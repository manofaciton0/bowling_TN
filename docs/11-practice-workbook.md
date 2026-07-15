# 11. 단계별 종합 실습 워크북

이 워크북은 현재 프로젝트를 바로 수정하지 않고 별도의 작은 예제로 핵심 원리를 다시 구현하는 과정이다. 각 단계가 동작한 뒤 다음 단계로 넘어간다.

## 실습 원칙

- 처음에는 4팀만 사용한다.
- 프레임워크 없이 HTML, CSS, JavaScript만 사용한다.
- 한 단계마다 Git 커밋을 남긴다.
- 데이터 변경과 화면 변경을 분리한다.
- 사용자 문자열은 `textContent`로 넣는다.
- 답을 보기 전에 Console로 상태를 확인한다.

## Lab 1. 팀 목록 렌더링

### 목표

- 배열과 객체 순회
- DOM 생성
- 빈 컨테이너 렌더링

### 시작 데이터

```javascript
const teams = [
    { id: 't1', name: '1팀', members: ['A', 'B'] },
    { id: 't2', name: '2팀', members: ['C', 'D'] },
    { id: 't3', name: '3팀', members: ['E', 'F'] },
    { id: 't4', name: '4팀', members: ['G', 'H'] }
];
```

### 요구사항

1. `<div id="app"></div>`를 만든다.
2. `renderTeamList(teams)`를 작성한다.
3. 각 팀을 `<article>`로 만든다.
4. 팀원은 `<ul>`로 표시한다.
5. 렌더링 전에 컨테이너를 비운다.

### 확인

- `renderTeamList(teams)`를 두 번 실행해도 카드가 중복되지 않는가?
- 팀명을 `<script>` 문자열로 바꿔도 실행되지 않는가?

## Lab 2. 경기 상태 렌더링

### 목표

- 상태에 따른 클래스 결정
- 승자와 패자 표현
- 이벤트와 클로저

### 시작 상태

```javascript
const matches = [
    { id: 'm1', p1: teams[0], p2: teams[1], winnerId: null },
    { id: 'm2', p1: teams[2], p2: teams[3], winnerId: null }
];
```

### 요구사항

1. `renderMatches()`를 작성한다.
2. 팀을 클릭하면 `winnerId`가 바뀐다.
3. 같은 팀을 다시 클릭하면 승자 선택이 취소된다.
4. 승자는 `.winner`, 패자는 `.loser` 클래스를 갖는다.
5. 상태 변경 후 전체 경기를 다시 렌더링한다.

### 힌트

```javascript
button.addEventListener('click', () => {
    selectWinner(matchIndex, team.id);
});
```

## Lab 3. 다음 라운드 진출

### 목표

- 상태 전이
- 경로 정보
- 기존 진출 경로 무효화

### 상태 확장

```javascript
const bracket = [
    [
        {
            id: 'm1',
            p1: teams[0],
            p2: teams[1],
            winnerId: null,
            route: { roundIndex: 1, matchIndex: 0, slot: 'p1' }
        },
        {
            id: 'm2',
            p1: teams[2],
            p2: teams[3],
            winnerId: null,
            route: { roundIndex: 1, matchIndex: 0, slot: 'p2' }
        }
    ],
    [
        { id: 'final', p1: null, p2: null, winnerId: null }
    ]
];
```

### 요구사항

1. 준결승 승자를 결승의 지정 슬롯에 넣는다.
2. 준결승 승자를 바꾸면 결승 승자와 점수를 취소한다.
3. 결승 슬롯의 기존 팀이 바뀔 때 이전 점수를 제거한다.
4. 모든 상태 변경 후 불변 조건을 Console로 검사한다.

### 불변 조건 함수 예

```javascript
function assertWinnerInMatch(match) {
    if (!match.winnerId) return true;
    return [match.p1?.id, match.p2?.id].includes(match.winnerId);
}
```

## Lab 4. 개인 점수 제출

### 목표

- 임시 입력 상태
- 배열 복사
- 합계 계산
- 제출 시 한 번만 원본 변경

### 데이터

```javascript
const scoreState = {
    teamId: 't1',
    memberScores: ['', ''],
    total: ''
};
```

### 요구사항

1. 팀 점수를 누르면 팝오버를 연다.
2. 입력 중에는 임시 배열만 변경한다.
3. 숫자가 아닌 문자를 제거한다.
4. 합계를 실시간 미리보기한다.
5. `입력` 버튼에서만 `scoreState`를 변경한다.
6. 바깥을 클릭해 닫으면 임시 입력을 버린다.

### 테스트

