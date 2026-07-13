document.addEventListener('DOMContentLoaded', () => {
    fetchData();

    const btnDownload = document.getElementById('btn-download');
    const btnRestore = document.getElementById('btn-restore');
    const btnReset = document.getElementById('btn-reset');
    const btnTheme = document.getElementById('btn-theme');
    const btnNavToggle = document.getElementById('btn-nav-toggle');
    const btnHelp = document.getElementById('btn-help');
    const btnHelpClose = document.getElementById('btn-help-close');
    const helpModalOverlay = document.getElementById('help-modal-overlay');
    const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
    const btnSidebarClose = document.getElementById('btn-sidebar-close');
    const teamSidebarOverlay = document.getElementById('team-sidebar-overlay');
    const btnNotice = document.getElementById('btn-notice');
    const btnNoticeStop = document.getElementById('btn-notice-stop');
    const btnNoticeClose = document.getElementById('btn-notice-close');
    const noticeModalOverlay = document.getElementById('notice-modal-overlay');
    const noticeForm = document.getElementById('notice-form');
    const roundResultSelect = document.getElementById('round-result-select');
    const btnSettings = document.getElementById('btn-settings');
    const btnSettingsClose = document.getElementById('btn-settings-close');
    const settingsModalOverlay = document.getElementById('settings-modal-overlay');
    const speedInput = document.getElementById('notice-speed-input');
    const defaultSpeedCheckbox = document.getElementById('use-default-speed');

    initializeTheme();
    initializeNavState();
    initializeNoticeSpeedSettings();

    if (btnDownload) {
        btnDownload.addEventListener('click', downloadJSON);
    }
    if (btnRestore) {
        btnRestore.addEventListener('click', restoreJSON);
    }
    if (btnReset) {
        btnReset.addEventListener('click', resetBracket);
    }
    if (btnTheme) {
        btnTheme.addEventListener('click', toggleTheme);
    }
    if (btnNavToggle) {
        btnNavToggle.addEventListener('click', toggleNav);
    }
    if (btnHelp) {
        btnHelp.addEventListener('click', () => setHelpModalState(true));
    }
    if (btnHelpClose) {
        btnHelpClose.addEventListener('click', () => setHelpModalState(false));
    }
    if (helpModalOverlay) {
        helpModalOverlay.addEventListener('click', () => setHelpModalState(false));
    }
    if (btnSidebarToggle) {
        btnSidebarToggle.addEventListener('click', toggleTeamSidebar);
    }
    if (btnSidebarClose) {
        btnSidebarClose.addEventListener('click', () => setTeamSidebarState(false));
    }
    if (teamSidebarOverlay) {
        teamSidebarOverlay.addEventListener('click', () => setTeamSidebarState(false));
    }
    btnNotice?.addEventListener('click', () => setNoticeModalState(true));
    btnNoticeStop?.addEventListener('click', stopNotice);
    btnNoticeClose?.addEventListener('click', () => setNoticeModalState(false));
    noticeModalOverlay?.addEventListener('click', () => setNoticeModalState(false));
    noticeForm?.addEventListener('submit', publishNotice);
    roundResultSelect?.addEventListener('change', publishRoundResults);
    btnSettings?.addEventListener('click', () => setSettingsModalState(true));
    btnSettingsClose?.addEventListener('click', () => setSettingsModalState(false));
    settingsModalOverlay?.addEventListener('click', () => setSettingsModalState(false));
    document.getElementById('btn-speed-decrease')?.addEventListener('click', () => changeNoticeSpeed(-10));
    document.getElementById('btn-speed-increase')?.addEventListener('click', () => changeNoticeSpeed(10));
    speedInput?.addEventListener('change', () => setNoticeSpeed(speedInput.value));
    defaultSpeedCheckbox?.addEventListener('change', () => toggleDefaultNoticeSpeed(defaultSpeedCheckbox.checked));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMemberScoreEditors();
            setHelpModalState(false);
            setTeamSidebarState(false);
            setNoticeModalState(false);
            setSettingsModalState(false);
        }
    });
    document.addEventListener('click', closeMemberScoreEditors);

    window.addEventListener('resize', scheduleRenderBracketLines);
});

function initializeNoticeSpeedSettings() {
    const savedSpeed = Number.parseInt(localStorage.getItem(NOTICE_SPEED_STORAGE_KEY), 10);
    noticeScrollSpeed = normalizeNoticeSpeed(savedSpeed || DEFAULT_NOTICE_SCROLL_SPEED);
    updateNoticeSpeedControls(noticeScrollSpeed === DEFAULT_NOTICE_SCROLL_SPEED);
}

function setSettingsModalState(open) {
    const modal = document.getElementById('settings-modal');
    const overlay = document.getElementById('settings-modal-overlay');
    const button = document.getElementById('btn-settings');
    const closeButton = document.getElementById('btn-settings-close');
    const wasOpen = document.body.classList.contains('settings-modal-open');

    if (!open && !wasOpen) return;

    document.body.classList.toggle('settings-modal-open', open);
    modal?.setAttribute('aria-hidden', String(!open));
    overlay?.setAttribute('aria-hidden', String(!open));
    button?.setAttribute('aria-expanded', String(open));

    if (open) {
        closeButton?.focus();
    } else if (wasOpen) {
        button?.focus();
    }
}

function normalizeNoticeSpeed(value) {
    const numericValue = Number.parseInt(value, 10);
    if (Number.isNaN(numericValue)) return DEFAULT_NOTICE_SCROLL_SPEED;
    return Math.min(300, Math.max(10, numericValue));
}

function setNoticeSpeed(value) {
    noticeScrollSpeed = normalizeNoticeSpeed(value);
    localStorage.setItem(NOTICE_SPEED_STORAGE_KEY, String(noticeScrollSpeed));
    updateNoticeSpeedControls(false);
    refreshActiveNoticeSpeed();
}

function changeNoticeSpeed(change) {
    setNoticeSpeed(noticeScrollSpeed + change);
}

function toggleDefaultNoticeSpeed(useDefault) {
    if (useDefault) {
        noticeScrollSpeed = DEFAULT_NOTICE_SCROLL_SPEED;
        localStorage.removeItem(NOTICE_SPEED_STORAGE_KEY);
        updateNoticeSpeedControls(true);
        refreshActiveNoticeSpeed();
        return;
    }

    updateNoticeSpeedControls(false);
}

function updateNoticeSpeedControls(useDefault) {
    const input = document.getElementById('notice-speed-input');
    const checkbox = document.getElementById('use-default-speed');
    const decreaseButton = document.getElementById('btn-speed-decrease');
    const increaseButton = document.getElementById('btn-speed-increase');

    if (input) {
        input.value = String(noticeScrollSpeed);
        input.disabled = useDefault;
    }
    if (checkbox) checkbox.checked = useDefault;
    if (decreaseButton) decreaseButton.disabled = useDefault;
    if (increaseButton) increaseButton.disabled = useDefault;
}

function refreshActiveNoticeSpeed() {
    const board = document.getElementById('notice-board');
    const text = document.getElementById('notice-text');
    if (!board?.classList.contains('is-active') || !text) return;

    applyNoticeScrollDuration(text);
}

function applyNoticeScrollDuration(text) {
    const travelDistance = text.getBoundingClientRect().width;
    const duration = Math.max(travelDistance / noticeScrollSpeed, 8);
    text.style.setProperty('--notice-scroll-duration', `${duration.toFixed(2)}s`);
}

function setNoticeModalState(open) {
    const modal = document.getElementById('notice-modal');
    const overlay = document.getElementById('notice-modal-overlay');
    const button = document.getElementById('btn-notice');
    const input = document.getElementById('notice-input');
    const wasOpen = document.body.classList.contains('notice-modal-open');

    if (!open && !wasOpen) return;

    document.body.classList.toggle('notice-modal-open', open);
    modal?.setAttribute('aria-hidden', String(!open));
    overlay?.setAttribute('aria-hidden', String(!open));
    button?.setAttribute('aria-expanded', String(open));

    if (open) {
        window.setTimeout(() => input?.focus(), 50);
    } else if (wasOpen) {
        button?.focus();
    }
}

