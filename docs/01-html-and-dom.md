# 01. 정적 HTML과 동적 DOM

## 학습 목표

- HTML이 담당하는 고정 UI와 JavaScript가 담당하는 동적 UI를 구분한다.
- `getElementById`, `createElement`, `appendChild` 문법을 이해한다.
- 모달과 사이드바의 접근성 속성을 이해한다.

## 1. HTML이 담당하는 것

`index.html`에는 다음과 같은 고정 인터페이스가 있다.

- 상단 네비게이션
- 팀 목록 사이드바
- 공지 입력 모달
- 설정 모달
- 관리자 로그인 모달
- 빈 대진표 컨테이너

이 요소들은 데이터가 바뀌어도 기본 구조가 유지된다.

```html
<button id="btn-admin-auth" type="button">관리자 로그인</button>

<section id="admin-modal" role="dialog" aria-modal="true">
    <form id="admin-login-form">
        <input id="admin-email" type="email">
        <input id="admin-password" type="password">
        <button type="submit">로그인</button>
    </form>
</section>
```

반면 경기 카드와 팀 점수 팝오버는 `bracket.js`가 동적으로 생성한다.

## 2. DOM 요소 찾기

```javascript
const button = document.getElementById('btn-admin-auth');
const container = document.getElementById('bracket-container');
```

`getElementById()`는 일치하는 요소 하나를 반환한다. 없으면 `null`을 반환하므로 선택적 연결 연산자를 자주 사용한다.

```javascript
button?.addEventListener('click', handleAdminAuthButton);
```

`button`이 `null`이면 오른쪽 코드를 실행하지 않는다.

## 3. 동적으로 요소 만들기

경기 카드를 단순화하면 다음과 같다.

```javascript
function createSimpleMatch(match) {
    const card = document.createElement('article');
    card.className = 'match';

    const p1 = document.createElement('div');
    p1.textContent = match.p1?.name || '대기중';

    const p2 = document.createElement('div');
    p2.textContent = match.p2?.name || '대기중';

    card.appendChild(p1);
    card.appendChild(p2);
    return card;
}
```

핵심 문법:

- `document.createElement('article')`: 메모리에 새 요소 생성
- `element.className`: CSS 클래스 지정
- `element.textContent`: 안전하게 텍스트 입력
- `parent.appendChild(child)`: 부모에 자식 삽입
- `return card`: 완성된 요소를 호출자에게 반환

## 4. `textContent`와 `innerHTML`

사용자 입력은 가능한 한 `textContent`로 넣는다.

```javascript
nameElement.textContent = team.name;
```

다음 코드는 사용자 입력을 HTML로 해석하므로 피해야 한다.

```javascript
nameElement.innerHTML = team.name;
```

프로젝트에서 `innerHTML = ''`은 컨테이너를 비우는 용도로 사용한다. 사용자 문자열을 HTML로 삽입하는 용도가 아니다.

## 5. 클래스는 상태 표현 언어다

```javascript
if (playerObj === winner) {
    div.classList.add('winner');
} else if (winner !== null) {
    div.classList.add('loser');
}
```

JavaScript는 의미를 나타내는 클래스만 붙이고 실제 색상은 CSS가 결정한다.

```css
.player.winner { /* 승리 스타일 */ }
.player.loser { /* 패배 스타일 */ }
```

## 6. `data-*` 속성

DOM에 라운드와 경기 번호를 기록할 수 있다.

```javascript
matchDiv.dataset.round = String(rIndex);
matchDiv.dataset.match = String(mIndex);
```

생성 결과:

```html
<div class="match" data-round="0" data-match="2"></div>
```

연결선 렌더링이나 디버깅에서 특정 경기 요소를 다시 찾는 데 사용한다.

## 7. 모달 접근성

```html
<section
    role="dialog"
    aria-modal="true"
    aria-labelledby="admin-modal-title"
    aria-hidden="true">
</section>
```

- `role="dialog"`: 보조 기술에 대화상자임을 알림
- `aria-modal="true"`: 모달이 열린 동안 바깥 UI와 분리됨을 알림
- `aria-labelledby`: 제목 요소와 연결
- `aria-hidden`: 현재 표시 여부 전달

JavaScript는 시각 클래스와 ARIA 상태를 함께 바꾼다.

```javascript
document.body.classList.toggle('admin-modal-open', open);
modal.setAttribute('aria-hidden', String(!open));
button.setAttribute('aria-expanded', String(open));
```

## 확인 문제

1. `createElement()`로 만든 요소는 언제 실제 페이지에 나타나는가?
2. 팀 이름을 넣을 때 `innerHTML`보다 `textContent`가 안전한 이유는 무엇인가?
3. `button?.addEventListener()`에서 `?.`가 필요한 이유는 무엇인가?
4. CSS 클래스와 JavaScript 상태를 분리하면 어떤 장점이 있는가?

## 실습

다음 함수가 팀명과 팀원 목록을 포함한 `<article>`을 반환하도록 완성한다.

```javascript
function createTeamCard(team) {
    // TODO
}

const team = {
    name: '1팀',
    members: ['김수빈', '백창건', '김정환', '김정은']
};
```

요구사항:

- 팀명은 `<h3>`
- 팀원은 `<ul>`과 `<li>`
- 팀원이 없으면 `팀원 없음` 표시
- 사용자 문자열은 `textContent`로 처리

