# 10. 동시 수정, 성능, 디버깅

## 학습 목표

- 현재 한 행 JSON 저장 방식의 장단점을 설명할 수 있다.
- 여러 기기 동시 수정에서 마지막 저장 우선 문제가 발생하는 이유를 이해한다.
- 낙관적 잠금과 데이터 정규화 개선 방향을 이해한다.
- 브라우저와 네트워크 문제를 체계적으로 추적할 수 있다.

## 1. 현재 저장 단위

현재 UPDATE는 다음 세 JSON을 한 번에 보낸다.

```javascript
const payload = {
    players: tournamentPlayers,
    bracket_state: bracketState,
    display_state: currentDisplayState
};
```

장점:

- 구조가 단순함
- 한 번 조회하면 전체 화면을 만들 수 있음
- 백업과 복원이 쉬움
- 18팀 규모에서는 데이터 크기가 크지 않음

단점:

- 점수 하나가 바뀌어도 전체 JSON 전송
- Realtime도 전체 새 행을 전달
- 서로 다른 기기의 변경을 행 단위로 병합하기 어려움
- 전체 JSON 비교와 전체 재렌더링 발생

## 2. 350ms debounce의 의미

350ms 안의 연속 변경은 하나로 합쳐진다. 그러나 1초 간격으로 네 번 제출하면 네 번 UPDATE된다.

```text
0초 입력 버튼   UPDATE 1
1초 입력 버튼   UPDATE 2
2초 입력 버튼   UPDATE 3
3초 입력 버튼   UPDATE 4
```

다른 브라우저도 네 번 Realtime 이벤트를 받을 수 있다.

## 3. 마지막 저장 우선 문제

두 기기가 같은 초기 버전 10을 보고 있다고 가정한다.

```text
기기 A: 1경기 점수 수정 → 전체 JSON A 저장 → version 11
기기 B: 이전 화면에서 2경기 점수 수정 → 전체 JSON B 저장 → version 12
```

B의 JSON에 A의 변경이 없다면 A의 점수가 사라질 수 있다. DB는 두 요청 모두 권한이 있으므로 기본적으로 마지막 UPDATE를 허용한다.

현재 `remoteTournamentVersion`은 오래된 수신 이벤트를 무시하지만 UPDATE 조건에는 사용하지 않는다.

## 4. 낙관적 잠금

저장할 때 자신이 읽은 버전과 DB 버전이 같은 경우에만 UPDATE한다.

개념 코드:

```javascript
const expectedVersion = remoteTournamentVersion;

const { data, error } = await client
    .from('tournament_state')
    .update(payload)
    .eq('id', SUPABASE_TOURNAMENT_ID)
    .eq('version', expectedVersion)
    .select()
    .maybeSingle();

if (!data) {
    // 다른 기기가 먼저 저장했다.
    await loadRemoteTournamentState();
    showToast('다른 기기에서 먼저 수정했습니다. 최신 상태를 확인해 주세요.');
}
```

주의: DB 트리거가 UPDATE마다 `version`을 증가시켜야 한다.

장점:

- 조용한 덮어쓰기를 방지
- 충돌을 사용자에게 알릴 수 있음

단점:

- 사용자가 충돌 후 다시 입력해야 할 수 있음
- 서로 다른 경기 변경도 한 행이므로 충돌로 판단됨

## 5. 행 단위 데이터 모델

동시 수정이 많아지면 데이터를 나눌 수 있다.

```text
tournaments
teams
team_members
matches
match_team_scores
member_scores
display_state
```

개인 점수 하나를 한 행으로 저장하면 다른 경기 수정과 충돌할 가능성이 낮다.

예:

```sql
create table member_scores (
    match_id text not null,
    team_id uuid not null,
    member_id uuid not null,
    score integer,
    primary key (match_id, team_id, member_id)
);
```

하지만 조회와 조인, 초기화, 백업 로직은 더 복잡해진다. 작은 대회에서는 한 행 JSON + 낙관적 잠금이 현실적인 중간 지점이다.

