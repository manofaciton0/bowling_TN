# 볼링 토너먼트 웹앱 학습 교재

이 교재는 현재 저장소의 `index.html`, `bracket-style.css`, `bracket.js`를 사례로 삼아 정적 웹페이지가 상태 기반 애플리케이션으로 발전하는 과정을 설명한다. 완성 코드를 그대로 외우는 대신, 데이터가 화면이 되고 사용자 입력이 다시 데이터로 돌아가는 흐름을 이해하는 것이 목표다.

## 학습 대상

- HTML과 CSS를 조금 사용해 봤지만 동적 DOM 생성은 익숙하지 않은 사람
- JavaScript 객체, 배열, 이벤트, 비동기 코드가 실제 앱에서 어떻게 연결되는지 알고 싶은 사람
- Supabase Auth, RLS, Realtime을 작은 프로젝트에 적용해 보고 싶은 사람
- 토너먼트처럼 상태 전이가 중요한 UI의 설계 방법을 배우고 싶은 사람

## 권장 선행 지식

- HTML 태그와 `id`, `class`의 의미
- CSS 선택자와 박스 모델
- JavaScript의 변수, 함수, 배열, 객체
- 브라우저 개발자 도구의 Console과 Elements 탭 사용법

모르는 문법이 있어도 각 장의 예제를 직접 실행하며 따라갈 수 있다.

## 교재 구성

| 순서 | 파일 | 주제 |
|---|---|---|
| 0 | [00-architecture.md](./00-architecture.md) | 전체 구조와 실행 순서 |
| 1 | [01-html-and-dom.md](./01-html-and-dom.md) | 정적 HTML과 동적 DOM |
| 2 | [02-css-and-responsive.md](./02-css-and-responsive.md) | 상태 클래스와 반응형 UI |
| 3 | [03-state-and-json.md](./03-state-and-json.md) | 팀, 경기, 대진 상태 JSON |
| 4 | [04-rendering-pipeline.md](./04-rendering-pipeline.md) | 상태를 화면으로 만드는 렌더링 |
| 5 | [05-events-and-scores.md](./05-events-and-scores.md) | 이벤트, 클로저, 점수 입력 |
| 6 | [06-tournament-logic.md](./06-tournament-logic.md) | 승자 진출, 취소, 순위 계산 |
| 7 | [07-local-storage.md](./07-local-storage.md) | localStorage, 백업, 복원 |
| 8 | [08-supabase-auth.md](./08-supabase-auth.md) | 로그인과 관리자 권한 |
| 9 | [09-supabase-data-realtime.md](./09-supabase-data-realtime.md) | JSONB 저장, RLS, Realtime |
| 10 | [10-concurrency-and-debugging.md](./10-concurrency-and-debugging.md) | 동시 수정, 성능, 디버깅 |
| 11 | [11-practice-workbook.md](./11-practice-workbook.md) | 단계별 종합 실습 |
| 12 | [12-answer-guide.md](./12-answer-guide.md) | 확인 문제 해설 |

## 권장 학습 방법

1. 각 장의 **학습 목표**를 먼저 읽는다.
2. 설명에 나온 함수 이름을 `bracket.js`에서 검색한다.
3. 코드 예제를 Console이나 별도 HTML 파일에서 작게 실행한다.
4. 장 끝의 **확인 문제**를 코드 없이 먼저 설명해 본다.
5. **실습**은 완성 코드보다 작은 데이터와 함수부터 만든다.
6. 마지막에 현재 프로젝트 코드와 자신의 구현을 비교한다.

## 프로젝트 파일 역할

```text
index.html          정적인 페이지 뼈대, 모달, 사이드바, 설정값
bracket-style.css   테마, 레이아웃, 상태별 스타일, 반응형 UI
bracket.js          상태, 렌더링, 토너먼트 규칙, 저장, Supabase
fonts/              전광판에 사용하는 로컬 폰트
docs/               이 학습 교재
```

## 보안 주의

교재의 Supabase URL과 키는 모두 예제값으로 표기한다.

```javascript
const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
const publishableKey = 'sb_publishable_EXAMPLE';
```

Publishable Key는 브라우저에서 사용할 수 있는 공개용 키지만, `service_role` 키와 사용자 비밀번호는 HTML, JavaScript, Git 저장소에 절대 넣지 않는다. 실제 권한 통제는 데이터베이스의 RLS 정책으로 수행한다.

## 학습 완료 기준

교재를 마친 뒤 다음 질문에 코드 수준으로 답할 수 있어야 한다.

- `bracket_state` JSON이 어떻게 경기 카드 HTML로 바뀌는가?
- 승자를 다시 클릭했을 때 다음 라운드 데이터는 왜 함께 취소되어야 하는가?
- 점수를 타이핑할 때가 아니라 `입력` 버튼에서 저장하는 이유는 무엇인가?
- 비로그인 사용자가 JavaScript를 조작해도 Supabase 업데이트가 거부되는 이유는 무엇인가?
- 여러 기기에서 동시에 수정할 때 왜 마지막 저장이 앞선 변경을 덮을 수 있는가?

