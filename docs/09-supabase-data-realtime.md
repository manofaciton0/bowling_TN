# 09. Supabase JSONB 저장과 Realtime

## 학습 목표

- 원격 대회 상태를 불러와 메모리와 화면에 적용하는 과정을 이해한다.
- JSONB 한 행 업데이트와 Realtime 수신 구조를 이해한다.
- RLS의 공개 조회와 관리자 수정 정책을 구분한다.

## 1. 테이블 구조

개념적 SQL:

```sql
create table public.tournament_state (
    id text primary key,
    players jsonb not null default '[]'::jsonb,
    bracket_state jsonb not null default '[]'::jsonb,
    display_state jsonb not null default '{}'::jsonb,
    version bigint not null default 0,
    updated_at timestamptz not null default now()
);
```

현재 대회는 한 행으로 식별한다.

```javascript
const SUPABASE_TOURNAMENT_ID = 'bowling-2026';
```

## 2. 초기화 순서

```javascript
function initializeSupabaseTournamentState() {
    subscribeToTournamentState();
    remoteStateLoadPromise = loadRemoteTournamentState();
}
```

구독을 먼저 시작한 뒤 현재 상태를 조회한다. 조회 중 발생하는 변경을 놓칠 가능성을 줄이기 위한 순서다.

## 3. 현재 상태 조회

```javascript
const { data, error } = await client
    .from('tournament_state')
    .select('id, players, bracket_state, display_state, version, updated_at')
    .eq('id', SUPABASE_TOURNAMENT_ID)
    .maybeSingle();
```

Supabase SDK는 `jsonb`를 JavaScript 배열과 객체로 변환한다. 별도의 `JSON.parse()`가 필요 없다.

## 4. 원격 상태 적용

```javascript
function applyRemoteTournamentState(row) {
    if (!row || row.id !== SUPABASE_TOURNAMENT_ID) return;

    const incomingVersion = Number.parseInt(row.version, 10) || 0;
    if (incomingVersion < remoteTournamentVersion) return;

    remoteTournamentVersion = incomingVersion;
    tournamentPlayers = normalizePlayers(row.players);
    bracketState = row.bracket_state;

    normalizeBracketState();
    renderBracket();
}
```

오래된 버전 이벤트는 무시한다. 단, 이 검사는 수신 순서를 정리할 뿐 저장 충돌을 막지는 않는다.

## 5. 변경 여부 비교

현재 구현은 원격 데이터와 메모리 데이터를 문자열로 비교한다.

```javascript
const changed =
    JSON.stringify(bracketState) !== JSON.stringify(row.bracket_state);
```

장점은 단순함이다. 단점은 객체가 커질수록 전체 직렬화 비용이 생기고 속성 순서에 의존할 수 있다는 점이다.

## 6. 첫 원격 상태 초기화

Supabase 행의 배열이 비어 있고 관리자가 로그인하면 현재 브라우저 상태를 최초 저장한다.

```javascript
async function ensureRemoteTournamentStateInitialized() {
    if (!isAdminAuthenticated()) return false;
    if (remoteTournamentStateInitialized) return true;

    return updateRemoteTournamentState();
}
```

처음 어떤 상태를 업로드할지 결정해야 하므로 익명 사용자가 아니라 관리자만 초기화한다.

## 7. 원격 업데이트 payload

```javascript
const payload = {
    players: tournamentPlayers,
    bracket_state: bracketState,
    display_state: currentDisplayState
};

const { data, error } = await client
    .from('tournament_state')
    .update(payload)
    .eq('id', SUPABASE_TOURNAMENT_ID)
    .select('id, players, bracket_state, display_state, version, updated_at')
    .maybeSingle();
```

점수 하나가 바뀌어도 현재는 `bracket_state` JSON 전체와 다른 두 JSON 컬럼을 함께 보낸다.

## 8. 저장 큐

```javascript
let remoteSavePending = false;
let remoteSaveInFlight = false;
```

- `pending`: 저장해야 할 새 변경이 있음
- `inFlight`: 현재 네트워크 요청 중

요청 중에 새 변경이 생기면 현재 요청이 끝난 뒤 다시 저장한다. 동시에 여러 UPDATE 요청이 무질서하게 실행되는 것을 줄인다.

## 9. Realtime 구독

```javascript
client
    .channel(`tournament-state-${SUPABASE_TOURNAMENT_ID}`)
    .on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'tournament_state',
            filter: `id=eq.${SUPABASE_TOURNAMENT_ID}`
        },
        payload => applyRemoteTournamentState(payload.new)
    )
    .subscribe();
```

다른 기기에서 업데이트하면 새 행 데이터가 `payload.new`에 들어온다.

```text
관리자 A UPDATE
→ Postgres 행 변경
→ Realtime 이벤트
→ 사용자 B payload.new 수신
→ applyRemoteTournamentState()
→ renderBracket()
```

## 10. 공개 조회 RLS

읽기 전용 관람자는 로그인하지 않아도 대진표를 읽어야 한다.

```sql
create policy "public can read tournament state"
on public.tournament_state
for select
to anon, authenticated
using (true);
```

UPDATE는 관리자 정책으로 별도 제한한다. SELECT가 공개라고 UPDATE까지 공개되는 것은 아니다.

## 11. Realtime publication

Postgres Changes를 받으려면 테이블이 `supabase_realtime` publication에 포함되어야 한다.

```sql
alter publication supabase_realtime
add table public.tournament_state;
```

RLS가 활성화된 테이블의 변경은 해당 행을 SELECT할 수 있는 클라이언트에게 전달된다.

## 12. 공지 동기화

공지 시작:

```javascript
currentDisplayState = {
    notice: {
        active: true,
        message,
        highlightLosses: Boolean(options.highlightLosses)
    }
};
```

공지 정지:

```javascript
currentDisplayState = createEmptyDisplayState();
```

`display_state`도 같은 행에 저장되므로 읽기 전용 사용자에게 Realtime으로 전달된다.

## 확인 문제

1. Realtime 구독을 조회보다 먼저 시작하는 이유는 무엇인가?
2. Supabase의 JSONB를 받은 뒤 `JSON.parse()`가 필요 없는 이유는 무엇인가?
3. 점수 하나를 저장할 때 현재 payload에 포함되는 세 필드는 무엇인가?
4. SELECT가 공개여도 UPDATE를 관리자만 할 수 있는 이유는 무엇인가?
5. `remoteSaveInFlight`가 필요한 이유는 무엇인가?

## 실습

다음 요구사항의 간단한 공유 메모를 설계한다.

```text
누구나 메모 조회 가능
관리자만 메모 수정 가능
수정 시 다른 브라우저에 즉시 반영
```

작성할 항목:

- 테이블 SQL
- SELECT/UPDATE RLS 정책
- JavaScript 조회 코드
- JavaScript UPDATE 코드
- Realtime 구독 코드