function publishNotice(event) {
    event.preventDefault();
    const input = document.getElementById('notice-input');
    const message = input?.value.trim();
    if (!message) {
        input?.focus();
        return;
    }

    const roundResultSelect = document.getElementById('round-result-select');
    if (roundResultSelect) roundResultSelect.value = '';
    activateNoticeBoard(message);
    setNoticeModalState(false);
}

function publishRoundResults(event) {
    const select = event.currentTarget;
    const roundIndex = Number.parseInt(select.value, 10);
    if (Number.isNaN(roundIndex)) return;

    const round = bracketState[roundIndex];
    if (!Array.isArray(round) || round.length === 0) {
        showToast('선택한 라운드의 경기 결과가 없습니다.');
        return;
    }

    const title = roundTitles[roundIndex] || `Round ${roundIndex + 1}`;
    const matches = round.map((match, matchIndex) => formatMatchResult(match, matchIndex));
    activateNoticeBoard(`◆ ${title} 경기 결과 ◆   ${matches.join('   ◆   ')}`);
}

function formatMatchResult(match, matchIndex) {
    const teams = getMatchSlots(match).map(slot => formatTeamResult(match, slot));
    return `${matchIndex + 1}경기  ${teams.join('  VS  ')}`;
}

function formatTeamResult(match, slot) {
    const team = match[slot];
    if (!team) return '대기중';

    const memberScores = getSlotMemberScores(match, slot, team);
    const memberText = getScoreMembers(team)
        .map((member, index) => `${member} ${memberScores[index] || '-'}`)
        .join(' · ');
    const memberTotal = calculateMemberScoreTotal(memberScores);
    const savedTotal = String(match[`${slot}Score`] ?? '').trim();
    const total = memberTotal || savedTotal || '-';
    const winnerMark = isSameTeam(team, match.winner) ? ' [승]' : '';

    return `${team.name}${winnerMark} (${memberText} / 합계 ${total})`;
}

function activateNoticeBoard(message) {
    const board = document.getElementById('notice-board');
    const text = document.getElementById('notice-text');
    if (text) text.textContent = message;
    board?.classList.remove('is-active');
    void board?.offsetWidth;
    board?.classList.add('is-active');
    board?.setAttribute('aria-hidden', 'false');
    if (board && text) {
        applyNoticeScrollDuration(text);
    }
    const stopButton = document.getElementById('btn-notice-stop');
    if (stopButton) stopButton.disabled = false;
}

function stopNotice() {
    const board = document.getElementById('notice-board');
    board?.classList.remove('is-active');
    board?.setAttribute('aria-hidden', 'true');
    const stopButton = document.getElementById('btn-notice-stop');
    if (stopButton) stopButton.disabled = true;
    const roundResultSelect = document.getElementById('round-result-select');
    if (roundResultSelect) roundResultSelect.value = '';
}

let bracketState = [];
let tournamentPlayers = [];
let expandedSidebarTeamName = null;
const DEFAULT_NOTICE_SCROLL_SPEED = 100;
const NOTICE_SPEED_STORAGE_KEY = 'bowling_notice_scroll_speed';
let noticeScrollSpeed = DEFAULT_NOTICE_SCROLL_SPEED;

const pageTournamentConfig = window.BOWLING_BRACKET_CONFIG || {};
const pageFormatConfig = pageTournamentConfig.format || {};
const DEFAULT_TOURNAMENT_VERSION = '18-team-14-prelim-v2';
const DEFAULT_TOURNAMENT_TITLE = '볼링대회 18팀 토너먼트';
const DEFAULT_BYE_RULE = '본선 11강의 부전승 슬롯은 중앙 경로(5/6팀 예선 승자)에 배치됩니다.';
const DEFAULT_PRELIMINARY_ROUTES = [
    { matchIndex: 0, slot: 'p1' },
    { matchIndex: 1, slot: 'p1' },
    { matchIndex: 2, slot: 'p1' },
    { matchIndex: 3, slot: 'p1' },
    { matchIndex: 4, slot: 'p1' },
    { matchIndex: 4, slot: 'p2' },
    { matchIndex: 5, slot: 'p1' }
];
const DEFAULT_PRELIMINARY_LANES = [[0], [1], [2], [3], [4, 5], [6]];

const TOURNAMENT_VERSION = pageTournamentConfig.version || pageFormatConfig.version || DEFAULT_TOURNAMENT_VERSION;
const STORAGE_KEY = `bowling_bracket_state_${TOURNAMENT_VERSION}`;
const TOTAL_TEAMS = Number(pageFormatConfig.totalTeams ?? pageTournamentConfig.totalTeams ?? 18);
const PRELIMINARY_TEAMS = Number(pageFormatConfig.preliminaryTeams ?? pageTournamentConfig.preliminaryTeams ?? 14);
const DIRECT_MAIN_TEAMS = Number(pageFormatConfig.directMainTeams ?? pageTournamentConfig.directMainTeams ?? 4);
const FINAL_ROUND_TEAM_COUNT = Number(pageFormatConfig.finalRoundTeamCount ?? pageTournamentConfig.finalRoundTeamCount ?? 2);
const BYE_RULE = pageFormatConfig.byeRule || pageTournamentConfig.byeRule || DEFAULT_BYE_RULE;
const TOURNAMENT_TITLE = pageTournamentConfig.title || DEFAULT_TOURNAMENT_TITLE;
const DIRECT_MAIN_LEGEND_TEXT = pageFormatConfig.directMainLegendText
    || pageTournamentConfig.directMainLegendText
    || '경기 없이 11강 바로 진출';
const SVG_NS = 'http://www.w3.org/2000/svg';
const THEME_STORAGE_KEY = 'bowling_bracket_theme';
const NAV_STORAGE_KEY = 'bowling_bracket_nav_collapsed';

const roundTitles = pageFormatConfig.roundTitles
    || pageTournamentConfig.roundTitles
    || ['예선 14강', '본선 11강', '본선 6강', '준결승', '결승'];
const preliminaryRoutes = pageFormatConfig.preliminaryRoutes
    || pageTournamentConfig.preliminaryRoutes
    || DEFAULT_PRELIMINARY_ROUTES;
const preliminaryLanes = pageFormatConfig.preliminaryLanes
    || pageTournamentConfig.preliminaryLanes
    || (PRELIMINARY_TEAMS === 14 ? DEFAULT_PRELIMINARY_LANES : null);

function initializeNavState() {
    const isCollapsed = localStorage.getItem(NAV_STORAGE_KEY) === 'true';
    setNavState(isCollapsed);
}

function toggleNav() {
    const topBar = document.getElementById('top-bar');
    const isCurrentlyCollapsed = topBar?.classList.contains('collapsed');
    setNavState(!isCurrentlyCollapsed);
}

function setNavState(collapsed) {
    const topBar = document.getElementById('top-bar');
    if (!topBar) return;

    topBar.classList.toggle('collapsed', collapsed);
    document.body.classList.toggle('nav-collapsed', collapsed);
    localStorage.setItem(NAV_STORAGE_KEY, collapsed);
}

function setHelpModalState(open) {
    const modal = document.getElementById('help-modal');
    const overlay = document.getElementById('help-modal-overlay');
    const helpButton = document.getElementById('btn-help');
    const closeButton = document.getElementById('btn-help-close');
    const wasOpen = document.body.classList.contains('help-modal-open');

    if (!open && !wasOpen) return;

    document.body.classList.toggle('help-modal-open', open);

    if (modal) {
        modal.setAttribute('aria-hidden', String(!open));
    }
    if (overlay) {
        overlay.setAttribute('aria-hidden', String(!open));
    }
    if (helpButton) {
        helpButton.setAttribute('aria-expanded', String(open));
    }
    if (open) {
        closeButton?.focus();
    } else if (wasOpen) {
        helpButton?.focus();
    }
}

