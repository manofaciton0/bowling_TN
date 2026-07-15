# 02. CSS 상태 클래스와 반응형 UI

## 학습 목표

- CSS 변수와 상태 클래스로 테마를 구성하는 방법을 이해한다.
- 데스크톱과 모바일 UI가 어떻게 분리되는지 이해한다.
- Safari 입력 확대와 반응형 레이아웃의 실전 문제를 이해한다.

## 1. CSS 변수

프로젝트는 색상 역할을 변수로 정의하고 테마별로 값만 바꾼다.

```css
body.theme-light {
    --text-primary: #111827;
    --card-bg: #ffffff;
    --input-bg: #ffffff;
}

body.theme-dark {
    --text-primary: #f9fafb;
    --card-bg: #111827;
    --input-bg: #0f172a;
}
```

컴포넌트는 구체적인 색상보다 역할 변수를 사용한다.

```css
.team-sidebar-card {
    color: var(--text-primary);
    background: var(--card-bg);
}
```

이렇게 하면 같은 카드 CSS를 다시 작성하지 않고 테마를 바꿀 수 있다.

## 2. body 상태 클래스

앱의 큰 상태는 `body` 클래스에 표현된다.

```text
theme-light          밝은 테마
theme-dark           어두운 테마
nav-collapsed        네비게이션 접힘
team-sidebar-open    팀 목록 열림
admin-modal-open     로그인 모달 열림
admin-authenticated  관리자 로그인 상태
admin-read-only      읽기 전용 상태
mobile-bracket-overview 모바일 전용 대진표 표시
```

예를 들어 읽기 전용 사용자는 공지 제어를 볼 수 없다.

```css
body.admin-read-only .notice-controls {
    display: none;
}
```

JavaScript는 로그인 결과에 따라 클래스만 전환한다.

```javascript
document.body.classList.toggle('admin-read-only', !currentAdminUser);
```

## 3. 데스크톱과 모바일 대진표

JavaScript는 데스크톱 대진표와 모바일 대진표를 모두 만든다. CSS가 화면 폭과 보기 모드에 따라 하나를 보여준다.

```css
.mobile-bracket-board {
    display: none;
}

@media (max-width: 640px) {
    body.mobile-bracket-overview .bracket-stage {
        display: none;
    }

    body.mobile-bracket-overview .mobile-bracket-board {
        display: block;
    }
}
```

모바일에서 데스크톱 DOM을 단순히 축소하지 않고 별도 구조를 만든 이유는 다음과 같다.

- 넓은 가로 연결선이 작은 화면에서 깨지는 문제 방지
- 팀명과 점수를 읽을 수 있는 크기로 유지
- 핀치 줌과 브라우저 확대에 덜 의존
- 터치 조작에 맞는 카드 간격 제공

## 4. Grid와 Flexbox 선택

경기 카드 묶음은 2열 Grid가 적합하다.

```css
.mobile-match-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
}
```

한 행 안에서 팀명과 합계를 양쪽 정렬할 때는 Flexbox가 적합하다.

```css
.mobile-team-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
}
```

Grid는 행과 열의 2차원 배치, Flexbox는 한 방향 정렬에 강하다.

## 5. 안정적인 크기

동적 콘텐츠가 들어가도 레이아웃이 흔들리지 않게 최소 크기와 축소 규칙을 지정한다.

```css
.mobile-team-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.mobile-team-total {
    flex: 0 0 auto;
    min-width: 38px;
}
```

Flex 자식에서 말줄임을 사용하려면 `min-width: 0`이 중요하다.

## 6. Safari 입력 자동 확대

iOS Safari는 포커스된 입력의 글자 크기가 16px보다 작으면 읽기 편하게 화면을 자동 확대할 수 있다.

```css
.score-input,
.member-score-input,
.team-sidebar-search input {
    font-size: 16px;
}
```

`maximum-scale=1`로 사용자 줌을 막는 방법보다 입력 글자 크기를 16px 이상으로 유지하는 편이 접근성과 사용성 면에서 낫다.

## 7. 순위 카드의 동적 열 수

확정된 순위 수에 따라 클래스를 다르게 붙인다.

```javascript
placementGrid.className =
    `mobile-placement-grid placement-count-${confirmedPlacements.length}`;
```

```css
.placement-count-1 {
    grid-template-columns: 1fr;
}

.placement-count-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
```

CSS가 데이터 개수를 직접 알 수 없으므로 JavaScript가 의미 있는 클래스를 제공한다.

## 확인 문제

1. 테마 색상을 컴포넌트마다 직접 쓰지 않고 CSS 변수로 쓰는 이유는 무엇인가?
2. 모바일 대진표를 데스크톱 대진표의 `transform: scale()`로 처리하지 않은 이유는 무엇인가?
3. Flex 자식에 `min-width: 0`이 필요한 경우는 언제인가?
4. Safari 입력 확대를 막기 위해 입력 글자 크기를 몇 px 이상으로 설정했는가?

## 실습

확정 순위가 1개, 2개, 3개일 때 각각 1열, 2열, 3열이 되도록 HTML 클래스와 CSS를 설계한다.

```html
<div class="placements count-2">
    <article>2등</article>
    <article>4등</article>
</div>
```