## 6. Realtime 자기 반사

관리자가 UPDATE하면 같은 관리자 브라우저도 Realtime 이벤트를 받을 수 있다.

```text
로컬 상태 변경
→ UPDATE
→ 같은 브라우저에 Realtime 도착
→ 원격 상태 적용
→ 재렌더링
```

입력 중 재렌더링은 팝오버를 닫을 수 있다. 현재 점수는 타이핑 중 저장하지 않고 제출 버튼에서만 저장해 이 문제를 줄였다.

더 강한 방법:

- 요청별 client ID를 저장해 자기 이벤트 무시
- 보낸 상태의 해시를 기억해 같은 이벤트 무시
- 편집 중에는 원격 변경 알림만 표시하고 제출 시 충돌 검사

## 7. Safari 자동 확대

증상:

- 점수 입력을 누르면 화면이 약간 확대됨
- 팀 검색 입력을 누르면 확대됨

원인:

- iOS Safari가 16px보다 작은 입력 글자를 확대할 수 있음

해결:

```css
input {
    font-size: 16px;
}
```

사용자 확대 기능 자체를 막는 viewport 설정보다 입력 크기를 고치는 것이 낫다.

## 8. 디버깅 순서

### 상태 확인

Console에서 메모리 상태를 확인한다.

```javascript
console.log(bracketState);
console.log(tournamentPlayers);
```

### localStorage 확인

개발자 도구 Application 또는 Storage 탭에서 `bowling_bracket_state_*` 키를 확인한다.

### 네트워크 확인

Network 탭에서 다음을 본다.

- `/rest/v1/tournament_state` 요청 상태
- 요청 payload
- 응답 version
- 401, 403, 409 오류

### Supabase 로그 확인

- Auth 로그: 로그인 실패
- API 로그: REST/RLS 오류
- Realtime 로그: 구독 문제
- Postgres 로그: 트리거와 SQL 오류

### DOM 확인

Elements 탭에서 다음 클래스를 확인한다.

```text
winner
loser
is-read-only
admin-authenticated
admin-read-only
mobile-bracket-overview
```

## 9. 로그를 남길 위치

```javascript
console.debug('remote load', data.version);
console.debug('save start', payload);
console.debug('realtime received', payload.new.version);
```

실제 운영에서는 팀원 개인정보나 인증 토큰을 로그에 남기지 않는다.

## 10. 테스트 시나리오

```text
1. 익명 브라우저에서 수정 버튼이 숨겨지는가?
2. 익명 REST UPDATE가 RLS로 거부되는가?
3. 관리자 로그인 후 점수가 저장되는가?
4. 다른 브라우저에 새로고침 없이 반영되는가?
5. 승자를 취소하면 다음 라운드 데이터도 사라지는가?
6. 동시에 두 기기에서 수정하면 어떻게 되는가?
7. 네트워크를 끊어도 로컬 상태가 남는가?
8. Safari에서 입력 포커스 시 확대되지 않는가?
```

## 확인 문제

1. debounce는 동시 수정 충돌을 완전히 해결하는가?
2. 현재 `version` 검사는 수신과 저장 중 어느 쪽에만 적용되는가?
3. 낙관적 잠금에서 UPDATE 결과가 0행이면 무엇을 의미하는가?
4. 행 단위 모델이 충돌을 줄이는 이유는 무엇인가?
5. Safari 자동 확대를 viewport로 막지 않은 이유는 무엇인가?

## 실습

두 개의 가상 클라이언트가 같은 객체를 수정하는 상황을 코드로 재현한다.

```javascript
const server = {
    version: 1,
    state: { match1: '', match2: '' }
};

const clientA = structuredClone(server);
const clientB = structuredClone(server);
```

1. A가 `match1`을 수정해 저장한다.
2. B가 이전 상태에서 `match2`를 수정해 저장한다.
3. 마지막 저장 우선으로 `match1`이 사라지는 것을 확인한다.
4. 버전이 같을 때만 저장하도록 바꿔 충돌을 검출한다.

