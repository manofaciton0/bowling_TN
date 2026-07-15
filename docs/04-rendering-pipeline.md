# 04. 상태를 화면으로 만드는 렌더링

## 학습 목표

- `renderBracket()`에서 팀 카드까지 이어지는 호출 구조를 이해한다.
- 조건부 렌더링과 CSS 클래스 결정 과정을 설명할 수 있다.
- 전체 재렌더링과 부분 업데이트의 차이를 이해한다.

## 1. 렌더링의 입력과 출력

입력은 JavaScript 상태다.

```javascript
bracketState
tournamentPlayers
currentAdminUser
mobileBracketOverview
```

출력은 브라우저 DOM이다.

```html
<div class="bracket-stage">
    <div class="bracket-board">...</div>
</div>
<section class="mobile-bracket-board">...</section>
```

렌더링 함수는 DB에 직접 접근하지 않는다. 이미 메모리에 들어온 상태를 화면으로 변환한다.

## 2. `renderBracket()`의 책임

단순화한 구조는 다음과 같다.

```javascript
function renderBracket() {
    const container = document.getElementById('bracket-container');
    if (!container) return;

    container.innerHTML = '';

    const stage = document.createElement('div');
    stage.className = 'bracket-stage';

    const board = document.createElement('div');
    board.className = 'bracket-board';

    bracketState.forEach((round, rIndex) => {
        // 라운드 제목과 경기 카드를 생성한다.
    });

    stage.appendChild(board);
    container.appendChild(stage);
    container.appendChild(createMobileBracketBoard());
}
```

주요 책임:

- 기존 대진표 제거
- 데스크톱 대진표 생성
- 모바일 대진표 생성
- 팀 목록 사이드바 갱신
- 연결선 렌더링 예약
- 기존 스크롤 위치 복원

한 함수가 많은 일을 맡고 있으므로 기능이 더 커지면 데스크톱, 모바일, 연결선을 별도 모듈로 나눌 수 있다.

## 3. 배열 순회 문법

```javascript
bracketState.forEach((round, rIndex) => {
    round.forEach((match, mIndex) => {
        const matchDiv = createMatchDiv(match, rIndex, mIndex);
        roundDiv.appendChild(matchDiv);
    });
});
```

- `round`: 현재 라운드의 경기 배열
- `rIndex`: 라운드 번호
- `match`: 경기 객체
- `mIndex`: 라운드 안의 경기 번호

인덱스는 승자 선택 이벤트가 원래 상태 위치를 찾을 때도 필요하다.

## 4. 경기 카드 렌더링

`createMatchDiv(match, rIndex, mIndex)`는 경기 하나를 만든다.

```javascript
function createMatchDiv(match, rIndex, mIndex) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match';
    matchDiv.dataset.round = String(rIndex);
    matchDiv.dataset.match = String(mIndex);

    if (match.winner) {
        matchDiv.classList.add('has-winner');
    }

    getMatchSlots(match).forEach(slot => {
        const playerDiv = createPlayerDiv(/* ... */);
        matchDiv.appendChild(playerDiv);
    });

    return matchDiv;
}
```

결승은 `p1`, `p2`, `p3`, 일반 경기는 `p1`, `p2`를 순회한다.

## 5. 팀 카드의 조건부 렌더링

팀이 아직 없으면 즉시 빈 카드를 반환한다.

```javascript
if (!playerObj) {
    div.classList.add('empty');
    div.textContent = options.emptyText || '대기중';
    return div;
}
```

이 조기 반환 패턴은 이후 코드가 `playerObj`가 존재한다고 가정할 수 있게 한다.

팀이 있으면 팀명, 순위 배지, 점수, 개인 점수 팝오버, 팀원 툴팁을 추가한다.

## 6. 상태를 클래스로 변환

```javascript
if (playerObj === winner) {
    div.classList.add('winner');
} else if (options.placement?.rank === 2) {
    div.classList.add('runner-up');
} else if (winner !== null) {
    div.classList.add('loser');
}
```

선택 순서가 중요하다. 우승 팀이면서 동시에 2등으로 오인되지 않도록 더 강한 조건을 먼저 검사한다.

현재 코드는 일부 비교에서 객체 참조를 사용하고 일부에서는 `isSameTeam()`을 사용한다. 원격 JSON을 다시 받은 뒤에는 객체 참조가 달라질 수 있으므로 장기적으로는 팀 ID를 두고 ID로 비교하는 편이 안전하다.

## 7. 읽기 전용 렌더링

```javascript
const canEdit = isAdminAuthenticated();

if (!canEdit) {
    div.classList.add('is-read-only');
}

div.onclick = canEdit ? onClick : null;
```

관리자 여부에 따라 같은 데이터를 다른 상호작용 상태로 렌더링한다. 하지만 프론트엔드에서 클릭을 막는 것만으로 보안이 완성되지는 않는다. 실제 DB 업데이트 차단은 RLS가 담당한다.

## 8. 모바일 렌더링

`createMobileBracketBoard()`는 같은 `bracketState`를 모바일 친화적인 카드로 다시 표현한다.

```javascript
bracketState.forEach((round, roundIndex) => {
    const roundSection = document.createElement('section');
    const matchGrid = document.createElement('div');

    round.forEach((match, matchIndex) => {
        matchGrid.appendChild(createMobileMatchCard(match, matchIndex));
    });
});
```

같은 데이터에서 여러 View를 만들 수 있다는 상태 기반 설계의 장점이다.

## 9. 확정된 순위만 생성하기

```javascript
const confirmedPlacements = [
    { rank: 2, team: standings.second },
    { rank: 3, team: standings.third },
    { rank: 4, team: standings.fourth }
].filter(placement => placement.team);
```

`filter()`는 팀이 확정된 항목만 새 배열로 만든다. 따라서 미정 카드 자체를 생성하지 않는다.

## 10. 전체 재렌더링에서 주의할 점

DOM을 다시 만들면 다음 상태가 사라진다.

- 현재 포커스된 입력
- 열려 있는 팝오버
- 요소에 임시로 저장된 값
- 일부 스크롤 위치

그래서 점수를 타이핑할 때마다 `renderBracket()`를 호출하지 않고 `입력` 버튼에서 확정하도록 바꿨다.

## 확인 문제

1. `createMatchDiv()`에 `rIndex`, `mIndex`가 필요한 이유는 무엇인가?
2. 팀이 없을 때 조기 반환하면 어떤 장점이 있는가?
3. 관리자 여부는 데이터가 아니라 렌더링 상호작용에 어떻게 반영되는가?
4. 같은 `bracketState`로 데스크톱과 모바일 화면을 모두 만들 수 있는 이유는 무엇인가?
5. 전체 재렌더링이 입력 팝오버를 닫는 이유는 무엇인가?

## 실습

다음 상태로 승자와 패자를 구분하는 단순 경기 DOM을 만든다.

```javascript
const match = {
    p1: { name: '1팀' },
    p2: { name: '2팀' },
    winner: { name: '1팀' }
};
```

요구사항:

- `isSameTeam(a, b)`를 작성한다.
- 승자는 `winner`, 패자는 `loser` 클래스를 갖는다.
- `winner`가 `null`이면 어느 팀에도 결과 클래스를 붙이지 않는다.

