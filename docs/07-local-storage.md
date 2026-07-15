# 07. localStorage, 백업, 복원

## 학습 목표

- JavaScript 객체를 문자열로 직렬화해 저장하는 과정을 이해한다.
- localStorage를 원본 DB가 아니라 로컬 캐시로 사용하는 이유를 이해한다.
- 대진표 버전 검증과 JSON 백업 복원 흐름을 설명할 수 있다.

## 1. localStorage 특징

localStorage는 브라우저에 문자열을 저장한다.

```javascript
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');
localStorage.removeItem('key');
```

특징:

- 같은 브라우저와 같은 사이트에서 유지
- 새로고침 후에도 남음
- 다른 기기와 공유되지 않음
- 값은 문자열만 저장 가능
- 사용자가 브라우저 데이터를 지우면 사라짐

## 2. JSON 직렬화

객체를 저장할 때 `JSON.stringify()`를 사용한다.

```javascript
const data = {
    version: TOURNAMENT_VERSION,
    players: tournamentPlayers,
    bracketState
};

localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
```

읽을 때는 `JSON.parse()`로 복원한다.

```javascript
const saved = localStorage.getItem(STORAGE_KEY);
const data = JSON.parse(saved);
```

## 3. 속성 축약 문법

```javascript
const data = {
    players: tournamentPlayers,
    bracketState
};
```

`bracketState`는 다음의 축약이다.

```javascript
const data = {
    players: tournamentPlayers,
    bracketState: bracketState
};
```

변수명과 속성명이 같을 때 사용할 수 있다.

## 4. 버전별 저장 키

```javascript
const STORAGE_KEY = `bowling_bracket_state_${TOURNAMENT_VERSION}`;
```

대진 구조가 바뀌면 새 버전은 다른 localStorage 키를 사용한다. 과거 2팀 결승 데이터가 현재 3팀 결승 코드에 잘못 로드되는 문제를 줄인다.

## 5. 저장 함수

```javascript
function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: TOURNAMENT_VERSION,
        players: tournamentPlayers,
        bracketState
    }));

    scheduleRemoteTournamentStateSave();
}
```

한 함수에서 로컬 저장 후 원격 저장을 예약한다.

```text
상태 변경
→ localStorage 즉시 저장
→ Supabase 저장 350ms 예약
```

원격 저장이 실패해도 현재 기기의 로컬 상태는 남는다.

## 6. 저장 상태 검증

```javascript
if (data.version !== TOURNAMENT_VERSION) {
    localStorage.removeItem(STORAGE_KEY);
    return false;
}
```

또한 배열 여부를 확인한다.

```javascript
if (!Array.isArray(data.bracketState)) return false;
```

외부 입력과 저장 데이터는 항상 예상 형식을 검증해야 한다.

## 7. 팀 목록 비교

내장된 팀 목록과 저장된 팀 목록이 다르면 이전 상태를 그대로 적용하지 않는다.

```javascript
arePlayerListsSame(savedPlayers, sourcePlayers)
```

팀 순서가 대진 배치에 영향을 주므로 이름과 팀원 배열을 순서대로 비교한다.

## 8. JSON 다운로드

현재 상태를 JSON 문자열로 만든 뒤 Data URL을 사용해 다운로드한다.

```javascript
const dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(exportData, null, 2));

const anchor = document.createElement('a');
anchor.href = dataStr;
anchor.download = 'bracket-data.json';
anchor.click();
```

`JSON.stringify(data, null, 2)`의 `2`는 사람이 읽기 좋게 두 칸 들여쓰기를 적용한다.

## 9. JSON 복원

파일 입력 요소를 동적으로 만든다.

```javascript
const input = document.createElement('input');
input.type = 'file';
input.accept = '.json,application/json';
input.click();
```

`FileReader`로 읽은 뒤 파싱한다.

```javascript
reader.addEventListener('load', () => {
    const data = JSON.parse(String(reader.result || ''));
    restoreFromBackup(data);
});
```

복원 과정에서도 버전, 팀 배열, 대진 배열을 검사한다.

## 10. debounce

```javascript
function scheduleRemoteTournamentStateSave() {
    remoteSavePending = true;
    clearTimeout(remoteSaveTimer);
    remoteSaveTimer = setTimeout(flushRemoteTournamentStateSave, 350);
}
```

350ms 안에 여러 번 호출되면 이전 타이머를 취소하고 마지막 한 번만 실행한다.

```text
0ms 변경   → 350ms 저장 예약
100ms 변경 → 이전 예약 취소, 450ms 저장 예약
200ms 변경 → 이전 예약 취소, 550ms 저장 예약
550ms      → 한 번 저장
```

현재 점수는 제출 버튼에서만 저장하지만, 공지나 연쇄 상태 변경이 짧은 시간에 발생할 때도 요청을 줄인다.

## 11. localStorage의 한계

localStorage만 사용하면:

- 다른 기기에서 볼 수 없음
- 관리자 여러 명이 공유할 수 없음
- 브라우저 데이터 삭제에 취약
- 서버 권한 검증이 없음

그래서 Supabase를 공유 원본 상태로 추가했다.

## 확인 문제

1. localStorage에 객체를 직접 저장할 수 없는 이유는 무엇인가?
2. `TOURNAMENT_VERSION`을 저장 데이터에 넣는 이유는 무엇인가?
3. 원격 저장보다 로컬 저장을 먼저 하는 장점은 무엇인가?
4. debounce가 1초 간격의 네 번 변경도 한 번으로 합치는가?
5. 백업 파일을 곧바로 상태에 대입하지 않고 검증하는 이유는 무엇인가?

## 실습

간단한 메모 객체를 localStorage에 저장하고 복원한다.

```javascript
const note = {
    title: '대회 준비',
    items: ['팀 확인', '레인 확인']
};
```

요구사항:

- `saveNote(note)` 작성
- `loadNote()` 작성
- 잘못된 JSON이면 기본 객체 반환
- `version`이 다르면 이전 데이터 무시

