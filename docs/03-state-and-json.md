# 03. 상태와 JSON 데이터 모델

## 학습 목표

- `players`, `bracket_state`, `display_state` 구조를 설명할 수 있다.
- 배열 안의 배열로 라운드와 경기를 표현하는 방법을 이해한다.
- `null`, 빈 문자열, 빈 배열의 의미를 구분한다.
- 데이터 정규화가 필요한 이유를 이해한다.

## 1. Supabase 행 구조

공유되는 대회 상태는 `tournament_state`의 한 행에 저장된다.

```json
{
  "id": "bowling-2026",
  "players": [],
  "bracket_state": [],
  "display_state": {},
  "version": 1,
  "updated_at": "2026-07-15T00:00:00Z"
}
```

각 필드 역할:

| 필드 | 형식 | 역할 |
|---|---|---|
| `id` | text | 대회 상태 식별자 |
| `players` | jsonb | 팀과 팀원 목록 |
| `bracket_state` | jsonb | 라운드, 경기, 점수, 승자 |
| `display_state` | jsonb | 공지 표시 상태 |
| `version` | bigint | DB 변경 횟수 |
| `updated_at` | timestamptz | 마지막 수정 시각 |

## 2. 팀 객체

DB 컬럼 이름은 `players`지만 실제 요소는 개인 선수가 아니라 팀이다.

```json
{
  "name": "1팀",
  "members": ["김수빈", "백창건", "김정환", "김정은"]
}
```

JavaScript에서는 다음 변수에 저장한다.

```javascript
let tournamentPlayers = [];
```

이름 대응 관계:

```text
DB players → JS tournamentPlayers → 실제 의미는 teams
```

## 3. 대진표는 2차원 배열

```javascript
bracketState[roundIndex][matchIndex]
```

현재 대회 형식은 다음처럼 구성된다.

```text
bracketState[0] 예선 12강  6경기
bracketState[1] 본선 12강  6경기
bracketState[2] 본선 6강   3경기
bracketState[3] 결승        1경기
```

예시:

```javascript
const firstPreliminaryMatch = bracketState[0][0];
const finalMatch = bracketState[3][0];
```

## 4. 일반 경기 객체

```json
{
  "id": "prelim-m0",
  "p1": {
    "name": "1팀",
    "members": ["김수빈", "백창건", "김정환", "김정은"]
  },
  "p2": {
    "name": "2팀",
    "members": ["이상범", "김묘덕", "이찬양", "김민기(전략)"]
  },
  "winner": null,
  "p1Score": "",
  "p2Score": "",
  "p1MemberScores": [],
  "p2MemberScores": [],
  "route": {
    "roundIndex": 1,
    "matchIndex": 0,
    "slot": "p1"
  }
}
```

`route`는 이 경기의 승자가 어느 경기의 어느 슬롯으로 이동할지를 나타낸다.

## 5. 결승 경기 객체

결승은 3팀 경기이므로 슬롯 목록과 `p3`가 있다.

```json
{
  "id": "final-m0",
  "slots": ["p1", "p2", "p3"],
  "p1": null,
  "p2": null,
  "p3": null,
  "winner": null,
  "p1Score": "",
  "p2Score": "",
  "p3Score": "",
  "p1MemberScores": [],
  "p2MemberScores": [],
  "p3MemberScores": []
}
```

코드는 고정된 `p1`, `p2`만 가정하지 않고 슬롯 목록을 구한다.

```javascript
function getMatchSlots(match) {
    return Array.isArray(match.slots) ? match.slots : ['p1', 'p2'];
}
```

## 6. 비어 있는 값의 의미

```text
p1: null              아직 진출팀이 없음
winner: null          승패가 결정되지 않음
p1Score: ""           팀 합계 점수 미입력
p1MemberScores: []    개인 점수 미입력
members: []           등록된 팀원이 없음
```

`null`과 빈 문자열은 의미가 다르다. `null`은 객체가 없음을, `""`는 텍스트 입력값이 비어 있음을 나타낸다.

## 7. 승자는 팀 객체로 저장된다

```javascript
match.winner = match.p1;
```

현재 구조에서는 팀 ID만 저장하지 않고 팀 객체 전체를 저장한다. 구현은 단순하지만 같은 팀 데이터가 `players`, `p1`, `p2`, `winner`에 중복될 수 있다.

팀 비교는 객체 참조보다 이름을 사용한다.

```javascript
function isSameTeam(a, b) {
    return Boolean(a && b && a.name === b.name);
}
```

Supabase에서 JSON을 다시 받으면 같은 내용이어도 JavaScript 객체 참조는 새로 만들어질 수 있기 때문이다.

## 8. 공지 상태

```json
{
  "notice": {
    "active": true,
    "message": "예선 경기를 시작합니다.",
    "highlightLosses": false
  }
}
```

`display_state`를 별도로 둬 대진 결과와 전광판 표시 상태를 논리적으로 구분한다.

## 9. 이름 변환

브라우저 내부는 camelCase, DB 컬럼은 snake_case를 사용한다.

```javascript
const payload = {
    players: tournamentPlayers,
    bracket_state: bracketState,
    display_state: currentDisplayState
};
```

## 10. 두 종류의 version

로컬 백업의 형식 버전:

```javascript
const TOURNAMENT_VERSION = '18-team-12-prelim-final3-v1';
```

DB 동시성용 숫자 버전:

```json
{ "version": 169 }
```

이름은 같지만 목적이 다르다.

## 11. 정규화

과거 데이터나 일부 필드가 빠진 JSON을 안전하게 사용하기 위해 기본값을 채운다.

```javascript
function ensureMatchSlots(match) {
    getMatchSlots(match).forEach(slot => {
        if (!(slot in match)) match[slot] = null;
        if (!(`${slot}Score` in match)) match[`${slot}Score`] = '';
        if (!Array.isArray(match[`${slot}MemberScores`])) {
            match[`${slot}MemberScores`] = [];
        }
    });
}
```

대괄호 표기법은 동적인 속성 이름을 만들 때 사용한다.

```javascript
const slot = 'p1';
match[`${slot}Score`]; // match.p1Score
```

## 확인 문제

1. `bracketState[2][1]`은 무엇을 의미하는가?
2. `winner: null`과 `p1Score: ""`의 차이는 무엇인가?
3. 팀을 `a === b`가 아니라 `a.name === b.name`으로 비교하는 이유는 무엇인가?
4. 결승에 `slots` 배열이 필요한 이유는 무엇인가?
5. 로컬 형식 버전과 DB 숫자 버전은 각각 무엇을 해결하는가?

## 실습

다음 경기 데이터에 누락된 점수 필드를 채우는 `normalizeMatch()`를 작성한다.

```javascript
const match = {
    id: 'm0',
    p1: { name: '1팀', members: [] },
    p2: null,
    winner: null
};
```

정규화 후 필요한 필드:

```javascript
p1Score: ''
p2Score: ''
p1MemberScores: []
p2MemberScores: []
```