function toggleTeamSidebar() {
    const isOpen = document.body.classList.contains('team-sidebar-open');
    setTeamSidebarState(!isOpen);
}

function setTeamSidebarState(open) {
    const sidebar = document.getElementById('team-sidebar');
    const overlay = document.getElementById('team-sidebar-overlay');
    const toggleButton = document.getElementById('btn-sidebar-toggle');
    const closeButton = document.getElementById('btn-sidebar-close');
    const wasOpen = document.body.classList.contains('team-sidebar-open');

    if (!open && !wasOpen) return;

    document.body.classList.toggle('team-sidebar-open', open);

    if (sidebar) {
        sidebar.setAttribute('aria-hidden', String(!open));
    }
    if (overlay) {
        overlay.setAttribute('aria-hidden', String(!open));
    }
    if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', String(open));
    }
    if (open) {
        renderTeamSidebar();
        closeButton?.focus();
    } else if (wasOpen) {
        toggleButton?.focus();
    }
}

function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    setTheme(savedTheme === 'dark' ? 'dark' : 'light');
}

function toggleTheme() {
    const nextTheme = document.body.classList.contains('theme-light') ? 'dark' : 'light';
    setTheme(nextTheme);
    scheduleRenderBracketLines();
}

function setTheme(theme) {
    const normalizedTheme = theme === 'dark' ? 'dark' : 'light';
    document.body.classList.toggle('theme-light', normalizedTheme === 'light');
    document.body.classList.toggle('theme-dark', normalizedTheme === 'dark');
    localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);

    const themeButton = document.getElementById('btn-theme');
    if (themeButton) {
        themeButton.textContent = normalizedTheme === 'light' ? '어두운 테마' : '밝은 테마';
    }
}

// === [사용자 설정] 대진표 선수/팀 데이터 ===
// 웹 서버(CORS) 없이 로컬 파일만 더블 클릭해서 실행할 수 있도록 데이터 파일의 내용을 자바스크립트에 내장했습니다.
// 선수 명단이나 팀명을 수정하려면 이 변수 내부의 데이터를 편집해 주세요.
const localTournamentData = {
  "version": TOURNAMENT_VERSION,
  "title": TOURNAMENT_TITLE,
  "format": {
    "totalTeams": TOTAL_TEAMS,
    "preliminaryTeams": PRELIMINARY_TEAMS,
    "directMainTeams": DIRECT_MAIN_TEAMS,
    "finalRoundTeamCount": FINAL_ROUND_TEAM_COUNT,
    "byeRule": BYE_RULE
  },
  "players": [
  { "name": "1팀", "members": ["김수빈", "백창건", "김정환", "김정은"] },
  { "name": "2팀", "members": ["이상범", "김묘덕", "이찬양", "김민기(전략)"] },
  { "name": "3팀", "members": ["박철우", "김민기", "황인찬", "송정아"] },
  { "name": "4팀", "members": ["정재운", "김용주", "이시영", "한수연"] },
  { "name": "5팀", "members": ["김영제", "김성주", "유수정", "오미선"] },
  { "name": "6팀", "members": ["임해식", "장지영", "정헌", "한동찬"] },
  { "name": "7팀", "members": ["최진성", "이호균", "홍우석", "이서하"] },
  { "name": "8팀", "members": ["민동현", "정해림", "김슬기", "기지희"] },
  { "name": "9팀", "members": ["박시훈", "이규승", "장은채", "차지훈"] },
  { "name": "10팀", "members": ["최봉락", "천일범", "강소희", "구소영"] },
  { "name": "11팀", "members": ["이효수", "이민규", "장예안", "이은지"] },
  { "name": "12팀", "members": ["안홍주", "이혜선", "조덕현", "박윤경"] },
  { "name": "13팀", "members": ["황윤하", "이송희", "김진", "김지선"] },
  { "name": "14팀", "members": ["이호경", "권성수", "문진규", "이은진"] },
  { "name": "15팀", "members": ["이경민", "정상현", "김다찬", "황서연"] },
  { "name": "16팀", "members": ["김태형", "이황열", "김종현", "신민경"] },
  { "name": "17팀", "members": ["조영", "이영웅", "손제민", "한지원"] },
  { "name": "18팀", "members": ["박세준", "이길용", "최용훈", "황찬선"] }
]
};

function fetchData() {
    try {
        loadTournamentData(localTournamentData);
    } catch (error) {
        console.warn('로컬 데이터 로드 실패. 내장 더미 데이터를 사용합니다.', error);
        setTournamentTitle(TOURNAMENT_TITLE);
        const fallbackPlayers = createFallbackPlayers();
        if (loadSavedState(fallbackPlayers)) {
            renderBracket();
            return;
        }
        initBracket(fallbackPlayers);
    }
}

function loadTournamentData(data) {
    setTournamentTitle(data.title || TOURNAMENT_TITLE);
    const sourcePlayers = normalizePlayers(data.players);

    if (loadSavedState(sourcePlayers)) {
        renderBracket();
        return;
    }

    tournamentPlayers = sourcePlayers;

    if (data.version === TOURNAMENT_VERSION && Array.isArray(data.bracketState)) {
        bracketState = data.bracketState;
        normalizeBracketState();
        saveToLocalStorage();
        renderBracket();
        return;
    }

    initBracket(tournamentPlayers);
}

function loadSavedState(sourcePlayers = null) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    try {
        const data = JSON.parse(saved);
        if (data.version !== TOURNAMENT_VERSION || !Array.isArray(data.bracketState)) {
            localStorage.removeItem(STORAGE_KEY);
            return false;
        }

        const savedPlayers = normalizePlayers(data.players);
        if (sourcePlayers && !arePlayerListsSame(savedPlayers, sourcePlayers)) {
            localStorage.removeItem(STORAGE_KEY);
            return false;
        }

        tournamentPlayers = savedPlayers;
        bracketState = data.bracketState;
        normalizeBracketState();
        return true;
    } catch (error) {
        console.error('로컬스토리지 파싱 에러, 새 대진표를 로드합니다.', error);
        localStorage.removeItem(STORAGE_KEY);
        return false;
    }
}

function arePlayerListsSame(a, b) {
    const normalizedA = normalizePlayers(a);
    const normalizedB = normalizePlayers(b);

    return normalizedA.every((player, index) => {
        const other = normalizedB[index];
        if (!other || player.name !== other.name) return false;

        const members = Array.isArray(player.members) ? player.members : [];
        const otherMembers = Array.isArray(other.members) ? other.members : [];
        return members.length === otherMembers.length
            && members.every((member, memberIndex) => member === otherMembers[memberIndex]);
    });
}

function normalizePlayers(players, fallback = createFallbackPlayers()) {
    const normalized = Array.isArray(players)
        ? players.filter(player => player && player.name).slice(0, TOTAL_TEAMS)
        : [];

    for (let i = normalized.length; i < TOTAL_TEAMS; i++) {
        normalized.push(fallback[i] || { name: `${i + 1}팀`, members: [] });
    }

    return normalized;
}

