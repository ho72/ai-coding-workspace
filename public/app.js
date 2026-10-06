import { sortRoomsByRecency } from './room-order.js'
import { roomCanChangeAgent, roomJustFinished } from './room-state.js?v=20260912-room-updates'

const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => Array.from(document.querySelectorAll(selector))

const app = $('#app')
const loginView = $('#loginView')
const loginForm = $('#loginForm')
const loginError = $('#loginError')
const loginButton = $('#loginButton')
const loginNextInput = $('#loginNextInput')
const roomList = $('#roomList')
const refreshButton = $('#refreshButton')
const logoutButton = $('#logoutButton')
const settingsButton = $('#settingsButton')
const newRoomButton = $('#newRoomButton')
const newRoomDialog = $('#newRoomDialog')
const newRoomForm = $('#newRoomForm')
const cancelNewRoomButton = $('#cancelNewRoomButton')
const closeNewRoomButton = $('#closeNewRoomButton')
const deleteRoomDialog = $('#deleteRoomDialog')
const deleteRoomTitle = $('#deleteRoomTitle')
const deleteRoomMeta = $('#deleteRoomMeta')
const cancelDeleteRoomButton = $('#cancelDeleteRoomButton')
const closeDeleteRoomButton = $('#closeDeleteRoomButton')
const confirmDeleteRoomButton = $('#confirmDeleteRoomButton')
const roomNameInput = $('#roomNameInput')
const agentInput = $('#agentInput')
const cwdInput = $('#cwdInput')
const cwdQuickPicks = $('#cwdQuickPicks')
const initialPromptInput = $('#initialPromptInput')
const roomStatus = $('#roomStatus')
const roomTitle = $('#roomTitle')
const roomMeta = $('#roomMeta')
const workspace = $('.workspace')
const topbar = $('.topbar')
const roomSettingsButton = $('#roomSettingsButton')
const startButton = $('#startButton')
const stopButton = $('#stopButton')
const downloadLogButton = $('#downloadLogButton')
const composer = $('#composer')
const promptInput = $('#promptInput')
const sendButton = $('#sendButton')
const attachButton = $('#attachButton')
const attachmentInput = $('#attachmentInput')
const attachmentTray = $('#attachmentTray')
const queuedPromptTray = $('#queuedPromptTray')
const ctrlCButton = $('#ctrlCButton')
const escapeButton = $('#escapeButton')
const activityList = $('#activityList')
const activityCount = $('#activityCount')
const terminalElement = $('#terminal')
const terminalCard = $('#terminalCard')
const terminalToggle = $('#terminalToggle')
const terminalCommand = $('#terminalCommand')
const terminalSummary = $('#terminalSummary')
const terminalIcon = $('#terminalIcon')
const emptyState = $('#emptyState')
const roomLoadingState = $('#roomLoadingState')
const historyTopLoader = $('#historyTopLoader')
const messageList = $('#messageList')
const mobileMenuButton = $('#mobileMenuButton')
const sidebarBackdrop = $('#sidebarBackdrop')
const agentLabel = $('#agentLabel')
const modeLabel = $('#modeLabel')
const contextLabel = $('#contextLabel')
const stream = $('#stream')
const composerMenu = $('#composerMenu')
const agentMenuButton = $('#agentMenuButton')
const modelMenuButton = $('#modelMenuButton')
const effortMenuButton = $('#effortMenuButton')
const modeMenuButton = $('#modeMenuButton')
const modeMenuText = $('#modeMenuText')
const settingsDialog = $('#settingsDialog')
const closeSettingsButton = $('#closeSettingsButton')
const settingsActiveTitle = $('#settingsActiveTitle')
const settingsUserLabel = $('#settingsUserLabel')
const settingsThemeLabel = $('#settingsThemeLabel')
const settingsGeneralPanel = $('#settingsGeneralPanel')
const settingsTrashPanel = $('#settingsTrashPanel')
const settingsTrashList = $('#settingsTrashList')
const settingsTrashCount = $('#settingsTrashCount')
const storageRefreshButton = $('#storageRefreshButton')
const storageUsageLabel = $('#storageUsageLabel')
const storageUsagePercent = $('#storageUsagePercent')
const storageUsageTrack = $('.storage-usage-track')
const storageUsageBar = $('#storageUsageBar')
const storageRetentionLabel = $('#storageRetentionLabel')
const storageFileCount = $('#storageFileCount')
const settingsNavButtons = $$('[data-settings-panel]')
const roomSettingsDialog = $('#roomSettingsDialog')
const closeRoomSettingsButton = $('#closeRoomSettingsButton')
const roomSettingsActiveTitle = $('#roomSettingsActiveTitle')
const roomSettingsWorkDirInput = $('#roomSettingsWorkDirInput')
const roomSettingsWorkDirSave = $('#roomSettingsWorkDirSave')
const roomSettingsWorkDirStatus = $('#roomSettingsWorkDirStatus')
const roomSettingsWorkDirQuickPicks = $('#roomSettingsWorkDirQuickPicks')
const roomSettingsAgentLabel = $('#roomSettingsAgentLabel')
const roomSettingsDownloadLog = $('#roomSettingsDownloadLog')
const imageLightbox = $('#imageLightbox')
const imageLightboxTitle = $('#imageLightboxTitle')
const imageLightboxImage = $('#imageLightboxImage')
const imageLightboxOpen = $('#imageLightboxOpen')
const imageLightboxStage = $('#imageLightboxStage')
const closeImageLightboxButton = $('#closeImageLightboxButton')
const profileAvatar = $('#profileAvatar')
const profileName = $('#profileName')
const profileSub = $('#profileSub')
const agentActivityDrawer = $('#agentActivityDrawer')
const agentActivityDrawerBackdrop = $('#agentActivityDrawerBackdrop')
const agentActivityDrawerTitle = $('#agentActivityDrawerTitle')
const agentActivityDrawerBody = $('#agentActivityDrawerBody')
const closeAgentActivityDrawerButton = $('#closeAgentActivityDrawer')

const SLASH_COMMANDS = [
  { name: '/permissions', desc: '이 채팅의 권한 모드 변경' },
  { name: '/model', desc: 'CLI 선택 메뉴 열기' },
  { name: '/usage', desc: '최근 턴과 세션의 토큰 사용량 확인' },
  { name: '/diff', desc: '아직 커밋하지 않은 변경 보기' },
  { name: '/compact', desc: '대화를 요약해 컨텍스트 확보' },
  { name: '/clear', desc: '이 채팅 화면 비우기' },
  { name: '/init', desc: '프로젝트 규칙 파일 생성' },
]

const AGENT_MENU = [
  { id: 'codex', name: 'Codex', desc: 'codex app-server', icon: '/assets/chatgpt.png' },
  { id: 'claude', name: 'Claude', desc: 'claude stream-json', icon: '/assets/claude.png' },
]

const AGENT_BRANDS = {
  codex: {
    id: 'codex',
    label: 'codex',
    iconSrc: '/assets/chatgpt.png',
    icon: '<img class="assistant-logo" src="/assets/chatgpt.png" alt="" aria-hidden="true">',
  },
  claude: {
    id: 'claude',
    label: 'claude',
    iconSrc: '/assets/claude.png',
    icon: '<img class="assistant-logo" src="/assets/claude.png" alt="" aria-hidden="true">',
  },
}

const PERMISSION_MODES = {
  ask: {
    label: '1. Ask for approval',
    short: 'Ask ▾',
    desc: '현재 서버에서는 비활성화되어 있습니다. Codex sandbox가 bwrap 권한 문제로 실패합니다.',
  },
  auto: {
    label: '2. Approve for me',
    short: 'Auto ▾',
    desc: '현재 서버에서는 비활성화되어 있습니다. Codex sandbox가 bwrap 권한 문제로 실패합니다.',
  },
  full: {
    label: '3. Full access',
    short: 'Full ▾',
    desc: '현재 devi 서버의 실제 Codex 실행 모드입니다. --dangerously-bypass-approvals-and-sandbox',
  },
}

const PERMISSION_MODE_ITEMS = [
  { id: 'full', name: PERMISSION_MODES.full.label, desc: PERMISSION_MODES.full.desc },
]

const SOCKET_RECONNECT_DELAY_MS = 1200
const EVENT_PAGE_SIZE = 1000
const HISTORY_LOAD_THRESHOLD_PX = 96
const STREAM_BOTTOM_THRESHOLD_PX = 160
const TEXT_STREAM_INTERVAL_MS = 16
const TEXT_STREAM_CHUNK = 1
const TEXT_STREAM_CATCHUP_FRAMES = 24
const LIVE_RENDER_INTERVAL_MS = 80
const MOTION_ENTER_MS = 260
const MOTION_MOVE_MS = 320
const MOTION_UPDATE_MS = 180
const STREAM_MOTION_INTERVAL_MS = 96
const WORK_GROUP_HOLD_MS = 900
const WORK_GROUP_COLLAPSE_MS = 280
const USER_SEND_ANIMATION_MS = 420
const QUEUED_PROMPT_FLUSH_DELAY_MS = 140
const PENDING_RUN_START_GUARD_MS = 2500
const PROMPT_QUEUE_STORAGE_KEY = 'devai_prompt_queues'
const ARCHIVED_ROOMS_EXPANDED_KEY = 'devai_archived_rooms_expanded'
const UNREAD_ROOMS_STORAGE_KEY = 'devai_unread_rooms'

const themeButtons = [
  { dark: $('#setDarkButton'), light: $('#setLightButton'), root: app },
  { dark: $('#loginDarkButton'), light: $('#loginLightButton'), root: loginView },
]

const TerminalCtor = window.Terminal
const FitAddonCtor = window.FitAddon?.FitAddon

const state = {
  rooms: [],
  activeRoomId: null,
  activeRoom: null,
  socket: null,
  events: [],
  workspaces: [],
  theme: localStorage.getItem('devai_theme') || 'dark',
  terminalCollapsed: false,
  messages: [],
  pendingDeleteRoomId: null,
  deletingRoomId: null,
  permanentlyDeletingRoomId: null,
  activeRoomMenuId: null,
  archivingRoomId: null,
  restoringRoomId: null,
  pinningRoomId: null,
  savingRoomWorkDir: false,
  roomWorkDirStatus: '',
  archivedRoomsExpanded: localStorage.getItem(ARCHIVED_ROOMS_EXPANDED_KEY) === 'true',
  settingsPanel: 'general',
  storageUsage: null,
  storageLoading: false,
  deletedAttachmentIds: new Set(),
  composerMenuType: null,
  usageLoading: false,
  creatingRoom: false,
  user: null,
  agentOptions: AGENT_MENU,
  codexSettings: { models: [], resolvedModel: '', resolvedEffort: '' },
  claudeSettings: { models: [], resolvedModel: '', resolvedEffort: '' },
  permissionOptions: [],
  defaultSettingsMode: localStorage.getItem('devai_settings_mode') || 'ask',
  defaultCodexModel: String(localStorage.getItem('devai_codex_model') || ''),
  defaultCodexEffort: String(localStorage.getItem('devai_codex_effort') || ''),
  defaultClaudeModel: String(localStorage.getItem('devai_claude_model') || ''),
  defaultClaudeEffort: String(localStorage.getItem('devai_claude_effort') || ''),
  roomModes: readStoredJson('devai_room_modes', {}),
  sandboxFlags: readStoredJson('devai_sandbox_flags', { network: true, outside: false }),
  titleEditingOriginal: null,
  expandedPanels: {},
  pendingAttachments: [],
  uploadingAttachments: false,
  draggingAttachments: false,
  socketReconnectTimer: null,
  roomUpdatesSocket: null,
  roomUpdatesReconnectTimer: null,
  roomLoading: false,
  historyBefore: null,
  historyHasMore: false,
  historyLoading: false,
  activeRoomLoadToken: 0,
  textStreams: {},
  textStreamTargets: {},
  textStreamTimers: {},
  streamFollowFrame: null,
  streamFollowPaused: false,
  lastStreamScrollTop: 0,
  restorePromptFocusWhenEnabled: false,
  messageRenderTimer: null,
  pendingRenderOptions: null,
  activityRenderTimer: null,
  activeTurnId: null,
  activeGroupId: null,
  previousCompletedGroupId: null,
  panelUiState: {},
  panelEffectTimers: {},
  messageScrollHoldSpacerPx: 0,
  messageMotionReady: false,
  activityMotionReady: false,
  motionUpdateTimes: {},
  streamMotionTimes: {},
  recentUserMessages: {},
  promptQueues: readStoredJson(PROMPT_QUEUE_STORAGE_KEY, {}),
  promptQueueTimers: {},
  pendingRunStarts: {},
  unreadRoomIds: new Set(readStoredStringArray(UNREAD_ROOMS_STORAGE_KEY)),
  activityDrawerTurnId: null,
}

const terminal = new TerminalCtor({
  cursorBlink: true,
  convertEol: false,
  fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: 13,
  lineHeight: 1.25,
  scrollback: 10000,
  theme: {
    background: '#111417',
    foreground: '#e7edf2',
    cursor: '#4094e8',
    selectionBackground: '#31544f',
  },
})
const fitAddon = new FitAddonCtor()
terminal.loadAddon(fitAddon)
terminal.open(terminalElement)

applyTheme(state.theme)
setTerminalVisible(false)
fitTerminal()

terminal.onData((data) => {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return
  if (data === '\u0003' || data === '\u001b') state.socket.send(JSON.stringify({ type: 'stop' }))
})

window.addEventListener('resize', () => {
  fitTerminal()
  sendResize()
})

window.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
    event.preventDefault()
    createRoom().catch((err) => showUiError(err, '새 채팅을 만들지 못했습니다.'))
    return
  }
  if (event.key === 'Escape') {
    if (state.activityDrawerTurnId) {
      closeAgentActivityDrawer()
      return
    }
    if (state.activeRoomMenuId) {
      state.activeRoomMenuId = null
      renderRooms()
    }
  }
})

agentActivityDrawerBackdrop.addEventListener('click', closeAgentActivityDrawer)
closeAgentActivityDrawerButton.addEventListener('click', closeAgentActivityDrawer)

window.setInterval(updateActivityElapsedLabels, 1000)

document.addEventListener('click', () => {
  if (!state.activeRoomMenuId) return
  state.activeRoomMenuId = null
  renderRooms()
})

loginForm.addEventListener('submit', () => {
  loginError.textContent = ''
  loginButton.disabled = true
  loginNextInput.value = currentPath()
})

logoutButton.addEventListener('click', async () => {
  const originalText = logoutButton.textContent
  logoutButton.disabled = true
  logoutButton.textContent = '로그아웃 중'
  try {
    await api('/api/logout', { method: 'POST' })
    const stillAuthenticated = await api('/api/me')
      .then((me) => Boolean(me?.authenticated))
      .catch((err) => {
        if (err.status === 401) return false
        throw err
      })
    if (stillAuthenticated) throw new Error('로그아웃 후에도 세션이 남아 있습니다.')
    closeSettingsDialog()
    clearClientSession()
    showLogin()
  } catch (err) {
    showUiError(err, '로그아웃하지 못했습니다.')
  } finally {
    logoutButton.disabled = false
    logoutButton.textContent = originalText
  }
})

refreshButton.addEventListener('click', async () => {
  await loadRooms()
  if (state.activeRoomId) await selectRoom(state.activeRoomId, { keepTerminal: true })
})

settingsButton.addEventListener('click', openSettingsDialog)

closeSettingsButton.addEventListener('click', closeSettingsDialog)

settingsDialog.addEventListener('click', (event) => {
  if (event.target === settingsDialog) closeSettingsDialog()
})

storageRefreshButton.addEventListener('click', () => {
  loadStorageUsage().catch((err) => showUiError(err, '저장공간 사용량을 확인하지 못했습니다.'))
})

for (const button of settingsNavButtons) {
  button.addEventListener('click', () => {
    state.settingsPanel = button.dataset.settingsPanel === 'trash' ? 'trash' : 'general'
    updateSettingsDialog()
  })
}

roomSettingsButton.addEventListener('click', openRoomSettingsDialog)

closeRoomSettingsButton.addEventListener('click', closeRoomSettingsDialog)

roomSettingsDialog.addEventListener('click', (event) => {
  if (event.target === roomSettingsDialog) closeRoomSettingsDialog()
})

closeImageLightboxButton.addEventListener('click', closeImageLightbox)

imageLightbox.addEventListener('click', (event) => {
  if (event.target === imageLightbox || event.target === imageLightboxStage) closeImageLightbox()
})

imageLightbox.addEventListener('close', () => {
  imageLightboxImage.removeAttribute('src')
  imageLightboxImage.alt = ''
  imageLightboxOpen.href = '#'
})

cwdInput.addEventListener('input', () => {
  renderWorkDirQuickPicks(cwdQuickPicks, cwdInput.value)
})

cwdQuickPicks.addEventListener('click', (event) => {
  const button = event.target.closest('[data-workdir-path]')
  if (!button) return
  cwdInput.value = button.dataset.workdirPath || cwdInput.value
  renderWorkDirQuickPicks(cwdQuickPicks, cwdInput.value)
  cwdInput.focus()
})

roomSettingsWorkDirInput.addEventListener('input', () => {
  state.roomWorkDirStatus = ''
  updateRoomSettingsDialog()
})

roomSettingsWorkDirInput.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return
  event.preventDefault()
  saveRoomWorkDir().catch((err) => showUiError(err, '작업 디렉터리를 저장하지 못했습니다.'))
})

roomSettingsWorkDirSave.addEventListener('click', () => {
  saveRoomWorkDir().catch((err) => showUiError(err, '작업 디렉터리를 저장하지 못했습니다.'))
})

roomSettingsWorkDirQuickPicks.addEventListener('click', (event) => {
  const button = event.target.closest('[data-workdir-path]')
  if (!button || button.disabled) return
  roomSettingsWorkDirInput.value = button.dataset.workdirPath || roomSettingsWorkDirInput.value
  state.roomWorkDirStatus = ''
  updateRoomSettingsDialog()
  roomSettingsWorkDirInput.focus()
})

for (const button of $$('[data-settings-mode]')) {
  button.addEventListener('click', () => setSettingsMode(button.dataset.settingsMode))
}

for (const button of $$('[data-settings-toggle]')) {
  button.addEventListener('click', () => {
    const key = button.dataset.settingsToggle
    state.sandboxFlags[key] = !state.sandboxFlags[key]
    localStorage.setItem('devai_sandbox_flags', JSON.stringify(state.sandboxFlags))
    updateRoomSettingsDialog()
  })
}

newRoomButton.addEventListener('click', () => {
  createRoom().catch((err) => showUiError(err, '새 채팅을 만들지 못했습니다.'))
})

cancelNewRoomButton.addEventListener('click', () => {
  newRoomDialog.close()
})

closeNewRoomButton.addEventListener('click', () => {
  newRoomDialog.close()
})

cancelDeleteRoomButton.addEventListener('click', closeDeleteRoomDialog)
closeDeleteRoomButton.addEventListener('click', closeDeleteRoomDialog)

deleteRoomDialog.addEventListener('click', (event) => {
  if (event.target === deleteRoomDialog) closeDeleteRoomDialog()
})

deleteRoomDialog.addEventListener('close', () => {
  if (state.deletingRoomId) return
  state.pendingDeleteRoomId = null
  renderRooms()
})

confirmDeleteRoomButton.addEventListener('click', () => {
  if (!state.pendingDeleteRoomId) return
  deleteRoom(state.pendingDeleteRoomId)
})

newRoomForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const initialPrompt = initialPromptInput.value.trim()
  const response = await api('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({
      title: roomNameInput.value,
      agent: agentInput.value,
      cwd: cwdInput.value,
      initialPrompt,
      ...currentCodexSettingsPayload({ agent: agentInput.value }),
      cols: terminalSize().cols,
      rows: terminalSize().rows,
    }),
  })

  newRoomDialog.close()
  upsertRoom(response.room)
  await loadRooms()
  await selectRoom(response.room.id, { keepTerminal: false })
  if (initialPrompt && !state.messages.some((message) => message.role === 'user' && message.text === cleanDisplayMessage(initialPrompt))) {
    addActivity({ type: 'input', text: initialPrompt })
    rebuildMessagesFromEvents()
  }
})

composer.addEventListener('submit', (event) => {
  event.preventDefault()
  sendPrompt()
})

attachButton.addEventListener('click', () => {
  if (attachButton.disabled) return
  attachmentInput.click()
})

attachmentInput.addEventListener('change', () => {
  uploadAttachmentFiles([...attachmentInput.files]).catch((err) => showUiError(err, '파일을 첨부하지 못했습니다.'))
  attachmentInput.value = ''
})

composer.addEventListener('dragover', (event) => {
  if (!canUploadAttachments()) return
  event.preventDefault()
  state.draggingAttachments = true
  composer.classList.add('dragging-attachment')
})

composer.addEventListener('dragleave', (event) => {
  if (composer.contains(event.relatedTarget)) return
  state.draggingAttachments = false
  composer.classList.remove('dragging-attachment')
})

composer.addEventListener('drop', (event) => {
  if (!canUploadAttachments()) return
  const files = [...event.dataTransfer.files]
  if (!files.length) return
  event.preventDefault()
  state.draggingAttachments = false
  composer.classList.remove('dragging-attachment')
  uploadAttachmentFiles(files).catch((err) => showUiError(err, '파일을 첨부하지 못했습니다.'))
})

composer.addEventListener('paste', (event) => {
  const files = clipboardAttachmentFiles(event.clipboardData)
  if (!files.length) return
  event.preventDefault()
  if (!canUploadAttachments()) {
    showUiError(new Error('첨부할 채팅방을 먼저 선택하세요.'))
    return
  }
  uploadAttachmentFiles(files).catch((err) => showUiError(err, '붙여넣은 파일을 첨부하지 못했습니다.'))
})

promptInput.addEventListener('input', () => {
  syncComposerMenuFromDraft()
  updateComposerState()
  autoGrowPrompt()
})

promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.composerMenuType) {
    event.preventDefault()
    closeComposerMenu()
    return
  }
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    closeComposerMenu()
    sendPrompt()
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    sendControl('\u001b')
  }
})

for (const button of $$('[data-insert]')) {
  button.addEventListener('click', () => {
    if (button.dataset.insert === '@') toggleComposerMenu('at')
    else if (button.dataset.insert === '/') toggleComposerMenu('slash')
    else insertPromptText(button.dataset.insert)
  })
}

agentMenuButton.addEventListener('click', () => toggleComposerMenu('agent'))
modelMenuButton.addEventListener('click', () => toggleComposerMenu('model'))
effortMenuButton.addEventListener('click', () => toggleComposerMenu('effort'))
modeMenuButton.addEventListener('click', () => toggleComposerMenu('mode'))

document.addEventListener('click', (event) => {
  if (!state.composerMenuType) return
  if (composer.contains(event.target)) return
  closeComposerMenu()
})

for (const button of $$('[data-suggestion]')) {
  button.addEventListener('click', async () => {
    if (!state.activeRoomId) await createRoom({ draft: button.dataset.suggestion }).catch((err) => showUiError(err, '새 채팅을 만들지 못했습니다.'))
    else setDraft(button.dataset.suggestion)
  })
}

roomTitle.addEventListener('dblclick', startTitleEdit)

roomTitle.addEventListener('keydown', (event) => {
  if (!roomTitle.isContentEditable) return
  if (event.key === 'Enter') {
    event.preventDefault()
    roomTitle.blur()
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    finishTitleEdit({ cancel: true })
  }
})

roomTitle.addEventListener('blur', () => {
  if (roomTitle.isContentEditable) finishTitleEdit()
})

startButton.addEventListener('click', async () => {
  if (!state.activeRoomId) return
  const response = await api(`/api/rooms/${state.activeRoomId}/start`, {
    method: 'POST',
    body: JSON.stringify(terminalSize()),
  })
  upsertRoom(response.room)
  renderRoomHeader(response.room)
  connectRoom(state.activeRoomId)
  renderRooms()
})

stopButton.addEventListener('click', async () => {
  if (!state.activeRoomId) return
  await api(`/api/rooms/${state.activeRoomId}/stop`, { method: 'POST' })
  addActivity({ type: 'system', text: '프로세스 중지를 요청했습니다.' })
  await loadRooms()
  const room = state.rooms.find((item) => item.id === state.activeRoomId)
  if (room) renderRoomHeader(room)
})

ctrlCButton.addEventListener('click', () => {
  sendControl('\u0003')
})

escapeButton.addEventListener('click', () => {
  sendControl('\u001b')
})

terminalToggle.addEventListener('click', () => {
  state.terminalCollapsed = !state.terminalCollapsed
  terminalCard.classList.toggle('collapsed', state.terminalCollapsed)
  terminalToggle.setAttribute('aria-expanded', String(!state.terminalCollapsed))
  if (!state.terminalCollapsed) requestAnimationFrame(fitTerminal)
})

mobileMenuButton.addEventListener('click', () => {
  app.classList.add('sidebar-open')
})

sidebarBackdrop.addEventListener('click', () => {
  app.classList.remove('sidebar-open')
})

stream.addEventListener('scroll', () => {
  const currentScrollTop = stream.scrollTop
  const scrollingUp = currentScrollTop < state.lastStreamScrollTop - 1
  const scrollingDown = currentScrollTop > state.lastStreamScrollTop + 1
  if (scrollingUp && !state.roomLoading && !state.historyLoading) {
    pauseStreamAutoFollow()
  }
  if (state.streamFollowPaused && scrollingDown && isStreamNearBottom(8)) {
    state.streamFollowPaused = false
  }
  state.lastStreamScrollTop = currentScrollTop
  if (stream.scrollTop <= HISTORY_LOAD_THRESHOLD_PX) {
    loadOlderEvents().catch((err) => showUiError(err, '이전 기록을 불러오지 못했습니다.'))
  }
})

stream.addEventListener('wheel', handleStreamWheel, { passive: true })
stream.addEventListener('touchstart', pauseStreamAutoFollow, { passive: true })

for (const group of themeButtons) {
  group.dark.addEventListener('click', () => applyTheme('dark'))
  group.light.addEventListener('click', () => applyTheme('light'))
}

boot()

async function boot() {
  const me = await api('/api/me').catch(() => null)
  if (!me?.authenticated) {
    showLogin()
    return
  }

  state.user = me.user || null
  updateProfile()
  loginView.hidden = true
  app.hidden = false
  state.roomLoading = true
  roomTitle.textContent = 'devi'
  roomMeta.textContent = '채팅방 목록을 불러오는 중입니다.'
  showRoomLoadingState()
  await loadWorkspaces()
  await loadExecutionSettings()
  await loadRooms()
  const firstRoom = state.rooms[0]
  if (firstRoom) await selectRoom(firstRoom.id, { keepTerminal: false })
  else renderEmptyRoom()
  connectRoomUpdates()
}

function showLogin() {
  state.user = null
  updateProfile()
  app.hidden = true
  loginView.hidden = false
  loginButton.disabled = false
  loginNextInput.value = currentPath()
  const authError = new URLSearchParams(location.search).get('auth_error')
  loginError.textContent = authError ? authErrorMessage(authError) : ''
  loginButton.focus()
}

function clearClientSession() {
  closeAgentActivityDrawer()
  closeSocket()
  closeRoomUpdates()
  state.activeRoomId = null
  state.activeRoom = null
  state.events = []
  state.messages = []
  state.roomLoading = false
  state.usageLoading = false
  state.historyBefore = null
  state.historyHasMore = false
  state.historyLoading = false
  state.pendingDeleteRoomId = null
  state.deletingRoomId = null
  state.permanentlyDeletingRoomId = null
  state.activeRoomMenuId = null
  state.archivingRoomId = null
  state.restoringRoomId = null
  state.pinningRoomId = null
  if (deleteRoomDialog.open) deleteRoomDialog.close()
  state.user = null
  state.pendingAttachments = []
  state.uploadingAttachments = false
  for (const timer of Object.values(state.promptQueueTimers)) clearTimeout(timer)
  state.promptQueues = {}
  state.promptQueueTimers = {}
  state.pendingRunStarts = {}
  state.unreadRoomIds.clear()
  localStorage.removeItem(PROMPT_QUEUE_STORAGE_KEY)
  localStorage.removeItem(UNREAD_ROOMS_STORAGE_KEY)
  clearTextStreams()
  clearRenderTimers()
  state.panelUiState = {}
  state.messageScrollHoldSpacerPx = 0
  renderAttachmentTray()
  renderQueuedPromptTray()
  updateProfile()
}

function currentPath() {
  return `${location.pathname}${location.search}`
}

function authErrorMessage(value) {
  const messages = {
    missing_token: 'Unipass 로그인 토큰을 받지 못했습니다.',
    invalid_token: 'Unipass 계정을 확인하지 못했거나 devi 접근 권한이 없습니다.',
  }
  return messages[value] || 'Unipass 로그인을 완료하지 못했습니다.'
}

function applyTheme(theme) {
  state.theme = theme === 'light' ? 'light' : 'dark'
  localStorage.setItem('devai_theme', state.theme)
  app.dataset.theme = state.theme
  loginView.dataset.theme = state.theme
  for (const group of themeButtons) {
    group.dark.classList.toggle('active', state.theme === 'dark')
    group.light.classList.toggle('active', state.theme === 'light')
  }
  updateSettingsDialog()
}

async function loadWorkspaces() {
  const data = await api('/api/workspaces')
  state.workspaces = data.workspaces || []
  const preferred = preferredProjectWorkspace()
  if (preferred) cwdInput.value = preferred.path
  renderWorkDirQuickPicks(cwdQuickPicks, cwdInput.value)
}

function preferredProjectWorkspace() {
  return state.workspaces.find((item) => item.git && item.project !== false)
    || state.workspaces.find((item) => item.project !== false)
    || state.workspaces[0]
    || null
}

function preferredNewRoomCwd() {
  const active = state.workspaces.find((item) => item.path === state.activeRoom?.cwd && item.project !== false)
  return active?.path || preferredProjectWorkspace()?.path || cwdInput.value || '/workspace'
}

