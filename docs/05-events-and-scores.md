# 05. 이벤트, 클로저, 점수 입력

## 학습 목표

- 이벤트 리스너와 콜백 함수의 역할을 이해한다.
- 렌더링 시 만들어진 클로저가 경기 위치를 기억하는 원리를 이해한다.
- 점수 입력값을 임시 상태와 확정 상태로 분리하는 이유를 이해한다.

## 1. 이벤트 연결

```javascript
btnReset.addEventListener('click', resetBracket);
noticeForm.addEventListener('submit', publishNotice);
searchInput.addEventListener('input', renderTeamSidebar);
```

첫 번째 인자는 이벤트 종류, 두 번째 인자는 이벤트 발생 시 실행할 함수다.

함수를 실행한 결과가 아니라 함수 자체를 전달해야 한다.

```javascript
// 올바름
button.addEventListener('click', resetBracket);

// 페이지 로드 중 즉시 실행되므로 잘못됨
button.addEventListener('click', resetBracket());
```

## 2. 인자가 필요한 이벤트 함수

```javascript
button.addEventListener('click', () => setModalState(true));
```

화살표 함수가 클릭될 때 `setModalState(true)`를 실행한다.

## 3. 클로저로 경기 위치 기억하기

경기 카드 렌더링 시 다음 콜백을 만든다.

```javascript
() => selectWinner(rIndex, mIndex, match[slot])
```

이 함수는 나중에 클릭되더라도 생성 당시의 `rIndex`, `mIndex`, `slot`을 기억한다. 이를 클로저라고 한다.

덕분에 모든 팀 카드가 같은 `selectWinner()`를 사용하면서도 자기 경기 위치를 전달할 수 있다.

## 4. 이벤트 전파

점수 입력은 팀 카드 안에 있다. 입력을 눌렀을 때 카드 클릭까지 실행되면 실수로 승자가 선택될 수 있다.

```javascript
scoreInput.addEventListener('click', event => {
    event.stopPropagation();
    openMemberScoreEditor(/* ... */);
});
```

`stopPropagation()`은 현재 이벤트가 부모 요소로 올라가는 것을 막는다.

## 5. 숫자 정규화

```javascript
function normalizeScoreValue(value) {
    return String(value).replace(/\D/g, '').slice(0, 3);
}
```

- `String(value)`: 어떤 입력도 문자열로 변환
- `/\D/g`: 숫자가 아닌 모든 문자 선택
- `replace(..., '')`: 숫자 아닌 문자 제거
- `slice(0, 3)`: 최대 3자리만 유지

## 6. 개인 점수 배열

```javascript
const scores = [...memberScores];
```

전개 문법으로 원본 배열을 복사한다. 팝오버 안에서 입력 중인 값은 이 임시 배열에만 기록한다.

```javascript
input.addEventListener('input', event => {
    const value = normalizeScoreValue(event.target.value);
    scores[index] = value;

    const total = calculateMemberScoreTotal(scores);
    totalValue.textContent = total || '-';
});
```

이 단계에서는 `match`나 Supabase를 변경하지 않는다.

## 7. 제출 시 한 번만 확정하기

```javascript
submitButton.addEventListener('click', () => {
    const total = calculateMemberScoreTotal(scores);
    onScoresChange([...scores], total);
    closeMemberScoreEditors();
});
```

`onScoresChange`는 상위 렌더링 함수가 전달한 콜백이다.

```javascript
(val, memberScores) => {
    match[`${slot}Score`] = val;
    match[`${slot}MemberScores`] = memberScores;
    saveToLocalStorage();
}
```

데이터 흐름:

```text
키보드 입력
→ 팝오버 임시 scores 변경
→ 합계 미리보기
→ 입력 버튼 클릭
→ match 객체 변경
→ 로컬 및 원격 저장
```

이 방식은 다음 문제를 해결한다.

- 숫자 하나마다 Supabase 업데이트가 발생하지 않음
- Realtime 반사로 입력 팝오버가 닫히는 현상 감소
- 사용자가 버튼 없이 닫으면 변경을 취소할 수 있음

## 8. 합계 계산

```javascript
function calculateMemberScoreTotal(scores) {
    const normalizedScores = scores.map(score => normalizeScoreValue(score));
    const hasAnyScore = normalizedScores.some(score => score !== '');
    if (!hasAnyScore) return '';

    return String(normalizedScores.reduce((sum, score) => {
        return sum + (Number.parseInt(score, 10) || 0);
    }, 0));
}
```

사용된 배열 메서드:

- `map()`: 모든 값을 정규화한 새 배열 생성
- `some()`: 하나라도 입력됐는지 검사
- `reduce()`: 점수를 하나의 합계로 축약

## 9. form submit

공지와 로그인은 `<form>`의 `submit` 이벤트를 사용한다.

```javascript
async function submitAdminLogin(event) {
    event.preventDefault();
    // 비동기 로그인
}
```

`preventDefault()`는 브라우저의 기본 폼 제출과 페이지 새로고침을 막는다.

## 10. 비동기 이벤트

```javascript
async function submitAdminLogin(event) {
    const { data, error } = await client.auth.signInWithPassword(/* ... */);
}
```

- `async`: 함수가 Promise를 반환함
- `await`: Promise 완료까지 이 함수 안의 다음 줄을 기다림
- 브라우저 전체가 멈추는 것은 아님

## 확인 문제

1. `addEventListener('click', handler())`가 잘못된 이유는 무엇인가?
2. 점수 입력 클릭에서 `stopPropagation()`이 필요한 이유는 무엇인가?
3. `const scores = [...memberScores]`로 복사하는 이유는 무엇인가?
4. 점수 타이핑 중에는 왜 Supabase를 업데이트하지 않는가?
5. `reduce()`는 이 프로젝트에서 어떤 값을 만드는가?

## 실습

세 명의 점수를 입력받아 합계를 미리 보여주고 `확정` 버튼에서만 원본 객체를 변경하는 작은 UI를 만든다.

```javascript
const game = {
    memberScores: ['', '', ''],
    total: ''
};
```

테스트:

- `100`, `120`, `130` 입력 중 `game`은 변경되지 않는다.
- 합계 미리보기는 `350`이다.
- 확정 후 `game.total === '350'`이다.