function initBracket(players) {
    const entrants = normalizePlayers(players);
    const preliminaryPlayers = entrants.slice(0, PRELIMINARY_TEAMS);
    const directMainPlayers = entrants.slice(PRELIMINARY_TEAMS, PRELIMINARY_TEAMS + DIRECT_MAIN_TEAMS);

    tournamentPlayers = entrants;
    bracketState = [];

    if (PRELIMINARY_TEAMS === 12 && DIRECT_MAIN_TEAMS === 6 && FINAL_ROUND_TEAM_COUNT === 3) {
        initTwelvePrelimFinalThree(preliminaryPlayers, directMainPlayers);
        return;
    }

    const preliminaryRound = [];
    for (let i = 0; i < PRELIMINARY_TEAMS / 2; i++) {
        preliminaryRound.push(createMatch(`prelim-m${i}`, preliminaryPlayers[i * 2], preliminaryPlayers[i * 2 + 1], {
            route: {
                roundIndex: 1,
                matchIndex: preliminaryRoutes[i].matchIndex,
                slot: preliminaryRoutes[i].slot
            }
        }));
    }

    const mainRound = [
        createMatch('main-m0', null, directMainPlayers[0]),
        createMatch('main-m1', null, directMainPlayers[1]),
        createMatch('main-m2', null, null, { byeSlot: 'p2', byeLabel: '부전승' }),
        createMatch('main-m3', null, directMainPlayers[2]),
        createMatch('main-m4'),
        createMatch('main-m5', null, directMainPlayers[3])
    ];

    bracketState.push(preliminaryRound);
    bracketState.push(mainRound);
    bracketState.push(createEmptyRound('six', 3));
    bracketState.push([
        createMatch('semi-m0'),
        createMatch('semi-m1', null, null, { byeSlot: 'p2', byeLabel: '부전승' })
    ]);
    bracketState.push([createMatch('final-m0')]);

    saveToLocalStorage();
    renderBracket();
}

function initTwelvePrelimFinalThree(preliminaryPlayers, directMainPlayers) {
    const preliminaryRound = [];
    for (let i = 0; i < PRELIMINARY_TEAMS / 2; i++) {
        preliminaryRound.push(createMatch(`prelim-m${i}`, preliminaryPlayers[i * 2], preliminaryPlayers[i * 2 + 1], {
            route: {
                roundIndex: 1,
                matchIndex: preliminaryRoutes[i]?.matchIndex ?? i,
                slot: preliminaryRoutes[i]?.slot || 'p1'
            }
        }));
    }

    const mainRound = [];
    for (let i = 0; i < DIRECT_MAIN_TEAMS; i++) {
        mainRound.push(createMatch(`main-m${i}`, null, directMainPlayers[i] || null));
    }

    const sixRound = createEmptyRound('six', 3);
    sixRound.forEach((match, index) => {
        match.route = {
            roundIndex: 3,
            matchIndex: 0,
            slot: `p${index + 1}`
        };
    });

    bracketState.push(preliminaryRound);
    bracketState.push(mainRound);
    bracketState.push(sixRound);
    bracketState.push([
        createMatch('final-m0', null, null, {
            slots: ['p1', 'p2', 'p3'],
            p3: null,
            p3Score: ''
        })
    ]);

    saveToLocalStorage();
    renderBracket();
}

function createEmptyRound(prefix, size) {
    const round = [];
    for (let i = 0; i < size; i++) {
        round.push(createMatch(`${prefix}-m${i}`));
    }
    return round;
}

function createMatch(id, p1 = null, p2 = null, options = {}) {
    const match = {
        id,
        p1,
        p2,
        winner: null,
        ...options
    };
    ensureMatchSlots(match);
    return match;
}

function getMatchSlots(match) {
    return Array.isArray(match?.slots) && match.slots.length > 0 ? match.slots : ['p1', 'p2'];
}

function ensureMatchSlots(match) {
    getMatchSlots(match).forEach(slot => {
        if (!Object.prototype.hasOwnProperty.call(match, slot)) {
            match[slot] = null;
        }

        const scoreKey = `${slot}Score`;
        if (!Object.prototype.hasOwnProperty.call(match, scoreKey)) {
            match[scoreKey] = '';
        }

        const memberScoreKey = `${slot}MemberScores`;
        if (!Array.isArray(match[memberScoreKey])) {
            match[memberScoreKey] = [];
        }
    });
}

function clearMatchScores(match) {
    getMatchSlots(match).forEach(slot => {
        clearSlotScores(match, slot);
    });
}

function clearSlotScores(match, slot) {
    match[`${slot}Score`] = '';
    match[`${slot}MemberScores`] = [];
}

function normalizeBracketState() {
    bracketState.forEach(round => {
        round.forEach(match => {
            ensureMatchSlots(match);
            if (!Object.prototype.hasOwnProperty.call(match, 'winner')) match.winner = null;
            if (match.winner) {
                const winnerSlot = getMatchSlots(match).find(slot => isSameTeam(match[slot], match.winner));
                if (winnerSlot) {
                    match.winner = match[winnerSlot];
                } else {
                    match.winner = null;
                }
            }
        });
    });
    handleAllByes();
}

function isSameTeam(a, b) {
    return Boolean(a && b && a.name === b.name);
}

function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: TOURNAMENT_VERSION,
        players: tournamentPlayers,
        bracketState
    }));
}

function resetBracket() {
    if (confirm('정말로 대진표를 초기화하시겠습니까?\n모든 진출 결과와 입력하신 점수가 영구 삭제됩니다.')) {
        localStorage.removeItem(STORAGE_KEY);
        fetchData();
        showToast('대진표가 완전히 초기화되었습니다.');
    }
}

function downloadJSON() {
    const title = getTournamentTitle();
    const exportData = {
        version: TOURNAMENT_VERSION,
        title,
        format: {
            totalTeams: TOTAL_TEAMS,
            preliminaryTeams: PRELIMINARY_TEAMS,
            directMainTeams: DIRECT_MAIN_TEAMS,
            finalRoundTeamCount: FINAL_ROUND_TEAM_COUNT,
            byeRule: BYE_RULE
        },
        players: tournamentPlayers,
        bracketState
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'bracket-data.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('현재 상태가 담긴 bracket-data.json 파일을 다운로드했습니다.<br>기존 폴더에 덮어씌우면 상태가 계속 복원됩니다.');
}

function restoreJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.addEventListener('load', () => {
            try {
                restoreFromBackup(JSON.parse(String(reader.result || '')));
            } catch (error) {
                console.error('대진 복원 파일 파싱 실패:', error);
                showToast('복원 실패: 올바른 JSON 백업 파일이 아닙니다.');
            }
        });
        reader.addEventListener('error', () => {
            showToast('복원 실패: 파일을 읽을 수 없습니다.');
        });
        reader.readAsText(file, 'utf-8');
    });

    input.click();
}

function restoreFromBackup(data) {
    if (!data || typeof data !== 'object') {
        showToast('복원 실패: 백업 데이터가 비어 있습니다.');
        return;
    }

    if (data.version !== TOURNAMENT_VERSION) {
        showToast('복원 실패: 현재 대진표와 다른 버전의 백업 파일입니다.');
        return;
    }

    if (!Array.isArray(data.players) || !Array.isArray(data.bracketState)) {
        showToast('복원 실패: 백업 파일에 팀 목록 또는 대진 상태가 없습니다.');
        return;
    }

    const restoredPlayers = normalizePlayers(data.players);
    if (!arePlayerListsSame(restoredPlayers, normalizePlayers(localTournamentData.players))) {
        const shouldContinue = confirm('백업 파일의 팀 목록이 현재 팀 목록과 다릅니다.\n백업 파일의 팀 목록과 대진 상태로 복원하시겠습니까?');
        if (!shouldContinue) return;
    }

    tournamentPlayers = restoredPlayers;
    bracketState = data.bracketState;
    normalizeBracketState();
    saveToLocalStorage();
    setTournamentTitle(data.title || TOURNAMENT_TITLE);
    renderBracket();
    showToast('백업 파일에서 대진표를 복원했습니다.');
}