async function loadExecutionSettings() {
  const data = await api('/api/agents')
  state.agentOptions = Array.isArray(data.agents) && data.agents.length
    ? data.agents.map((item) => ({
        id: item.id,
        name: item.label,
        desc: item.description || item.command || '',
        icon: AGENT_BRANDS[normalizeAgentBrand(item.id)]?.iconSrc || '',
      }))
    : AGENT_MENU
  state.codexSettings = data.codex || { models: [], resolvedModel: '', resolvedEffort: '' }
  state.claudeSettings = data.claude || { models: [], resolvedModel: '', resolvedEffort: '' }
  state.permissionOptions = Array.isArray(data.permissions) ? data.permissions : []
  state.defaultCodexModel = normalizeCodexModel(state.defaultCodexModel)
  state.defaultCodexEffort = normalizeCodexEffort(state.defaultCodexEffort)
  state.defaultClaudeModel = normalizeClaudeModel(state.defaultClaudeModel)
  state.defaultClaudeEffort = normalizeClaudeEffort(state.defaultClaudeEffort)
}

function renderWorkDirQuickPicks(container, selectedPath, options = {}) {
  if (!container) return
  const selected = cleanDisplayMessage(selectedPath)
  const items = workDirQuickPickItems(selected)
  container.hidden = !items.length
  container.innerHTML = items.map((item) => {
    const active = item.path === selected
    const disabled = Boolean(options.disabled)
    return `
      <button class="workdir-pick ${active ? 'active' : ''}" type="button" data-workdir-path="${escapeHtml(item.path)}" title="${escapeHtml(item.path)}" ${disabled ? 'disabled aria-disabled="true"' : ''}>
        <span class="workdir-pick-name">${escapeHtml(workDirLabel(item))}</span>
        <span class="workdir-pick-path">${escapeHtml(compactWorkDirPath(item.path))}</span>
      </button>
    `
  }).join('')
}

function workDirQuickPickItems(selectedPath) {
  const byPath = new Map()
  const add = (item) => {
    if (!item?.path || byPath.has(item.path)) return
    byPath.set(item.path, item)
  }
  if (selectedPath) add(state.workspaces.find((item) => item.path === selectedPath))
  for (const item of state.workspaces) add(item)
  return [...byPath.values()].slice(0, 6)
}

function workDirLabel(item) {
  const label = cleanDisplayMessage(item?.label)
  if (label) return label
  const path = cleanDisplayMessage(item?.path)
  return path.split('/').filter(Boolean).pop() || path || '작업 디렉터리'
}

function compactWorkDirPath(path) {
  const value = cleanDisplayMessage(path).replace(/^\/home\/roro(?=\/|$)/, '~')
  return summarize(value, 44)
}

async function loadRooms() {
  const data = await api('/api/rooms')
  const previousById = new Map(state.rooms.map((room) => [room.id, room]))
  const rooms = (data.rooms || []).map((room) => roomWithPendingRunGuard(room))
  for (const room of rooms) updateRoomUnreadState(previousById.get(room.id), room)
  state.rooms = sortRoomsByRecency(rooms)
  pruneUnreadRooms()
  renderRooms()
  if (settingsDialog.open) updateSettingsDialog()
  if (deleteRoomDialog.open) updateDeleteRoomDialog()
}

function renderRooms() {
  if (!state.rooms.length) {
    roomList.innerHTML = `
      <div class="room-section-title">최근</div>
      <div class="room-subtitle" style="padding: 8px 9px;">저장된 채팅방이 없습니다.</div>
    `
    return
  }

  const activeRooms = state.rooms.filter((room) => !room.archivedAt && !room.trashedAt)
  const archivedRooms = state.rooms.filter((room) => room.archivedAt && !room.trashedAt)
  roomList.innerHTML = `
    <div class="room-section-title">최근</div>
    ${activeRooms.length ? activeRooms.map(roomListItem).join('') : '<div class="room-subtitle" style="padding: 8px 9px;">활성 채팅방이 없습니다.</div>'}
    ${archivedRooms.length ? `
      <button class="room-section-toggle archived-section" type="button" data-toggle-archived aria-expanded="${state.archivedRoomsExpanded ? 'true' : 'false'}">
        <span class="room-section-caret" aria-hidden="true">${state.archivedRoomsExpanded ? '▾' : '▸'}</span>
        <span>보관됨</span>
        <span class="room-section-count">${archivedRooms.length}</span>
      </button>
      ${state.archivedRoomsExpanded ? archivedRooms.map(roomListItem).join('') : ''}
    ` : ''}
  `

  const archivedToggle = roomList.querySelector('[data-toggle-archived]')
  archivedToggle?.addEventListener('click', (event) => {
    event.preventDefault()
    event.stopPropagation()
    state.archivedRoomsExpanded = !state.archivedRoomsExpanded
    localStorage.setItem(ARCHIVED_ROOMS_EXPANDED_KEY, String(state.archivedRoomsExpanded))
    if (!state.archivedRoomsExpanded) {
      const menuRoom = state.rooms.find((room) => room.id === state.activeRoomMenuId)
      if (menuRoom?.archivedAt) state.activeRoomMenuId = null
    }
    renderRooms()
  })

  for (const button of roomList.querySelectorAll('[data-room-id]')) {
    button.addEventListener('click', () => {
      if (state.pendingDeleteRoomId) {
        state.pendingDeleteRoomId = null
      }
      if (state.activeRoomMenuId) state.activeRoomMenuId = null
      renderRooms()
      selectRoom(button.dataset.roomId, { keepTerminal: false })
    })
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      button.click()
    })
  }

  for (const menu of roomList.querySelectorAll('[data-room-menu]')) {
    menu.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
    })
  }

  for (const button of roomList.querySelectorAll('[data-room-menu-id]')) {
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      const roomId = button.dataset.roomMenuId
      state.pendingDeleteRoomId = null
      state.activeRoomMenuId = state.activeRoomMenuId === roomId ? null : roomId
      renderRooms()
    })
  }

  for (const button of roomList.querySelectorAll('[data-archive-room-id]')) {
    button.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()
      await archiveRoom(button.dataset.archiveRoomId)
    })
  }

  for (const button of roomList.querySelectorAll('[data-unarchive-room-id]')) {
    button.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()
      await unarchiveRoom(button.dataset.unarchiveRoomId)
    })
  }

  for (const button of roomList.querySelectorAll('[data-pin-room-id]')) {
    button.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()
      await pinRoom(button.dataset.pinRoomId, button.dataset.pinRoomPinned !== 'false')
    })
  }

  for (const button of roomList.querySelectorAll('[data-ask-delete-room-id]')) {
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      openDeleteRoomDialog(button.dataset.askDeleteRoomId)
    })
  }
}

function roomListItem(room) {
  const active = room.id === state.activeRoomId
  const deleting = room.id === state.deletingRoomId
  const archiving = room.id === state.archivingRoomId
  const restoring = room.id === state.restoringRoomId
  const pinning = room.id === state.pinningRoomId
  const menuOpen = room.id === state.activeRoomMenuId
  const archived = Boolean(room.archivedAt)
  const pinned = Boolean(room.pinnedAt) && !archived && !room.trashedAt
  const running = Boolean(room.alive) && !archived
  const unread = state.unreadRoomIds.has(room.id) && !running && !archived && !room.trashedAt
  const status = running ? 'running' : unread ? 'unread' : safeStatusClass(room.status)
  const queuedCount = queuedPromptCount(room.id)
  const statusText = restoring
    ? '이동 중'
    : archiving
    ? '보관 중'
    : archived
    ? '보관됨'
    : running
      ? queuedCount ? `진행 중 · 대기 ${queuedCount}` : '진행 중'
      : queuedCount ? `대기 ${queuedCount}` : unread ? '확인 필요' : pinned ? '고정됨' : room.status === 'error' ? '오류' : ''
  const preview = room.lastUserMessage || room.cwd
  return `
    <div class="room-item ${active ? 'active' : ''} ${running ? 'running' : ''} ${unread ? 'unread' : ''} ${deleting ? 'deleting' : ''} ${archiving ? 'archiving' : ''} ${restoring ? 'restoring' : ''} ${pinning ? 'pinning' : ''} ${menuOpen ? 'menu-open' : ''} ${archived ? 'archived' : ''} ${pinned ? 'pinned' : ''}" role="button" tabindex="0" data-room-id="${escapeHtml(room.id)}">
      <span class="room-dot ${status}"></span>
      <span class="room-main">
        <span class="room-name">${escapeHtml(room.title)}</span>
        <span class="room-preview">${escapeHtml(preview)}</span>
      </span>
      ${statusText ? `<span class="room-status-label">${escapeHtml(statusText)}</span>` : ''}
      <span class="room-actions">
        <button class="room-menu-button ${menuOpen ? 'active' : ''}" type="button" data-room-menu-id="${escapeHtml(room.id)}" title="채팅 메뉴" aria-label="${escapeHtml(room.title)} 메뉴" aria-expanded="${menuOpen ? 'true' : 'false'}">⋮</button>
        ${menuOpen ? `
          <span class="room-menu" data-room-menu>
            ${archived ? `
              <button type="button" data-unarchive-room-id="${escapeHtml(room.id)}" ${restoring ? 'disabled' : ''}>${restoring ? '이동 중' : '최근으로 올리기'}</button>
              <button class="danger" type="button" data-ask-delete-room-id="${escapeHtml(room.id)}" ${deleting ? 'disabled' : ''}>삭제</button>
            ` : `
              <button type="button" data-archive-room-id="${escapeHtml(room.id)}" ${archiving ? 'disabled' : ''}>${archiving ? '보관 중' : '보관'}</button>
              <button class="danger" type="button" data-ask-delete-room-id="${escapeHtml(room.id)}" ${deleting ? 'disabled' : ''}>삭제</button>
              <button type="button" data-pin-room-id="${escapeHtml(room.id)}" data-pin-room-pinned="${pinned ? 'false' : 'true'}" ${pinning ? 'disabled' : ''}>${pinning ? '처리 중' : pinned ? '핀 해제' : '핀'}</button>
            `}
          </span>
        ` : ''}
      </span>
    </div>
  `
}

function clearRoomTransientState(roomId) {
  if (state.promptQueueTimers[roomId]) clearTimeout(state.promptQueueTimers[roomId])
  delete state.promptQueueTimers[roomId]
  delete state.promptQueues[roomId]
  setRoomUnread(roomId, false)
  persistPromptQueues()
  clearPanelStateForRoom(roomId)
}

async function archiveRoom(roomId) {
  const room = state.rooms.find((item) => item.id === roomId)
  if (!room || room.archivedAt || state.archivingRoomId) return
  const wasActive = state.activeRoomId === room.id
  state.archivingRoomId = room.id
  state.activeRoomMenuId = null
  renderRooms()
  try {
    await api(`/api/rooms/${room.id}/archive`, { method: 'POST' })
    state.pendingDeleteRoomId = null
    state.archivingRoomId = null
    clearRoomTransientState(room.id)
    if (wasActive) {
      closeSocket()
      state.activeRoomId = null
      state.activeRoom = null
      terminal.reset()
      renderEmptyRoom()
    }
    await loadRooms()
    if (wasActive) {
      const nextRoom = state.rooms.find((item) => !item.archivedAt && !item.trashedAt)
      if (nextRoom) await selectRoom(nextRoom.id, { keepTerminal: false })
    }
  } catch (err) {
    state.archivingRoomId = null
    renderRooms()
    showUiError(err, '채팅방을 보관하지 못했습니다.')
  }
}

async function unarchiveRoom(roomId) {
  const room = state.rooms.find((item) => item.id === roomId)
  if (!room || !room.archivedAt || state.restoringRoomId) return
  const wasActive = state.activeRoomId === room.id
  state.restoringRoomId = room.id
  state.activeRoomMenuId = null
  renderRooms()
  try {
    const response = await api(`/api/rooms/${room.id}/unarchive`, { method: 'POST' })
    state.restoringRoomId = null
    if (response.room) upsertRoom(response.room)
    await loadRooms()
    if (wasActive) await selectRoom(room.id, { keepTerminal: false })
  } catch (err) {
    state.restoringRoomId = null
    renderRooms()
    showUiError(err, '채팅방을 최근으로 옮기지 못했습니다.')
  }
}

async function pinRoom(roomId, pinned) {
  const room = state.rooms.find((item) => item.id === roomId)
  if (!room || room.archivedAt || room.trashedAt || state.pinningRoomId) return
  state.pinningRoomId = room.id
  state.activeRoomMenuId = null
  renderRooms()
  try {
    const response = await api(`/api/rooms/${room.id}/pin`, {
      method: 'POST',
      body: JSON.stringify({ pinned }),
    })
    state.pinningRoomId = null
    if (response.room) upsertRoom(response.room)
    await loadRooms()
    if (state.activeRoomId === room.id && response.room) {
      state.activeRoom = response.room
      renderRoomHeader(response.room)
    }
  } catch (err) {
    state.pinningRoomId = null
    renderRooms()
    showUiError(err, pinned ? '채팅방을 고정하지 못했습니다.' : '채팅방 고정을 해제하지 못했습니다.')
  }
}

function openDeleteRoomDialog(roomId) {
  const room = state.rooms.find((item) => item.id === roomId)
  if (!room || room.trashedAt || state.deletingRoomId) return
  state.pendingDeleteRoomId = room.id
  state.activeRoomMenuId = null
  renderRooms()
  updateDeleteRoomDialog()
  if (!deleteRoomDialog.open) {
    deleteRoomDialog.showModal()
    requestAnimationFrame(() => cancelDeleteRoomButton.focus({ preventScroll: true }))
  }
}

function closeDeleteRoomDialog() {
  if (state.deletingRoomId) return
  state.pendingDeleteRoomId = null
  if (deleteRoomDialog.open) deleteRoomDialog.close()
  renderRooms()
}

function updateDeleteRoomDialog() {
  if (!deleteRoomDialog) return
  const room = state.rooms.find((item) => item.id === state.pendingDeleteRoomId)
  const deleting = Boolean(state.deletingRoomId)
  deleteRoomTitle.textContent = room?.title || '채팅방'
  deleteRoomMeta.textContent = room?.archivedAt
    ? '보관된 채팅방을 휴지통으로 이동합니다.'
    : '이 채팅방을 휴지통으로 이동합니다.'
  confirmDeleteRoomButton.textContent = deleting ? '삭제 중' : '삭제'
  confirmDeleteRoomButton.disabled = deleting || !room
  cancelDeleteRoomButton.disabled = deleting
  closeDeleteRoomButton.disabled = deleting
}

async function deleteRoom(roomId) {
  const room = state.rooms.find((item) => item.id === roomId)
  if (!room || state.deletingRoomId) return
  const wasActive = state.activeRoomId === room.id
  state.deletingRoomId = room.id
  state.activeRoomMenuId = null
  renderRooms()
  updateDeleteRoomDialog()
  try {
    const response = await api(`/api/rooms/${room.id}/trash`, { method: 'POST' })
    state.pendingDeleteRoomId = null
    state.deletingRoomId = null
    clearRoomTransientState(room.id)
    if (response.room) upsertRoom(response.room)
    if (wasActive) {
      closeSocket()
      state.activeRoomId = null
      state.activeRoom = null
      terminal.reset()
      renderEmptyRoom()
    }
    await loadRooms()
    const nextRoom = state.rooms.find((item) => !item.trashedAt)
    if (!state.activeRoomId && nextRoom) await selectRoom(nextRoom.id, { keepTerminal: false })
    if (deleteRoomDialog.open) deleteRoomDialog.close()
  } catch (err) {
    state.pendingDeleteRoomId = null
    state.deletingRoomId = null
    renderRooms()
    if (deleteRoomDialog.open) deleteRoomDialog.close()
    showUiError(err, '채팅방을 휴지통으로 이동하지 못했습니다.')
  }
}

async function permanentlyDeleteRoom(roomId) {
  const room = state.rooms.find((item) => item.id === roomId)
  if (!room || state.permanentlyDeletingRoomId) return
  const wasActive = state.activeRoomId === room.id
  state.permanentlyDeletingRoomId = room.id
  updateSettingsDialog()
  try {
    await api(`/api/rooms/${room.id}`, { method: 'DELETE' })
    state.permanentlyDeletingRoomId = null
    clearRoomTransientState(room.id)
    state.rooms = state.rooms.filter((item) => item.id !== room.id)
    if (wasActive) {
      closeSocket()
      state.activeRoomId = null
      state.activeRoom = null
      terminal.reset()
      renderEmptyRoom()
    }
    renderRooms()
    updateSettingsDialog()
  } catch (err) {
    state.permanentlyDeletingRoomId = null
    updateSettingsDialog()
    showUiError(err, '채팅방을 영구 삭제하지 못했습니다.')
  }
}

async function selectRoom(roomId, options = {}) {
  closeAgentActivityDrawer()
  setRoomUnread(roomId, false)
  const loadToken = state.activeRoomLoadToken + 1
  state.activeRoomLoadToken = loadToken
  state.activeRoomId = roomId
  state.activeRoom = state.rooms.find((room) => room.id === roomId) || null
  state.roomLoading = true
  state.historyBefore = null
  state.historyHasMore = false
  state.historyLoading = false
  state.events = []
  state.messages = []
  clearTextStreams()
  state.lastStreamScrollTop = 0
  clearRenderTimers()
  state.pendingAttachments = []
  state.uploadingAttachments = false
  renderAttachmentTray()
  renderQueuedPromptTray()
  closeComposerMenu()
  app.classList.remove('sidebar-open')
  setTerminalVisible(true)
  renderRooms()
  closeSocket()
  if (!options.keepTerminal) terminal.reset()
  if (state.activeRoom) renderRoomHeader(state.activeRoom)
  setInputsEnabled(false)
  showRoomLoadingState()

  try {
    const [roomData, eventData] = await Promise.all([
      api(`/api/rooms/${roomId}`),
      api(`/api/rooms/${roomId}/events?limit=${EVENT_PAGE_SIZE}`),
    ])

    if (loadToken !== state.activeRoomLoadToken || state.activeRoomId !== roomId) return

    state.roomLoading = false
    const loadedRoom = roomWithPendingRunGuard(roomData.room)
    state.activeRoom = loadedRoom
    upsertRoom(loadedRoom)
    state.events = eventData.events || []
    state.historyBefore = eventData.before ?? null
    state.historyHasMore = pageHasOlderHistory(eventData, 0)
    state.messages = buildMessagesFromEvents(state.events)
    syncWorkPanelUiState()
    renderRoomHeader(loadedRoom)
    replayTerminal(state.events)
    renderMessages({ stickToBottom: true })
    renderActivity()
    if (loadedRoom.archivedAt || loadedRoom.trashedAt) {
      closeSocket()
      terminalSummary.textContent = loadedRoom.trashedAt ? '휴지통' : '보관됨'
      setInputsEnabled(false)
    } else {
      connectRoom(roomId)
    }
    requestAnimationFrame(() => {
      fitTerminal()
      stream.scrollTop = stream.scrollHeight
      state.lastStreamScrollTop = stream.scrollTop
      fillScrollableHistory()
    })
  } catch (err) {
    if (loadToken !== state.activeRoomLoadToken || state.activeRoomId !== roomId) return
    state.roomLoading = false
    renderMessages()
    showUiError(err, '채팅 기록을 불러오지 못했습니다.')
  }
}

function connectRoom(roomId) {
  clearSocketReconnect()
  closeSocket()
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const socket = new WebSocket(`${protocol}//${location.host}/ws/rooms/${roomId}`)
  state.socket = socket
  terminalSummary.textContent = '연결 중'

  socket.addEventListener('open', () => {
    clearSocketReconnect()
    terminalSummary.textContent = '연결됨'
    sendResize()
    setInputsEnabled(canUseActiveRoomComposer())
    flushPromptQueueSoon(roomId)
  })

  socket.addEventListener('message', (event) => {
    if (state.socket !== socket || state.activeRoomId !== roomId) return
    const message = JSON.parse(event.data)
    if (message.type === 'hello' || message.type === 'room') {
      applyRoomUpdate(message.room)
      return
    }
    if (message.type === 'room_deleted') {
      clearRoomTransientState(roomId)
      state.rooms = state.rooms.filter((room) => room.id !== roomId)
      closeSocket()
      state.activeRoomId = null
      state.activeRoom = null
      terminal.reset()
      renderEmptyRoom()
      renderRooms()
      return
    }
    ingestStreamEvent(message)
  })

  socket.addEventListener('close', (event) => {
    if (state.socket === socket) {
      state.socket = null
      terminalSummary.textContent = event.code === 1008 ? (event.reason || '로그인 필요') : '연결 끊김'
      setInputsEnabled(false)
      if (event.code !== 1008 && state.activeRoomId === roomId && !app.hidden) {
        scheduleSocketReconnect(roomId)
      }
    }
  })
}

function connectRoomUpdates() {
  clearRoomUpdatesReconnect()
  closeRoomUpdatesSocket()
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
  const socket = new WebSocket(`${protocol}//${location.host}/ws/rooms`)
  state.roomUpdatesSocket = socket

  socket.addEventListener('message', (event) => {
    if (state.roomUpdatesSocket !== socket) return
    const message = JSON.parse(event.data)
    if (message.type === 'rooms') {
      applyRoomUpdatesSnapshot(message.rooms || [])
      return
    }
    if (message.type === 'room') {
      applyRoomUpdate(message.room)
      return
    }
    if (message.type === 'room_deleted') removeRoomUpdate(message.roomId)
  })

  socket.addEventListener('close', (event) => {
    if (state.roomUpdatesSocket !== socket) return
    state.roomUpdatesSocket = null
    if (event.code !== 1008 && state.user && !app.hidden) scheduleRoomUpdatesReconnect()
  })
}

function closeRoomUpdates() {
  clearRoomUpdatesReconnect()
  closeRoomUpdatesSocket()
}

function closeRoomUpdatesSocket() {
  const socket = state.roomUpdatesSocket
  state.roomUpdatesSocket = null
  if (socket) socket.close()
}

function scheduleRoomUpdatesReconnect() {
  clearRoomUpdatesReconnect()
  state.roomUpdatesReconnectTimer = window.setTimeout(() => {
    state.roomUpdatesReconnectTimer = null
    if (!state.roomUpdatesSocket && state.user && !app.hidden) connectRoomUpdates()
  }, SOCKET_RECONNECT_DELAY_MS)
}

function clearRoomUpdatesReconnect() {
  if (!state.roomUpdatesReconnectTimer) return
  clearTimeout(state.roomUpdatesReconnectTimer)
  state.roomUpdatesReconnectTimer = null
}

function applyRoomUpdatesSnapshot(rooms) {
  const previousById = new Map(state.rooms.map((room) => [room.id, room]))
  const nextRooms = rooms.map((room) => roomWithPendingRunGuard(room))
  for (const room of nextRooms) updateRoomUnreadState(previousById.get(room.id), room)
  state.rooms = sortRoomsByRecency(nextRooms)
  pruneUnreadRooms()
  const activeRoom = state.rooms.find((room) => room.id === state.activeRoomId)
  if (activeRoom) renderRoomHeader(activeRoom)
  renderRooms()
}

function applyRoomUpdate(room) {
  if (!room?.id) return
  const previous = state.rooms.find((item) => item.id === room.id)
  const next = roomWithPendingRunGuard(room)
  updateRoomUnreadState(previous, next)
  upsertRoom(next)
  if (state.activeRoomId === next.id) {
    state.activeRoom = next
    setRoomUnread(next.id, false)
    renderRoomHeader(next)
  }
  renderRooms()
}

function removeRoomUpdate(roomId) {
  if (!roomId) return
  state.rooms = state.rooms.filter((room) => room.id !== roomId)
  setRoomUnread(roomId, false)
  renderRooms()
}

function updateRoomUnreadState(previous, next) {
  if (!next?.id) return
  if (next.archivedAt || next.trashedAt || state.activeRoomId === next.id) {
    setRoomUnread(next.id, false)
    return
  }
  if (roomJustFinished(previous, next)) setRoomUnread(next.id, true)
}

function setRoomUnread(roomId, unread) {
  if (!roomId) return
  const wasUnread = state.unreadRoomIds.has(roomId)
  if (wasUnread === unread) return
  if (unread) state.unreadRoomIds.add(roomId)
  else state.unreadRoomIds.delete(roomId)
  localStorage.setItem(UNREAD_ROOMS_STORAGE_KEY, JSON.stringify([...state.unreadRoomIds]))
}

function pruneUnreadRooms() {
  const visibleRoomIds = new Set(state.rooms
    .filter((room) => !room.archivedAt && !room.trashedAt)
    .map((room) => room.id))
  let changed = false
  for (const roomId of state.unreadRoomIds) {
    if (visibleRoomIds.has(roomId)) continue
    state.unreadRoomIds.delete(roomId)
    changed = true
  }
  if (changed) localStorage.setItem(UNREAD_ROOMS_STORAGE_KEY, JSON.stringify([...state.unreadRoomIds]))
}

function closeSocket() {
  clearSocketReconnect()
  if (state.socket) state.socket.close()
  state.socket = null
}

function scheduleSocketReconnect(roomId) {
  clearSocketReconnect()
  state.socketReconnectTimer = setTimeout(() => {
    state.socketReconnectTimer = null
    if (state.activeRoomId === roomId && !state.socket && !app.hidden) connectRoom(roomId)
  }, SOCKET_RECONNECT_DELAY_MS)
}

function clearSocketReconnect() {
  if (!state.socketReconnectTimer) return
  clearTimeout(state.socketReconnectTimer)
  state.socketReconnectTimer = null
}

function replayTerminal(events) {
  terminal.reset()
  for (const event of events) {
    if (event.type === 'output' && event.data) terminal.write(event.data)
  }
  fitTerminal()
}

async function loadOlderEvents() {
  if (!state.activeRoomId || state.roomLoading || state.historyLoading || !state.historyHasMore) return
  const roomId = state.activeRoomId
  const loadToken = state.activeRoomLoadToken
  const previousEventCount = state.events.length
  const previousScrollHeight = stream.scrollHeight
  const previousScrollTop = stream.scrollTop
  state.historyLoading = true
  updateHistoryTopLoader()
  try {
    const eventsPath = state.historyBefore === null
      ? `/api/rooms/${roomId}/events?limit=${previousEventCount + EVENT_PAGE_SIZE}`
      : `/api/rooms/${roomId}/events?limit=${EVENT_PAGE_SIZE}&before=${encodeURIComponent(state.historyBefore)}`
    const eventData = await api(eventsPath)
    if (loadToken !== state.activeRoomLoadToken || state.activeRoomId !== roomId) return
    state.events = mergeEventPages(eventData.events || [], state.events)
    state.historyBefore = eventData.before ?? null
    state.historyHasMore = pageHasOlderHistory(eventData, previousEventCount)
    rebuildMessagesFromEvents({
      preserveScroll: { previousScrollHeight, previousScrollTop },
    })
    renderActivity()
  } finally {
    if (loadToken === state.activeRoomLoadToken && state.activeRoomId === roomId) {
      state.historyLoading = false
      updateHistoryTopLoader()
      requestAnimationFrame(fillScrollableHistory)
    }
  }
}

function fillScrollableHistory() {
  if (
    !state.activeRoomId ||
    state.roomLoading ||
    state.historyLoading ||
    !state.historyHasMore ||
    stream.scrollHeight > stream.clientHeight + HISTORY_LOAD_THRESHOLD_PX
  ) return
  loadOlderEvents().catch((err) => showUiError(err, '이전 기록을 불러오지 못했습니다.'))
}

function mergeEventPages(olderEvents, currentEvents) {
  if (!olderEvents.length) return currentEvents
  const seen = new Set(currentEvents.map(eventIdentity))
  return [
    ...olderEvents.filter((event) => {
      const key = eventIdentity(event)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }),
    ...currentEvents,
  ]
}

function eventIdentity(event) {
  return JSON.stringify([
    event.time || '',
    event.type || '',
    event.messageId || '',
    event.toolUseId || '',
    event.text || '',
    event.command || '',
    event.data || '',
  ])
}

function pageHasOlderHistory(page, previousEventCount) {
  if (typeof page?.hasMore === 'boolean') return page.hasMore
  const eventCount = Array.isArray(page?.events) ? page.events.length : 0
  return eventCount >= EVENT_PAGE_SIZE && eventCount > previousEventCount
}

function buildMessagesFromEvents(events) {
  return buildTurnMessages(events)
}