```text
입력 전 원본: ['', '']
팝오버 입력: ['100', '120']
입력 전 원본 확인: ['', '']
버튼 제출 후 원본: ['100', '120']
합계: '220'
```

## Lab 5. localStorage와 복원

### 목표

- 직렬화와 역직렬화
- 버전 검증
- 오류 처리

### 요구사항

1. 상태 변경 후 localStorage에 저장한다.
2. 페이지 로드 시 저장 상태를 복원한다.
3. `version`이 다르면 저장 상태를 사용하지 않는다.
4. 잘못된 JSON이면 기본 상태로 시작한다.
5. 초기화 버튼을 만든다.

### 권장 구조

```javascript
const FORMAT_VERSION = 'four-team-v1';
const STORAGE_KEY = `practice_bracket_${FORMAT_VERSION}`;

function saveState() {}
function loadState() {}
function resetState() {}
```

## Lab 6. 가짜 원격 서버와 debounce

### 목표

- 비동기 함수
- debounce
- 요청 중 추가 변경 처리

실제 Supabase 대신 다음 함수를 사용한다.

```javascript
async function fakeRemoteUpdate(payload) {
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('remote saved', structuredClone(payload));
}
```

### 요구사항

1. 상태 변경 후 350ms 뒤 저장한다.
2. 350ms 안에 다시 변경하면 이전 타이머를 취소한다.
3. 요청 중 변경이 생기면 요청 종료 후 한 번 더 저장한다.
4. 저장 횟수를 Console에서 확인한다.

## Lab 7. Supabase Auth와 RLS 설계

### 목표

- 인증과 권한 분리
- 공개 조회와 관리자 수정
- 비밀정보 관리

### 과제

다음 요구사항을 SQL과 의사 코드로 설계한다.

```text
익명 사용자: 대진 상태 SELECT 가능
로그인 일반 사용자: SELECT 가능, UPDATE 불가
admin_users 등록 사용자: SELECT와 UPDATE 가능
```

### 제출물

- `admin_users` 테이블 SQL
- `tournament_state` 테이블 SQL
- SELECT RLS 정책
- UPDATE RLS 정책
- 로그인 후 관리자 확인 JavaScript

실제 프로젝트 URL과 키는 문서에 넣지 않는다.

## Lab 8. Realtime 화면 동기화

### 목표

- 초기 조회와 변경 구독
- 원격 상태 적용
- 자기 이벤트와 재렌더링 이해

### 요구사항

1. 페이지 시작 시 구독을 먼저 설정한다.
2. 현재 원격 상태를 조회한다.
3. UPDATE 이벤트에서 `payload.new`를 적용한다.
4. 버전이 현재보다 낮은 이벤트는 무시한다.
5. 데이터가 실제로 다를 때만 렌더링한다.

## Lab 9. 동시 수정 충돌 재현

### 목표

- 마지막 저장 우선 문제 확인
- 낙관적 잠금 구현

### 시작 코드

```javascript
let server = {
    version: 1,
    state: { m1: '', m2: '' }
};

function readServer() {
    return structuredClone(server);
}
```

### 단계

1. A와 B가 모두 version 1을 읽는다.
2. A가 `m1 = '650'`으로 저장한다.
3. B가 자신의 이전 복사본에서 `m2 = '620'`으로 저장한다.
4. A의 변경이 사라지는지 확인한다.
5. `expectedVersion`이 현재 서버 버전과 같을 때만 저장한다.
6. 충돌 시 최신 상태를 다시 읽고 사용자에게 알린다.

## 최종 프로젝트

4팀 실습 앱을 다음 수준까지 완성한다.

```text
정적 HTML 셸
동적 경기 렌더링
승자 진출과 취소
개인 점수 제출
로컬 저장과 복원
관리자 로그인
RLS 기반 수정 제한
Realtime 관람 화면
동시 수정 충돌 경고
모바일 전용 레이아웃
```

## 완료 체크리스트

- [ ] 상태를 직접 수정하지 않고 전용 함수로 변경한다.
- [ ] 렌더 함수는 DB를 직접 호출하지 않는다.
- [ ] 사용자 입력은 제출 전 임시 상태에 둔다.
- [ ] 비로그인 UI와 DB RLS를 모두 적용한다.
- [ ] 네트워크 실패 시 사용자에게 알린다.
- [ ] 동점, 빈 점수, 승자 변경을 테스트한다.
- [ ] 모바일 Safari 입력 확대를 확인한다.
- [ ] 두 브라우저에서 Realtime을 확인한다.
- [ ] 두 관리자 동시 수정 충돌을 확인한다.