function selectWinner(rIndex, mIndex, player) {
    if (!player) return;

    const currentMatch = bracketState[rIndex]?.[mIndex];
    if (!currentMatch || !getMatchSlots(currentMatch).some(slot => currentMatch[slot] === player)) return;

    if (currentMatch.winner === player) {
        clearAdvancedPath(rIndex, mIndex);
        currentMatch.winner = null;
        clearInvalidFinalWinner();
        saveToLocalStorage();
        renderBracket();
        return;
    }

    if (isLockedThirdPlaceSelection(currentMatch, player)) {
        showToast('결승전 점수가 가장 낮아 3등이 확정될 팀입니다.');
        return;
    }

    if (currentMatch.winner) {
        clearAdvancedPath(rIndex, mIndex);
    }

    currentMatch.winner = player;
    advanceWinner(rIndex, mIndex, player);
    clearInvalidFinalWinner();

    saveToLocalStorage();
    renderBracket();
}

function advanceWinner(rIndex, mIndex, player) {
    const route = getRoute(rIndex, mIndex);
    if (!route) return;

    const nextMatch = bracketState[route.roundIndex]?.[route.matchIndex];
    if (!nextMatch) return;

    if (nextMatch.winner) {
        clearAdvancedPath(route.roundIndex, route.matchIndex);
        nextMatch.winner = null;
        clearMatchScores(nextMatch);
    }

    nextMatch[route.slot] = player;
    clearSlotScores(nextMatch, route.slot);

    autoAdvanceBye(route.roundIndex, route.matchIndex);
}

function clearAdvancedPath(rIndex, mIndex) {
    const route = getRoute(rIndex, mIndex);
    if (!route) return;

    const nextMatch = bracketState[route.roundIndex]?.[route.matchIndex];
    if (!nextMatch) return;

    if (nextMatch.winner) {
        clearAdvancedPath(route.roundIndex, route.matchIndex);
        nextMatch.winner = null;
        clearMatchScores(nextMatch);
    }

    nextMatch[route.slot] = null;
    clearSlotScores(nextMatch, route.slot);
}

function getRoute(rIndex, mIndex) {
    const currentMatch = bracketState[rIndex]?.[mIndex];
    if (!currentMatch || !bracketState[rIndex + 1]) return null;

    if (currentMatch.route) {
        return currentMatch.route;
    }

    return {
        roundIndex: rIndex + 1,
        matchIndex: Math.floor(mIndex / 2),
        slot: mIndex % 2 === 0 ? 'p1' : 'p2'
    };
}

function handleAllByes() {
    bracketState.forEach((round, rIndex) => {
        round.forEach((match, mIndex) => {
            if (match.byeSlot) {
                autoAdvanceBye(rIndex, mIndex);
            }
        });
    });
}

function autoAdvanceBye(rIndex, mIndex) {
    const match = bracketState[rIndex]?.[mIndex];
    if (!match?.byeSlot) return;

    const playerSlot = getMatchSlots(match).find(slot => slot !== match.byeSlot);
    const player = match[playerSlot];

    if (!player) {
        if (match.winner) {
            clearAdvancedPath(rIndex, mIndex);
            match.winner = null;
        }
        return;
    }

    if (match.winner === player) return;

    if (match.winner) {
        clearAdvancedPath(rIndex, mIndex);
    }

    match.winner = player;
    clearMatchScores(match);
    advanceWinner(rIndex, mIndex, player);
}

function renderBracket() {
    const container = document.getElementById('bracket-container');
    if (!container) return;
    const previousScrollLeft = container.scrollLeft || 0;
    const hasRenderedBoard = Boolean(container.querySelector('.bracket-board'));
    if (clearInvalidFinalWinner()) {
        saveToLocalStorage();
    }
    container.innerHTML = '';
    container.dataset.finalRoundTeamCount = String(FINAL_ROUND_TEAM_COUNT);

    const board = document.createElement('div');
    board.className = 'bracket-board';

    bracketState.forEach((round, rIndex) => {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'round';
        roundDiv.setAttribute('data-round', rIndex);
        if (isFinalQualifyingRound(rIndex, round)) {
            roundDiv.classList.add('final-qualifying-round');
        }

        const titleDiv = document.createElement('div');
        titleDiv.className = 'round-title';
        titleDiv.textContent = roundTitles[rIndex] || `Round ${rIndex + 1}`;
        roundDiv.appendChild(titleDiv);

        if (rIndex === 0 && round.length === PRELIMINARY_TEAMS / 2) {
            renderPreliminaryRound(roundDiv, round, rIndex);
            
            // 꿀통 범례 추가
            const legendDiv = document.createElement('div');
            legendDiv.className = 'direct-main-legend prelim-legend';
            legendDiv.innerHTML = `<span class="direct-main-badge">🍯</span> : ${DIRECT_MAIN_LEGEND_TEXT}`;
            roundDiv.appendChild(legendDiv);
        } else if (isFinalQualifyingRound(rIndex, round)) {
            renderCenteredRound(roundDiv, round, rIndex);
        } else if (round.length > 1) {
            for (let i = 0; i < round.length; i += 2) {
                const pairDiv = document.createElement('div');
                pairDiv.className = 'match-pair';

                const w1 = document.createElement('div');
                w1.className = 'match-connector-item';
                w1.appendChild(createMatchDiv(round[i], rIndex, i));
                pairDiv.appendChild(w1);

                if (round[i + 1]) {
                    const w2 = document.createElement('div');
                    w2.className = 'match-connector-item';
                    w2.appendChild(createMatchDiv(round[i + 1], rIndex, i + 1));
                    pairDiv.appendChild(w2);
                }
                roundDiv.appendChild(pairDiv);
            }
        } else {
            round.forEach((match, mIndex) => {
                roundDiv.appendChild(createMatchDiv(match, rIndex, mIndex));
            });
        }

        board.appendChild(roundDiv);
    });

    renderChampion(board);
    container.appendChild(board);
    if (hasRenderedBoard) {
        container.scrollLeft = Math.min(previousScrollLeft, Math.max(0, container.scrollWidth - container.clientWidth));
    } else {
        container.scrollLeft = 0;
    }
    renderTeamSidebar();
    scheduleRenderBracketLines();
}

function renderTeamSidebar() {
    const list = document.getElementById('team-sidebar-list');
    const count = document.getElementById('team-sidebar-count');
    if (!list) return;

    const players = normalizePlayers(tournamentPlayers);
    list.innerHTML = '';

    if (count) {
        count.textContent = `${players.length}팀`;
    }

    players.forEach((team, index) => {
        const card = document.createElement('article');
        card.className = 'team-sidebar-card';

        const header = document.createElement('div');
        header.className = 'team-sidebar-card-header';

        const name = document.createElement('h3');
        name.className = 'team-sidebar-team-name';
        name.textContent = team.name;
        header.appendChild(name);

        if (index >= PRELIMINARY_TEAMS) {
            const badge = document.createElement('span');
            badge.className = 'team-sidebar-badge';
            badge.textContent = '본선 대기';
            header.appendChild(badge);
        }

        const scoreRecords = getTeamScoreRecords(team);
        if (scoreRecords.length > 0) {
            const isExpanded = expandedSidebarTeamName === team.name;
            card.classList.add('has-score-records');
            card.classList.toggle('is-expanded', isExpanded);
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-expanded', String(isExpanded));
            card.addEventListener('click', () => toggleSidebarTeamScores(team.name));
            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleSidebarTeamScores(team.name);
                }
            });
        }

        const members = document.createElement('ul');
        members.className = 'team-sidebar-members';

        const memberNames = Array.isArray(team.members) ? team.members : [];
        if (memberNames.length > 0) {
            memberNames.forEach(member => {
                const item = document.createElement('li');
                item.textContent = member;
                members.appendChild(item);
            });
        } else {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'team-sidebar-empty';
            emptyItem.textContent = '팀원 없음';
            members.appendChild(emptyItem);
        }

        card.appendChild(header);
        card.appendChild(members);
        if (scoreRecords.length > 0) {
            card.appendChild(createTeamScoreHistory(scoreRecords));
        }
        list.appendChild(card);
    });
}

