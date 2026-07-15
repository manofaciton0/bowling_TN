# 08. Supabase Auth와 관리자 권한

## 학습 목표

- 브라우저에서 Supabase 클라이언트를 만드는 과정을 이해한다.
- 로그인과 관리자 권한 검증이 별개임을 이해한다.
- 프론트엔드 읽기 전용 처리와 DB RLS의 역할을 구분한다.

## 1. SDK 로드

정적 웹페이지이므로 CDN에서 Supabase JavaScript SDK를 불러온다.

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.x.x"></script>
```

실제 프로젝트에서는 검증한 버전을 고정해 예기치 않은 변경을 줄인다.

## 2. 공개 설정

```javascript
window.BOWLING_SUPABASE_CONFIG = {
    url: 'https://YOUR_PROJECT.supabase.co',
    publishableKey: 'sb_publishable_EXAMPLE'
};
```

Publishable Key는 브라우저용 공개 키다. 이 키만으로 모든 데이터에 접근할 수 있는 것이 아니라 사용자의 JWT와 RLS 정책이 최종 권한을 결정한다.

절대 브라우저에 넣으면 안 되는 값:

- `service_role` 키
- DB 비밀번호
- 사용자 비밀번호
- 서버 전용 비밀 키

## 3. 클라이언트 생성

```javascript
const config = window.BOWLING_SUPABASE_CONFIG || {};

const client = window.supabase && config.url && config.publishableKey
    ? window.supabase.createClient(config.url, config.publishableKey)
    : null;
```

삼항 연산자 문법:

```javascript
조건 ? 참일_때_값 : 거짓일_때_값
```

SDK나 설정이 없으면 `null`을 두고 UI에 연결 실패를 표시한다.

## 4. 기존 세션 확인

페이지가 열리면 현재 브라우저에 저장된 인증 세션을 확인한다.

```javascript
const { data, error } = await client.auth.getSession();

if (data.session?.user) {
    await validateAndApplyAdminSession(data.session.user);
}
```

구조 분해 할당:

```javascript
const { data, error } = result;
```

`result.data`, `result.error`를 각각 변수로 꺼낸다.

## 5. 이메일과 비밀번호 로그인

```javascript
const { data, error } = await client.auth.signInWithPassword({
    email,
    password
});
```

성공하면 Supabase Auth 사용자의 UUID와 JWT 세션을 받는다. 비밀번호는 프로젝트 DB 테이블에 직접 저장하지 않고 Supabase Auth가 관리한다.

## 6. 로그인과 관리자 권한은 다르다

로그인에 성공한 모든 사용자가 관리자는 아니다. `admin_users`에서 UUID를 확인한다.

```javascript
const { data, error } = await client
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();
```

```text
Auth 로그인 성공
→ user.id 획득
→ admin_users에 같은 UUID가 있는지 조회
→ 있으면 관리자
→ 없으면 로그아웃
```

`maybeSingle()`은 결과가 0개 또는 1개일 때 사용한다.

## 7. 관리자 테이블

개념적 구조:

```sql
create table public.admin_users (
    user_id uuid primary key references auth.users(id),
    created_at timestamptz not null default now()
);
```

Auth 사용자를 만들었다고 자동으로 관리자가 되는 것이 아니다. 해당 UUID를 `admin_users`에 별도로 등록해야 한다.

## 8. 인증 UI 갱신

```javascript
function updateAdminAuthUi(user) {
    currentAdminUser = user || null;

    document.body.classList.toggle(
        'admin-authenticated',
        Boolean(currentAdminUser)
    );

    document.body.classList.toggle(
        'admin-read-only',
        !currentAdminUser
    );
}
```

`Boolean(value)`는 값을 명시적인 `true` 또는 `false`로 변환한다.

## 9. 수정 함수의 방어 코드

버튼을 숨기는 것만으로는 충분하지 않다. 수정 함수 시작에도 검사를 둔다.

```javascript
function requireAdminAccess(action = '수정') {
    if (isAdminAuthenticated()) return true;

    showToast(`${action}은 관리자 로그인 후 사용할 수 있습니다.`);
    setAdminModalState(true);
    return false;
}
```

사용 예:

```javascript
function selectWinner(/* ... */) {
    if (!requireAdminAccess('승패 변경')) return;
    // 상태 변경
}
```

이 검사는 실수나 일반적인 UI 우회를 막지만 진짜 보안 경계는 아니다. 브라우저 코드는 사용자가 수정할 수 있기 때문이다.

## 10. RLS가 실제 보안 경계다

DB에는 다음과 같은 UPDATE 정책이 필요하다.

```sql
create policy "admins can update tournament state"
on public.tournament_state
for update
to authenticated
using (
    exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
)
with check (
    exists (
        select 1
        from public.admin_users
        where user_id = auth.uid()
    )
);
```

사용자가 개발자 도구에서 버튼을 다시 보이게 해도 DB가 JWT의 사용자 UUID를 확인하고 업데이트를 거부한다.

## 11. 로그아웃

```javascript
await client.auth.signOut();
updateAdminAuthUi(null);
```

로그아웃 시 편집 UI를 숨기고 열린 관리자 전용 모달도 닫는다.

## 확인 문제

1. Publishable Key가 HTML에 있어도 되는 이유는 무엇인가?
2. 로그인 성공 후 `admin_users`를 다시 조회하는 이유는 무엇인가?
3. 버튼을 CSS로 숨기는 것만으로 보안이 완성되지 않는 이유는 무엇인가?
4. RLS의 `auth.uid()`는 무엇을 나타내는가?
5. `maybeSingle()`은 어떤 조회에 적합한가?

## 실습

가상의 로그인 상태로 읽기 전용 UI를 전환한다.

```javascript
let currentUser = null;

function updateUi(user) {
    // TODO: body에 read-only 클래스를 전환한다.
    // TODO: 버튼 텍스트를 로그인/로그아웃으로 바꾼다.
}
```

추가 질문: 이 UI 코드만으로 DB 보안을 보장할 수 없는 이유를 한 문장으로 설명한다.