function renderMessages(options = {}) {
  if (!options.holdScrollOnCollapse && !options.keepScrollHoldSpacer) {
    state.messageScrollHoldSpacerPx = 0
  }
  const wasNearBottom = !state.streamFollowPaused && isStreamNearBottom()
  const promptFocus = capturePromptFocus()
  updateHistoryTopLoader()
  if (state.roomLoading) {
    showRoomLoadingState()
    restorePromptFocus(promptFocus)
    return
  }

  roomLoadingState.hidden = true
  messageList.hidden = !state.activeRoomId
  if (!state.activeRoomId || !state.messages.length) {
    messageList.innerHTML = ''
    emptyState.hidden = false
    if (state.activeRoomId && !state.roomLoading) state.messageMotionReady = true
    restorePromptFocus(promptFocus)
    return
  }

  emptyState.hidden = true
  const previousMotionLayout = captureMotionLayout(messageList)
  messageList.innerHTML = state.messages.map((message, index) => {
    if (message.role === 'codex_turn') return renderCodexTurnMessage(message)
    if (message.role === 'assistant') {
      const brand = assistantBrandFor(message)
      const streamKey = `assistant:${message.messageId || message.time || index}`
      const text = displayStreamingText(
        streamKey,
        message.text,
        Boolean(message.streaming && state.activeRoom?.alive)
      )
      return `
        <article class="message-row assistant" ${motionAttributes(messageMotionKey(message, index), 'row')}>
          <div class="message-bubble">
            <div class="assistant-name ${brand.id} ${message.streaming ? 'streaming' : ''}">
              ${brand.icon}
              <span>${escapeHtml(brand.label)}</span>
            </div>
            <div class="message-content" data-stream-text-key="${escapeHtml(streamKey)}" data-stream-renderer="assistant" data-stream-caret="${message.streaming ? 'true' : 'false'}">${formatAssistantText(text)}${message.streaming ? '<span class="typing-caret"></span>' : ''}</div>
          </div>
        </article>
      `
    }
    if (message.role === 'progress') return renderProgressMessage(message)
    if (message.role === 'shell') return renderShellMessage(message)
    if (message.role === 'diff') return renderDiffMessage(message)
    if (message.role === 'files') return renderFilesMessage(message)
    if (message.role === 'usage') return renderUsageMessage(message)
    if (message.role === 'usage_summary') return renderUsageSummaryMessage(message)
    if (message.role === 'error') return renderErrorMessage(message)
    if (message.role === 'user') {
      const sentClass = shouldAnimateUserMessage(message) ? 'sent-anim' : ''
      const attachments = activeMessageAttachments(message.attachments)
      const userText = visibleUserMessageText(message.text, attachments)
      const long = isLongUserText(userText)
      const textPanelId = `${messageMotionKey(message, index)}:usertext`
      const textExpanded = long && isPanelExpanded(textPanelId, false)
      return `
        <article class="message-row user ${sentClass}" ${motionAttributes(messageMotionKey(message, index), 'row')}>
          <div class="message-col">
            <div class="message-bubble ${attachments.length ? 'has-attachments' : ''}">
              ${renderMessageAttachments(attachments)}
              ${userText ? `
                <div class="message-text-wrap ${long ? (textExpanded ? 'expanded' : 'collapsed') : ''}">
                  <div class="message-text">${formatMessageText(userText)}</div>
                </div>
              ` : ''}
            </div>
            ${long ? `
              <button class="message-text-toggle" type="button" data-toggle-panel="${escapeHtml(textPanelId)}" aria-expanded="${textExpanded}">
                <span>${textExpanded ? '접기' : '전체 보기'}</span>
                <span class="message-text-toggle-icon">▾</span>
              </button>
            ` : ''}
          </div>
        </article>
      `
    }
    return `
      <article class="message-row ${escapeHtml(message.role)}" ${motionAttributes(messageMotionKey(message, index), 'row')}>
        <div class="message-bubble">${formatMessageText(message.text)}</div>
      </article>
    `
  }).join('')
  bindMessageControls()
  renderAgentActivityDrawer()
  animateMotionLayout(messageList, previousMotionLayout, 'messageMotionReady')
  if (options.holdScrollOnCollapse) {
    applyCollapseScrollHold(options.holdScrollOnCollapse)
    restorePromptFocus(promptFocus)
    return
  }
  if (options.preserveScroll) {
    const { previousScrollHeight, previousScrollTop } = options.preserveScroll
    stream.scrollTop = Math.max(0, stream.scrollHeight - previousScrollHeight + previousScrollTop)
  } else if (!state.streamFollowPaused && (options.stickToBottom || (options.stickToBottom !== false && wasNearBottom))) {
    if (options.smoothFollow || hasPendingTextStream()) {
      requestSmoothStreamBottom()
    } else {
      cancelSmoothStreamBottom()
      stream.scrollTop = stream.scrollHeight
      requestAnimationFrame(() => {
        stream.scrollTop = stream.scrollHeight
      })
    }
  }
  restorePromptFocus(promptFocus)
}

function ingestStreamEvent(event) {
  clearMessageScrollHoldSpacer()
  state.events.push({ ...event, time: event.time || new Date().toISOString() })
  applyEventSideEffects(event)
  scheduleMessagesRebuild({
    stickToBottom: !state.streamFollowPaused && isStreamNearBottom(),
    smoothFollow: shouldSmoothFollowEvent(event),
    immediate: shouldRenderStreamEventImmediately(event),
  })
  scheduleActivityRender()
}

function shouldSmoothFollowEvent(event) {
  return [
    'assistant_delta',
    'assistant_message',
    'assistant_attachment',
    'progress',
    'tool',
    'tool_result',
    'output',
    'diff',
    'files',
    'file_change',
    'usage',
    'turn_completed',
    'exit',
    'error',
  ].includes(event?.type)
}

function clearMessageScrollHoldSpacer() {
  state.messageScrollHoldSpacerPx = 0
}

function applyCollapseScrollHold({ previousScrollTop }) {
  const nextMaxScrollTop = Math.max(0, stream.scrollHeight - stream.clientHeight)
  const spacerPx = Math.ceil(Math.max(0, previousScrollTop - nextMaxScrollTop))
  state.messageScrollHoldSpacerPx = spacerPx
  if (spacerPx > 0) {
    const spacer = document.createElement('div')
    spacer.className = 'message-scroll-hold'
    spacer.style.height = `${spacerPx}px`
    spacer.setAttribute('aria-hidden', 'true')
    messageList.appendChild(spacer)
  }
  stream.scrollTop = Math.min(previousScrollTop, Math.max(0, stream.scrollHeight - stream.clientHeight))
}

function applyEventSideEffects(event) {
  if (event.type === 'progress') {
    if (event.phase === 'started') {
      terminalSummary.textContent = '응답 준비 중'
      return
    }
    const clean = cleanDisplayMessage(event.text)
    if (clean && !shouldHideProgressText(clean)) terminalSummary.textContent = clean
    return
  }
  if (event.type === 'tool') {
    terminalSummary.textContent = event.command || event.title || '도구 실행 중'
    return
  }
  if (event.type === 'tool_result') {
    const exit = Number.isInteger(event.exitCode) ? event.exitCode : event.status === 'error' ? 1 : 0
    terminalSummary.textContent = exit ? `도구 실패 · exit ${exit}` : '도구 완료'
    return
  }
  if (event.type === 'usage') {
    terminalSummary.textContent = cleanDisplayMessage(event.text) || terminalSummary.textContent
    return
  }
  if (event.type === 'turn_completed') {
    terminalSummary.textContent = '작업 완료'
    return
  }
  if (event.type === 'exit') {
    clearPendingRunStart(state.activeRoomId)
    if (state.activeRoom) {
      state.activeRoom.alive = false
      state.activeRoom.status = event.code && event.code !== 0 ? 'error' : 'exited'
      upsertRoom(state.activeRoom)
      renderRoomHeader(state.activeRoom)
      renderRooms()
    }
    terminalSummary.textContent = `exit ${event.code ?? 'null'}`
    setInputsEnabled(canUseActiveRoomComposer())
    flushPromptQueueSoon(state.activeRoomId)
    return
  }
  if (event.type === 'error') {
    clearPendingRunStart(state.activeRoomId)
    terminalSummary.textContent = '오류'
  }
}

function rebuildMessagesFromEvents(options = {}) {
  state.messages = buildMessagesFromEvents(state.events)
  syncWorkPanelUiState()
  if (options.render !== false) renderMessages(options)
}

function scheduleMessagesRebuild(options = {}) {
  const pending = state.pendingRenderOptions || {}
  state.pendingRenderOptions = {
    ...pending,
    ...options,
    stickToBottom: Boolean(pending.stickToBottom || options.stickToBottom),
    smoothFollow: Boolean(pending.smoothFollow || options.smoothFollow),
  }
  if (state.messageRenderTimer) {
    if (!options.immediate) return
    clearTimeout(state.messageRenderTimer)
    state.messageRenderTimer = null
  }
  const delay = options.immediate ? 0 : LIVE_RENDER_INTERVAL_MS
  state.messageRenderTimer = window.setTimeout(() => {
    state.messageRenderTimer = null
    const renderOptions = state.pendingRenderOptions || {}
    state.pendingRenderOptions = null
    rebuildMessagesFromEvents(renderOptions)
  }, delay)
}

function scheduleActivityRender() {
  if (state.activityRenderTimer) return
  state.activityRenderTimer = window.setTimeout(() => {
    state.activityRenderTimer = null
    renderActivity()
  }, LIVE_RENDER_INTERVAL_MS)
}

function shouldRenderStreamEventImmediately(event) {
  return ['turn_completed', 'exit', 'error', 'tool', 'tool_result', 'assistant_attachment', 'attachment_deleted', 'diff', 'files', 'file_change', 'usage'].includes(event.type)
}

function buildTurnMessages(events) {
  const messages = []
  let pendingInput = null
  let currentTurn = null
  let turnIndex = 0
  let seq = 0
  state.deletedAttachmentIds = new Set(events
    .filter((event) => event.type === 'attachment_deleted')
    .map((event) => cleanAttachmentId(event.attachmentId))
    .filter(Boolean))

  for (const rawEvent of events) {
    const event = { ...rawEvent, _seq: seq++ }
    if (event.type === 'attachment' || event.type === 'attachment_deleted') continue

    if (event.type === 'input') {
      const userMessage = userMessageFromInput(event)
      const last = messages[messages.length - 1]
      if (last?.role === 'user' && sameAttachmentIds(last.attachments, userMessage.attachments) && last.text === userMessage.text) {
        pendingInput = { time: event.time, seq: event._seq }
        currentTurn = null
        continue
      }
      messages.push(userMessage)
      pendingInput = { time: event.time, seq: event._seq }
      currentTurn = null
      continue
    }

    if (isCodexTurnEvent(event)) {
      if (!currentTurn) {
        currentTurn = createCodexTurn(event, pendingInput, turnIndex++)
        messages.push(currentTurn)
      }
      applyEventToCodexTurn(currentTurn, event)
      continue
    }

    if (event.type === 'usage_summary') {
      messages.push({
        role: 'usage_summary',
        text: cleanDisplayMessage(event.text) || 'Usage',
        usage: event.usage || {},
        time: event.time,
      })
      continue
    }

    if (event.type === 'system') {
      messages.push({ role: 'system', text: cleanDisplayMessage(event.text), time: event.time })
    }
  }

  if (pendingInput && state.activeRoom?.alive) {
    if (currentTurn) {
      if (!hasVisibleTurnContent(currentTurn)) currentTurn.pending = true
    } else {
      const pendingTurn = createCodexTurn({ type: 'pending', time: pendingInput.time, _seq: seq }, pendingInput, turnIndex++)
      pendingTurn.pending = true
      messages.push(pendingTurn)
    }
  }

  return messages.filter((message) => {
    if (message.role !== 'codex_turn') return message.text || message.attachments?.length
    return hasCodexTurnContent(message)
  })
}

function userMessageFromInput(event) {
  const attachments = activeMessageAttachments(event.attachments)
  return {
    role: 'user',
    text: cleanDisplayMessage(event.text) || (attachments.length ? '첨부 파일을 확인해줘.' : ''),
    attachments,
    time: event.time || new Date().toISOString(),
  }
}

function isCodexTurnEvent(event) {
  return [
    'assistant_delta',
    'assistant_message',
    'assistant_attachment',
    'progress',
    'tool',
    'tool_result',
    'diff',
    'files',
    'file_change',
    'usage',
    'turn_completed',
    'exit',
    'error',
    'output',
  ].includes(event.type)
}

function createCodexTurn(event, pendingInput, index) {
  const agent = agentForMessageEvent(event)
  const rawTurnKey = pendingInput?.time || event.turnId || event.messageId || event.toolUseId || event.time || String(index)
  const turnKey = String(rawTurnKey).replace(/[^a-z0-9_.:-]/gi, '-')
  return {
    role: 'codex_turn',
    id: `${state.activeRoomId || 'room'}-turn-${turnKey}`,
    agent,
    time: pendingInput?.time || event.time || new Date().toISOString(),
    startSeq: pendingInput?.seq ?? event._seq ?? 0,
    lastSeq: event._seq ?? 0,
    assistantMessages: [],
    workGroups: [],
    timeline: [],
    events: [],
    changes: { files: [], items: [] },
    attachments: [],
    usage: '',
    completion: null,
    error: null,
    pending: false,
  }
}

function hasVisibleTurnContent(turn) {
  return Boolean(
    turn.assistantMessages.length ||
    turn.workGroups.length ||
    turn.changes.files.length ||
    turn.changes.items.length ||
    turn.attachments.length ||
    turn.usage ||
    turn.completion ||
    turn.error
  )
}

function hasCodexTurnContent(turn) {
  return Boolean(hasVisibleTurnContent(turn) || turn.pending)
}

function applyEventToCodexTurn(turn, event) {
  turn.lastSeq = event._seq ?? turn.lastSeq
  turn.events.push({ ...event })
  if (event.type === 'assistant_delta') {
    addAssistantToTurn(turn, event, true)
    return
  }
  if (event.type === 'assistant_message') {
    addAssistantToTurn(turn, event, false)
    return
  }
  if (event.type === 'assistant_attachment') {
    const incoming = activeMessageAttachments(event.attachments)
    for (const attachment of incoming) {
      if (!turn.attachments.some((item) => item.id === attachment.id)) turn.attachments.push(attachment)
    }
    if (turn.attachments.length) {
      addTurnTimelineItem(turn, {
        type: 'attachments',
        id: `${turn.id}:attachments`,
        seq: event._seq ?? turn.lastSeq,
        attachments: turn.attachments,
      })
    }
    return
  }
  if (event.type === 'progress') {
    if (isCommandOutputProgress(event) && addCommandOutputToTurn(turn, event)) return
    addProgressToTurn(turn, event)
    return
  }
  if (event.type === 'tool') {
    addToolToTurn(turn, event)
    return
  }
  if (event.type === 'tool_result') {
    addToolResultToTurn(turn, event)
    return
  }
  if (event.type === 'diff') {
    const files = Array.isArray(event.files) ? event.files : []
    if (files.length) {
      turn.changes.files = files
      addChangesTimelineItem(turn, event)
    }
    return
  }
  if (event.type === 'files') {
    const items = Array.isArray(event.items) ? event.items : []
    if (items.length) {
      turn.changes.items = items
      addChangesTimelineItem(turn, event)
    }
    return
  }
  if (event.type === 'file_change') {
    addFileChangeToTurn(turn, event)
    return
  }
  if (event.type === 'usage') {
    turn.usage = cleanDisplayMessage(event.text)
    if (turn.usage) {
      addTurnTimelineItem(turn, {
        type: 'usage',
        id: `${turn.id}:usage`,
        seq: event._seq ?? turn.lastSeq,
      })
    }
    return
  }
  if (event.type === 'turn_completed' || event.type === 'exit') {
    stopTurnAssistantStreams(turn)
    turn.completion = completionFromEvent(turn, event)
    addTurnTimelineItem(turn, {
      type: 'completion',
      id: `${turn.id}:completion`,
      seq: event._seq ?? turn.lastSeq,
    })
    closeAllWorkGroups(turn)
    return
  }
  if (event.type === 'error') {
    stopTurnAssistantStreams(turn)
    turn.error = cleanDisplayMessage(event.text || event.error || '오류가 발생했습니다.')
    addTurnTimelineItem(turn, {
      type: 'error',
      id: `${turn.id}:error`,
      seq: event._seq ?? turn.lastSeq,
    })
    closeAllWorkGroups(turn)
    return
  }
  if (event.type === 'output' && event.data) {
    if (addCommandOutputToTurn(turn, event)) return
    const text = cleanTerminalMessage(event.data)
    if (text) addAssistantToTurn(turn, { ...event, text }, true)
  }
}

function addAssistantToTurn(turn, event, isDelta) {
  const clean = isDelta ? cleanStreamMessage(event.text) : cleanDisplayMessage(event.text)
  if (!clean) return
  const messageId = event.messageId || ''
  let target = null
  if (messageId) target = turn.assistantMessages.find((item) => item.messageId === messageId)
  if (!target && isDelta && !messageId) target = turn.assistantMessages[turn.assistantMessages.length - 1]

  if (!target || (!isDelta && target.messageId && target.messageId !== messageId)) {
    stopTurnAssistantStreams(turn)
    target = {
      id: `${turn.id}:assistant:${eventStableKey(event)}`,
      messageId,
      phase: assistantMessagePhase(event.phase),
      text: '',
      seq: event._seq ?? turn.lastSeq,
      time: event.time || new Date().toISOString(),
      streaming: Boolean(isDelta),
    }
    turn.assistantMessages.push(target)
    addTurnTimelineItem(turn, {
      type: 'assistant',
      id: target.id,
      seq: target.seq,
      message: target,
    })
  }

  if (!target.id) target.id = `${turn.id}:assistant:${eventStableKey(event)}`
  addTurnTimelineItem(turn, {
    type: 'assistant',
    id: target.id,
    seq: target.seq,
    message: target,
  })
  target.seq = event._seq ?? target.seq
  target.time = event.time || target.time
  target.phase = assistantMessagePhase(event.phase) || target.phase || ''
  target.streaming = Boolean(isDelta)
  target.text = isDelta ? appendStreamText(target.text, clean) : clean
  target.text = isDelta ? limitStreamMessage(target.text) : trimMessage(target.text)
}

function stopTurnAssistantStreams(turn, except = null) {
  for (const message of turn.assistantMessages || []) {
    if (message !== except) message.streaming = false
  }
}

function assistantMessagePhase(value) {
  return value === 'commentary' || value === 'final_answer' ? value : ''
}

function addProgressToTurn(turn, event) {
  const text = cleanDisplayMessage(event.text)
  if (!text || shouldHideProgressText(text)) return
  const kind = progressKind(event)
  const group = ensureWorkGroup(turn, kind, progressGroupTitle(kind, text), event)
  group.notes.push({ text, seq: event._seq ?? turn.lastSeq, time: event.time || new Date().toISOString() })
  group.running = !turn.completion && !turn.error
  group.status = group.running ? 'running' : 'completed'
  if (!group.running) group.completedAt = group.completedAt || event.time || new Date().toISOString()
}

function shouldHideProgressText(text) {
  return (
    /Custom tool call output is missing/i.test(text) ||
    /^Reading prompt from stdin\.{0,3}$/i.test(text) ||
    /^(Codex|Claude) JSON 실행을 시작했습니다\.?$/i.test(text) ||
    /^Codex App Server 실행을 시작했습니다\.?$/i.test(text) ||
    /^(Codex|Claude) 세션 [A-Za-z0-9_.:-]+ 초기화$/i.test(text) ||
    /^(Codex|Claude) 진행 중$/i.test(text) ||
    /^requesting(?: complete| 완료)?\.?$/i.test(text) ||
    /^Codex의 추가 입력 요청을 건너뛰었습니다\.?$/i.test(text)
  )
}

function progressKind(event) {
  const phase = String(event.phase || '').toLowerCase()
  const text = String(event.text || '').toLowerCase()
  if (/reason|thinking|analysis|plan/.test(phase) || /계획|검토|확인/.test(text)) return 'reasoning'
  if (/web|search|browser/.test(phase) || /검색|브라우저/.test(text)) return 'web'
  if (/stderr|error/.test(phase)) return 'log'
  return 'progress'
}

function progressGroupTitle(kind, text) {
  if (kind === 'reasoning') return '코드 확인'
  if (kind === 'web') return '웹 확인'
  if (kind === 'log') return '실행 로그'
  return summarize(text, 44) || '작업 준비'
}

function addToolToTurn(turn, event) {
  const command = cleanDisplayMessage(event.command || event.text || event.title || 'tool')
  const kind = toolKind(event, command)
  const existing = event.toolUseId ? findTurnCommand(turn, event.toolUseId) : null
  if (existing) {
    const previous = cleanDisplayMessage(existing.command)
    const incomingHasDetail = command && !/^(tool|bash|shell|command)$/i.test(command)
    if (incomingHasDetail || !previous) existing.command = command
    existing.title = event.title || existing.title || workGroupTitle(kind)
    if (event.text && event.text !== event.command && event.text !== '{}') {
      existing.out = uniqueAdjacent([...(existing.out || []), ...splitOutputLines(event.text)]).slice(-300)
    }
    existing.status = event.status || existing.status || 'running'
    existing.running = existing.status !== 'done' && existing.status !== 'error'
    existing.seq = event._seq ?? existing.seq
    existing.time = event.time || existing.time
    return
  }
  const group = ensureWorkGroup(turn, kind, workGroupTitle(kind), event)
  group.commands.push({
    id: event.toolUseId || `cmd-${group.commands.length}`,
    command,
    title: event.title || workGroupTitle(kind),
    out: event.text && event.text !== event.command ? splitOutputLines(event.text) : [],
    exit: null,
    status: event.status || 'running',
    running: event.status !== 'done' && event.status !== 'error',
    seq: event._seq ?? turn.lastSeq,
    time: event.time || new Date().toISOString(),
  })
  group.running = true
  group.status = 'running'
  group.completedAt = null
}

function addToolResultToTurn(turn, event) {
  const command = findTurnCommand(turn, event.toolUseId)
  const lines = splitOutputLines(event.text)
  if (command) {
    command.out = uniqueAdjacent([...(command.out || []), ...lines]).slice(-300)
    command.exit = Number.isInteger(event.exitCode) ? event.exitCode : event.status === 'error' ? 1 : 0
    command.status = event.status || (command.exit ? 'error' : 'done')
    command.running = false
  } else if (lines.length) {
    const group = ensureWorkGroup(turn, 'command', '명령 실행', event)
    group.commands.push({
      id: event.toolUseId || `cmd-${group.commands.length}`,
      command: 'tool result',
      title: 'tool result',
      out: lines,
      exit: event.status === 'error' ? 1 : 0,
      status: event.status || 'done',
      running: false,
      seq: event._seq ?? turn.lastSeq,
      time: event.time || new Date().toISOString(),
    })
  }

  for (const group of turn.workGroups) {
    if (!group.commands.length) continue
    group.running = group.commands.some((item) => item.running)
    group.status = group.running
      ? 'running'
      : group.commands.some((item) => Number(item.exit) > 0) ? 'failed' : 'completed'
    if (!group.running) group.completedAt = group.completedAt || event.time || new Date().toISOString()
  }
}

function addCommandOutputToTurn(turn, event) {
  const command = findRunningTurnCommand(turn)
  const lines = splitOutputLines(event.data ?? event.text)
  if (!command || !lines.length) return false
  command.out = uniqueAdjacent([...(command.out || []), ...lines]).slice(-300)
  command.seq = event._seq ?? command.seq
  command.time = event.time || command.time
  return true
}

function findRunningTurnCommand(turn) {
  for (let groupIndex = turn.workGroups.length - 1; groupIndex >= 0; groupIndex -= 1) {
    const group = turn.workGroups[groupIndex]
    for (let commandIndex = group.commands.length - 1; commandIndex >= 0; commandIndex -= 1) {
      const command = group.commands[commandIndex]
      if (command.running) return command
    }
  }
  return null
}

function isCommandOutputProgress(event) {
  return /stdout|stderr|output/i.test(String(event.phase || event.kind || event.type || ''))
}

function addFileChangeToTurn(turn, event) {
  const files = Array.isArray(event.files) ? event.files : Array.isArray(event.items) ? event.items : []
  let added = false
  for (const file of files) {
    if (!file?.path) continue
    turn.changes.items.push({
      op: file.op || 'modified',
      path: file.path,
      add: Number(file.add || file.additions || 0),
      del: Number(file.del || file.deletions || 0),
    })
    added = true
  }
  if (added) addChangesTimelineItem(turn, event)
}

function ensureWorkGroup(turn, kind, title, event) {
  const normalizedKind = kind === 'command_execution' ? 'command' : kind
  const last = turn.workGroups[turn.workGroups.length - 1]
  if (last && canReuseWorkGroup(last, normalizedKind)) {
    last.title = last.title || title
    last.lastSeq = event._seq ?? turn.lastSeq
    return last
  }

  if (last) {
    last.running = false
    last.status = last.commands.some((command) => Number(command.exit) > 0) ? 'failed' : 'completed'
    last.completedAt = last.completedAt || event.time || new Date().toISOString()
  }
  const group = {
    id: `${turn.id}:work:${eventStableKey(event)}`,
    kind: normalizedKind,
    title,
    notes: [],
    commands: [],
    running: true,
    status: 'running',
    startedAt: event.time || new Date().toISOString(),
    completedAt: null,
    seq: event._seq ?? turn.lastSeq,
    lastSeq: event._seq ?? turn.lastSeq,
  }
  turn.workGroups.push(group)
  addTurnTimelineItem(turn, {
    type: 'work',
    id: group.id,
    seq: group.seq,
    group,
  })
  return group
}

function addChangesTimelineItem(turn, event) {
  if (!turn.changes.id) turn.changes.id = `${turn.id}:changes:${eventStableKey(event)}`
  addTurnTimelineItem(turn, {
    type: 'changes',
    id: turn.changes.id,
    seq: event._seq ?? turn.lastSeq,
  })
}

function addTurnTimelineItem(turn, item) {
  if (!item?.id) return
  if (!Array.isArray(turn.timeline)) turn.timeline = []
  const existing = turn.timeline.find((entry) => entry.id === item.id)
  if (existing) {
    Object.assign(existing, item)
    return
  }
  turn.timeline.push(item)
}

function canReuseWorkGroup(group, kind) {
  if (kind === 'command') return false
  if (kind === 'web') return group.kind === 'web'
  if (kind === 'reasoning') return group.kind === 'reasoning' && !group.commands.length
  return group.kind === kind && !group.commands.length
}

function eventStableKey(event = {}) {
  const specific = firstNonEmpty(
    event.toolUseId,
    event.messageId,
    event.callId,
    event.id,
    event.command,
    event.title,
    event.phase,
    event.kind,
    event.type
  )
  return sanitizeStableKey(`${event.time || 'event'}:${event.type || 'event'}:${specific || ''}`)
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const clean = cleanDisplayMessage(value)
    if (clean) return clean
  }
  return ''
}

