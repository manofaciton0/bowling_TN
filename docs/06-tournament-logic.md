# 06. 토너먼트 상태 전이 알고리즘

## 학습 목표

- 경기 결과 선택이 다음 라운드에 미치는 영향을 이해한다.
- 승자 변경 시 기존 진출 경로를 먼저 지워야 하는 이유를 이해한다.
- 부전승과 2~4등 계산 조건을 설명할 수 있다.

## 1. 상태 전이란

토너먼트에서 한 경기의 상태는 독립적이지 않다.

```text
예선 승자
→ 본선 슬롯
→ 본선 승자
→ 본선 6강 슬롯
→ 결승 슬롯
```

앞 경기의 승자를 바꾸면 뒤 경기의 참가팀, 승자, 점수도 무효가 될 수 있다. 이런 연쇄 변화를 상태 전이라고 한다.

## 2. 승자 선택

단순화한 `selectWinner()` 흐름:

```javascript
function selectWinner(rIndex, mIndex, player) {
    if (!requireAdminAccess('승패 변경')) return;
    if (!player) return;

    const match = bracketState[rIndex][mIndex];

    if (match.winner === player) {
        clearAdvancedPath(rIndex, mIndex);
        match.winner = null;
    } else {
        if (match.winner) clearAdvancedPath(rIndex, mIndex);
        match.winner = player;
        advanceWinner(rIndex, mIndex, player);
    }

    saveToLocalStorage();
    renderBracket();
}
```

같은 승자를 다시 클릭하면 선택 취소, 다른 팀을 클릭하면 승자 교체다.

## 3. 다음 경기 경로

경기 객체의 `route`:

```json
{
  "roundIndex": 1,
  "matchIndex": 0,
  "slot": "p1"
}
```

의미:

```text
승자를 bracketState[1][0].p1에 넣는다.
```

```javascript
function advanceWinner(rIndex, mIndex, player) {
    const route = getRoute(rIndex, mIndex);
    if (!route) return;

    const nextMatch = bracketState[route.roundIndex][route.matchIndex];
    nextMatch[route.slot] = player;
}
```

## 4. 기존 경로를 먼저 지우는 이유

예를 들어 1팀이 예선 승자로 본선에 올라가 본선 점수까지 입력됐다고 가정한다. 예선 승자를 2팀으로 바꾸면 기존 본선 기록은 2팀의 기록이 될 수 없다.

따라서 다음을 연쇄적으로 정리해야 한다.

```text
기존 진출팀 제거
다음 경기 winner 제거
다음 경기 점수 제거
더 다음 라운드 진출팀 제거
새 승자 진출
```

`clearAdvancedPath()`는 이 재귀적 무효화를 담당한다.

## 5. 불변 조건

토너먼트 로직을 안전하게 유지하려면 다음 조건이 항상 참이어야 한다.

```text
1. match.winner는 해당 경기 슬롯에 존재하는 팀이어야 한다.
2. 다음 라운드 팀은 이전 경기 winner와 일치해야 한다.
3. 팀이 바뀐 슬롯의 이전 점수는 남아 있으면 안 된다.
4. 결승 3등 확정 팀을 우승자로 선택할 수 없어야 한다.
5. 동점이면 자동 순위를 확정하지 않아야 한다.
```

`normalizeBracketState()`와 `clearInvalidFinalWinner()`는 일부 불변 조건을 보정한다.

## 6. 부전승

```javascript
function autoAdvanceBye(rIndex, mIndex) {
    const match = bracketState[rIndex][mIndex];
    const playerSlot = getMatchSlots(match)
        .find(slot => slot !== match.byeSlot);
    const player = match[playerSlot];

    if (!player) return;
    match.winner = player;
    advanceWinner(rIndex, mIndex, player);
}
```

부전승 슬롯이 아닌 쪽에 팀이 들어오면 사용자 클릭 없이 자동 진출한다.

## 7. 3등 계산

결승 3팀의 점수가 모두 있어야 한다.

```javascript
const finalScores = slots
    .map(slot => ({
        slot,
        score: parseScoreValue(finalMatch[`${slot}Score`])
    }))
    .filter(item => item.score !== null);
```

조건:

- 모든 결승팀 점수 입력
- 최저 점수가 단독 최저
- 필요한 경우 결승 승자 확정

동점이면 `null`을 반환해 자동 확정을 보류한다.

## 8. 2등 계산

결승 승자가 확정되고 3등 슬롯이 결정되면 나머지 한 팀이 2등이다.

```text
결승 참가 3팀 - 우승팀 - 3등팀 = 2등팀
```

## 9. 4등 계산

본선 6강 세 경기의 패배팀 점수를 비교한다.

```text
각 경기 승자 확정
각 경기 패배팀 점수 입력
패배팀 중 최고 점수 한 팀
→ 4등
```

최고 점수가 동점이면 자동 확정하지 않는다.

## 10. 순위를 저장하지 않고 계산하는 이유

1~4등을 별도 필드에 저장하지 않고 승자와 점수에서 계산한다.

장점:

- 원본 데이터가 바뀌면 순위도 자동으로 일관되게 바뀜
- 저장할 중복 데이터 감소
- 잘못된 순위 데이터가 남을 가능성 감소

단점:

- 렌더링 때마다 계산해야 함
- 규칙이 복잡해지면 계산 함수가 어려워짐

## 확인 문제

1. 승자를 바꾸기 전에 `clearAdvancedPath()`가 필요한 이유는 무엇인가?
2. `route.slot`이 문자열인 이유와 대괄호 표기법이 필요한 이유는 무엇인가?
3. 결승 최저 점수가 동점일 때 3등을 확정하지 않는 이유는 무엇인가?
4. 4등을 결승 결과보다 먼저 확정할 수 있는 이유는 무엇인가?
5. 순위를 별도 저장하지 않는 방식의 장점은 무엇인가?

## 실습

4팀 단일 토너먼트를 배열로 만들고 다음 함수를 구현한다.

```javascript
const state = [
    [
        { p1: 'A', p2: 'B', winner: null, route: { roundIndex: 1, matchIndex: 0, slot: 'p1' } },
        { p1: 'C', p2: 'D', winner: null, route: { roundIndex: 1, matchIndex: 0, slot: 'p2' } }
    ],
    [
        { p1: null, p2: null, winner: null }
    ]
];
```

구현할 함수:

- `selectWinner(roundIndex, matchIndex, team)`
- `advanceWinner(match, team)`
- 준결승 승자를 변경할 때 결승 winner를 취소하는 함수