function toggleSidebarTeamScores(teamName) {
    expandedSidebarTeamName = expandedSidebarTeamName === teamName ? null : teamName;
    renderTeamSidebar();
}

function getTeamScoreRecords(team) {
    if (!team) return [];

    const records = [];

    bracketState.forEach((round, rIndex) => {
        if (!Array.isArray(round)) return;

        round.forEach(match => {
            getMatchSlots(match).forEach(slot => {
                const slotTeam = match[slot];
                if (!isSameTeam(slotTeam, team)) return;

                const teamScore = String(match[`${slot}Score`] ?? '');
                const memberScores = getSlotMemberScores(match, slot, slotTeam);
                const memberTotal = calculateMemberScoreTotal(memberScores);
                const total = memberTotal || teamScore;
                const hasScore = memberScores.some(score => score !== '') || parseScoreValue(teamScore) !== null;
                if (!hasScore) return;

                records.push({
                    roundTitle: roundTitles[rIndex] || `Round ${rIndex + 1}`,
                    members: getScoreMembers(slotTeam).map((member, index) => ({
                        name: member,
                        score: memberScores[index] || ''
                    })),
                    total
                });
            });
        });
    });

    return records;
}

function createTeamScoreHistory(records) {
    const history = document.createElement('div');
    history.className = 'team-sidebar-score-history';
    history.addEventListener('click', event => event.stopPropagation());

    records.forEach(record => {
        const section = document.createElement('section');
        section.className = 'team-sidebar-score-round';

        const header = document.createElement('div');
        header.className = 'team-sidebar-score-round-header';

        const title = document.createElement('strong');
        title.textContent = record.roundTitle;
        header.appendChild(title);

        const total = document.createElement('span');
        total.textContent = `합계 ${record.total || '-'}`;
        header.appendChild(total);

        const memberList = document.createElement('ul');
        memberList.className = 'team-sidebar-score-members';

        record.members.forEach(member => {
            const item = document.createElement('li');

            const name = document.createElement('span');
            name.textContent = member.name;
            item.appendChild(name);

            const score = document.createElement('strong');
            score.textContent = member.score || '-';
            item.appendChild(score);

            memberList.appendChild(item);
        });

        section.appendChild(header);
        section.appendChild(memberList);
        history.appendChild(section);
    });

    return history;
}

function isFinalQualifyingRound(rIndex, round) {
    const finalMatch = bracketState[rIndex + 1]?.[0];
    return FINAL_ROUND_TEAM_COUNT > 2
        && rIndex === bracketState.length - 2
        && round.length === FINAL_ROUND_TEAM_COUNT
        && getMatchSlots(finalMatch).length === FINAL_ROUND_TEAM_COUNT;
}

function renderCenteredRound(roundDiv, round, rIndex) {
    round.forEach((match, mIndex) => {
        roundDiv.appendChild(createMatchDiv(match, rIndex, mIndex));
    });
}

function scheduleRenderBracketLines() {
    const container = document.getElementById('bracket-container');
    if (!container) return;

    requestAnimationFrame(() => {
        renderBracketLines(container);
    });
}

function renderBracketLines(container) {
    const oldLines = container.querySelector('.bracket-lines');
    if (oldLines) oldLines.remove();

    const width = Math.max(container.scrollWidth, container.clientWidth);
    const height = Math.max(container.scrollHeight, container.clientHeight);
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.classList.add('bracket-lines');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('aria-hidden', 'true');

    bracketState.forEach((round, rIndex) => {
        round.forEach((match, mIndex) => {
            const route = getRoute(rIndex, mIndex);
            if (!route) return;

            const sourceEl = getMatchElement(container, rIndex, mIndex);
            const targetEl = getMatchElement(container, route.roundIndex, route.matchIndex);
            if (!sourceEl || !targetEl) return;

            drawBracketLine(
                svg,
                getElementPoint(sourceEl, container, 0.5, 0),
                getElementPoint(targetEl, container, 0.5, 1),
                Boolean(match.winner)
            );
        });
    });

    const finalMatch = bracketState[bracketState.length - 1]?.[0];
    const finalEl = getMatchElement(container, bracketState.length - 1, 0);
    const championEl = container.querySelector('.champion-box');
    if (finalEl && championEl) {
        drawBracketLine(
            svg,
            getElementPoint(finalEl, container, 0.5, 0),
            getElementPoint(championEl, container, 0.5, 1),
            Boolean(finalMatch?.winner)
        );
    }

    container.appendChild(svg);
}

function getMatchElement(container, rIndex, mIndex) {
    return container.querySelector(`.match[data-round="${rIndex}"][data-match="${mIndex}"]`);
}

function getElementPoint(element, container, xRatio, yRatio) {
    const rect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return {
        x: rect.left - containerRect.left + container.scrollLeft + rect.width * xRatio,
        y: rect.top - containerRect.top + container.scrollTop + rect.height * yRatio
    };
}

function drawBracketLine(svg, start, end, isActive) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.classList.add('bracket-line');
    if (isActive) {
        path.classList.add('is-active');
    }

    const startX = Math.round(start.x);
    const startY = Math.round(start.y);
    const endX = Math.round(end.x);
    const endY = Math.round(end.y);
    const middleY = Math.round((startY + endY) / 2);
    const linePath = Math.abs(startX - endX) < 1
        ? `M ${startX} ${startY} L ${endX} ${endY}`
        : `M ${startX} ${startY} L ${startX} ${middleY} L ${endX} ${middleY} L ${endX} ${endY}`;

    path.setAttribute('d', linePath);
    svg.appendChild(path);
}

function renderPreliminaryRound(roundDiv, round, rIndex) {
    const lanes = Array.isArray(preliminaryLanes)
        ? preliminaryLanes
        : round.map((_, index) => [index]);

    lanes.forEach(indices => {
        const validIndices = indices.filter(index => round[index]);
        if (validIndices.length === 0) return;

        const laneDiv = document.createElement('div');
        laneDiv.className = 'prelim-lane';

        if (validIndices.length > 1) {
            const pairDiv = document.createElement('div');
            pairDiv.className = 'match-pair prelim-pair';

            validIndices.forEach(mIndex => {
                const item = document.createElement('div');
                item.className = 'match-connector-item';
                item.appendChild(createMatchDiv(round[mIndex], rIndex, mIndex));
                pairDiv.appendChild(item);
            });

            laneDiv.appendChild(pairDiv);
        } else {
            const mIndex = validIndices[0];
            const item = document.createElement('div');
            item.className = 'match-connector-item prelim-single';
            item.appendChild(createMatchDiv(round[mIndex], rIndex, mIndex));
            laneDiv.appendChild(item);
        }

        roundDiv.appendChild(laneDiv);
    });
}

function renderChampion(container) {
    const finalRoundDiv = document.createElement('div');
    finalRoundDiv.className = 'round';

    const finalTitle = document.createElement('div');
    finalTitle.className = 'round-title';
    finalTitle.textContent = 'CHAMPION';
    finalRoundDiv.appendChild(finalTitle);

    const finalMatch = bracketState[bracketState.length - 1]?.[0];
    const championCard = document.createElement('div');
    championCard.className = 'match champion-box';
    if (finalMatch?.winner) {
        championCard.classList.add('has-winner');
    }

    const champDiv = document.createElement('div');
    if (finalMatch?.winner) {
        champDiv.className = 'player champion';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `🏆 ${finalMatch.winner.name} 🏆`;
        champDiv.appendChild(nameSpan);

        appendMembersTooltip(champDiv, finalMatch.winner);
    } else {
        champDiv.className = 'player empty';
        champDiv.textContent = '대기중';
    }

    championCard.appendChild(champDiv);
    finalRoundDiv.appendChild(championCard);
    container.appendChild(finalRoundDiv);
}