function sanitizeStableKey(value) {
  return String(value || 'event')
    .replace(/[^a-z0-9_.:-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160) || 'event'
}

function toolKind(event, command) {
  const raw = `${event.kind || ''} ${event.title || ''} ${event.command || ''} ${command || ''}`.toLowerCase()
  if (/web|search|browser|open|fetch/.test(raw)) return 'web'
  if (/image|screenshot|view_image|vision/.test(raw)) return 'image'
  if (/file|edit|patch|apply_patch|write/.test(raw)) return 'file'
  return 'command'
}

function workGroupTitle(kind) {
  if (kind === 'web') return '웹 확인'
  if (kind === 'reasoning') return '코드 확인'
  if (kind === 'image') return '이미지 확인'
  if (kind === 'file') return '파일 작업'
  return '명령 실행'
}

function findTurnCommand(turn, toolUseId) {
  for (let groupIndex = turn.workGroups.length - 1; groupIndex >= 0; groupIndex -= 1) {
    const group = turn.workGroups[groupIndex]
    for (let commandIndex = group.commands.length - 1; commandIndex >= 0; commandIndex -= 1) {
      const command = group.commands[commandIndex]
      if (!toolUseId || command.id === toolUseId) return command
    }
  }
  return null
}

function closeAllWorkGroups(turn) {
  const completedAt = turn.completion?.time || new Date().toISOString()
  for (const group of turn.workGroups) {
    group.running = false
    group.status = group.commands.some((command) => Number(command.exit) > 0) ? 'failed' : 'completed'
    group.completedAt = group.completedAt || completedAt
  }
  for (const group of turn.workGroups) {
    for (const command of group.commands) command.running = false
  }
}

function completionFromEvent(turn, event) {
  const code = Number.isInteger(event.code) ? event.code : null
  const durationMs = Number(event.durationMs ?? event.duration_ms)
  return {
    ok: event.type === 'turn_completed' ? event.status !== 'error' : code === null || code === 0,
    code,
    text: cleanDisplayMessage(event.text),
    time: event.time || new Date().toISOString(),
    durationMs: Number.isFinite(durationMs) && durationMs > 0 ? durationMs : elapsedBetween(turn.time, event.time),
  }
}

function elapsedBetween(startValue, endValue) {
  const start = new Date(startValue).valueOf()
  const end = new Date(endValue).valueOf()
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start : 0
}

function applyEventToMessages(event, options = {}) {
  const shouldRender = options.render !== false
  if (event.type === 'input' && event.text) {
    appendUserMessage(event.text, { time: event.time, attachments: event.attachments, render: shouldRender })
    return
  }
  if (event.type === 'input' && Array.isArray(event.attachments) && event.attachments.length) {
    appendUserMessage('첨부 파일을 확인해줘.', { time: event.time, attachments: event.attachments, render: shouldRender })
    return
  }
  if (event.type === 'assistant_delta') {
    appendAssistantDelta(event.text, event, { render: shouldRender })
    return
  }
  if (event.type === 'assistant_message') {
    appendAssistantMessage(event.text, event, { render: shouldRender })
    return
  }
  if (event.type === 'progress') {
    appendProgressMessage(event.text, event, { render: shouldRender })
    return
  }
  if (event.type === 'tool') {
    appendToolMessage(event, { render: shouldRender })
    return
  }
  if (event.type === 'tool_result') {
    appendToolResult(event, { render: shouldRender })
    return
  }
  if (event.type === 'diff') {
    appendDiffMessage(event, { render: shouldRender })
    return
  }
  if (event.type === 'files') {
    appendFilesMessage(event, { render: shouldRender })
    return
  }
  if (event.type === 'usage') {
    appendUsageMessage(event, { render: shouldRender })
    return
  }
  if (event.type === 'output' && event.data) {
    appendAssistantOutput(event.data, { render: shouldRender })
    return
  }
  if (event.type === 'exit') {
    finishRunningMessages(event)
    clearPendingRunStart(state.activeRoomId)
    if (state.activeRoom) {
      state.activeRoom.alive = false
      state.activeRoom.status = event.code && event.code !== 0 ? 'error' : 'exited'
      upsertRoom(state.activeRoom)
      renderRoomHeader(state.activeRoom)
      renderRooms()
    }
    terminalSummary.textContent = `exit ${event.code ?? 'null'}`
    setInputsEnabled(canUseActiveRoomComposer())
    flushPromptQueueSoon(state.activeRoomId)
    if (event.code && event.code !== 0) appendSystemMessage(event.text || `프로세스가 종료되었습니다. code=${event.code}`, { render: shouldRender })
    else if (shouldRender) renderMessages()
    return
  }
  if (event.type === 'error') {
    appendErrorMessage(event.text || event.error || '오류가 발생했습니다.', event, { render: shouldRender })
  }
}

function appendUserMessage(text, options = {}) {
  finishAssistantMessage()
  const attachments = normalizeMessageAttachments(options.attachments)
  const clean = cleanDisplayMessage(text) || (attachments.length ? '첨부 파일을 확인해줘.' : '')
  if (!clean && !attachments.length) return
  const last = state.messages[state.messages.length - 1]
  if (last?.role === 'user' && last.text === clean && sameAttachmentIds(last.attachments, attachments)) return
  state.messages.push({ role: 'user', text: clean, attachments, time: options.time || new Date().toISOString() })
  if (options.render !== false) renderMessages()
}

function appendAssistantOutput(raw, options = {}) {
  const text = cleanTerminalMessage(raw)
  if (!text) return
  appendAssistantDelta(text, {}, options)
}

function appendAssistantDelta(text, event = {}, options = {}) {
  const clean = cleanDisplayMessage(text)
  if (!clean) return
  closeProgressMessage()
  const agent = agentForMessageEvent(event)
  let last = state.messages[state.messages.length - 1]
  if (!last || last.role !== 'assistant' || (event.messageId && last.messageId && last.messageId !== event.messageId)) {
    last = { role: 'assistant', agent, text: '', time: event.time || new Date().toISOString(), streaming: true, messageId: event.messageId || '' }
    state.messages.push(last)
  }
  if (event.messageId) last.messageId = event.messageId
  if (!last.agent) last.agent = agent
  last.streaming = true
  last.text = event.type === 'assistant_delta' ? appendStreamText(last.text, clean) : appendText(last.text, clean)
  last.text = trimMessage(last.text)
  if (options.render !== false) renderMessages()
}

function appendAssistantMessage(text, event = {}, options = {}) {
  const clean = cleanDisplayMessage(text)
  if (!clean) return
  closeProgressMessage()
  const agent = agentForMessageEvent(event)
  let last = state.messages[state.messages.length - 1]
  if (event.messageId && last?.role === 'assistant' && last.messageId === event.messageId) {
    last.text = clean
    if (!last.agent) last.agent = agent
  } else if (last?.role === 'assistant' && last.streaming && !event.messageId) {
    last.text = clean || last.text
    if (!last.agent) last.agent = agent
  } else {
    last = { role: 'assistant', agent, text: clean, time: event.time || new Date().toISOString(), streaming: false, messageId: event.messageId || '' }
    state.messages.push(last)
  }
  last.streaming = false
  last.text = trimMessage(last.text)
  if (options.render !== false) renderMessages()
}

function appendProgressMessage(text, event = {}, options = {}) {
  const clean = cleanDisplayMessage(text)
  if (!clean) return
  if (isCompletionProgress(event)) {
    closeProgressMessage()
    terminalSummary.textContent = clean
    if (options.render !== false) renderMessages()
    return
  }
  let last = state.messages[state.messages.length - 1]
  if (!last || last.role !== 'progress' || last.done) {
    last = { role: 'progress', steps: [], time: event.time || new Date().toISOString(), running: true, done: false, phase: event.phase || 'progress' }
    state.messages.push(last)
  }
  if (!last.steps.includes(clean)) last.steps.push(clean)
  last.phase = event.phase || last.phase || 'progress'
  last.running = true
  terminalSummary.textContent = clean
  if (options.render !== false) renderMessages()
}

function appendToolMessage(event, options = {}) {
  closeProgressMessage()
  state.messages.push({
    role: 'shell',
    toolUseId: event.toolUseId || '',
    title: event.title || 'tool',
    cmd: event.command || event.text || event.title || 'tool',
    out: event.text && event.text !== event.command ? splitOutputLines(event.text) : [],
    running: event.status !== 'done' && event.status !== 'error',
    exit: null,
    collapsed: false,
    time: event.time || new Date().toISOString(),
  })
  terminalSummary.textContent = event.command || event.title || '도구 실행 중'
  if (options.render !== false) renderMessages()
}

function appendToolResult(event, options = {}) {
  const target = findLastToolMessage(event.toolUseId)
  const lines = splitOutputLines(event.text)
  if (target) {
    target.out = uniqueAdjacent([...(target.out || []), ...lines]).slice(-300)
    target.running = false
    target.exit = Number.isInteger(event.exitCode) ? event.exitCode : event.status === 'error' ? 1 : 0
    target.collapsed = target.exit === 0
  } else if (lines.length) {
    state.messages.push({
      role: 'shell',
      toolUseId: event.toolUseId || '',
      title: 'tool result',
      cmd: 'tool result',
      out: lines,
      running: false,
      exit: event.status === 'error' ? 1 : 0,
      collapsed: false,
      time: event.time || new Date().toISOString(),
    })
  }
  if (options.render !== false) renderMessages()
}

function appendDiffMessage(event, options = {}) {
  closeProgressMessage()
  const files = Array.isArray(event.files) ? event.files : []
  if (!files.length) return
  state.messages.push({
    role: 'diff',
    title: event.title || `${files.length}개 파일 변경`,
    files,
    collapsed: files.length > 2,
    time: event.time || new Date().toISOString(),
  })
  if (options.render !== false) renderMessages()
}

function appendFilesMessage(event, options = {}) {
  const items = Array.isArray(event.items) ? event.items : []
  if (!items.length) return
  state.messages.push({
    role: 'files',
    title: event.title || '변경된 파일',
    items,
    time: event.time || new Date().toISOString(),
  })
  if (options.render !== false) renderMessages()
}

function appendUsageMessage(event, options = {}) {
  const clean = cleanDisplayMessage(event.text)
  if (!clean) return
  state.messages.push({ role: 'usage', text: clean, time: event.time || new Date().toISOString() })
  if (options.render !== false) renderMessages()
}

function appendErrorMessage(text, event = {}, options = {}) {
  finishRunningMessages(event)
  const clean = cleanDisplayMessage(text)
  if (!clean) return
  state.messages.push({ role: 'error', title: '오류', text: clean, time: event.time || new Date().toISOString() })
  terminalSummary.textContent = '오류'
  if (options.render !== false) renderMessages()
}

function appendSystemMessage(text, options = {}) {
  const clean = cleanDisplayMessage(text)
  if (!clean) return
  state.messages.push({ role: 'system', text: clean, time: new Date().toISOString() })
  if (options.render !== false) renderMessages()
}

function finishAssistantMessage() {
  const last = state.messages[state.messages.length - 1]
  if (last?.role === 'assistant') last.streaming = false
}

function finishRunningMessages(event = {}) {
  finishAssistantMessage()
  closeProgressMessage()
  for (const message of state.messages) {
    if (message.role === 'shell' && message.running) {
      message.running = false
      message.exit = event.code ?? message.exit ?? null
      message.collapsed = message.exit === 0
    }
  }
}

function closeProgressMessage() {
  const last = state.messages[state.messages.length - 1]
  if (last?.role === 'progress') {
    last.running = false
    last.done = true
  }
}

function compactMessages(messages) {
  return messages
    .map((message) => ({ ...message, text: message.text ? trimMessage(message.text) : message.text }))
    .filter((message) => !(message.role === 'progress' && message.done))
    .filter((message) => message.text || message.steps?.length || message.files?.length || message.items?.length || message.out?.length)
}

function assistantBrandFor(message = {}) {
  return AGENT_BRANDS[agentForMessageEvent(message)] || AGENT_BRANDS.codex
}

function agentForMessageEvent(event = {}) {
  return normalizeAgentBrand(event.agent || event.agentId || state.activeRoom?.agent || agentInput.value || 'codex')
}

function normalizeAgentBrand(value) {
  return String(value || '').toLowerCase().includes('claude') ? 'claude' : 'codex'
}

function isCompletionProgress(event = {}) {
  return /(completed|done|finished|exit)/i.test(String(event.phase || event.type || ''))
}

function cleanDisplayMessage(value) {
  return String(value ?? '').replace(/\r/g, '').trim()
}

function cleanStreamMessage(value) {
  return String(value ?? '').replace(/\r/g, '')
}

function limitStreamMessage(value) {
  const text = String(value || '')
  return text.length > 18000 ? text.slice(-18000) : text
}

function appendText(base, next) {
  const left = String(base || '').trimEnd()
  const right = String(next || '').trim()
  if (!right) return left
  if (!left) return right
  if (left.endsWith(right)) return left
  if (right.length < 80 && left.slice(-240).includes(right)) return left
  return `${left}\n${right}`
}

function appendStreamText(base, next) {
  const left = String(base || '')
  const right = String(next || '')
  if (!right) return left
  if (!left) return right
  if (right.startsWith(left)) return right
  return `${left}${right}`
}

function displayStreamingText(key, fullText, active) {
  const target = String(fullText ?? '')
  state.textStreamTargets[key] = target
  if (!active) {
    const current = state.textStreams[key]
    if (current !== undefined && target.startsWith(current) && current.length < target.length) {
      scheduleTextStream(key)
      return current
    }
    clearTextStreamTimer(key)
    state.textStreams[key] = target
    return target
  }

  const current = state.textStreams[key]
  if (current === undefined || !target.startsWith(current)) {
    state.textStreams[key] = target.slice(0, Math.min(TEXT_STREAM_CHUNK, target.length))
  }
  if (state.textStreams[key].length < target.length) scheduleTextStream(key)
  return state.textStreams[key]
}

function scheduleTextStream(key) {
  if (state.textStreamTimers[key]) return
  state.textStreamTimers[key] = window.setTimeout(() => {
    delete state.textStreamTimers[key]
    const stickToBottom = !state.streamFollowPaused && isStreamNearBottom()
    const target = String(state.textStreamTargets[key] ?? '')
    const current = String(state.textStreams[key] ?? '')
    if (!target.startsWith(current)) {
      state.textStreams[key] = target.slice(0, Math.min(TEXT_STREAM_CHUNK, target.length))
    } else {
      const remaining = target.length - current.length
      const chunk = Math.max(TEXT_STREAM_CHUNK, Math.ceil(remaining / TEXT_STREAM_CATCHUP_FRAMES))
      state.textStreams[key] = target.slice(0, Math.min(target.length, current.length + chunk))
    }
    updateStreamingTextElements(key)
    if (stickToBottom) pinStreamToBottom()
    if (state.textStreams[key].length < target.length) scheduleTextStream(key)
  }, TEXT_STREAM_INTERVAL_MS)
}

function hasPendingTextStream() {
  return Object.keys(state.textStreamTargets).some((key) => {
    return String(state.textStreams[key] ?? '').length < String(state.textStreamTargets[key] ?? '').length
  })
}

function requestSmoothStreamBottom() {
  if (state.streamFollowPaused || state.streamFollowFrame) return
  const step = () => {
    state.streamFollowFrame = null
    if (state.streamFollowPaused) return
    const target = Math.max(0, stream.scrollHeight - stream.clientHeight)
    if (target > stream.scrollTop) stream.scrollTop = target
    state.lastStreamScrollTop = stream.scrollTop
  }
  state.streamFollowFrame = requestAnimationFrame(step)
}

function pinStreamToBottom() {
  if (state.streamFollowPaused) return
  cancelSmoothStreamBottom()
  stream.scrollTop = stream.scrollHeight
  state.lastStreamScrollTop = stream.scrollTop
  requestAnimationFrame(() => {
    if (state.streamFollowPaused) return
    stream.scrollTop = stream.scrollHeight
    state.lastStreamScrollTop = stream.scrollTop
  })
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

function messageMotionKey(message, index) {
  const identity = message?.messageId || message?.id || message?.time || index
  return `message:${message?.role || 'unknown'}:${identity}`
}

function motionAttributes(key, kind = 'item', signature = '') {
  return `data-motion-key="${escapeHtml(key)}" data-motion-kind="${escapeHtml(kind)}" data-motion-signature="${escapeHtml(signature)}"`
}

function captureMotionLayout(root) {
  const layout = new Map()
  if (!root || !root.isConnected) return layout
  const rootRect = root.getBoundingClientRect()
  for (const node of root.querySelectorAll('[data-motion-key]')) {
    const key = node.dataset.motionKey
    if (!key || layout.has(key)) continue
    const rect = node.getBoundingClientRect()
    layout.set(key, {
      top: rect.top - rootRect.top,
      left: rect.left - rootRect.left,
      width: rect.width,
      height: rect.height,
      signature: node.dataset.motionSignature || '',
    })
  }
  return layout
}

function animateMotionLayout(root, previous, readyStateKey) {
  const wasReady = Boolean(state[readyStateKey])
  state[readyStateKey] = true
  if (!wasReady || prefersReducedMotion() || typeof Element.prototype.animate !== 'function') return

  const rootRect = root.getBoundingClientRect()
  const nodes = [...root.querySelectorAll('[data-motion-key]')]
  const current = new Map()
  for (const node of nodes) {
    const rect = node.getBoundingClientRect()
    current.set(node.dataset.motionKey, {
      top: rect.top - rootRect.top,
      left: rect.left - rootRect.left,
      width: rect.width,
      height: rect.height,
    })
  }

  for (const node of nodes) {
    const key = node.dataset.motionKey
    const before = previous.get(key)
    const after = current.get(key)
    const parent = node.parentElement?.closest?.('[data-motion-key]')
    const parentKey = parent?.dataset.motionKey || ''
    const parentBefore = parentKey ? previous.get(parentKey) : null
    const parentAfter = parentKey ? current.get(parentKey) : null

    if (!before) {
      if (parentKey && !parentBefore) continue
      const distance = node.dataset.motionKind === 'row' ? 12 : node.dataset.motionKind === 'line' ? 4 : 7
      node.animate([
        { opacity: 0, transform: `translateY(${distance}px) scale(0.992)` },
        { opacity: 1, transform: 'none' },
      ], {
        duration: node.dataset.motionKind === 'line' ? 180 : MOTION_ENTER_MS,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      })
      continue
    }

    let deltaX = before.left - after.left
    let deltaY = before.top - after.top
    if (parentBefore && parentAfter) {
      deltaX -= parentBefore.left - parentAfter.left
      deltaY -= parentBefore.top - parentAfter.top
    }
    if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
      node.animate([
        { transform: `translate(${deltaX}px, ${deltaY}px)` },
        { transform: 'none' },
      ], {
        duration: MOTION_MOVE_MS,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      })
    }

    const signature = node.dataset.motionSignature || ''
    if (signature && before.signature && signature !== before.signature) {
      const now = performance.now()
      const lastUpdate = Number(state.motionUpdateTimes[key] || 0)
      if (now - lastUpdate >= MOTION_UPDATE_MS) {
        state.motionUpdateTimes[key] = now
        node.animate([
          { opacity: 0.78, filter: 'brightness(1.08)' },
          { opacity: 1, filter: 'none' },
        ], {
          duration: MOTION_UPDATE_MS,
          easing: 'ease-out',
        })
      }
    }
  }
}

function handleStreamWheel(event) {
  if (event.deltaY < 0) {
    pauseStreamAutoFollow()
    return
  }
  if (event.deltaY > 0 && state.streamFollowPaused) {
    requestAnimationFrame(() => {
      if (isStreamNearBottom(8)) state.streamFollowPaused = false
    })
  }
}

function pauseStreamAutoFollow() {
  state.streamFollowPaused = true
  if (state.pendingRenderOptions) state.pendingRenderOptions.stickToBottom = false
  cancelSmoothStreamBottom()
}

function cancelSmoothStreamBottom() {
  if (!state.streamFollowFrame) return
  cancelAnimationFrame(state.streamFollowFrame)
  state.streamFollowFrame = null
}

function updateStreamingTextElements(key) {
  const text = String(state.textStreams[key] ?? '')
  for (const node of messageList.querySelectorAll('[data-stream-text-key]')) {
    if (node.dataset.streamTextKey !== key) continue
    const renderer = node.dataset.streamRenderer || 'assistant'
    const html = renderer === 'inline' ? formatMessageText(text) : formatAssistantText(text)
    node.innerHTML = `${html}${node.dataset.streamCaret === 'true' ? '<span class="typing-caret"></span>' : ''}`
    animateStreamingTextNode(node, key)
  }
}

function animateStreamingTextNode(node, key) {
  state.streamMotionTimes[key] = performance.now()
}

function clearTextStreamTimer(key) {
  if (!state.textStreamTimers[key]) return
  clearTimeout(state.textStreamTimers[key])
  delete state.textStreamTimers[key]
}

function clearTextStreams() {
  for (const key of Object.keys(state.textStreamTimers)) clearTextStreamTimer(key)
  cancelSmoothStreamBottom()
  state.streamFollowPaused = false
  state.lastStreamScrollTop = stream.scrollTop
  state.textStreams = {}
  state.textStreamTargets = {}
}

function clearRenderTimers() {
  if (state.messageRenderTimer) {
    clearTimeout(state.messageRenderTimer)
    state.messageRenderTimer = null
  }
  if (state.activityRenderTimer) {
    clearTimeout(state.activityRenderTimer)
    state.activityRenderTimer = null
  }
  clearPanelEffectTimers()
  state.pendingRenderOptions = null
  state.activeTurnId = null
  state.activeGroupId = null
  state.previousCompletedGroupId = null
  state.messageMotionReady = false
  state.activityMotionReady = false
  state.motionUpdateTimes = {}
  state.streamMotionTimes = {}
  for (const [panelId, panel] of Object.entries(state.panelUiState)) {
    if (panel?.openedBy !== 'user') delete state.panelUiState[panelId]
  }
}

function trimMessage(value) {
  const text = String(value || '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text.length > 18000 ? `${text.slice(-18000).trimStart()}` : text
}

function cleanTerminalMessage(raw) {
  const stripped = stripAnsi(raw)
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  const lines = stripped
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, '').trim())
    .map(removeTerminalFrameChars)
    .map((line) => line.trim())
    .filter(isUsefulTerminalLine)
  return uniqueAdjacent(lines).join('\n').trim()
}

function stripAnsi(value) {
  return String(value ?? '')
    .replace(/\x1B\][^\x07]*(?:\x07|\x1B\\)/g, '')
    .replace(/\x1B[PX^_].*?\x1B\\/g, '')
    .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/\x1B[()][A-Za-z0-9]/g, '')
    .replace(/\x1B[@-Z\\-_]/g, '')
}

function removeTerminalFrameChars(value) {
  return value
    .replace(/[╭╮╰╯│─┌┐└┘├┤┬┴┼]/g, ' ')
    .replace(/^[›>_•◦*]+\s*/, '')
    .replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, '')
}

function isUsefulTerminalLine(line) {
  if (!line) return false
  if (line.length < 2) return false
  if (/^[()/.·,\-:;0-9\s]+$/.test(line)) return false
  if (/^(OpenAI Codex|Claude Code|model:|directory:|Tip:|gpt-[\w.-]+|loading)$/i.test(line)) return false
  if (/(esc to interrupt|Starting MCP servers|Booting MCP server|MCP server|to change|Improve documentation in @filename)/i.test(line)) return false
  if (/^(작업 디렉터리|새 채팅|devi|devai|codex|claude)$/i.test(line)) return false
  return true
}

function uniqueAdjacent(lines) {
  const out = []
  for (const line of lines) {
    if (out[out.length - 1] !== line) out.push(line)
  }
  return out
}

function formatMessageText(value) {
  const tokens = []
  const token = (html) => {
    const index = tokens.push(html) - 1
    return `\u0000${index}\u0000`
  }
  let text = String(value ?? '')
    .replace(/`([^`\n]+)`/g, (_match, code) => token(`<code>${escapeHtml(code)}</code>`))
    .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
      if (!/^(?:https?:\/\/|\/)/i.test(href)) return match
      return token(`<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`)
    })

  text = escapeHtml(text)
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
    .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?:;])/g, '$1<em>$2</em>')

  return text.replace(/\u0000(\d+)\u0000/g, (_match, index) => tokens[Number(index)] || '')
}

function renderCodexTurnMessage(turn) {
  const brand = assistantBrandFor(turn)
  const activity = buildAgentActivity(turn)
  const done = activity.status === 'completed' || activity.status === 'failed'
  const response = activity.question || activity.final
  return `
    <article class="message-row codex-turn ${escapeHtml(activity.status)}" data-turn-id="${escapeHtml(turn.id)}" ${motionAttributes(`turn:${turn.id}`, 'row', activity.status)}>
      <div class="turn-bubble">
        <div class="assistant-name ${brand.id} ${done ? '' : 'streaming'}">
          ${brand.icon}
          <span>${escapeHtml(brand.label)}</span>
        </div>
        ${renderAgentActivity(turn, activity)}
        ${renderTurnAttachments(turn.attachments)}
        ${response ? `<div class="turn-response">${renderTurnTimelineAssistant(turn, response, 'response')}</div>` : ''}
      </div>
    </article>
  `
}

function buildAgentActivity(turn) {
  const messages = (turn.assistantMessages || []).filter((item) => cleanDisplayMessage(item.text))
  const explicitFinal = [...messages].reverse().find((item) => item.phase === 'final_answer') || null
  const latestMessage = messages[messages.length - 1] || null
  const waiting = !turn.completion && !turn.error && isUserQuestion(latestMessage, turn)
  const inferredFinal = !waiting && isLikelyFinalAssistant(latestMessage, turn) ? latestMessage : null
  const final = turn.completion ? (explicitFinal || latestMessage) : (explicitFinal || inferredFinal)
  const question = waiting ? latestMessage : null
  const excluded = new Set([final, question].filter(Boolean))
  const checkpoints = messages
    .filter((message) => !excluded.has(message) && isMeaningfulCheckpoint(message.text))
    .slice(-2)
  const status = turn.error || turn.completion?.ok === false
    ? 'failed'
    : waiting
      ? 'waiting_user'
      : turn.completion || (!state.activeRoom?.alive && !turn.pending)
        ? 'completed'
        : 'running'
  const groups = Array.isArray(turn.workGroups) ? turn.workGroups : []
  const currentGroup = [...groups].reverse().find((group) => group.running) || groups[groups.length - 1] || null
  const currentCommand = currentGroup ? [...(currentGroup.commands || [])].reverse().find((command) => command.running) || currentGroup.commands?.[currentGroup.commands.length - 1] : null
  const operations = groups.reduce((sum, group) => sum + (group.commands?.length || 0), 0)
  return {
    status,
    final,
    question,
    checkpoints,
    operations,
    tools: activityToolLabels(groups),
    steps: buildActivitySteps(turn, groups),
    currentActivity: semanticCurrentActivity(currentGroup, currentCommand, status),
    metadata: activityCommandMetadata(currentGroup, currentCommand),
    durationMs: turn.completion?.durationMs || elapsedBetween(turn.time, new Date().toISOString()),
  }
}

function renderAgentActivity(turn, activity) {
  const collapsed = activity.status === 'completed'
  const statusIcon = activity.status === 'running' ? '●' : activity.status === 'waiting_user' ? '◷' : activity.status === 'failed' ? '!' : '✓'
  const statusLabel = activity.status === 'running'
    ? '작업 중'
    : activity.status === 'waiting_user'
      ? '사용자 응답 대기'
      : activity.status === 'failed'
        ? '오류'
        : '완료'
  const duration = formatDurationMs(activity.durationMs)
  const operationLabel = `${activity.operations} operation${activity.operations === 1 ? '' : 's'}`
  const elapsedAttrs = activity.status === 'running'
    ? `data-activity-elapsed data-started-at="${escapeHtml(turn.time)}"`
    : ''

  if (collapsed) {
    return `
      <section class="agent-activity collapsed" aria-label="Agent Activity">
        <div class="agent-activity-summary">
          <span class="agent-activity-status completed" aria-hidden="true">${statusIcon}</span>
          <strong>${statusLabel}</strong>
          ${duration ? `<span>· <span>${escapeHtml(duration)}</span></span>` : ''}
          <span>· ${escapeHtml(operationLabel)}</span>
          <button type="button" data-open-activity-log="${escapeHtml(turn.id)}">작업 과정 보기</button>
        </div>
      </section>
    `
  }

  return `
    <section class="agent-activity ${escapeHtml(activity.status)}" aria-label="Agent Activity" aria-live="polite">
      <div class="agent-activity-head">
        <span class="agent-activity-status ${escapeHtml(activity.status)}" aria-hidden="true">${statusIcon}</span>
        <strong>${statusLabel}</strong>
        <span>· <span ${elapsedAttrs}>${escapeHtml(duration || '1초')}</span></span>
      </div>
      <div class="agent-current-activity">
        <strong>${escapeHtml(activity.currentActivity)}</strong>
        ${activity.metadata ? `<span>${escapeHtml(activity.metadata)}</span>` : ''}
      </div>
      ${renderActivityCheckpoints(activity.checkpoints)}
      ${renderActivitySteps(activity.steps)}
      ${activity.status === 'failed' ? `<div class="agent-activity-error"><strong>오류</strong><span>${escapeHtml(turn.error || turn.completion?.text || '작업을 완료하지 못했습니다.')}</span></div>` : ''}
      <div class="agent-activity-foot">
        <span>${escapeHtml([...activity.tools, operationLabel].join(' · '))}</span>
        <button type="button" data-open-activity-log="${escapeHtml(turn.id)}">상세 로그</button>
      </div>
    </section>
  `
}

function renderActivityCheckpoints(checkpoints) {
  if (!checkpoints.length) return ''
  return `
    <div class="agent-checkpoints">
      ${checkpoints.map((message) => `
        <div class="agent-checkpoint">
          <span aria-hidden="true">✓</span>
          <div class="message-content">${formatAssistantText(cleanDisplayMessage(message.text))}</div>
        </div>
      `).join('')}
    </div>
  `
}

function renderActivitySteps(steps) {
  if (!steps.length) return ''
  return `
    <div class="agent-activity-steps">
      ${steps.map((step) => {
        const icon = step.status === 'running' ? '●' : step.status === 'failed' ? '!' : step.status === 'pending' ? '○' : '✓'
        return `<div class="agent-activity-step ${escapeHtml(step.status)}"><span aria-hidden="true">${icon}</span><span>${escapeHtml(step.label)}</span></div>`
      }).join('')}
    </div>
  `
}

function buildActivitySteps(turn, groups) {
  const steps = []
  for (const group of groups) {
    const semantic = semanticStepForGroup(group)
    const existing = steps.find((step) => step.key === semantic.key)
    const status = group.status === 'failed' ? 'failed' : group.running ? 'running' : 'completed'
    if (existing) {
      existing.status = status
      existing.label = semantic.label
      continue
    }
    steps.push({ ...semantic, status })
  }
  if (normalizedChangeFiles(turn).length) {
    const existing = steps.find((step) => step.key === 'file-change')
    if (existing) existing.status = turn.error ? 'failed' : 'completed'
    else steps.push({ key: 'file-change', label: '파일 변경 사항 반영', status: turn.error ? 'failed' : 'completed' })
  }
  if (!steps.length && !turn.completion && !turn.error) steps.push({ key: 'prepare', label: '작업 준비', status: 'running' })
  if (steps.length <= 5) return steps
  return [...steps.slice(0, 2), ...steps.slice(-3)]
}

function semanticStepForGroup(group) {
  const command = (group.commands || []).map((item) => item.command || item.title || '').join(' ').toLowerCase()
  if (/\b(rg|grep|find|fd)\b/.test(command)) return { key: 'search-code', label: '관련 코드 탐색' }
  if (/\b(ls|tree|pwd)\b/.test(command)) return { key: 'project', label: '프로젝트 구조 확인' }
  if (/\b(curl|wget)\b|https?:\/\//.test(command)) return { key: 'request', label: '서버 요청 검증' }
  if (/\b(npm|pnpm|yarn|node|pytest|vitest|jest|playwright)\b.*\b(test|check|build)\b|\b(test|check|build)\b/.test(command)) return { key: 'verify', label: '변경 사항 검증' }
  if (/\b(rm|unlink|delete)\b/.test(command)) return { key: 'delete', label: '파일 삭제' }
  if (/apply_patch|\b(write|edit)\b/.test(command) || group.kind === 'file') return { key: 'file-change', label: '파일 변경' }
  if (/\b(cat|sed|head|tail|less)\b/.test(command)) return { key: 'read-file', label: '관련 파일 확인' }
  if (group.kind === 'web') return { key: 'web', label: '웹 정보 확인' }
  if (group.kind === 'reasoning') return { key: 'reasoning', label: '접근 방법 검토' }
  if (group.kind === 'image') return { key: 'image', label: '이미지 확인' }
  return { key: 'command', label: '개발 환경 확인' }
}

function semanticCurrentActivity(group, command, status) {
  if (status === 'waiting_user') return '다음 작업을 위해 답변을 기다리고 있습니다'
  if (status === 'failed') return '작업 중 오류를 확인했습니다'
  if (!group) return status === 'completed' ? '작업을 마쳤습니다' : '요청을 분석하는 중'
  if (!group.running && status === 'running') return '실행 결과를 정리하는 중'
  const raw = String(command?.command || command?.title || '').toLowerCase()
  if (/\b(rg|grep|find|fd)\b/.test(raw)) return '관련 코드를 찾는 중'
  if (/\b(ls|tree|pwd)\b/.test(raw)) return '프로젝트 구조를 확인하는 중'
  if (/\b(curl|wget)\b|https?:\/\//.test(raw)) return '서버 응답을 검증하는 중'
  if (/\b(npm|pnpm|yarn|pytest|vitest|jest|playwright)\b.*\b(test|check|build)\b|\b(test|check|build)\b/.test(raw)) return '변경 사항을 검증하는 중'
  if (/\b(rm|unlink|delete)\b/.test(raw)) return '파일 삭제를 처리하는 중'
  if (/apply_patch|\b(write|edit)\b/.test(raw) || group.kind === 'file') return '파일 변경 사항을 반영하는 중'
  if (/\b(cat|sed|head|tail|less)\b/.test(raw)) return '관련 파일을 확인하는 중'
  if (group.kind === 'web') return '웹에서 관련 정보를 확인하는 중'
  if (group.kind === 'reasoning') return '다음 작업 방향을 검토하는 중'
  if (group.kind === 'image') return '이미지를 확인하는 중'
  return group.running ? '개발 환경에서 작업을 실행하는 중' : '실행 결과를 정리하는 중'
}

function activityCommandMetadata(group, command) {
  if (!command) return group?.kind === 'web' ? 'Web' : ''
  const raw = cleanDisplayMessage(command.command || command.title)
  const executable = raw.match(/(?:^|\s)(rg|grep|find|fd|ls|tree|pwd|curl|wget|sed|cat|head|tail|npm|pnpm|yarn|node|pytest|vitest|jest|playwright|apply_patch)\b/i)?.[1]
  const path = raw.match(/(?:^|\s)([^\s"']+[/.][^\s"']*\.[a-z0-9_-]{1,10})(?:\s|$)/i)?.[1]
  return [executable, path ? path.split('/').pop() : ''].filter(Boolean).join(' · ') || cleanDisplayMessage(command.title || workGroupTitle(group?.kind))
}

function activityToolLabels(groups) {
  const labels = []
  const add = (label) => {
    if (label && !labels.includes(label)) labels.push(label)
  }
  for (const group of groups) {
    const commandText = (group.commands || []).map((item) => `${item.title || ''} ${item.command || ''}`).join(' ')
    const shellTool = (group.commands || []).some((item) => /^(bash|shell|terminal|command)$/i.test(cleanDisplayMessage(item.title)))
    if (/\b(curl|wget)\b|https?:\/\//i.test(commandText)) add('HTTP')
    if (group.kind === 'web' && !shellTool) add('Web')
    else if (group.kind === 'file') add('File')
    else if (group.kind === 'image') add('Image')
    else if (group.commands?.length) add('Bash')
  }
  return labels
}

function isMeaningfulCheckpoint(text) {
  const clean = cleanDisplayMessage(text)
  if (!clean || shouldHideProgressText(clean)) return false
  if (/^(검색|확인|검토|실행|웹을 확인).*(중|하겠습니다|합니다)\.?$/i.test(clean) && clean.length < 80) return false
  return /찾았|발견|확인했|완료|변경|오류|문제|원인|결과|이제|다음|추가 검증|https?:\/\/|(?:^|\s)[\w./-]+\.[a-z0-9]{1,8}(?:\s|$)/i.test(clean)
}

function isUserQuestion(message, turn) {
  if (!message || message.streaming || message.phase === 'final_answer') return false
  const text = cleanDisplayMessage(message.text)
  if (!text || !/[?？]\s*$/.test(text)) return false
  return !(turn.workGroups || []).some((group) => group.running)
}

function isLikelyFinalAssistant(message, turn) {
  if (!message || message.phase === 'commentary') return false
  if (message.phase === 'final_answer') return true
  const groups = turn.workGroups || []
  if (groups.some((group) => group.running)) return false
  if (!groups.length) return true
  const lastWorkSeq = Math.max(-1, ...groups.map((group) => Number(group.lastSeq ?? group.seq ?? -1)))
  return Number(message.seq ?? -1) >= lastWorkSeq
}

function renderTurnThinking(turn) {
  if (!turn.pending || turn.completion || turn.error || hasVisibleTurnContent(turn)) return ''
  return `
    <div class="turn-thinking" aria-live="polite">
      <span class="thinking-dot" aria-hidden="true"></span>
      <span>생각 중</span>
      <span class="thinking-ellipsis" aria-hidden="true"><span></span><span></span><span></span></span>
    </div>
  `
}

function renderTurnTimeline(turn) {
  const items = normalizedTurnTimeline(turn)
  if (!items.length) return ''
  return `
    <div class="turn-timeline">
      ${items.map((item, index) => renderTurnTimelineItem(turn, item, index)).join('')}
    </div>
  `
}

function normalizedTurnTimeline(turn) {
  const timeline = Array.isArray(turn.timeline) ? turn.timeline : []
  const items = timeline.filter((item) => visibleTurnTimelineItem(turn, item))
  if (items.length) return compactTurnCommentary(turn, items)

  const split = splitTurnAssistantMessages(turn)
  const fallback = [
    ...split.commentary.map((message) => ({ type: 'assistant', id: message.id || `${turn.id}:legacy-commentary:${message.seq}`, message })),
    ...turn.workGroups.map((group) => ({ type: 'work', id: group.id, group })),
    turn.attachments.length ? { type: 'attachments', id: `${turn.id}:legacy-attachments`, attachments: turn.attachments } : null,
    normalizedChangeFiles(turn).length ? { type: 'changes', id: `${turn.id}:legacy-changes` } : null,
    split.final ? { type: 'assistant', id: split.final.id || `${turn.id}:legacy-final:${split.final.seq}`, message: split.final } : null,
    turn.error ? { type: 'error', id: `${turn.id}:legacy-error` } : null,
    turn.usage && !turn.completion ? { type: 'usage', id: `${turn.id}:legacy-usage` } : null,
    turn.completion ? { type: 'completion', id: `${turn.id}:legacy-completion` } : null,
  ].filter(Boolean)
  return compactTurnCommentary(turn, fallback)
}

function compactTurnCommentary(turn, items) {
  const assistantItems = items.filter((item) => item.type === 'assistant')
  if (assistantItems.length < 2) return items

  const explicitFinals = assistantItems.filter((item) => item.message?.phase === 'final_answer')
  const inferredFinal = !explicitFinals.length && turn.completion
    ? assistantItems[assistantItems.length - 1]
    : null
  const finalItems = new Set(inferredFinal ? [inferredFinal] : explicitFinals)
  const commentary = assistantItems.filter((item) => !finalItems.has(item))
  const latest = commentary[commentary.length - 1]
  const previous = latest?.message?.streaming ? commentary[commentary.length - 2] : null
  const visibleAssistants = new Set([...finalItems, latest, previous].filter(Boolean))

  return items.filter((item) => item.type !== 'assistant' || visibleAssistants.has(item))
}

function visibleTurnTimelineItem(turn, item) {
  if (item.type === 'assistant') return Boolean(cleanDisplayMessage(item.message?.text))
  if (item.type === 'work') return Boolean(item.group)
  if (item.type === 'attachments') return Boolean(normalizeMessageAttachments(item.attachments || turn.attachments).length)
  if (item.type === 'changes') return Boolean(normalizedChangeFiles(turn).length)
  if (item.type === 'usage') return Boolean(turn.usage)
  if (item.type === 'completion') return Boolean(turn.completion)
  if (item.type === 'error') return Boolean(turn.error)
  return false
}

function renderTurnTimelineItem(turn, item, index) {
  if (item.type === 'assistant') return renderTurnTimelineAssistant(turn, item.message, index)
  if (item.type === 'work') return renderWorkGroup(turn, item.group)
  if (item.type === 'attachments') return renderTurnAttachments(item.attachments || turn.attachments)
  if (item.type === 'changes') return renderChangesSection(turn)
  if (item.type === 'usage') return renderTurnUsage(turn)
  if (item.type === 'completion') return renderTurnCompletion(turn)
  if (item.type === 'error') return renderTurnError(turn)
  return ''
}

function renderTurnTimelineAssistant(turn, message, index) {
  const text = cleanDisplayMessage(message?.text)
  if (!text) return ''
  const latestStreaming = [...(turn.assistantMessages || [])].reverse().find((item) => item.streaming)
  const active = Boolean(
    state.activeRoom?.alive &&
    !turn.completion &&
    !turn.error &&
    message?.streaming &&
    message === latestStreaming
  )
  const streamKey = `${turn.id}:timeline:${message?.messageId || message?.seq || index}`
  const displayText = displayStreamingText(streamKey, text, active)
  return `
    <div class="turn-timeline-assistant message-content" ${motionAttributes(message?.id || streamKey, 'item')} data-stream-text-key="${escapeHtml(streamKey)}" data-stream-renderer="assistant" data-stream-caret="${active ? 'true' : 'false'}">
      ${formatAssistantText(displayText)}${active ? '<span class="typing-caret"></span>' : ''}
    </div>
  `
}

function renderTurnAttachments(attachments) {
  const content = renderMessageAttachments(attachments)
  return content ? `<div class="turn-attachments">${content}</div>` : ''
}

function splitTurnAssistantMessages(turn) {
  const messages = (turn.assistantMessages || []).filter((item) => cleanDisplayMessage(item.text))
  if (!messages.length) return { commentary: [], final: null }

  const lastWorkSeq = Math.max(
    -1,
    ...turn.workGroups.flatMap((group) => [
      Number(group.seq ?? -1),
      Number(group.lastSeq ?? -1),
      ...group.notes.map((note) => Number(note.seq ?? -1)),
      ...group.commands.map((command) => Number(command.seq ?? -1)),
    ]),
    ...turn.changes.files.map((file) => Number(file.seq ?? -1)),
    ...turn.changes.items.map((file) => Number(file.seq ?? -1))
  )
  const final = turn.completion
    ? messages[messages.length - 1]
    : [...messages].reverse().find((item) => Number(item.seq ?? 0) >= lastWorkSeq)
  const commentary = final ? messages.filter((item) => item !== final) : messages
  return { commentary, final }
}

function renderTurnCommentary(commentary, turn) {
  const active = Boolean(state.activeRoom?.alive && !turn.completion)
  const items = commentary
    .map((item, index) => {
      const key = `${turn.id}:commentary:${item.messageId || item.seq || index}`
      return {
        key,
        text: displayStreamingText(
          key,
          cleanDisplayMessage(item.text),
          active && Boolean(item.streaming)
        ),
      }
    })
    .filter((item) => item.text)
    .slice(-5)
  if (!items.length) return ''
  return `
    <div class="turn-commentary">
      ${items.map((item) => `<p data-stream-text-key="${escapeHtml(item.key)}" data-stream-renderer="inline">${formatMessageText(item.text)}</p>`).join('')}
    </div>
  `
}

function renderWorkProcess(turn) {
  const groups = Array.isArray(turn.workGroups) ? turn.workGroups : []
  if (!groups.length) return ''
  return `
    <section class="turn-section work-process">
      <div class="turn-section-title">작업 과정</div>
      <div class="work-group-list">
        ${groups.map((group) => renderWorkGroup(turn, group)).join('')}
      </div>
    </section>
  `
}

function renderWorkGroup(turn, group) {
  const panelId = group.id
  const panelState = workPanelRenderState(turn, group)
  const expanded = panelState.expanded
  const renderBody = expanded || panelState.collapsing
  const summary = summarizeWorkGroup(group)
  const hasDetails = Boolean(group.notes?.length || group.commands?.some((command) => command.out?.length || command.command))
  return `
    <div class="work-group ${group.running ? 'running' : group.status === 'failed' ? 'failed' : 'done'} ${expanded ? 'expanded' : 'collapsed'} ${panelState.holding ? 'auto-holding' : ''} ${panelState.collapsing ? 'auto-collapsing' : ''} ${panelState.openedBy === 'user' ? 'user-managed' : panelState.openedBy === 'auto' ? 'auto-managed' : 'static'}" data-group-id="${escapeHtml(group.id)}" data-panel-id="${escapeHtml(panelId)}" ${motionAttributes(group.id, 'item', `${group.status}:${group.running}:${expanded}:${group.commands?.length || 0}:${group.notes?.length || 0}`)}>
      <button class="work-group-head ${hasDetails ? '' : 'no-details'}" type="button" ${hasDetails ? `data-toggle-panel="${escapeHtml(panelId)}" aria-expanded="${expanded}"` : 'tabindex="-1" aria-disabled="true"'}>
        <span class="work-status" aria-hidden="true">${workGroupIcon(group)}</span>
        <span class="work-summary">${escapeHtml(summary)}</span>
        ${hasDetails ? '<span class="work-caret">▶</span>' : ''}
      </button>
      ${renderBody ? `
        <div class="work-group-body">
          ${renderWorkNotes(group)}
          ${renderGroupedCommands(group)}
        </div>
      ` : ''}
    </div>
  `
}

function workPanelRenderState(turn, group) {
  const panel = state.panelUiState[group.id]
  const phase = panel?.openedBy === 'user' ? panel.phase : 'collapsed'
  const openedBy = panel?.openedBy === 'user' ? 'user' : null
  return {
    phase,
    openedBy,
    expanded: phase === 'expanded' || phase === 'holding' || phase === 'collapsing',
    holding: phase === 'holding',
    collapsing: phase === 'collapsing',
  }
}

function syncWorkPanelUiState() {
  const activeTurn = currentActiveTurn()
  state.activeTurnId = activeTurn?.id || null
  const activeGroup = activeTurn ? currentRunningGroup(activeTurn) : null
  state.activeGroupId = activeGroup?.id || null
  state.previousCompletedGroupId = null
  pruneAutoPanelState()
}

function currentActiveTurn() {
  if (!state.activeRoom?.alive) return null
  for (let index = state.messages.length - 1; index >= 0; index -= 1) {
    const message = state.messages[index]
    if (message.role === 'codex_turn' && !message.completion && !message.error) return message
  }
  return null
}

function currentRunningGroup(turn) {
  for (let index = turn.workGroups.length - 1; index >= 0; index -= 1) {
    const group = turn.workGroups[index]
    if (group.running) return group
  }
  return null
}

function findWorkGroupById(groupId) {
  for (const turn of state.messages) {
    if (turn.role !== 'codex_turn') continue
    const group = turn.workGroups.find((item) => item.id === groupId)
    if (group) return group
  }
  return null
}

function expandAutoPanel(panelId, turnId) {
  const panel = state.panelUiState[panelId]
  if (panel?.openedBy === 'user') return
  clearPanelEffectTimer(panelId)
  state.panelUiState[panelId] = {
    phase: 'expanded',
    openedBy: 'auto',
    turnId,
    updatedAt: Date.now(),
  }
}

function holdAutoPanel(panelId, turnId) {
  const panel = state.panelUiState[panelId]
  if (panel?.openedBy === 'user') return
  if (panel?.phase === 'holding' || panel?.phase === 'collapsing' || panel?.phase === 'collapsed') return
  state.panelUiState[panelId] = {
    phase: 'holding',
    openedBy: 'auto',
    turnId,
    updatedAt: Date.now(),
  }
  scheduleAutoPanelCollapse(panelId)
}

function collapseAutoPanel(panelId, options = {}) {
  const panel = state.panelUiState[panelId]
  if (panel?.openedBy === 'user') return
  clearPanelEffectTimer(panelId)
  const turnId = panel?.turnId || state.activeTurnId
  const shouldAnimate = options.animate !== false && panel && panel.phase !== 'collapsed'
  if (!shouldAnimate) {
    state.panelUiState[panelId] = {
      phase: 'collapsed',
      openedBy: 'auto',
      turnId,
      updatedAt: Date.now(),
    }
    return
  }
  state.panelUiState[panelId] = {
    phase: 'collapsing',
    openedBy: 'auto',
    turnId,
    updatedAt: Date.now(),
  }
  schedulePanelCollapseEnd(panelId, 'auto', turnId)
}

function collapseAutoPanelsForTurn(turnId, options = {}) {
  for (const [panelId, panel] of Object.entries(state.panelUiState)) {
    if (panel?.turnId === turnId && panel.openedBy !== 'user') collapseAutoPanel(panelId, options)
  }
}

function scheduleAutoPanelCollapse(panelId) {
  clearPanelEffectTimer(panelId)
  state.panelEffectTimers[panelId] = window.setTimeout(() => {
    delete state.panelEffectTimers[panelId]
    const preserveScroll = {
      previousScrollHeight: stream.scrollHeight,
      previousScrollTop: stream.scrollTop,
    }
    collapseAutoPanel(panelId, { animate: true })
    renderMessages({ preserveScroll, keepScrollHoldSpacer: true })
  }, WORK_GROUP_HOLD_MS)
}

function schedulePanelCollapseEnd(panelId, openedBy, turnId) {
  clearPanelEffectTimer(panelId)
  state.panelEffectTimers[panelId] = window.setTimeout(() => {
    delete state.panelEffectTimers[panelId]
    const holdScrollOnCollapse = {
      previousScrollTop: stream.scrollTop,
    }
    state.panelUiState[panelId] = {
      phase: 'collapsed',
      openedBy,
      turnId,
      updatedAt: Date.now(),
    }
    renderMessages({ holdScrollOnCollapse })
  }, WORK_GROUP_COLLAPSE_MS)
}

function clearPanelEffectTimer(panelId) {
  if (!state.panelEffectTimers[panelId]) return
  clearTimeout(state.panelEffectTimers[panelId])
  delete state.panelEffectTimers[panelId]
}

function clearPanelEffectTimers() {
  for (const panelId of Object.keys(state.panelEffectTimers)) clearPanelEffectTimer(panelId)
}

function pruneAutoPanelState() {
  const visibleWorkPanelIds = new Set()
  for (const turn of state.messages) {
    if (turn.role !== 'codex_turn') continue
    for (const group of turn.workGroups) visibleWorkPanelIds.add(group.id)
  }
  for (const [panelId, panel] of Object.entries(state.panelUiState)) {
    if (panel?.openedBy === 'user' || visibleWorkPanelIds.has(panelId)) continue
    clearPanelEffectTimer(panelId)
    delete state.panelUiState[panelId]
  }
}

function clearPanelStateForRoom(roomId) {
  const prefix = `${roomId}-turn-`
  for (const panelId of Object.keys(state.panelUiState)) {
    if (!panelId.startsWith(prefix)) continue
    clearPanelEffectTimer(panelId)
    delete state.panelUiState[panelId]
  }
}

function summarizeWorkGroup(group) {
  const title = group.title || workGroupTitle(group.kind)
  const commandCount = group.commands.length
  const failed = group.commands.filter((item) => Number(item.exit) > 0).length
  const noteCount = group.notes.length
  const firstCommand = group.commands.find((item) => cleanDisplayMessage(item.command))
  const commandLabel = firstCommand ? summarize(cleanDisplayMessage(firstCommand.command), 96) : ''
  const suffix = failed ? ` · 실패 ${failed}개` : commandCount > 1 ? ` · 명령 ${commandCount}개` : ''
  if (group.kind === 'command') {
    if (group.running) return commandLabel ? `명령 실행 중 ${commandLabel}` : '명령 실행 중'
    return commandLabel ? `명령을 실행했습니다 ${commandLabel}${suffix}` : `명령을 실행했습니다${suffix}`
  }
  if (group.kind === 'web') return group.running ? '웹을 확인하고 있습니다' : '웹을 확인했습니다'
  if (group.kind === 'reasoning') return group.running ? '코드를 확인하고 있습니다' : '코드를 확인했습니다'
  if (group.kind === 'image') return group.running ? '이미지를 확인하고 있습니다' : '이미지를 확인했습니다'
  if (group.kind === 'file') return group.running ? '파일을 확인하고 있습니다' : '파일을 확인했습니다'
  if (noteCount && !commandCount) return group.running ? `${title} 중` : `${title} 완료`
  return group.running ? `${title} 중` : `${title} 완료`
}

function workGroupIcon(group) {
  if (group.status === 'failed') return inlineIcon('alert')
  if (group.kind === 'web') return inlineIcon('search')
  if (group.kind === 'reasoning') return inlineIcon('edit')
  if (group.kind === 'image') return inlineIcon('image')
  if (group.kind === 'file') return inlineIcon('edit')
  if (group.kind === 'command') return inlineIcon('terminal')
  return inlineIcon(group.running ? 'spinner' : 'check')
}

function inlineIcon(name) {
  const attrs = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"'
  const common = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
  if (name === 'terminal') return `<svg ${attrs} ${common}><path d="m8 9 3 3-3 3"></path><path d="M13 15h3"></path><rect x="3" y="4" width="18" height="16" rx="3"></rect></svg>`
  if (name === 'search') return `<svg ${attrs} ${common}><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>`
  if (name === 'edit') return `<svg ${attrs} ${common}><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`
  if (name === 'image') return `<svg ${attrs} ${common}><rect x="3" y="5" width="18" height="14" rx="3"></rect><circle cx="8.5" cy="10.5" r="1.5"></circle><path d="m21 15-5-5L5 19"></path></svg>`
  if (name === 'alert') return `<svg ${attrs} ${common}><circle cx="12" cy="12" r="9"></circle><path d="M12 7v6"></path><path d="M12 17h.01"></path></svg>`
  if (name === 'check') return `<svg ${attrs} ${common}><path d="M20 6 9 17l-5-5"></path></svg>`
  return `<svg ${attrs} ${common}><path d="M12 3v3"></path><path d="M12 18v3"></path><path d="M3 12h3"></path><path d="M18 12h3"></path><path d="m5.6 5.6 2.1 2.1"></path><path d="m16.3 16.3 2.1 2.1"></path><path d="m18.4 5.6-2.1 2.1"></path><path d="m7.7 16.3-2.1 2.1"></path></svg>`
}

function renderWorkNotes(group) {
  const notes = (group.notes || [])
    .map((note, index) => ({ note, index, text: cleanDisplayMessage(note.text) }))
    .filter((item) => item.text)
    .slice(-8)
  if (!notes.length) return ''
  return `
    <div class="work-notes">
      ${notes.map(({ note, index, text }) => `<div ${motionAttributes(`${group.id}:note:${note.seq ?? note.time ?? index}`, 'line')}>${formatMessageText(text)}</div>`).join('')}
    </div>
  `
}

function renderGroupedCommands(group) {
  const commands = Array.isArray(group.commands) ? group.commands : []
  if (!commands.length) return ''
  return `
    <div class="command-stack">
      ${commands.map((command) => renderGroupedCommand(command, group)).join('')}
    </div>
  `
}

function renderGroupedCommand(command, group) {
  const lines = (command.out || []).slice(-180)
  const exit = Number.isInteger(command.exit) ? command.exit : null
  const status = command.running ? '실행 중' : exit === null ? '완료' : `exit ${exit}`
  const commandText = command.command || command.title || 'tool'
  const outputLines = command.running
    ? [`$ ${commandText}`, ...lines]
    : lines
  const commandKey = `${group.id}:command:${command.id || command.seq || commandText}`
  return `
    <div class="command-item ${command.running ? 'running' : exit ? 'error' : 'success'}" ${motionAttributes(commandKey, 'item', `${command.running}:${exit}:${outputLines.length > 0}`)}>
      <div class="command-item-head">
        <code>${escapeHtml(commandText)}</code>
        <span>${escapeHtml(status)}</span>
      </div>
      ${outputLines.length ? `
        <div class="command-output ${command.running ? 'live' : ''}" data-scroll>
          ${outputLines.map((line, index) => `<div class="${index === 0 && command.running ? 'prompt-line' : ''}" ${motionAttributes(`${commandKey}:line:${index}`, 'line')}>${escapeHtml(line)}</div>`).join('')}
          ${command.running ? `<div class="terminal-live-row" ${motionAttributes(`${commandKey}:cursor`, 'line')}><span class="terminal-cursor"></span><span>running</span></div>` : ''}
        </div>
      ` : command.running ? '<div class="command-output compact"><div class="loading-dots"><span></span><span></span><span></span></div></div>' : ''}
    </div>
  `
}

function renderChangesSection(turn) {
  const files = normalizedChangeFiles(turn)
  if (!files.length) return ''
  const panelId = `${turn.id}:changes`
  const expanded = isPanelExpanded(panelId, false)
  const add = files.reduce((sum, file) => sum + Number(file.add || 0), 0)
  const del = files.reduce((sum, file) => sum + Number(file.del || 0), 0)
  const summary = `${files.length}개 파일 변경함${add || del ? ` · +${add} -${del}` : ''}`
  return `
    <section class="turn-section changes-section ${expanded ? 'expanded' : 'collapsed'}" ${motionAttributes(`${turn.id}:changes`, 'item', `${files.length}:${add}:${del}:${expanded}`)}>
      <button class="changes-head" type="button" data-toggle-panel="${escapeHtml(panelId)}" aria-expanded="${expanded}">
        <span class="work-status" aria-hidden="true">${inlineIcon('edit')}</span>
        <strong>${escapeHtml(summary)}</strong>
        <span class="work-caret">▶</span>
      </button>
      ${expanded ? `
        <div class="change-file-list">
          ${files.map((file) => `
            <div class="change-file-row">
              <code>${escapeHtml(file.path || '')}</code>
              <span class="diff-add">+${Number(file.add || 0)}</span>
              <span class="diff-del">-${Number(file.del || 0)}</span>
            </div>
          `).join('')}
        </div>
        <div class="change-diff-list">
          ${files.filter((file) => file.lines?.length).map(renderTurnDiffFile).join('')}
        </div>
      ` : ''}
    </section>
  `
}

function normalizedChangeFiles(turn) {
  const byPath = new Map()
  for (const item of turn.changes.items || []) {
    if (!item?.path) continue
    byPath.set(item.path, {
      path: item.path,
      op: item.op || 'modified',
      add: Number(item.add || 0),
      del: Number(item.del || 0),
      lines: [],
    })
  }
  for (const file of turn.changes.files || []) {
    if (!file?.path) continue
    byPath.set(file.path, {
      ...byPath.get(file.path),
      path: file.path,
      op: file.op || byPath.get(file.path)?.op || 'modified',
      add: Number(file.add || byPath.get(file.path)?.add || 0),
      del: Number(file.del || byPath.get(file.path)?.del || 0),
      lines: Array.isArray(file.lines) ? file.lines : [],
    })
  }
  return [...byPath.values()]
}

function renderTurnDiffFile(file) {
  const lines = Array.isArray(file.lines) ? file.lines.slice(0, 140) : []
  return `
    <div class="turn-diff-file">
      <div class="turn-diff-file-head">
        <code>${escapeHtml(file.path || '')}</code>
        <span class="diff-add">+${Number(file.add || 0)}</span>
        <span class="diff-del">-${Number(file.del || 0)}</span>
      </div>
      <div class="diff-lines" data-scroll>
        ${lines.map((line) => {
          const sign = line.s === '@' ? '' : line.s || ' '
          const klass = line.s === '+' ? 'add' : line.s === '-' ? 'del' : line.s === '@' ? 'hunk' : ''
          return `<div class="${klass}"><span>${escapeHtml(sign)}</span><code>${escapeHtml(line.t || '')}</code></div>`
        }).join('')}
      </div>
    </div>
  `
}

function renderTurnFinalAnswer(final, turn) {
  if (!final?.text) return ''
  const active = Boolean(state.activeRoom?.alive && !turn.completion)
  const streamKey = `${turn.id}:final:${final.messageId || final.seq || 'answer'}`
  const text = displayStreamingText(
    streamKey,
    final.text,
    active
  )
  return `
    <section class="turn-final">
      <div class="turn-section-title">최종 답변</div>
      <div class="message-content" data-stream-text-key="${escapeHtml(streamKey)}" data-stream-renderer="assistant" data-stream-caret="${active || final.streaming ? 'true' : 'false'}">${formatAssistantText(text)}${active || final.streaming ? '<span class="typing-caret"></span>' : ''}</div>
    </section>
  `
}

function renderTurnUsage(turn) {
  if (!turn.usage) return ''
  return `<div class="turn-usage" ${motionAttributes(`${turn.id}:usage`, 'item')}>${escapeHtml(turn.usage)}</div>`
}

function renderTurnError(turn) {
  if (!turn.error) return ''
  return `
    <section class="turn-error" ${motionAttributes(`${turn.id}:error`, 'item')}>
      <strong>오류</strong>
      <p>${escapeHtml(turn.error)}</p>
    </section>
  `
}

function renderTurnCompletion(turn) {
  if (!turn.completion) return turn.usage ? `<div class="turn-usage">${escapeHtml(turn.usage)}</div>` : ''
  const ok = turn.completion.ok
  const label = ok ? '작업 완료' : '작업 종료'
  const duration = formatDurationMs(turn.completion.durationMs)
  return `
    <div class="turn-completion ${ok ? 'ok' : 'error'}" ${motionAttributes(`${turn.id}:completion`, 'item')}>
      <span>${ok ? '✓' : '!'}</span>
      <span>${label}${duration ? ` · ${duration}` : ''}</span>
    </div>
  `
}

function openAgentActivityDrawer(turnId) {
  const turn = state.messages.find((message) => message.role === 'codex_turn' && message.id === turnId)
  if (!turn) return
  state.activityDrawerTurnId = turnId
  renderAgentActivityDrawer()
  agentActivityDrawer.hidden = false
  agentActivityDrawerBackdrop.hidden = false
  agentActivityDrawer.setAttribute('aria-hidden', 'false')
  requestAnimationFrame(() => app.classList.add('activity-drawer-open'))
}

function closeAgentActivityDrawer() {
  if (!state.activityDrawerTurnId && agentActivityDrawer.hidden) return
  state.activityDrawerTurnId = null
  app.classList.remove('activity-drawer-open')
  agentActivityDrawer.setAttribute('aria-hidden', 'true')
  window.setTimeout(() => {
    if (state.activityDrawerTurnId) return
    agentActivityDrawer.hidden = true
    agentActivityDrawerBackdrop.hidden = true
    agentActivityDrawerBody.innerHTML = ''
  }, 180)
}

function renderAgentActivityDrawer() {
  if (!state.activityDrawerTurnId) return
  const turn = state.messages.find((message) => message.role === 'codex_turn' && message.id === state.activityDrawerTurnId)
  if (!turn) {
    closeAgentActivityDrawer()
    return
  }
  const activity = buildAgentActivity(turn)
  const statusLabel = activity.status === 'running'
    ? '작업 중'
    : activity.status === 'waiting_user'
      ? '사용자 응답 대기'
      : activity.status === 'failed'
        ? '오류'
        : '완료'
  agentActivityDrawerTitle.textContent = `${statusLabel} · ${activity.operations} operations`
  const events = activityDetailEvents(turn, activity)
  agentActivityDrawerBody.innerHTML = events.length
    ? `<div class="agent-detail-log">${events.map((event, index) => renderActivityDetailEvent(event, index)).join('')}</div>`
    : '<div class="agent-detail-empty">기록된 실행 이벤트가 없습니다.</div>'
}

function activityDetailEvents(turn, activity) {
  const events = Array.isArray(turn.events) ? turn.events : []
  const checkpointIds = new Set(activity.checkpoints.map((message) => message.messageId || message.id).filter(Boolean))
  const checkpointTexts = new Set(activity.checkpoints.map((message) => cleanDisplayMessage(message.text)).filter(Boolean))
  return events.flatMap((event, index) => {
    if (event.type === 'assistant_delta') return []
    if (event.type === 'assistant_message') {
      const isCheckpoint = checkpointIds.has(event.messageId || event.id) || checkpointTexts.has(cleanDisplayMessage(event.text))
      return isCheckpoint ? [{ ...event, detailRole: 'checkpoint' }] : []
    }
    if (event.type === 'progress' && shouldHideProgressText(cleanDisplayMessage(event.text))) return []
    if (event.type === 'tool' && isPlaceholderToolEvent(event, events, index)) return []
    return [event]
  })
}

function isPlaceholderToolEvent(event, events, index) {
  const command = cleanDisplayMessage(event.command || event.text || event.title)
  if (!event.toolUseId || !/^(tool|bash|shell|command)$/i.test(command)) return false
  return events.slice(index + 1).some((next) => {
    if (next.type !== 'tool' || next.toolUseId !== event.toolUseId) return false
    const nextCommand = cleanDisplayMessage(next.command || next.text || next.title)
    return nextCommand && !/^(tool|bash|shell|command)$/i.test(nextCommand)
  })
}

function renderActivityDetailEvent(event, index) {
  const detail = activityDetailForEvent(event)
  const time = formatActivityEventTime(event.time)
  return `
    <article class="agent-detail-event ${escapeHtml(detail.tone)}">
      <time>${escapeHtml(time)}</time>
      <div class="agent-detail-event-content">
        <div class="agent-detail-event-head">
          <span>${escapeHtml(detail.label)}</span>
          ${detail.status ? `<span>${escapeHtml(detail.status)}</span>` : ''}
        </div>
        ${detail.title ? `<div class="agent-detail-title">${escapeHtml(detail.title)}</div>` : ''}
        ${detail.body ? `<pre data-scroll>${escapeHtml(detail.body)}</pre>` : ''}
        ${detail.html || ''}
      </div>
    </article>
  `
}

function activityDetailForEvent(event) {
  if (event.type === 'tool') {
    const kind = toolKind(event, event.command || event.text)
    return {
      label: kind === 'web' ? 'Web' : kind === 'file' ? 'File' : kind === 'image' ? 'Image' : 'Terminal',
      title: event.title || workGroupTitle(kind),
      body: cleanDisplayMessage(event.command || event.text),
      status: event.status === 'running' ? '실행 중' : '',
      tone: 'tool',
    }
  }
  if (event.type === 'tool_result') {
    return {
      label: event.kind === 'web' ? 'Web 결과' : '실행 결과',
      title: Number.isInteger(event.exitCode) ? `exit ${event.exitCode}` : event.status === 'error' ? '오류' : '완료',
      body: cleanDisplayMessage(event.text),
      status: '',
      tone: event.status === 'error' ? 'error' : 'result',
    }
  }
  if (event.type === 'assistant_message' && event.detailRole === 'checkpoint') {
    return {
      label: 'Checkpoint',
      title: '',
      body: cleanDisplayMessage(event.text),
      status: '',
      tone: 'agent',
    }
  }
  if (event.type === 'output') {
    return {
      label: 'Terminal output',
      title: '',
      body: cleanTerminalMessage(event.data ?? event.text),
      status: '',
      tone: 'result',
    }
  }
  if (event.type === 'progress') {
    return {
      label: event.phase === 'system' ? 'System' : 'Progress',
      title: cleanDisplayMessage(event.text),
      body: '',
      status: '',
      tone: 'progress',
    }
  }
  if (event.type === 'diff') {
    const files = Array.isArray(event.files) ? event.files : []
    const add = files.reduce((sum, file) => sum + Number(file.add || 0), 0)
    const del = files.reduce((sum, file) => sum + Number(file.del || 0), 0)
    return {
      label: 'Diff',
      title: `${files.length}개 파일 · +${add} -${del}`,
      body: '',
      html: `<div class="agent-detail-diff-list">${files.map(renderTurnDiffFile).join('')}</div>`,
      status: '',
      tone: 'file diff',
    }
  }
  if (event.type === 'file_change' || event.type === 'files') {
    const files = event.files || event.items || []
    return {
      label: 'File change',
      title: `${files.length}개 파일`,
      body: files.map((file) => `${file.op || 'modified'}  ${file.path || ''}`).join('\n'),
      status: '',
      tone: 'file',
    }
  }
  if (event.type === 'error') {
    return { label: 'Error', title: '', body: cleanDisplayMessage(event.text || event.error), status: '', tone: 'error' }
  }
  if (event.type === 'turn_completed' || event.type === 'exit') {
    return { label: 'Run', title: event.type === 'turn_completed' ? '완료' : '종료', body: cleanDisplayMessage(event.text), status: '', tone: 'completion' }
  }
  if (event.type === 'usage') return { label: 'Usage', title: cleanDisplayMessage(event.text), body: '', status: '', tone: 'usage' }
  if (event.type === 'attachments') return { label: 'Attachment', title: '', body: '', status: '', tone: 'file' }
  return {
    label: cleanDisplayMessage(event.type || 'Event'),
    title: cleanDisplayMessage(event.text || event.title),
    body: '',
    status: '',
    tone: 'event',
  }
}

function formatActivityEventTime(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.valueOf())) return '--:--:--'
  return date.toLocaleTimeString('ko-KR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function updateActivityElapsedLabels() {
  for (const label of document.querySelectorAll('[data-activity-elapsed]')) {
    const startedAt = new Date(label.dataset.startedAt).valueOf()
    if (!Number.isFinite(startedAt)) continue
    label.textContent = formatDurationMs(Date.now() - startedAt) || '1초'
  }
}

function bindMessageControls() {
  for (const button of messageList.querySelectorAll('[data-open-activity-log]')) {
    button.addEventListener('click', () => openAgentActivityDrawer(button.dataset.openActivityLog))
  }
  for (const button of messageList.querySelectorAll('[data-toggle-panel]')) {
    button.addEventListener('click', () => {
      const id = button.dataset.togglePanel
      if (!id) return
      const isExpanded = button.getAttribute('aria-expanded') === 'true'
      if (id.includes(':work:')) {
        const turnId = button.closest('[data-turn-id]')?.dataset.turnId || state.panelUiState[id]?.turnId || ''
        toggleWorkPanelByUser(id, isExpanded, turnId)
      } else {
        state.expandedPanels[id] = !isExpanded
        renderMessages()
      }
    })
  }
  for (const button of messageList.querySelectorAll('[data-open-image]')) {
    button.addEventListener('click', () => {
      openImageLightbox(button.dataset.imageSrc, button.dataset.imageName)
    })
  }
  bindAttachmentImageLoadHandlers()
  for (const button of messageList.querySelectorAll('[data-delete-attachment]')) {
    button.addEventListener('click', () => {
      deleteStoredAttachment(button.dataset.deleteAttachment, button.dataset.attachmentName)
        .catch((err) => showUiError(err, '첨부파일을 삭제하지 못했습니다.'))
    })
  }
}

function bindAttachmentImageLoadHandlers() {
  for (const image of messageList.querySelectorAll('.message-image img')) {
    if (image.dataset.loadBound === 'true') continue
    image.dataset.loadBound = 'true'
    const shouldFollow = !state.streamFollowPaused && isStreamNearBottom(320)
    const handleLoad = () => {
      if (shouldFollow && !state.streamFollowPaused) pinStreamToBottom()
    }
    image.addEventListener('load', handleLoad, { once: true })
    image.addEventListener('error', handleLoad, { once: true })
  }
}

function toggleWorkPanelByUser(panelId, isExpanded, turnId) {
  clearPanelEffectTimer(panelId)
  if (isExpanded) {
    state.panelUiState[panelId] = {
      phase: 'collapsing',
      openedBy: 'user',
      turnId,
      updatedAt: Date.now(),
    }
    schedulePanelCollapseEnd(panelId, 'user', turnId)
  } else {
    state.panelUiState[panelId] = {
      phase: 'expanded',
      openedBy: 'user',
      turnId,
      updatedAt: Date.now(),
    }
  }
  renderMessages()
}

function isPanelExpanded(id, fallback) {
  return Object.prototype.hasOwnProperty.call(state.expandedPanels, id)
    ? Boolean(state.expandedPanels[id])
    : Boolean(fallback)
}

function formatDurationMs(value) {
  const ms = Number(value)
  if (!Number.isFinite(ms) || ms <= 0) return ''
  const totalSeconds = Math.max(1, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes <= 0) return `${seconds}초`
  if (minutes < 60) return seconds ? `${minutes}분 ${seconds}초` : `${minutes}분`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}시간 ${rest}분` : `${hours}시간`
}