function createMatchDiv(match, rIndex, mIndex) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'match';
    matchDiv.dataset.round = String(rIndex);
    matchDiv.dataset.match = String(mIndex);
    if (match.winner) {
        matchDiv.classList.add('has-winner');
    }

    const slots = getMatchSlots(match);
    if (slots.length > 2) {
        matchDiv.classList.add('multi-player-match');
    }

    const isByeMatch = Boolean(match.byeSlot);
    const isFinalPlacementMatch = rIndex === bracketState.length - 1 && slots.length > 2;
    const isFinalQualifyingMatch = isFinalQualifyingRound(rIndex, bracketState[rIndex] || []);
    const fourthPlaceQualifier = isFinalQualifyingMatch ? getFourthPlaceQualifier() : null;
    const refreshOnScoreBlur = isFinalPlacementMatch || isFinalQualifyingMatch;
    slots.forEach(slot => {
        const placement = isFinalPlacementMatch
            ? getFinalPlacement(match, slot)
            : getFinalQualifyingPlacement(fourthPlaceQualifier, rIndex, mIndex, slot);
        const playerDiv = createPlayerDiv(
            match[slot],
            match.winner,
            () => selectWinner(rIndex, mIndex, match[slot]),
            match[`${slot}Score`],
            isByeMatch ? null : (val, memberScores) => {
                match[`${slot}Score`] = val;
                match[`${slot}MemberScores`] = memberScores;
                saveToLocalStorage();
                renderTeamSidebar();
            },
            {
                emptyText: match.byeSlot === slot ? match.byeLabel || '부전승' : '대기중',
                isBye: match.byeSlot === slot,
                slot,
                memberScores: getSlotMemberScores(match, slot, match[slot]),
                placement,
                refreshOnScoreBlur
            }
        );
        matchDiv.appendChild(playerDiv);
    });

    return matchDiv;
}

function isLockedThirdPlaceSelection(match, player) {
    const slots = getMatchSlots(match);
    if (slots.length < 3 || match !== bracketState[bracketState.length - 1]?.[0]) return false;

    const thirdPlaceSlot = getLowestFinalScoreSlot(match, { requireWinner: false });
    return Boolean(thirdPlaceSlot && match[thirdPlaceSlot] === player);
}

function clearInvalidFinalWinner() {
    const finalMatch = bracketState[bracketState.length - 1]?.[0];
    if (!finalMatch?.winner || getMatchSlots(finalMatch).length < 3) return false;

    if (!isLockedThirdPlaceSelection(finalMatch, finalMatch.winner)) return false;

    finalMatch.winner = null;
    return true;
}

function getFinalPlacement(match, slot) {
    const slots = getMatchSlots(match);
    const player = match[slot];
    if (!player || slots.length < 3) return null;

    const thirdPlaceSlot = getLowestFinalScoreSlot(match);
    if (slot === thirdPlaceSlot) {
        return {
            rank: 3,
            label: '3등 확정'
        };
    }

    if (match.winner && player !== match.winner && thirdPlaceSlot && slot !== thirdPlaceSlot) {
        return {
            rank: 2,
            label: '2등'
        };
    }

    return null;
}

function getFinalQualifyingPlacement(fourthPlaceQualifier, rIndex, mIndex, slot) {
    if (!fourthPlaceQualifier) return null;

    if (
        fourthPlaceQualifier.roundIndex === rIndex
        && fourthPlaceQualifier.matchIndex === mIndex
        && fourthPlaceQualifier.slot === slot
    ) {
        return {
            rank: 4,
            label: '4등 확정'
        };
    }

    return null;
}

function getLowestFinalScoreSlot(finalMatch, options = {}) {
    if (finalMatch !== bracketState[bracketState.length - 1]?.[0]) return null;
    if (options.requireWinner !== false && !finalMatch.winner) return null;

    const slots = getMatchSlots(finalMatch);
    if (slots.length < 3) return null;

    const finalScores = slots
        .map(slot => {
            if (!finalMatch[slot]) return null;
            const score = parseScoreValue(finalMatch[`${slot}Score`]);
            if (score === null) return null;

            return {
                slot,
                score
            };
        })
        .filter(Boolean);

    if (finalScores.length !== slots.length) return null;

    finalScores.sort((a, b) => a.score - b.score);
    if (finalScores[0].score === finalScores[1]?.score) return null;

    return finalScores[0].slot;
}

function getFourthPlaceQualifier() {
    const finalMatch = bracketState[bracketState.length - 1]?.[0];
    if (!finalMatch || getMatchSlots(finalMatch).length < 3) return null;
    if (!getLowestFinalScoreSlot(finalMatch)) return null;

    const qualifierRoundIndex = bracketState.length - 2;
    const qualifierRound = bracketState[qualifierRoundIndex];
    if (!Array.isArray(qualifierRound) || qualifierRound.length === 0) return null;

    const loserScores = qualifierRound
        .map((match, matchIndex) => {
            if (!match?.winner) return null;

            const loserSlot = getMatchSlots(match).find(slot => match[slot] && match[slot] !== match.winner);
            if (!loserSlot) return null;

            const score = parseScoreValue(match[`${loserSlot}Score`]);
            if (score === null) return null;

            return {
                roundIndex: qualifierRoundIndex,
                matchIndex,
                slot: loserSlot,
                score
            };
        })
        .filter(Boolean);

    if (loserScores.length !== qualifierRound.length) return null;

    loserScores.sort((a, b) => b.score - a.score);
    if (loserScores[0].score === loserScores[1]?.score) return null;

    return loserScores[0];
}

function parseScoreValue(value) {
    if (value === null || value === undefined || value === '') return null;

    const score = Number.parseInt(String(value), 10);
    return Number.isNaN(score) ? null : score;
}

function getScoreMembers(playerObj) {
    return Array.isArray(playerObj?.members) && playerObj.members.length > 0
        ? playerObj.members
        : ['팀 점수'];
}

function normalizeScoreValue(value) {
    return String(value ?? '').replace(/[^0-9]/g, '').slice(0, 3);
}

function normalizeMemberScores(scores, playerObj) {
    const members = getScoreMembers(playerObj);
    const source = Array.isArray(scores) ? scores : [];

    return members.map((_, index) => normalizeScoreValue(source[index]));
}

function getSlotMemberScores(match, slot, playerObj) {
    return normalizeMemberScores(match?.[`${slot}MemberScores`], playerObj);
}

function calculateMemberScoreTotal(memberScores) {
    const normalizedScores = Array.isArray(memberScores) ? memberScores : [];
    const hasAnyScore = normalizedScores.some(score => score !== '');

    if (!hasAnyScore) return '';

    return String(normalizedScores.reduce((sum, score) => {
        if (score === '') return sum;
        return sum + (Number.parseInt(score, 10) || 0);
    }, 0));
}

function closeMemberScoreEditors() {
    document.querySelectorAll('.member-score-popover.is-open').forEach(popover => {
        popover.classList.remove('is-open', 'open-up');
        popover.closest('.player')?.classList.remove('score-editor-open');
    });
    document.querySelectorAll('.score-input.is-editor-open').forEach(input => {
        input.classList.remove('is-editor-open');
    });
}

function openMemberScoreEditor(playerDiv, scoreInput, popover) {
    const wasOpen = popover.classList.contains('is-open');
    closeMemberScoreEditors();

    if (wasOpen) return;

    playerDiv.classList.add('score-editor-open');
    scoreInput.classList.add('is-editor-open');
    const playerRect = playerDiv.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const shouldOpenUp = viewportHeight - playerRect.bottom < 300 && playerRect.top > 300;
    popover.classList.toggle('open-up', shouldOpenUp);
    popover.classList.add('is-open');

    const firstInput = popover.querySelector('.member-score-input');
    if (firstInput) {
        firstInput.focus();
        firstInput.select();
    }
}

function createPlayerDiv(playerObj, winner, onClick, scoreVal, onScoreChange, options = {}) {
    const div = document.createElement('div');
    div.className = 'player';
    if (options.slot) {
        div.dataset.slot = options.slot;
    }

    if (!playerObj) {
        div.classList.add('empty');
        if (options.isBye) {
            div.classList.add('bye');
        }
        div.textContent = options.emptyText || '대기중';
        return div;
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'team-name';
    
    const playerIndex = tournamentPlayers.findIndex(p => p && p.name === playerObj.name);
    const isDirectMain = playerIndex >= PRELIMINARY_TEAMS;
    if (isDirectMain) {
        const badgeSpan = document.createElement('span');
        badgeSpan.className = 'direct-main-badge';
        badgeSpan.textContent = '🍯';
        badgeSpan.style.marginRight = '4px';
        nameSpan.appendChild(badgeSpan);
    }
    
    const nameText = document.createTextNode(playerObj.name);
    nameSpan.appendChild(nameText);
    div.appendChild(nameSpan);

    if (options.placement) {
        const placementBadge = document.createElement('span');
        placementBadge.className = `placement-badge placement-${options.placement.rank}`;
        placementBadge.textContent = options.placement.label;
        div.appendChild(placementBadge);
    }

    if (onScoreChange) {
        const memberScores = normalizeMemberScores(options.memberScores, playerObj);
        const memberScoreTotal = calculateMemberScoreTotal(memberScores);
        const scoreInput = document.createElement('input');
        scoreInput.type = 'text';
        scoreInput.className = 'score-input';
        scoreInput.value = memberScoreTotal || (scoreVal !== undefined ? scoreVal : '');
        scoreInput.placeholder = '-';
        scoreInput.maxLength = 4;
        scoreInput.readOnly = true;
        scoreInput.setAttribute('aria-label', `${playerObj.name} 팀 합계 점수`);

        const memberScoreEditor = createMemberScoreEditor(
            playerObj,
            memberScores,
            scoreVal,
            (scores, total) => {
                scoreInput.value = total;
                onScoreChange(total, scores);
            },
            options.refreshOnScoreBlur
        );

        scoreInput.addEventListener('click', (e) => {
            e.stopPropagation();
            openMemberScoreEditor(div, scoreInput, memberScoreEditor);
        });

        div.appendChild(scoreInput);
        div.appendChild(memberScoreEditor);
    }

    if (playerObj === winner) {
        div.classList.add('winner');
    } else if (options.placement?.rank === 2) {
        div.classList.add('runner-up');
    } else if (options.placement?.rank === 3) {
        div.classList.add('third-place');
    } else if (options.placement?.rank === 4) {
        div.classList.add('fourth-place');
    } else if (winner !== null && playerObj !== winner) {
        div.classList.add('loser');
    }
    div.onclick = onClick;

    appendMembersTooltip(div, playerObj);
    return div;
}

function createMemberScoreEditor(playerObj, memberScores, fallbackTotal, onScoresChange, refreshOnClose) {
    const editor = document.createElement('div');
    editor.className = 'member-score-popover';
    editor.addEventListener('click', (event) => event.stopPropagation());

    const title = document.createElement('div');
    title.className = 'member-score-title';
    title.textContent = `${playerObj.name} 개인 점수`;
    editor.appendChild(title);

    const list = document.createElement('div');
    list.className = 'member-score-list';
    editor.appendChild(list);

    const scores = [...memberScores];

    getScoreMembers(playerObj).forEach((member, index) => {
        const row = document.createElement('label');
        row.className = 'member-score-row';

        const name = document.createElement('span');
        name.className = 'member-score-name';
        name.textContent = member;
        row.appendChild(name);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'member-score-input';
        input.value = scores[index] || '';
        input.placeholder = '-';
        input.maxLength = 3;
        input.inputMode = 'numeric';
        input.setAttribute('aria-label', `${member} 점수`);

        input.addEventListener('input', (event) => {
            const value = normalizeScoreValue(event.target.value);
            event.target.value = value;
            scores[index] = value;

            const total = calculateMemberScoreTotal(scores);
            totalValue.textContent = total || '-';
            onScoresChange([...scores], total);
        });

        if (refreshOnClose) {
            input.addEventListener('blur', () => {
                window.setTimeout(() => {
                    if (!editor.contains(document.activeElement)) {
                        renderBracket();
                    }
                }, 0);
            });
        }

        row.appendChild(input);
        list.appendChild(row);
    });

    const totalRow = document.createElement('div');
    totalRow.className = 'member-score-total';

    const totalLabel = document.createElement('span');
    totalLabel.textContent = '합계';
    totalRow.appendChild(totalLabel);

    const totalValue = document.createElement('strong');
    totalValue.textContent = calculateMemberScoreTotal(scores) || fallbackTotal || '-';
    totalRow.appendChild(totalValue);

    editor.appendChild(totalRow);

    return editor;
}

function appendMembersTooltip(parent, playerObj) {
    if (!playerObj.members || playerObj.members.length === 0) return;

    const tooltip = document.createElement('div');
    tooltip.className = 'team-members-tooltip';

    const title = document.createElement('div');
    title.className = 'tooltip-title';
    title.textContent = '👥 팀원 목록';
    tooltip.appendChild(title);

    const list = document.createElement('div');
    list.className = 'members-list';

    playerObj.members.forEach(member => {
        const pill = document.createElement('span');
        pill.className = 'member-pill';
        pill.textContent = member;
        list.appendChild(pill);
    });

    tooltip.appendChild(list);
    parent.appendChild(tooltip);
}

function setTournamentTitle(title) {
    const safeTitle = title || TOURNAMENT_TITLE;
    const titleEl = document.getElementById('tournament-title');
    if (titleEl) {
        titleEl.textContent = safeTitle;
    }
    document.title = `${safeTitle} 대진표`;
}

function getTournamentTitle() {
    const titleEl = document.getElementById('tournament-title');
    return titleEl?.textContent || TOURNAMENT_TITLE;
}

function createFallbackPlayers() {
    return[
    {
        name: '1팀',
        members: ['김수빈', '백창건', '김정환', '김정은']
    },
    {
        name: '2팀',
        members: ['이상범', '김묘덕', '이찬양', '김민기(전략)']
    },
    {
        name: '3팀',
        members: ['박철우', '김민기', '황인찬', '송정아']
    },
    {
        name: '4팀',
        members: ['정재운', '김용주', '이시영', '한수연']
    },
    {
        name: '5팀',
        members: ['김영제', '김성주', '유수정', '오미선']
    },
    {
        name: '6팀',
        members: ['임해식', '장지영', '정헌', '한동찬']
    },
    {
        name: '7팀',
        members: ['최진성', '이호균', '홍우석', '이서하']
    },
    {
        name: '8팀',
        members: ['민동현', '정해림', '김슬기', '기지희']
    },
    {
        name: '9팀',
        members: ['박시훈', '이규승', '장은채', '차지훈']
    },
    {
        name: '10팀',
        members: ['최봉락', '천일범', '강소희', '구소영']
    },
    {
        name: '11팀',
        members: ['이효수', '이민규', '장예안', '이은지']
    },
    {
        name: '12팀',
        members: ['안홍주', '이혜선', '조덕현', '박윤경']
    },
    {
        name: '13팀',
        members: ['황윤하', '이송희', '김진', '김지선']
    },
    {
        name: '14팀',
        members: ['이호경', '권성수', '문진규', '이은진']
    },
    {
        name: '15팀',
        members: ['이경민', '정상현', '김다찬', '황서연']
    },
    {
        name: '16팀',
        members: ['김태형', '이황열', '김종현', '신민경']
    },
    {
        name: '17팀',
        members: ['조영', '이영웅', '손제민', '한지원']
    },
    {
        name: '18팀',
        members: ['박세준', '이길용', '최용훈', '황찬선']
    }
];
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.innerHTML = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 6000);
    }
}