function visibleUserMessageText(text, attachments = []) {
  const clean = cleanDisplayMessage(text)
  if (attachments.length && clean === '첨부 파일을 확인해줘.') return ''
  return clean
}

const USER_TEXT_COLLAPSE_LINES = 6
const USER_TEXT_COLLAPSE_CHARS = 480

function isLongUserText(text) {
  if (!text) return false
  if (text.length > USER_TEXT_COLLAPSE_CHARS) return true
  return text.split('\n').length > USER_TEXT_COLLAPSE_LINES
}

function renderMessageAttachments(attachments) {
  const items = activeMessageAttachments(attachments)
  if (!items.length) return ''
  const images = items.filter(isImageAttachment)
  const files = items.filter((item) => !isImageAttachment(item))
  return `
    <div class="message-attachments">
      ${images.length ? `
        <div class="message-image-grid ${images.length === 1 ? 'single' : 'multi'}">
          ${images.map((item) => `
            <span class="message-attachment-item">
              <button class="message-image" type="button" data-open-image data-image-src="${escapeHtml(attachmentUrl(item))}" data-image-name="${escapeHtml(item.name)}" title="${escapeHtml(item.name)} 크게 보기">
                <img src="${escapeHtml(attachmentUrl(item))}" alt="${escapeHtml(item.name)}" loading="lazy">
              </button>
              ${renderAttachmentDeleteButton(item)}
            </span>
          `).join('')}
        </div>
      ` : ''}
      ${files.length ? `
        <div class="message-file-list">
          ${files.map((item) => `
            <span class="message-attachment-item">
              <a class="message-file-card" href="${escapeHtml(attachmentUrl(item))}" target="_blank" rel="noreferrer" title="${escapeHtml(item.path || item.name)}">
                <span class="message-file-icon">${escapeHtml(attachmentIcon(item))}</span>
                <span class="message-file-main">
                  <span>${escapeHtml(item.name)}</span>
                  <code>${escapeHtml(formatFileSize(item.size))}</code>
                </span>
              </a>
              ${renderAttachmentDeleteButton(item)}
            </span>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `
}

function activeMessageAttachments(value) {
  return normalizeMessageAttachments(value).filter((item) => !state.deletedAttachmentIds.has(item.id))
}

function renderAttachmentDeleteButton(item) {
  if (!state.activeRoom || state.activeRoom.alive || state.activeRoom.archivedAt || state.activeRoom.trashedAt) return ''
  return `<button class="message-attachment-delete" type="button" data-delete-attachment="${escapeHtml(item.id)}" data-attachment-name="${escapeHtml(item.name)}" aria-label="${escapeHtml(item.name)} 삭제" title="파일 삭제">×</button>`
}

async function deleteStoredAttachment(attachmentId, name) {
  if (!state.activeRoomId || !attachmentId) return
  const confirmed = window.confirm(`“${name || '첨부파일'}”을 이 채팅에서 영구 삭제할까요?`)
  if (!confirmed) return
  const roomId = state.activeRoomId
  const response = await api(`/api/rooms/${encodeURIComponent(roomId)}/attachments/${encodeURIComponent(attachmentId)}`, { method: 'DELETE' })
  if (state.activeRoomId !== roomId) return
  if (!state.events.some((event) => event.type === 'attachment_deleted' && event.attachmentId === response.attachmentId)) {
    state.events.push({ type: 'attachment_deleted', attachmentId: response.attachmentId, text: `Attachment deleted: ${name}`, time: new Date().toISOString() })
    rebuildMessagesFromEvents()
    renderActivity()
  }
  loadStorageUsage().catch(() => {})
}

function openImageLightbox(source, name) {
  const imageSource = String(source || '')
  if (!imageSource || imageSource === '#') return
  const imageName = cleanAttachmentName(name || '이미지 미리보기')
  imageLightboxTitle.textContent = imageName
  imageLightboxImage.src = imageSource
  imageLightboxImage.alt = imageName
  imageLightboxOpen.href = imageSource
  if (!imageLightbox.open) imageLightbox.showModal()
}

function closeImageLightbox() {
  if (imageLightbox.open) imageLightbox.close()
}

function normalizeMessageAttachments(value) {
  if (!Array.isArray(value)) return []
  const out = []
  for (const item of value) {
    const id = cleanAttachmentId(item?.id)
    if (!id || out.some((existing) => existing.id === id)) continue
    out.push({
      id,
      name: cleanAttachmentName(item?.name || item?.path || 'attachment'),
      size: Number.isFinite(Number(item?.size)) ? Number(item.size) : 0,
      mime: typeof item?.mime === 'string' ? item.mime : '',
      kind: typeof item?.kind === 'string' ? item.kind : '',
      path: typeof item?.path === 'string' ? item.path : '',
      url: typeof item?.url === 'string' ? item.url : '',
      relativePath: typeof item?.relativePath === 'string' ? item.relativePath : '',
    })
  }
  return out
}

function sameAttachmentIds(left, right) {
  const a = normalizeMessageAttachments(left).map((item) => item.id).join(',')
  const b = normalizeMessageAttachments(right).map((item) => item.id).join(',')
  return a === b
}

function attachmentSummaryText(attachments) {
  const items = normalizeMessageAttachments(attachments)
  if (!items.length) return ''
  return `첨부 ${items.length}개: ${items.map((item) => item.name).join(', ')}`
}

function attachmentIcon(item) {
  if (item.kind === 'image' || item.mime.startsWith('image/')) return 'IMG'
  if (item.kind === 'pdf' || item.mime === 'application/pdf') return 'PDF'
  if (item.kind === 'text' || item.mime.startsWith('text/')) return 'TXT'
  return 'DOC'
}

function isImageAttachment(item) {
  return item?.kind === 'image' || String(item?.mime || '').startsWith('image/')
}

function attachmentUrl(item) {
  if (item?.url && item.url.startsWith('/')) return item.url
  if (state.activeRoomId && item?.id) return `/api/rooms/${encodeURIComponent(state.activeRoomId)}/attachments/${encodeURIComponent(item.id)}`
  return '#'
}

function cleanAttachmentId(value) {
  const text = String(value ?? '').trim()
  return /^[0-9a-f-]{36}$/i.test(text) ? text.toLowerCase() : ''
}

function cleanAttachmentName(value) {
  const text = String(value ?? 'attachment')
    .replaceAll('\\', '/')
    .split('/')
    .pop()
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return (text || 'attachment').slice(0, 180)
}

function formatFileSize(value) {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round(bytes)} B`
}

function formatAssistantText(value) {
  const lines = String(value ?? '').split('\n')
  const parts = []
  let code = null
  let codeLanguage = ''
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const fence = line.trim().match(/^```\s*([\w.+-]*)/)
    if (fence) {
      if (code) {
        const language = codeLanguage ? ` data-language="${escapeHtml(codeLanguage)}"` : ''
        parts.push(`<pre class="message-code"${language}><code>${escapeHtml(code.join('\n'))}</code></pre>`)
        code = null
        codeLanguage = ''
      } else {
        code = []
        codeLanguage = fence[1] || ''
      }
      continue
    }
    if (code) {
      code.push(line)
      continue
    }
    const trimmed = line.trim()
    if (!trimmed) continue

    if (line.includes('|') && isMarkdownTableSeparator(lines[index + 1])) {
      const headers = splitMarkdownTableRow(line)
      const rows = []
      index += 2
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(splitMarkdownTableRow(lines[index]))
        index += 1
      }
      index -= 1
      parts.push(renderMarkdownTable(headers, rows))
      continue
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      parts.push(`<div class="message-heading level-${heading[1].length}">${formatMessageText(heading[2])}</div>`)
      continue
    }

    const bullet = line.match(/^\s*[-*+]\s+(.+)$/)
    if (bullet) {
      parts.push(`<div class="message-bullet"><span>·</span><span>${formatMessageText(bullet[1])}</span></div>`)
      continue
    }

    const ordered = line.match(/^\s*(\d+)[.)]\s+(.+)$/)
    if (ordered) {
      parts.push(`<div class="message-bullet ordered"><span>${escapeHtml(ordered[1])}.</span><span>${formatMessageText(ordered[2])}</span></div>`)
      continue
    }

    const quote = line.match(/^\s*>\s?(.*)$/)
    if (quote) {
      parts.push(`<blockquote class="message-quote">${formatMessageText(quote[1])}</blockquote>`)
      continue
    }

    if (/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      parts.push('<hr class="message-rule">')
      continue
    }

    parts.push(`<p>${formatMessageText(trimmed)}</p>`)
  }
  if (code) {
    const language = codeLanguage ? ` data-language="${escapeHtml(codeLanguage)}"` : ''
    parts.push(`<pre class="message-code"${language}><code>${escapeHtml(code.join('\n'))}</code></pre>`)
  }
  return parts.join('')
}

function isMarkdownTableSeparator(value) {
  const cells = splitMarkdownTableRow(value)
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
}

function splitMarkdownTableRow(value) {
  const line = String(value ?? '').trim().replace(/^\|/, '').replace(/\|$/, '')
  if (!line) return []
  return line.split('|').map((cell) => cell.trim())
}

function renderMarkdownTable(headers, rows) {
  if (!headers.length) return ''
  const width = headers.length
  return `
    <div class="message-table-wrap" data-scroll>
      <table class="message-table">
        <thead><tr>${headers.map((cell) => `<th>${formatMessageText(cell)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${Array.from({ length: width }, (_item, index) => `<td>${formatMessageText(row[index] || '')}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>
  `
}

function renderProgressMessage(message) {
  if (!message.running) return ''
  const steps = (message.steps || []).slice(-8)
  const label = message.running
    ? steps[steps.length - 1] || '진행 중'
    : `${steps.length}개 단계 처리`
  return `
    <article class="message-row progress">
      <div class="progress-card ${message.running ? 'running' : ''}">
        <button class="progress-head" type="button" data-toggle-message="${escapeHtml(message.time)}">
          <span>${escapeHtml(label)}</span>
          <span class="progress-caret">▶</span>
        </button>
        <div class="progress-steps">
          ${steps.map((step) => `<div>${escapeHtml(step)}</div>`).join('')}
        </div>
      </div>
    </article>
  `
}

function renderShellMessage(message) {
  const lines = message.collapsed ? [] : (message.out || []).slice(-220)
  const exitText = message.running ? '실행 중' : message.exit === null || message.exit === undefined ? '완료' : `exit ${message.exit}`
  return `
    <article class="message-row shell">
      <div class="shell-message ${message.running ? 'running' : message.exit === 0 ? 'success' : message.exit ? 'error' : ''}">
        <div class="shell-message-head">
          <span class="shell-message-icon">${message.running ? '›' : message.exit === 0 ? '✓' : message.exit ? '✕' : '✓'}</span>
          <span class="shell-message-command">${escapeHtml(message.cmd || message.title || 'tool')}</span>
          <span class="shell-message-status">${escapeHtml(exitText)}${message.out?.length ? ` · ${message.out.length}줄` : ''}</span>
        </div>
        ${lines.length ? `
          <div class="shell-message-output" data-scroll>
            ${lines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
            ${message.running ? '<div class="loading-dots"><span></span><span></span><span></span></div>' : ''}
          </div>
        ` : message.running ? '<div class="shell-message-output compact"><div class="loading-dots"><span></span><span></span><span></span></div></div>' : ''}
      </div>
    </article>
  `
}

function renderDiffMessage(message) {
  const files = Array.isArray(message.files) ? message.files : []
  let add = 0
  let del = 0
  for (const file of files) {
    add += Number(file.add || 0)
    del += Number(file.del || 0)
  }
  return `
    <article class="message-row diff">
      <div class="diff-card">
        <div class="diff-head">
          <span class="diff-icon">◈</span>
          <span class="diff-title">${escapeHtml(message.title || `${files.length}개 파일 변경`)}</span>
          <span class="diff-add">+${add}</span>
          <span class="diff-del">-${del}</span>
        </div>
        <div class="diff-files">
          ${files.map(renderDiffFile).join('')}
        </div>
      </div>
    </article>
  `
}

function renderDiffFile(file) {
  const lines = Array.isArray(file.lines) ? file.lines.slice(0, 140) : []
  return `
    <div class="diff-file">
      <div class="diff-file-head">
        <span>${escapeHtml(file.path || '')}</span>
        <span class="diff-add">+${Number(file.add || 0)}</span>
        <span class="diff-del">-${Number(file.del || 0)}</span>
      </div>
      ${lines.length ? `
        <div class="diff-lines" data-scroll>
          ${lines.map((line) => {
            const sign = line.s === '@' ? '' : line.s || ' '
            const klass = line.s === '+' ? 'add' : line.s === '-' ? 'del' : line.s === '@' ? 'hunk' : ''
            return `<div class="${klass}"><span>${escapeHtml(sign)}</span><code>${escapeHtml(line.t || '')}</code></div>`
          }).join('')}
        </div>
      ` : ''}
    </div>
  `
}

function renderFilesMessage(message) {
  const items = Array.isArray(message.items) ? message.items : []
  return `
    <article class="message-row files">
      <div class="files-card">
        ${items.map((item) => {
          const op = item.op || 'modified'
          const label = op === 'new' ? 'NEW' : op === 'deleted' ? 'DEL' : op === 'renamed' ? 'REN' : 'MOD'
          return `
            <div class="file-row ${escapeHtml(op)}">
              <span>${escapeHtml(label)}</span>
              <code>${escapeHtml(item.path || '')}</code>
            </div>
          `
        }).join('')}
      </div>
    </article>
  `
}

function renderUsageMessage(message) {
  return `
    <article class="message-row usage">
      <div class="usage-row"><span></span><code>${escapeHtml(message.text)}</code><span></span></div>
    </article>
  `
}

function renderUsageSummaryMessage(message) {
  const usage = message.usage || {}
  const provider = usage.provider === 'claude' ? 'Claude' : 'Codex'
  const rateLimits = usage.rateLimits || {}
  const hasRateLimits = rateLimits.available && Array.isArray(rateLimits.limits) && rateLimits.limits.length
  if (!usage.available && !hasRateLimits) {
    return `
      <article class="message-row usage-summary">
        <div class="usage-summary-card">
          <header><strong>Usage</strong><span>${escapeHtml(provider)}</span></header>
          <p>${escapeHtml(rateLimits.message || usage.message || '아직 usage 데이터가 없습니다.')}</p>
        </div>
      </article>
    `
  }

  const plan = formatUsagePlan(rateLimits.planType)
  return `
    <article class="message-row usage-summary">
      <div class="usage-summary-card">
        <header>
          <strong>Usage</strong>
          <span>${escapeHtml([provider, plan].filter(Boolean).join(' · '))}</span>
        </header>
        ${hasRateLimits ? renderUsageRateLimits(rateLimits) : ''}
        ${usage.available ? `
          <div class="usage-summary-row usage-token-row">
            <span>최근 완료 턴</span>
            <code>${escapeHtml(formatUsageMetrics(usage.lastTurn))}</code>
          </div>
          <div class="usage-summary-row usage-token-row">
            <span>${usage.cumulative ? '세션 누적' : '채팅 합계'}</span>
            <code>${escapeHtml(formatUsageMetrics(usage.session))}</code>
          </div>
        ` : ''}
      </div>
    </article>
  `
}

function renderUsageRateLimits(rateLimits) {
  return rateLimits.limits.flatMap((limit) => {
    const windows = Array.isArray(limit.windows) ? limit.windows : []
    return windows.map((window) => {
      const used = Math.max(0, Math.min(100, Number(window.usedPercent) || 0))
      const remaining = Math.max(0, Math.min(100, Number(window.remainingPercent) || 0))
      const status = used >= 90 ? 'critical' : used >= 75 ? 'warning' : ''
      const name = `${limit.name || 'Codex'} · ${formatUsageWindow(window.windowMinutes)}`
      return `
        <div class="usage-limit-row ${status}">
          <div class="usage-limit-label">
            <span>${escapeHtml(name)}</span>
            <strong>${escapeHtml(`${formatUsagePercent(remaining)} 남음`)}</strong>
          </div>
          <div class="usage-limit-track" role="progressbar" aria-label="${escapeHtml(name)} 사용량" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${used}">
            <span style="width: ${used}%"></span>
          </div>
          <div class="usage-limit-meta">
            <span>${escapeHtml(`${formatUsagePercent(used)} 사용`)}</span>
            <span>${escapeHtml(formatUsageReset(window.resetsAt))}</span>
          </div>
        </div>
      `
    })
  }).join('')
}

function formatUsagePlan(value) {
  const plan = String(value || '').toLowerCase()
  if (plan === 'prolite') return 'Pro Lite'
  if (plan === 'pro') return 'Pro'
  if (plan === 'plus') return 'Plus'
  if (plan === 'team') return 'Team'
  if (plan === 'enterprise') return 'Enterprise'
  return value ? String(value) : ''
}

function formatUsageWindow(minutes) {
  const value = Number(minutes)
  if (value === 10080) return '주간'
  if (value === 1440) return '일간'
  if (value >= 60 && value % 60 === 0) return `${value / 60}시간`
  return Number.isFinite(value) ? `${value}분` : '한도'
}

function formatUsagePercent(value) {
  const number = Math.max(0, Math.min(100, Number(value) || 0))
  return `${Number.isInteger(number) ? number : number.toFixed(1)}%`
}

function formatUsageReset(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return '초기화 시각 미정'
  return `${new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)} 초기화`
}

function formatUsageMetrics(metrics = {}) {
  const parts = []
  if (Number.isFinite(metrics.inputTokens)) parts.push(`입력 ${formatUsageNumber(metrics.inputTokens)}`)
  if (Number.isFinite(metrics.outputTokens)) parts.push(`출력 ${formatUsageNumber(metrics.outputTokens)}`)
  if (Number.isFinite(metrics.inputTokens) || Number.isFinite(metrics.outputTokens)) {
    parts.push(`합계 ${formatUsageNumber(Number(metrics.inputTokens || 0) + Number(metrics.outputTokens || 0))}`)
  }
  if (Number.isFinite(metrics.costUsd)) parts.push(`$${metrics.costUsd.toFixed(4)}`)
  if (Number.isFinite(metrics.durationMs)) parts.push(formatDurationMs(metrics.durationMs))
  return parts.join(' · ') || '측정값 없음'
}

function formatUsageNumber(value) {
  return Math.max(0, Math.round(Number(value) || 0)).toLocaleString('en-US')
}

function renderErrorMessage(message) {
  return `
    <article class="message-row error">
      <div class="error-card">
        <div>${escapeHtml(message.title || '오류')}</div>
        <p>${escapeHtml(message.text || '')}</p>
      </div>
    </article>
  `
}

function splitOutputLines(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .filter((line) => line.length)
    .slice(-300)
}

function findLastToolMessage(toolUseId) {
  for (let index = state.messages.length - 1; index >= 0; index -= 1) {
    const message = state.messages[index]
    if (message.role !== 'shell') continue
    if (!toolUseId || message.toolUseId === toolUseId) return message
  }
  return null
}

function renderActivity() {
  const visible = state.events.filter((event) => ['input', 'attachment', 'attachment_deleted', 'system', 'progress', 'tool', 'tool_result', 'diff', 'files', 'usage', 'exit', 'error'].includes(event.type))
  activityCount.textContent = `${visible.length} events`
  const previousMotionLayout = captureMotionLayout(activityList)
  activityList.innerHTML = visible.slice(-200).reverse().map((event) => `
    <article class="activity-item" ${motionAttributes(`activity:${eventIdentity(event)}`, 'item')}>
      <div class="activity-type">${escapeHtml(event.type)} · ${escapeHtml(formatTime(event.time))}</div>
      <div class="activity-text">${escapeHtml(event.text || event.command || event.title || event.data || '')}</div>
    </article>
  `).join('')
  animateMotionLayout(activityList, previousMotionLayout, 'activityMotionReady')
}

function addActivity(event) {
  state.events.push({ ...event, time: event.time || new Date().toISOString() })
  renderActivity()
}

function renderRoomHeader(room) {
  if (!room) return renderEmptyRoom()
  state.activeRoom = room
  setTerminalVisible(true)
  if (!roomTitle.isContentEditable) roomTitle.textContent = room.title
  roomTitle.title = '더블클릭해서 이름 수정'
  const running = Boolean(room.alive)
  roomStatus.textContent = running ? '진행 중' : statusLabel(room.status)
  roomStatus.classList.toggle('running', Boolean(room.alive))
  workspace.classList.toggle('room-running', running)
  topbar.classList.toggle('room-running', running)
  roomMeta.textContent = `${room.agent}${room.agent === 'codex' ? codexRoomMetaLabel(room) : room.agent === 'claude' ? claudeRoomMetaLabel(room) : ''} · ${room.cwd}`
  terminalCommand.textContent = room.command ? `$ ${room.command}` : `$ ${room.agent} · ${room.cwd}`
  terminalSummary.textContent = room.trashedAt ? '휴지통' : room.archivedAt ? '보관됨' : room.alive ? '실행 중' : statusLabel(room.status)
  terminalIcon.textContent = room.alive ? '›' : room.status === 'error' ? '✕' : '✓'
  terminalCard.classList.toggle('success', !room.alive && room.status !== 'error')
  terminalCard.classList.toggle('error', room.status === 'error')
  agentLabel.textContent = room.agent === 'claude' ? 'Claude' : 'Codex'
  modeLabel.textContent = settingsModeLabel()
  contextLabel.textContent = composerContextText(room)
  renderExecutionButtons(room)
  modeMenuText.textContent = settingsModeShortLabel()
  composer.classList.toggle('running', Boolean(room.alive))
  ctrlCButton.textContent = '중단'
  startButton.textContent = room.alive ? '실행 중' : '대기'
  startButton.disabled = true
  stopButton.disabled = !room.alive
  roomSettingsButton.disabled = false
  downloadLogButton.href = `/api/rooms/${room.id}/log`
  downloadLogButton.classList.remove('disabled')
  downloadLogButton.setAttribute('aria-disabled', 'false')
  renderQueuedPromptTray()
  setInputsEnabled(canUseActiveRoomComposer())
  updateSettingsDialog()
  updateRoomSettingsDialog()
  requestAnimationFrame(fitTerminal)
}

function renderEmptyRoom() {
  state.activeRoomLoadToken += 1
  state.activeRoom = null
  state.messages = []
  state.events = []
  state.roomLoading = false
  state.historyBefore = null
  state.historyHasMore = false
  state.historyLoading = false
  state.pendingAttachments = []
  state.uploadingAttachments = false
  clearTextStreams()
  clearRenderTimers()
  renderAttachmentTray()
  renderQueuedPromptTray()
  setTerminalVisible(false)
  roomTitle.textContent = 'devi'
  roomTitle.title = ''
  roomStatus.textContent = '방을 선택하세요'
  roomStatus.classList.remove('running')
  workspace.classList.remove('room-running')
  topbar.classList.remove('room-running')
  roomMeta.textContent = '새 채팅방을 만들거나 기존 방을 선택하세요.'
  terminalSummary.textContent = '대기 중'
  agentLabel.textContent = 'Codex'
  modeLabel.textContent = settingsModeLabel()
  contextLabel.textContent = '채팅방 없음'
  renderExecutionButtons()
  modeMenuText.textContent = settingsModeShortLabel()
  composer.classList.remove('running')
  setInputsEnabled(false)
  startButton.disabled = true
  stopButton.disabled = true
  roomSettingsButton.disabled = true
  downloadLogButton.href = '#'
  downloadLogButton.classList.add('disabled')
  downloadLogButton.setAttribute('aria-disabled', 'true')
  activityList.innerHTML = ''
  activityCount.textContent = '0 events'
  messageList.innerHTML = ''
  updateSettingsDialog()
  updateRoomSettingsDialog()
  closeComposerMenu()
}

function renderExecutionButtons(source = null) {
  const provider = source?.execution?.provider || source?.agent || agentInput.value || 'codex'
  const providerOption = state.agentOptions.find((item) => item.id === provider)
  const providerName = providerOption?.name || (provider === 'claude' ? 'Claude' : 'Codex')
  const providerIcon = providerOption?.icon || AGENT_BRANDS[normalizeAgentBrand(provider)]?.iconSrc
  agentMenuButton.innerHTML = `
    ${providerIcon ? `<img class="agent-button-logo" src="${escapeHtml(providerIcon)}" alt="" aria-hidden="true">` : ''}
    <span>${escapeHtml(providerName)}</span>
    <span aria-hidden="true">▾</span>
  `
  const showModelSettings = provider === 'codex' || provider === 'claude'
  modelMenuButton.hidden = !showModelSettings
  effortMenuButton.hidden = !showModelSettings
  modelMenuButton.disabled = !showModelSettings
  effortMenuButton.disabled = !showModelSettings
  if (!showModelSettings) return

  const modelLabel = provider === 'claude' ? resolvedClaudeModelLabel(source) : resolvedCodexModelLabel(source)
  const effortLabel = provider === 'claude' ? resolvedClaudeEffortLabel(source) : resolvedCodexEffortLabel(source)
  modelMenuButton.textContent = `${modelLabel} ▾`
  effortMenuButton.textContent = `${effortLabel} ▾`
  modelMenuButton.title = `Model: ${modelLabel}`
  effortMenuButton.title = `Reasoning effort: ${effortLabel}`
}

function setTerminalVisible(visible) {
  terminalCard.hidden = false
  messageList.hidden = !visible || state.roomLoading
  roomLoadingState.hidden = !state.roomLoading
  historyTopLoader.hidden = true
  emptyState.hidden = state.roomLoading || (visible && state.messages.length > 0)
}

function showRoomLoadingState() {
  roomLoadingState.hidden = false
  historyTopLoader.hidden = true
  messageList.hidden = true
  emptyState.hidden = true
}

function updateHistoryTopLoader() {
  historyTopLoader.hidden = !state.historyLoading || state.roomLoading || !state.activeRoomId
}

function isStreamNearBottom(threshold = STREAM_BOTTOM_THRESHOLD_PX) {
  return stream.scrollHeight - stream.scrollTop - stream.clientHeight <= threshold
}

function shouldAnimateUserMessage(message) {
  const expiresAt = state.recentUserMessages[message.time]
  if (!expiresAt) return false
  delete state.recentUserMessages[message.time]
  return Date.now() <= expiresAt
}

function capturePromptFocus() {
  if (document.activeElement !== promptInput || promptInput.disabled) return null
  return {
    start: promptInput.selectionStart,
    end: promptInput.selectionEnd,
    direction: promptInput.selectionDirection,
  }
}

function restorePromptFocus(snapshot) {
  if (!snapshot || promptInput.disabled) return
  requestAnimationFrame(() => {
    if (promptInput.disabled) return
    promptInput.focus({ preventScroll: true })
    promptInput.setSelectionRange(snapshot.start, snapshot.end, snapshot.direction || 'none')
  })
}

function setInputsEnabled(enabled) {
  const promptFocus = capturePromptFocus()
  const nextPromptDisabled = !enabled
  if (promptInput.disabled !== nextPromptDisabled) {
    if (nextPromptDisabled && promptFocus) state.restorePromptFocusWhenEnabled = true
    promptInput.disabled = nextPromptDisabled
  }
  const nextAttachDisabled = !enabled || state.uploadingAttachments
  if (attachButton.disabled !== nextAttachDisabled) attachButton.disabled = nextAttachDisabled
  ctrlCButton.disabled = !state.activeRoom?.alive
  escapeButton.disabled = !state.activeRoom?.alive
  updateComposerState()
  if (enabled && (promptFocus || state.restorePromptFocusWhenEnabled)) {
    state.restorePromptFocusWhenEnabled = false
    restorePromptFocus(promptFocus || { start: promptInput.value.length, end: promptInput.value.length, direction: 'none' })
  }
}

function updateComposerState() {
  const ready = !promptInput.disabled && !state.uploadingAttachments && Boolean(promptInput.value.trim() || state.pendingAttachments.length)
  sendButton.disabled = !ready
  sendButton.classList.toggle('ready', ready)
  attachButton.disabled = promptInput.disabled || state.uploadingAttachments
}

function setDraft(value) {
  promptInput.value = value || ''
  updateComposerState()
  autoGrowPrompt()
  promptInput.focus()
}

function sendPrompt() {
  const text = promptInput.value.trim()
  const attachments = [...state.pendingAttachments]
  if ((!text && !attachments.length) || state.uploadingAttachments) return
  if (text.toLowerCase() === '/usage') {
    promptInput.value = ''
    updateComposerState()
    autoGrowPrompt()
    runUsageCommand()
    return
  }
  closeComposerMenu()
  if (state.activeRoom?.alive) {
    enqueuePrompt(text, attachments)
    clearPromptDraft()
    return
  }
  if (!dispatchPromptPayload({ text, attachments })) return
  clearPromptDraft()
}

function dispatchPromptPayload(item, options = {}) {
  const text = String(item?.text ?? '').trim()
  const attachments = normalizeMessageAttachments(item?.attachments)
  if ((!text && !attachments.length) || (!options.queued && state.uploadingAttachments)) return false
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    terminalSummary.textContent = '연결 재시도 중'
    if (!options.queued) {
      setInputsEnabled(false)
      addActivity({ type: 'error', text: '서버 연결이 끊어져 재연결 중입니다. 잠시 후 다시 보내세요.' })
    }
    if (state.activeRoomId) scheduleSocketReconnect(state.activeRoomId)
    return false
  }
  const sentAt = new Date().toISOString()
  state.socket.send(JSON.stringify({
    type: 'input',
    text,
    attachments: attachments.map((item) => item.id).filter(Boolean),
    ...currentCodexSettingsPayload(item),
  }))
  notePromptDispatch(state.activeRoomId)
  if (state.activeRoom) {
    state.activeRoom.alive = true
    state.activeRoom.status = 'running'
    state.activeRoom.updatedAt = sentAt
    state.activeRoom.lastUserMessage = summarize(text || attachmentSummaryText(attachments), 120)
    upsertRoom(state.activeRoom)
  }
  state.recentUserMessages[sentAt] = Date.now() + USER_SEND_ANIMATION_MS
  state.restorePromptFocusWhenEnabled = true
  addActivity({ type: 'input', text, attachments, time: sentAt })
  rebuildMessagesFromEvents({ stickToBottom: true })
  if (state.activeRoom) {
    renderRoomHeader(state.activeRoom)
    renderRooms()
  }
  return true
}

function clearPromptDraft() {
  promptInput.value = ''
  state.pendingAttachments = []
  renderAttachmentTray()
  autoGrowPrompt()
  updateComposerState()
  promptInput.focus()
}

function enqueuePrompt(text, attachments = []) {
  if (!state.activeRoomId) return
  const queue = promptQueueForRoom(state.activeRoomId)
  queue.push({
    id: makeQueuedPromptId(),
    text: String(text ?? '').trim(),
    attachments: normalizeMessageAttachments(attachments),
    ...currentCodexSettingsPayload(),
    createdAt: new Date().toISOString(),
  })
  persistPromptQueues()
  renderQueuedPromptTray()
  renderRooms()
  updateComposerContextLabel()
  terminalSummary.textContent = `대기 중 · ${queue.length}개`
}

function flushPromptQueueSoon(roomId = state.activeRoomId, delay = QUEUED_PROMPT_FLUSH_DELAY_MS) {
  if (!roomId || !queuedPromptCount(roomId)) return
  if (state.promptQueueTimers[roomId]) clearTimeout(state.promptQueueTimers[roomId])
  state.promptQueueTimers[roomId] = window.setTimeout(() => {
    delete state.promptQueueTimers[roomId]
    flushPromptQueue(roomId)
  }, delay)
}

function flushPromptQueue(roomId = state.activeRoomId) {
  if (!roomId || state.activeRoomId !== roomId) return
  if (!state.activeRoom || state.activeRoom.archivedAt || state.activeRoom.trashedAt || state.activeRoom.alive) return
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
    scheduleSocketReconnect(roomId)
    return
  }
  const queue = promptQueueForRoom(roomId)
  if (!queue.length) return
  const item = queue.shift()
  if (!queue.length) delete state.promptQueues[roomId]
  persistPromptQueues()
  renderQueuedPromptTray()
  renderRooms()
  updateComposerContextLabel()
  if (!dispatchPromptPayload(item, { queued: true })) {
    promptQueueForRoom(roomId).unshift(item)
    persistPromptQueues()
    renderQueuedPromptTray()
    renderRooms()
    updateComposerContextLabel()
  }
}

function promptQueueForRoom(roomId) {
  if (!roomId) return []
  if (!state.promptQueues[roomId]) state.promptQueues[roomId] = []
  return state.promptQueues[roomId]
}

function persistPromptQueues() {
  localStorage.setItem(PROMPT_QUEUE_STORAGE_KEY, JSON.stringify(state.promptQueues))
}

function queuedPromptItems(roomId = state.activeRoomId) {
  return roomId ? state.promptQueues[roomId] || [] : []
}

function queuedPromptCount(roomId = state.activeRoomId) {
  return queuedPromptItems(roomId).length
}

function removeQueuedPrompt(roomId, itemId) {
  const queue = queuedPromptItems(roomId)
  state.promptQueues[roomId] = queue.filter((item) => item.id !== itemId)
  if (!state.promptQueues[roomId].length) delete state.promptQueues[roomId]
  persistPromptQueues()
  renderQueuedPromptTray()
  renderRooms()
  updateComposerContextLabel()
  promptInput.focus()
}

function renderQueuedPromptTray() {
  if (!queuedPromptTray) return
  const items = queuedPromptItems()
  queuedPromptTray.hidden = !items.length
  queuedPromptTray.innerHTML = items.map((item, index) => {
    const attachmentText = attachmentSummaryText(item.attachments)
    const textPreview = cleanDisplayMessage(item.text)
    const preview = textPreview || attachmentText || '첨부 파일'
    return `
      <div class="queued-prompt-item ${index === 0 ? 'next' : ''}">
        <span class="queued-prompt-status">${index === 0 ? '다음' : '대기'}</span>
        <span class="queued-prompt-text">${escapeHtml(preview)}</span>
        ${textPreview && item.attachments?.length ? `<span class="queued-prompt-files">${escapeHtml(attachmentText)}</span>` : ''}
        <button type="button" data-remove-queued-prompt="${escapeHtml(item.id)}" aria-label="대기 메시지 제거">×</button>
      </div>
    `
  }).join('')
  for (const button of queuedPromptTray.querySelectorAll('[data-remove-queued-prompt]')) {
    button.addEventListener('click', () => removeQueuedPrompt(state.activeRoomId, button.dataset.removeQueuedPrompt))
  }
}

function makeQueuedPromptId() {
  return window.crypto?.randomUUID?.() || `queued-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function notePromptDispatch(roomId) {
  if (!roomId) return
  state.pendingRunStarts[roomId] = Date.now() + PENDING_RUN_START_GUARD_MS
}

function clearPendingRunStart(roomId) {
  if (!roomId) return
  delete state.pendingRunStarts[roomId]
}

function roomWithPendingRunGuard(room) {
  if (!room?.id || room.alive) {
    if (room?.id && room.alive) clearPendingRunStart(room.id)
    return room
  }
  const expiresAt = state.pendingRunStarts[room.id]
  if (!expiresAt) return room
  if (Date.now() > expiresAt) {
    clearPendingRunStart(room.id)
    return room
  }
  const localRoom = state.rooms.find((item) => item.id === room.id)
  if (!localRoom?.alive) return room
  return {
    ...room,
    alive: true,
    status: 'running',
    pid: localRoom.pid ?? room.pid,
    command: room.command || localRoom.command,
  }
}

function updateComposerContextLabel() {
  if (!state.activeRoom) return
  contextLabel.textContent = composerContextText(state.activeRoom)
}

function composerContextText(room) {
  if (!room) return '채팅방 없음'
  const queuedCount = queuedPromptCount(room.id)
  if (room.trashedAt) return '휴지통'
  if (room.archivedAt) return '보관된 기록'
  if (room.alive) return queuedCount ? `실행 중 · 대기 ${queuedCount}개` : '실행 중 · 입력 예약 가능'
  if (queuedCount) return `대기 ${queuedCount}개 · 곧 실행`
  return room.agentSessionId ? 'resume 준비됨' : '입력 대기'
}

async function uploadAttachmentFiles(files) {
  const list = files.filter(Boolean)
  if (!list.length) return
  if (!canUploadAttachments()) throw new Error('첨부할 채팅방을 먼저 선택하세요.')
  const roomId = state.activeRoomId
  state.uploadingAttachments = true
  renderAttachmentTray()
  updateComposerState()
  try {
    const form = new FormData()
    for (const file of list) form.append('files', file, file.name)
    const response = await api(`/api/rooms/${roomId}/attachments`, {
      method: 'POST',
      body: form,
    })
    if (state.activeRoomId !== roomId) return
    const attachments = normalizeMessageAttachments(response.attachments)
    state.pendingAttachments.push(...attachments)
    if (!state.socket || state.socket.readyState !== WebSocket.OPEN) {
      addActivity({ type: 'attachment', text: `${attachments.length}개 파일 첨부됨` })
    }
  } finally {
    state.uploadingAttachments = false
    renderAttachmentTray()
    updateComposerState()
    promptInput.focus()
  }
}

function clipboardAttachmentFiles(clipboardData) {
  if (!clipboardData) return []
  const seen = new Set()
  const files = []
  const addFile = (file) => {
    if (!file) return
    const key = `${file.name}:${file.type}:${file.size}:${file.lastModified}`
    if (seen.has(key)) return
    seen.add(key)
    files.push(namedClipboardFile(file, files.length))
  }
  for (const file of Array.from(clipboardData.files || [])) addFile(file)
  if (!files.length) {
    for (const item of Array.from(clipboardData.items || [])) {
      if (item.kind !== 'file') continue
      addFile(item.getAsFile())
    }
  }
  return files
}

function namedClipboardFile(file, index = 0) {
  const name = cleanAttachmentName(file.name || '')
  if (name && name !== 'image.png' && name !== 'blob') return file
  const ext = extensionFromMime(file.type)
  const suffix = index ? `-${index + 1}` : ''
  const base = String(file.type || '').startsWith('image/') ? 'pasted-image' : 'pasted-file'
  try {
    return new File([file], `${base}-${Date.now()}${suffix}${ext}`, {
      type: file.type || 'application/octet-stream',
      lastModified: file.lastModified || Date.now(),
    })
  } catch {
    return file
  }
}

function extensionFromMime(mime) {
  const map = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
  }
  return map[String(mime || '').toLowerCase()] || ''
}

function canUploadAttachments() {
  return Boolean(state.activeRoomId && state.activeRoom && !state.activeRoom.archivedAt && !state.activeRoom.trashedAt && !state.roomLoading && !state.uploadingAttachments)
}

function renderAttachmentTray() {
  if (!attachmentTray) return
  const attachments = state.pendingAttachments
  attachmentTray.hidden = !attachments.length && !state.uploadingAttachments
  attachmentTray.innerHTML = `
    ${attachments.map((item) => `
      <span class="attachment-chip ${isImageAttachment(item) ? 'image' : 'file'}" title="${escapeHtml(item.path || item.name)}">
        ${isImageAttachment(item) ? `
          <img class="attachment-thumb" src="${escapeHtml(attachmentUrl(item))}" alt="${escapeHtml(item.name)}">
          <span class="attachment-name">${escapeHtml(item.name)}</span>
        ` : `
          <span class="attachment-icon">${escapeHtml(attachmentIcon(item))}</span>
          <span class="attachment-main">
            <span class="attachment-name">${escapeHtml(item.name)}</span>
            <span class="attachment-size">${escapeHtml(formatFileSize(item.size))}</span>
          </span>
        `}
        <button type="button" data-remove-attachment="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.name)} 제거">×</button>
      </span>
    `).join('')}
    ${state.uploadingAttachments ? '<span class="attachment-chip file uploading"><span class="attachment-icon">...</span><span class="attachment-main"><span class="attachment-name">업로드 중</span><span class="attachment-size">잠시만</span></span></span>' : ''}
  `
  for (const button of attachmentTray.querySelectorAll('[data-remove-attachment]')) {
    button.addEventListener('click', () => {
      state.pendingAttachments = state.pendingAttachments.filter((item) => item.id !== button.dataset.removeAttachment)
      renderAttachmentTray()
      updateComposerState()
      promptInput.focus()
    })
  }
}

function insertPromptText(text) {
  if (promptInput.disabled) return
  const start = promptInput.selectionStart ?? promptInput.value.length
  const end = promptInput.selectionEnd ?? start
  const next = `${promptInput.value.slice(0, start)}${text}${promptInput.value.slice(end)}`
  promptInput.value = next
  const cursor = start + text.length
  promptInput.setSelectionRange(cursor, cursor)
  promptInput.focus()
  updateComposerState()
  autoGrowPrompt()
}

function toggleComposerMenu(type) {
  if (promptInput.disabled && !['agent', 'model', 'effort', 'mode'].includes(type)) return
  state.composerMenuType = state.composerMenuType === type ? null : type
  renderComposerMenu()
  promptInput.focus()
}

function closeComposerMenu() {
  state.composerMenuType = null
  renderComposerMenu()
}

function syncComposerMenuFromDraft() {
  const value = promptInput.value
  const tail = value.split(/\s/).pop() || ''
  if (value.startsWith('/') && !value.includes(' ')) {
    state.composerMenuType = 'slash'
  } else if (tail.startsWith('@')) {
    state.composerMenuType = 'at'
  } else if (state.composerMenuType === 'slash' || state.composerMenuType === 'at') {
    state.composerMenuType = null
  }
  renderComposerMenu()
}

function renderComposerMenu() {
  if (!state.composerMenuType) {
    composerMenu.hidden = true
    composerMenu.innerHTML = ''
    return
  }

  const menu = composerMenuData(state.composerMenuType)
  composerMenu.hidden = false
  composerMenu.innerHTML = `
    <div class="composer-menu-title">${escapeHtml(menu.title)}</div>
    ${menu.items.map((item, index) => `
      <button class="composer-menu-item ${item.checked ? 'checked' : ''}" type="button" data-menu-index="${index}">
        ${item.icon ? `<img class="composer-menu-icon" src="${escapeHtml(item.icon)}" alt="" aria-hidden="true">` : ''}
        <span class="menu-name">${escapeHtml(item.name)}</span>
        <span class="menu-desc">${escapeHtml(item.desc)}</span>
        ${item.checked ? '<span class="menu-check">✓</span>' : ''}
      </button>
    `).join('')}
  `

  for (const button of composerMenu.querySelectorAll('[data-menu-index]')) {
    button.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      const item = menu.items[Number(button.dataset.menuIndex)]
      item?.pick?.()
    })
  }
}

function composerMenuData(type) {
  if (type === 'slash') {
    const query = promptInput.value.trim().toLowerCase()
    const items = SLASH_COMMANDS
      .filter((item) => item.name.startsWith(query || '/') || query === '/')
      .map((item) => ({
        ...item,
        checked: false,
        pick: () => pickSlashCommand(item.name),
      }))
    return { title: '커맨드', items: items.length ? items : SLASH_COMMANDS.map((item) => ({ ...item, checked: false, pick: () => pickSlashCommand(item.name) })) }
  }

  if (type === 'at') {
    const tail = (promptInput.value.split(/\s/).pop() || '').slice(1).toLowerCase()
    const files = fileMentionItems().filter((item) => item.name.toLowerCase().includes(tail))
    return {
      title: '파일 멘션',
      items: (files.length ? files : fileMentionItems()).map((item) => ({
        ...item,
        checked: false,
        pick: () => pickFileMention(item.name),
      })),
    }
  }

  if (type === 'agent') {
    const currentAgent = state.activeRoom?.agent || agentInput.value || 'codex'
    const canChangeCurrentRoom = roomCanChangeAgent(state.activeRoom, state.events)
    return {
      title: '실행 엔진',
      items: state.agentOptions.map((item) => ({
        ...item,
        desc: item.id === currentAgent
          ? `${item.desc} · 현재 채팅`
          : `${item.desc} · ${canChangeCurrentRoom ? '현재 채팅에서 변경' : '새 채팅에서 사용'}`,
        checked: item.id === currentAgent,
        pick: () => pickAgent(item.id),
      })),
    }
  }

  if (type === 'model') {
    const agent = state.activeRoom?.agent || agentInput.value || 'codex'
    if (agent === 'claude') {
      const resolvedModel = currentResolvedClaudeModel()
      return {
        title: '모델',
        items: claudeModelOptions().map((item) => ({
          id: item.id,
          name: item.shortName || item.name,
          desc: item.description || item.name,
          checked: item.id === resolvedModel,
          pick: () => pickClaudeModel(item.id),
        })),
      }
    }
    const resolvedModel = currentResolvedCodexModel()
    return {
      title: '모델',
      items: codexModelOptions().map((item) => ({
        id: item.id,
        name: item.shortName || item.name,
        desc: item.description || item.name,
        checked: item.id === resolvedModel,
        pick: () => pickCodexModel(item.id),
      })),
    }
  }

  if (type === 'effort') {
    const agent = state.activeRoom?.agent || agentInput.value || 'codex'
    if (agent === 'claude') {
      const resolvedEffort = currentResolvedClaudeEffort()
      return {
        title: 'Reasoning Effort',
        items: currentClaudeEffortOptions().map((item) => ({
          id: item.id,
          name: item.name,
          desc: item.description,
          checked: item.id === resolvedEffort,
          pick: () => pickClaudeEffort(item.id),
        })),
      }
    }
    const resolvedEffort = currentResolvedCodexEffort()
    return {
      title: 'Reasoning Effort',
      items: currentCodexEffortOptions().map((item) => ({
        id: item.id,
        name: item.name,
        desc: item.description,
        checked: item.id === resolvedEffort,
        pick: () => pickCodexEffort(item.id),
      })),
    }
  }

  const running = Boolean(state.activeRoom?.alive)
  const items = PERMISSION_MODE_ITEMS.map((item) => ({
    ...item,
    checked: item.id === currentSettingsMode(),
    pick: () => pickMode(item.id),
  }))
  items.push({
    id: 'settings',
    name: '채팅 설정 열기',
    desc: '권한과 샌드박스를 자세히 조정',
    checked: false,
    pick: openRoomSettingsDialog,
  })
  if (running) {
    items.push({
      id: 'stop',
      name: 'Stop current turn',
      desc: '실행 중인 턴을 중단',
      checked: false,
      pick: () => pickMode('stop'),
    })
  }
  return {
    title: '권한',
    items,
  }
}

function pickSlashCommand(name) {
  if (name === '/permissions') {
    openRoomSettingsDialog()
    return
  }
  if (name === '/model') {
    state.composerMenuType = 'model'
    renderComposerMenu()
    return
  }
  if (name === '/usage') {
    promptInput.value = ''
    updateComposerState()
    autoGrowPrompt()
    runUsageCommand()
    return
  }
  if (name === '/clear') {
    state.messages = []
    promptInput.value = ''
    closeComposerMenu()
    renderMessages()
    updateComposerState()
    return
  }
  promptInput.value = `${name} `
  promptInput.focus()
  closeComposerMenu()
  updateComposerState()
  autoGrowPrompt()
}

async function runUsageCommand() {
  if (!state.activeRoomId || state.usageLoading) return
  const roomId = state.activeRoomId
  state.usageLoading = true
  closeComposerMenu()
  terminalSummary.textContent = '사용량 확인 중'
  try {
    const usage = await api(`/api/rooms/${roomId}/usage`)
    if (state.activeRoomId !== roomId) return
    state.events.push({
      type: 'usage_summary',
      text: usage.available ? 'Usage summary' : usage.message,
      usage,
      time: new Date().toISOString(),
    })
    rebuildMessagesFromEvents({ stickToBottom: true })
    terminalSummary.textContent = usage.available ? '사용량 확인됨' : '사용량 없음'
  } catch (err) {
    showUiError(err, '사용량을 확인하지 못했습니다.')
  } finally {
    state.usageLoading = false
    promptInput.focus()
  }
}

function pickFileMention(name) {
  const parts = promptInput.value.split(/(\s)/)
  let replaced = false
  for (let index = parts.length - 1; index >= 0; index -= 1) {
    if (parts[index].startsWith('@')) {
      parts[index] = `@${name} `
      replaced = true
      break
    }
  }
  promptInput.value = replaced ? parts.join('') : `${promptInput.value}@${name} `
  promptInput.focus()
  closeComposerMenu()
  updateComposerState()
  autoGrowPrompt()
}

function pickAgent(agent) {
  const currentAgent = state.activeRoom?.agent || 'codex'
  closeComposerMenu()
  if (agent === currentAgent) return
  if (roomCanChangeAgent(state.activeRoom, state.events)) {
    updateRoomAgent(agent).catch((err) => showUiError(err, '현재 채팅의 실행 엔진을 변경하지 못했습니다.'))
    return
  }
  createRoom({ agent, draft: promptInput.value.trim() }).catch((err) => showUiError(err, '새 채팅을 만들지 못했습니다.'))
}

async function updateRoomAgent(agent) {
  const roomId = state.activeRoom?.id
  if (!roomId || !roomCanChangeAgent(state.activeRoom, state.events)) return

  const previous = { ...state.activeRoom }
  const next = {
    ...state.activeRoom,
    agent,
    execution: {
      ...(state.activeRoom.execution || {}),
      provider: agent,
    },
  }
  state.activeRoom = next
  upsertRoom(next)
  renderRoomHeader(next)
  renderRooms()

  try {
    const response = await api(`/api/rooms/${roomId}`, {
      method: 'PATCH',
      body: JSON.stringify({ agent, ...currentCodexSettingsPayload({ agent }) }),
    })
    upsertRoom(response.room)
    if (state.activeRoomId === roomId) renderRoomHeader(response.room)
    renderRooms()
  } catch (err) {
    upsertRoom(previous)
    if (state.activeRoomId === roomId) renderRoomHeader(previous)
    renderRooms()
    throw err
  }
}

function pickCodexModel(model) {
  updateCodexSettings({ codexModel: model }).catch((err) => showUiError(err, 'Codex 모델을 변경하지 못했습니다.'))
}

function pickCodexEffort(effort) {
  updateCodexSettings({ codexEffort: effort }).catch((err) => showUiError(err, 'Codex reasoning을 변경하지 못했습니다.'))
}

async function updateCodexSettings(changes = {}) {
  closeComposerMenu()
  const codexModel = Object.prototype.hasOwnProperty.call(changes, 'codexModel')
    ? normalizeCodexModel(changes.codexModel)
    : currentCodexModel()
  const codexEffort = Object.prototype.hasOwnProperty.call(changes, 'codexEffort')
    ? normalizeCodexEffort(changes.codexEffort)
    : currentCodexEffort()

  if (!state.activeRoom || state.activeRoom.agent !== 'codex') {
    state.defaultCodexModel = codexModel
    state.defaultCodexEffort = codexEffort
    localStorage.setItem('devai_codex_model', codexModel)
    localStorage.setItem('devai_codex_effort', codexEffort)
    renderEmptyRoom()
    return
  }

  const previous = { ...state.activeRoom }
  const resolvedModel = codexModel || currentResolvedCodexModel(state.activeRoom)
  const resolvedEffort = codexEffort || currentResolvedCodexEffort(state.activeRoom)
  const next = {
    ...state.activeRoom,
    codexModel,
    codexEffort,
    resolvedModel,
    resolvedEffort,
    execution: {
      ...(state.activeRoom.execution || {}),
      provider: 'codex',
      model: codexModel || 'default',
      resolvedModel,
      effort: codexEffort || 'default',
      resolvedEffort,
    },
  }
  state.activeRoom = next
  upsertRoom(next)
  renderRoomHeader(next)
  renderRooms()
  updateRoomSettingsDialog()

  try {
    const response = await api(`/api/rooms/${next.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ codexModel, codexEffort }),
    })
    state.activeRoom = response.room
    upsertRoom(response.room)
    renderRoomHeader(response.room)
    renderRooms()
  } catch (err) {
    state.activeRoom = previous
    upsertRoom(previous)
    renderRoomHeader(previous)
    renderRooms()
    if (isStaleCodexSettingsServerError(err)) {
      throw new Error('devi 서버 재시작이 필요합니다. 현재 백엔드가 아직 이전 room 설정 API를 사용 중입니다.')
    }
    throw err
  }
}

function isStaleCodexSettingsServerError(err) {
  return err?.status === 400 && /title is required|supported room fields/i.test(err?.message || '')
}

function pickClaudeModel(model) {
  updateClaudeSettings({ claudeModel: model }).catch((err) => showUiError(err, 'Claude 모델을 변경하지 못했습니다.'))
}

function pickClaudeEffort(effort) {
  updateClaudeSettings({ claudeEffort: effort }).catch((err) => showUiError(err, 'Claude reasoning을 변경하지 못했습니다.'))
}

async function updateClaudeSettings(changes = {}) {
  closeComposerMenu()
  const claudeModel = Object.prototype.hasOwnProperty.call(changes, 'claudeModel')
    ? normalizeClaudeModel(changes.claudeModel)
    : currentClaudeModel()
  const claudeEffort = Object.prototype.hasOwnProperty.call(changes, 'claudeEffort')
    ? normalizeClaudeEffort(changes.claudeEffort)
    : currentClaudeEffort()

  if (!state.activeRoom || state.activeRoom.agent !== 'claude') {
    state.defaultClaudeModel = claudeModel
    state.defaultClaudeEffort = claudeEffort
    localStorage.setItem('devai_claude_model', claudeModel)
    localStorage.setItem('devai_claude_effort', claudeEffort)
    renderEmptyRoom()
    return
  }

  const previous = { ...state.activeRoom }
  const resolvedModel = claudeModel || currentResolvedClaudeModel(state.activeRoom)
  const resolvedEffort = claudeEffort || currentResolvedClaudeEffort(state.activeRoom)
  const next = {
    ...state.activeRoom,
    claudeModel,
    claudeEffort,
    resolvedModel,
    resolvedEffort,
    execution: {
      ...(state.activeRoom.execution || {}),
      provider: 'claude',
      model: claudeModel || 'default',
      resolvedModel,
      effort: claudeEffort || 'default',
      resolvedEffort,
    },
  }
  state.activeRoom = next
  upsertRoom(next)
  renderRoomHeader(next)
  renderRooms()
  updateRoomSettingsDialog()

  try {
    const response = await api(`/api/rooms/${next.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ claudeModel, claudeEffort }),
    })
    state.activeRoom = response.room
    upsertRoom(response.room)
    renderRoomHeader(response.room)
    renderRooms()
  } catch (err) {
    state.activeRoom = previous
    upsertRoom(previous)
    renderRoomHeader(previous)
    renderRooms()
    throw err
  }
}

function pickMode(mode) {
  closeComposerMenu()
  if (mode === 'stop' && state.activeRoom?.alive) sendControl('\u001b')
  else setSettingsMode(mode)
}

function fileMentionItems() {
  const files = new Map()
  for (const event of state.events) {
    if (event.type === 'attachment' && event.attachment?.path) {
      files.set(event.attachment.path, event.attachment.name || '첨부 파일')
    }
    if (event.type === 'input' && Array.isArray(event.attachments)) {
      for (const item of event.attachments) if (item.path) files.set(item.path, item.name || '첨부 파일')
    }
    if (event.type === 'files' && Array.isArray(event.items)) {
      for (const item of event.items) if (item.path) files.set(item.path, item.op || '변경됨')
    }
    if (event.type === 'diff' && Array.isArray(event.files)) {
      for (const item of event.files) if (item.path) files.set(item.path, `${item.add || 0}+ / ${item.del || 0}-`)
    }
  }
  const fallback = [
    ['src/server.js', 'devi backend'],
    ['public/app.js', '웹 UI logic'],
    ['public/styles.css', '웹 UI styles'],
    ['public/index.html', '웹 UI shell'],
    ['WORKLOG.md', '작업 기록'],
  ]
  for (const [name, desc] of fallback) {
    if (!files.has(name)) files.set(name, desc)
  }
  return [...files.entries()].slice(0, 12).map(([name, desc]) => ({ name, desc: String(desc) }))
}

function openNewRoomDialog(initialPrompt = '') {
  roomNameInput.value = ''
  initialPromptInput.value = initialPrompt
  cwdInput.value = preferredNewRoomCwd()
  renderWorkDirQuickPicks(cwdQuickPicks, cwdInput.value)
  newRoomDialog.showModal()
  initialPromptInput.focus()
}

async function createRoom(options = {}) {
  if (state.creatingRoom) return null
  state.creatingRoom = true
  newRoomButton.disabled = true
  try {
    const draft = cleanDisplayMessage(options.draft)
    const response = await api('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({
        title: '',
        agent: options.agent || state.activeRoom?.agent || agentInput.value || 'codex',
        cwd: options.cwd || preferredNewRoomCwd(),
        initialPrompt: '',
        ...currentCodexSettingsPayload(options),
        cols: terminalSize().cols,
        rows: terminalSize().rows,
      }),
    })
    upsertRoom(response.room)
    await loadRooms()
    await selectRoom(response.room.id, { keepTerminal: false })
    if (draft) setDraft(draft)
    return response.room
  } finally {
    state.creatingRoom = false
    newRoomButton.disabled = false
  }
}

function openSettingsDialog() {
  closeComposerMenu()
  updateSettingsDialog()
  if (!settingsDialog.open) settingsDialog.showModal()
  loadStorageUsage().catch((err) => showUiError(err, '저장공간 사용량을 확인하지 못했습니다.'))
}

function closeSettingsDialog() {
  if (settingsDialog.open) settingsDialog.close()
}

function updateSettingsDialog() {
  if (!settingsDialog) return
  const trashRooms = state.rooms.filter((room) => room.trashedAt)
  settingsActiveTitle.textContent = userDisplayName(state.user)
  settingsUserLabel.textContent = `${userDisplayName(state.user)} · Unipass`
  settingsThemeLabel.textContent = state.theme
  settingsTrashCount.textContent = String(trashRooms.length)
  settingsGeneralPanel.hidden = state.settingsPanel !== 'general'
  settingsTrashPanel.hidden = state.settingsPanel !== 'trash'
  for (const button of settingsNavButtons) {
    const active = button.dataset.settingsPanel === state.settingsPanel
    button.classList.toggle('active', active)
    button.setAttribute('aria-current', active ? 'page' : 'false')
  }
  renderSettingsTrash(trashRooms)
  renderStorageUsage()
}

async function loadStorageUsage() {
  if (state.storageLoading) return
  state.storageLoading = true
  renderStorageUsage()
  try {
    state.storageUsage = await api('/api/storage')
  } finally {
    state.storageLoading = false
    renderStorageUsage()
  }
}

function renderStorageUsage() {
  if (!storageUsageLabel) return
  storageRefreshButton.disabled = state.storageLoading
  storageRefreshButton.textContent = state.storageLoading ? '확인 중' : '새로고침'
  const usage = state.storageUsage
  if (!usage) {
    storageUsageLabel.textContent = state.storageLoading ? '사용량 확인 중' : '확인 전'
    storageUsagePercent.textContent = '—'
    storageUsageBar.style.width = '0%'
    storageUsageTrack.setAttribute('aria-valuenow', '0')
    return
  }
  const percent = Math.max(0, Math.min(100, Number(usage.usedPercent) || 0))
  storageUsageLabel.textContent = `${formatFileSize(usage.usedBytes) || '0 B'} / ${formatFileSize(usage.totalQuotaBytes)}`
  storageUsagePercent.textContent = `${percent.toFixed(percent < 1 ? 2 : 1)}%`
  storageUsageBar.style.width = `${percent}%`
  storageUsageTrack.setAttribute('aria-valuenow', String(percent))
  storageUsageTrack.dataset.level = usage.level || 'normal'
  storageRetentionLabel.textContent = `휴지통 ${usage.retention?.trashDays ?? 7}일 · 임시·고아 파일 ${usage.retention?.orphanHours ?? 24}시간`
  storageFileCount.textContent = `${Number(usage.fileCount || 0).toLocaleString('ko-KR')}개 파일 · 방별 ${formatFileSize(usage.roomQuotaBytes)}`
}

function renderSettingsTrash(trashRooms = state.rooms.filter((room) => room.trashedAt)) {
  if (!settingsTrashList) return
  if (!trashRooms.length) {
    settingsTrashList.innerHTML = '<div class="settings-trash-empty">휴지통이 비어 있습니다.</div>'
    return
  }
  settingsTrashList.innerHTML = trashRooms.map((room) => {
    const deleting = room.id === state.permanentlyDeletingRoomId
    const preview = room.lastUserMessage || room.cwd
    return `
      <div class="settings-trash-item">
        <span class="settings-trash-main">
          <span class="settings-trash-title">${escapeHtml(room.title)}</span>
          <span class="settings-trash-meta">${escapeHtml(formatTime(room.trashedAt))} · ${escapeHtml(preview)}</span>
        </span>
        <button class="settings-trash-delete" type="button" data-permanent-delete-room-id="${escapeHtml(room.id)}" ${deleting ? 'disabled' : ''}>${deleting ? '삭제 중' : '영구 삭제'}</button>
      </div>
    `
  }).join('')

  for (const button of settingsTrashList.querySelectorAll('[data-permanent-delete-room-id]')) {
    button.addEventListener('click', () => {
      permanentlyDeleteRoom(button.dataset.permanentDeleteRoomId)
    })
  }
}

function openRoomSettingsDialog() {
  if (!state.activeRoomId) return
  closeComposerMenu()
  state.roomWorkDirStatus = ''
  roomSettingsWorkDirInput.value = state.activeRoom?.cwd || cwdInput.value || state.workspaces[0]?.path || '/workspace'
  updateRoomSettingsDialog()
  if (!roomSettingsDialog.open) roomSettingsDialog.showModal()
}

function closeRoomSettingsDialog() {
  if (roomSettingsDialog.open) roomSettingsDialog.close()
}

function updateRoomSettingsDialog() {
  if (!roomSettingsDialog) return
  const mode = currentSettingsMode()
  const room = state.activeRoom
  const currentWorkDir = room?.cwd || cwdInput.value || state.workspaces[0]?.path || '/workspace'
  const canEditWorkDir = Boolean(room && !room.alive && !room.archivedAt && !room.trashedAt && !state.roomLoading)
  if (document.activeElement !== roomSettingsWorkDirInput) roomSettingsWorkDirInput.value = currentWorkDir
  const draftWorkDir = cleanDisplayMessage(roomSettingsWorkDirInput.value)
  const workDirChanged = Boolean(draftWorkDir && draftWorkDir !== currentWorkDir)
  roomSettingsActiveTitle.textContent = room?.title || '채팅방 없음'
  roomSettingsWorkDirInput.disabled = !canEditWorkDir || state.savingRoomWorkDir
  renderWorkDirQuickPicks(roomSettingsWorkDirQuickPicks, draftWorkDir || currentWorkDir, {
    disabled: !canEditWorkDir || state.savingRoomWorkDir,
  })
  roomSettingsWorkDirSave.disabled = !canEditWorkDir || state.savingRoomWorkDir || !workDirChanged
  roomSettingsWorkDirSave.textContent = state.savingRoomWorkDir ? '저장 중' : '저장'
  roomSettingsWorkDirStatus.textContent = state.roomWorkDirStatus || (
    room?.alive
      ? '실행 중에는 변경할 수 없습니다.'
      : canEditWorkDir ? '다음 턴부터 적용됩니다.' : ''
  )
  roomSettingsAgentLabel.textContent = room ? `${room.agent === 'claude' ? 'Claude' : 'Codex'} · ${room.trashedAt ? '휴지통' : room.archivedAt ? '보관됨' : room.alive ? '진행 중' : statusLabel(room.status)}` : '채팅방 없음'
  if (room?.id) {
    roomSettingsDownloadLog.href = `/api/rooms/${room.id}/log`
    roomSettingsDownloadLog.classList.remove('disabled')
    roomSettingsDownloadLog.setAttribute('aria-disabled', 'false')
  } else {
    roomSettingsDownloadLog.href = '#'
    roomSettingsDownloadLog.classList.add('disabled')
    roomSettingsDownloadLog.setAttribute('aria-disabled', 'true')
  }
  for (const button of $$('[data-settings-mode]')) {
    const active = button.dataset.settingsMode === mode
    button.classList.toggle('active', active)
    button.disabled = button.dataset.settingsMode !== 'full'
    button.setAttribute('aria-pressed', String(active))
    button.setAttribute('aria-disabled', String(button.disabled))
  }
  for (const button of $$('[data-settings-toggle]')) {
    const active = true
    button.classList.toggle('active', active)
    button.disabled = true
    button.setAttribute('aria-pressed', String(active))
    button.setAttribute('aria-disabled', 'true')
  }
  modeLabel.textContent = settingsModeLabel()
  modeMenuText.textContent = settingsModeShortLabel()
}

async function saveRoomWorkDir() {
  const room = state.activeRoom
  if (!room || state.savingRoomWorkDir) return
  if (room.alive) {
    state.roomWorkDirStatus = '실행 중에는 변경할 수 없습니다.'
    updateRoomSettingsDialog()
    return
  }
  const cwd = cleanDisplayMessage(roomSettingsWorkDirInput.value)
  if (!cwd || cwd === room.cwd) {
    updateRoomSettingsDialog()
    return
  }

  state.savingRoomWorkDir = true
  state.roomWorkDirStatus = ''
  updateRoomSettingsDialog()
  try {
    const response = await api(`/api/rooms/${room.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: room.title, cwd }),
    })
    state.activeRoom = response.room
    upsertRoom(response.room)
    renderRoomHeader(response.room)
    renderRooms()
    roomSettingsWorkDirInput.value = response.room.cwd
    state.roomWorkDirStatus = response.room.cwd === room.cwd && cwd !== room.cwd
      ? '서버 재시작 후 적용됩니다.'
      : '저장됨'
  } catch (err) {
    state.roomWorkDirStatus = err?.message || '저장 실패'
    throw err
  } finally {
    state.savingRoomWorkDir = false
    updateRoomSettingsDialog()
  }
}

function updateProfile() {
  const name = userDisplayName(state.user)
  const sub = state.user?.handle ? `@${state.user.handle} · Unipass 연결됨` : 'Unipass 연결됨'
  profileName.textContent = name
  profileSub.textContent = sub
  profileAvatar.textContent = initials(name)
}

function setSettingsMode(mode) {
  if (!PERMISSION_MODES[mode]) return
  if (mode !== 'full') {
    showUiError(new Error('현재 서버에서는 Codex sandbox 문제 때문에 Full access로 고정되어 있습니다.'), '실행 모드를 변경하지 못했습니다.')
    updateRoomSettingsDialog()
    return
  }
  if (state.activeRoomId) {
    state.roomModes[state.activeRoomId] = mode
    localStorage.setItem('devai_room_modes', JSON.stringify(state.roomModes))
  } else {
    state.defaultSettingsMode = mode
    localStorage.setItem('devai_settings_mode', mode)
  }
  updateSettingsDialog()
  updateRoomSettingsDialog()
  renderRooms()
}

function currentSettingsMode() {
  return 'full'
}

function currentCodexModel(source = null) {
  if (source && Object.prototype.hasOwnProperty.call(source, 'codexModel')) return normalizeCodexModel(source.codexModel)
  if (state.activeRoom && state.activeRoom.agent === 'codex') return normalizeCodexModel(state.activeRoom.codexModel)
  return normalizeCodexModel(state.defaultCodexModel)
}

function currentCodexEffort(source = null) {
  if (source && Object.prototype.hasOwnProperty.call(source, 'codexEffort')) return normalizeCodexEffort(source.codexEffort)
  if (state.activeRoom && state.activeRoom.agent === 'codex') return normalizeCodexEffort(state.activeRoom.codexEffort)
  return normalizeCodexEffort(state.defaultCodexEffort)
}

function currentCodexSettingsPayload(source = {}) {
  const agent = source.agent || state.activeRoom?.agent || agentInput.value || 'codex'
  if (agent === 'claude') {
    return {
      claudeModel: currentClaudeModel(source),
      claudeEffort: currentClaudeEffort(source),
    }
  }
  if (agent !== 'codex') return {}
  return {
    codexModel: currentCodexModel(source),
    codexEffort: currentCodexEffort(source),
  }
}

function normalizeCodexModel(value) {
  const model = String(value ?? '').trim().toLowerCase()
  return codexModelOptions().some((item) => item.id === model) ? model : ''
}

function normalizeCodexEffort(value) {
  const effort = String(value ?? '').trim().toLowerCase()
  return allCodexEffortOptions().some((item) => item.id === effort) ? effort : ''
}

function codexModelOptions() {
  return Array.isArray(state.codexSettings?.models) ? state.codexSettings.models : []
}

function allCodexEffortOptions() {
  const byId = new Map()
  for (const model of codexModelOptions()) {
    for (const effort of model.efforts || []) {
      if (effort?.id && !byId.has(effort.id)) byId.set(effort.id, effort)
    }
  }
  return [...byId.values()]
}

function currentCodexEffortOptions(source = null) {
  const model = codexModelOptions().find((item) => item.id === currentResolvedCodexModel(source))
  const options = [...(model?.efforts || [])]
  const resolvedEffort = currentResolvedCodexEffort(source)
  if (resolvedEffort && !options.some((item) => item.id === resolvedEffort)) {
    const known = allCodexEffortOptions().find((item) => item.id === resolvedEffort)
    options.push(known || {
      id: resolvedEffort,
      name: titleCaseSetting(resolvedEffort),
      description: '현재 CLI에 적용된 reasoning effort',
    })
  }
  return options
}

function currentResolvedCodexModel(source = null) {
  const selected = currentCodexModel(source)
  if (selected) return selected
  if (source?.execution?.resolvedModel) return String(source.execution.resolvedModel).toLowerCase()
  if (source?.resolvedModel) return String(source.resolvedModel).toLowerCase()
  if (state.activeRoom?.agent === 'codex' && state.activeRoom.execution?.resolvedModel) {
    return String(state.activeRoom.execution.resolvedModel).toLowerCase()
  }
  return normalizeCodexModel(state.defaultCodexModel) || String(state.codexSettings?.resolvedModel || '').toLowerCase()
}

function currentResolvedCodexEffort(source = null) {
  const selected = currentCodexEffort(source)
  if (selected) return selected
  if (source?.execution?.resolvedEffort) return String(source.execution.resolvedEffort).toLowerCase()
  if (source?.resolvedEffort) return String(source.resolvedEffort).toLowerCase()
  if (state.activeRoom?.agent === 'codex' && state.activeRoom.execution?.resolvedEffort) {
    return String(state.activeRoom.execution.resolvedEffort).toLowerCase()
  }
  return normalizeCodexEffort(state.defaultCodexEffort) || String(state.codexSettings?.resolvedEffort || '').toLowerCase()
}

function resolvedCodexModelLabel(source = null) {
  const resolvedModel = currentResolvedCodexModel(source)
  const option = codexModelOptions().find((item) => item.id === resolvedModel)
  return option?.shortName || option?.name || resolvedModel || '—'
}

function resolvedCodexEffortLabel(source = null) {
  const effort = currentResolvedCodexEffort(source)
  return allCodexEffortOptions().find((item) => item.id === effort)?.name || titleCaseSetting(effort) || '—'
}

function titleCaseSetting(value) {
  const text = String(value || '').trim()
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : ''
}

function codexSettingsLabel(source = null) {
  return `${resolvedCodexModelLabel(source)} · ${resolvedCodexEffortLabel(source)}`
}

function codexRoomMetaLabel(room) {
  return ` · ${codexSettingsLabel(room)}`
}

function currentClaudeModel(source = null) {
  if (source && Object.prototype.hasOwnProperty.call(source, 'claudeModel')) return normalizeClaudeModel(source.claudeModel)
  if (state.activeRoom && state.activeRoom.agent === 'claude') return normalizeClaudeModel(state.activeRoom.claudeModel)
  return normalizeClaudeModel(state.defaultClaudeModel)
}

function currentClaudeEffort(source = null) {
  if (source && Object.prototype.hasOwnProperty.call(source, 'claudeEffort')) return normalizeClaudeEffort(source.claudeEffort)
  if (state.activeRoom && state.activeRoom.agent === 'claude') return normalizeClaudeEffort(state.activeRoom.claudeEffort)
  return normalizeClaudeEffort(state.defaultClaudeEffort)
}

function normalizeClaudeModel(value) {
  const model = String(value ?? '').trim().toLowerCase()
  return claudeModelOptions().some((item) => item.id === model) ? model : ''
}

function normalizeClaudeEffort(value) {
  const effort = String(value ?? '').trim().toLowerCase()
  return allClaudeEffortOptions().some((item) => item.id === effort) ? effort : ''
}

function claudeModelOptions() {
  return Array.isArray(state.claudeSettings?.models) ? state.claudeSettings.models : []
}

function allClaudeEffortOptions() {
  const byId = new Map()
  for (const model of claudeModelOptions()) {
    for (const effort of model.efforts || []) {
      if (effort?.id && !byId.has(effort.id)) byId.set(effort.id, effort)
    }
  }
  return [...byId.values()]
}

function currentClaudeEffortOptions(source = null) {
  const model = claudeModelOptions().find((item) => item.id === currentResolvedClaudeModel(source))
  const options = [...(model?.efforts || [])]
  const resolvedEffort = currentResolvedClaudeEffort(source)
  if (resolvedEffort && !options.some((item) => item.id === resolvedEffort)) {
    const known = allClaudeEffortOptions().find((item) => item.id === resolvedEffort)
    options.push(known || {
      id: resolvedEffort,
      name: titleCaseSetting(resolvedEffort),
      description: '현재 CLI에 적용된 reasoning effort',
    })
  }
  return options
}

function currentResolvedClaudeModel(source = null) {
  const selected = currentClaudeModel(source)
  if (selected) return selected
  if (source?.execution?.resolvedModel) return String(source.execution.resolvedModel).toLowerCase()
  if (source?.resolvedModel) return String(source.resolvedModel).toLowerCase()
  if (state.activeRoom?.agent === 'claude' && state.activeRoom.execution?.resolvedModel) {
    return String(state.activeRoom.execution.resolvedModel).toLowerCase()
  }
  return normalizeClaudeModel(state.defaultClaudeModel) || String(state.claudeSettings?.resolvedModel || '').toLowerCase()
}

function currentResolvedClaudeEffort(source = null) {
  const selected = currentClaudeEffort(source)
  if (selected) return selected
  if (source?.execution?.resolvedEffort) return String(source.execution.resolvedEffort).toLowerCase()
  if (source?.resolvedEffort) return String(source.resolvedEffort).toLowerCase()
  if (state.activeRoom?.agent === 'claude' && state.activeRoom.execution?.resolvedEffort) {
    return String(state.activeRoom.execution.resolvedEffort).toLowerCase()
  }
  return normalizeClaudeEffort(state.defaultClaudeEffort) || String(state.claudeSettings?.resolvedEffort || '').toLowerCase()
}

function resolvedClaudeModelLabel(source = null) {
  const resolvedModel = currentResolvedClaudeModel(source)
  const option = claudeModelOptions().find((item) => item.id === resolvedModel)
  return option?.shortName || option?.name || resolvedModel || '—'
}

function resolvedClaudeEffortLabel(source = null) {
  const effort = currentResolvedClaudeEffort(source)
  return allClaudeEffortOptions().find((item) => item.id === effort)?.name || titleCaseSetting(effort) || '—'
}

function claudeSettingsLabel(source = null) {
  return `${resolvedClaudeModelLabel(source)} · ${resolvedClaudeEffortLabel(source)}`
}

function claudeRoomMetaLabel(room) {
  return ` · ${claudeSettingsLabel(room)}`
}

function settingsModeLabel() {
  return PERMISSION_MODES[currentSettingsMode()].label
}

function settingsModeShortLabel() {
  return PERMISSION_MODES[currentSettingsMode()].short
}

function startTitleEdit() {
  if (!state.activeRoomId || roomTitle.isContentEditable) return
  state.titleEditingOriginal = state.activeRoom?.title || roomTitle.textContent
  roomTitle.contentEditable = 'true'
  roomTitle.spellcheck = false
  roomTitle.classList.add('editing')
  roomTitle.focus()
  const range = document.createRange()
  range.selectNodeContents(roomTitle)
  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)
}

async function finishTitleEdit(options = {}) {
  if (!roomTitle.isContentEditable) return
  const original = state.titleEditingOriginal || state.activeRoom?.title || '새 채팅'
  const next = cleanTitleInput(roomTitle.textContent)
  state.titleEditingOriginal = null
  roomTitle.contentEditable = 'false'
  roomTitle.classList.remove('editing')
  window.getSelection()?.removeAllRanges()
  if (options.cancel || !next) {
    roomTitle.textContent = state.activeRoom?.title || original
    return
  }
  if (next === state.activeRoom?.title) {
    roomTitle.textContent = next
    return
  }
  try {
    const response = await api(`/api/rooms/${state.activeRoomId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: next }),
    })
    state.activeRoom = response.room
    upsertRoom(response.room)
    renderRoomHeader(response.room)
    renderRooms()
  } catch (err) {
    roomTitle.textContent = state.activeRoom?.title || original
    showUiError(err, '채팅방 이름을 저장하지 못했습니다.')
  }
}

function autoGrowPrompt() {
  promptInput.style.height = 'auto'
  promptInput.style.height = `${Math.min(promptInput.scrollHeight, 180)}px`
}

function sendControl(data) {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return
  if (state.activeRoom?.alive || data === '\u0003' || data === '\u001b') {
    state.socket.send(JSON.stringify({ type: 'stop' }))
  }
}

function sendResize() {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return
  state.socket.send(JSON.stringify({ type: 'resize', ...terminalSize() }))
}

function canSendToActiveRoom() {
  return Boolean(canUseActiveRoomComposer() && !state.activeRoom.alive)
}

function canUseActiveRoomComposer() {
  return Boolean(state.activeRoomId && state.activeRoom && !state.activeRoom.archivedAt && !state.activeRoom.trashedAt && !state.roomLoading && state.socket?.readyState === WebSocket.OPEN)
}

function terminalSize() {
  fitTerminal()
  return {
    cols: terminal.cols || 110,
    rows: terminal.rows || 32,
  }
}

function fitTerminal() {
  try {
    fitAddon.fit()
  } catch {
    // The terminal is not measurable while the app is hidden.
  }
}

function upsertRoom(room) {
  const index = state.rooms.findIndex((item) => item.id === room.id)
  if (index >= 0) state.rooms[index] = room
  else state.rooms.unshift(room)
  state.rooms = sortRoomsByRecency(state.rooms)
}

function statusLabel(status) {
  const labels = {
    created: '대기 중',
    running: '실행 중',
    stopped: '중지됨',
    exited: '종료됨',
    error: '오류',
    archived: '보관됨',
    trashed: '휴지통',
  }
  return labels[status] || status
}

function safeStatusClass(status) {
  return /^[a-z0-9_-]+$/i.test(String(status)) ? status : 'created'
}

function showUiError(err, fallback) {
  const message = err?.message || fallback || '요청을 처리하지 못했습니다.'
  addActivity({ type: 'error', text: message })
  if (state.activeRoomId) rebuildMessagesFromEvents()
  else roomMeta.textContent = message
}

function readStoredJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '')
    return value && typeof value === 'object' ? value : fallback
  } catch {
    return fallback
  }
}

function readStoredStringArray(key) {
  const value = readStoredJson(key, [])
  if (!Array.isArray(value)) return []
  return value.filter((item) => typeof item === 'string' && item)
}

function userDisplayName(user) {
  return user?.displayName || user?.handle || user?.email || 'devi'
}

function initials(value) {
  const parts = String(value || 'devi')
    .replace(/@.*/, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const text = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : (parts[0] || 'DV').slice(0, 2)
  return text.toUpperCase()
}

function cleanTitleInput(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

function summarize(value, max) {
  const clean = cleanDisplayMessage(value)
  if (clean.length <= max) return clean
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}...`
}

async function api(path, options = {}) {
  const hasBody = options.body !== undefined && options.body !== null
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) {
    const message = typeof body === 'object' && body?.error ? body.error : `Request failed: ${response.status}`
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  return body
}

function formatTime(value) {
  const date = new Date(value)
  if (!Number.isFinite(date.valueOf())) return ''
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
