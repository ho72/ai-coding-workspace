import 'dotenv/config'
import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyMultipart from '@fastify/multipart'
import fastifyWebsocket from '@fastify/websocket'
import crypto from 'node:crypto'
import { spawn } from 'node:child_process'
import { createReadStream, createWriteStream } from 'node:fs'
import {
  appendFile,
  mkdir,
  open as openFile,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import os from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import readline from 'node:readline'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import {
  assistantAttachmentPathCandidates,
  detectRasterImage,
  embeddedAssistantImages,
} from './assistant-images.js'
import {
  parseGitStatus,
  parseUnifiedDiff,
  workspaceChangesSinceBaseline,
} from './workspace-changes.js'
import { roomCanChangeAgent } from '../public/room-state.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = resolve(__dirname, '..')
const publicRoot = join(projectRoot, 'public')
const nodeModulesRoot = join(projectRoot, 'node_modules')

const PORT = Number(process.env.PORT ?? 4050)
const HOST = process.env.HOST ?? '127.0.0.1'
const PUBLIC_ORIGIN = normalizeOrigin(process.env.PUBLIC_ORIGIN ?? `http://localhost:${PORT}`)
const SESSION_COOKIE = process.env.DEVAI_SESSION_COOKIE ?? 'devai_session'
const SESSION_SECRET = process.env.DEVAI_SESSION_SECRET ?? ''
const SESSION_TTL_SECONDS = Number(process.env.DEVAI_SESSION_TTL_SECONDS ?? 60 * 60 * 12)
const SESSION_MIN_IAT = Number(process.env.DEVAI_SESSION_MIN_IAT ?? 0)
const UNIPASS_PUBLIC_ORIGIN = normalizeOrigin(process.env.UNIPASS_PUBLIC_ORIGIN ?? 'http://localhost:4000')
const UNIPASS_INTERNAL_ORIGIN = normalizeOrigin(process.env.UNIPASS_INTERNAL_ORIGIN ?? UNIPASS_PUBLIC_ORIGIN)
const ALLOWED_UNIPASS_IDS = csvSet(process.env.DEVAI_ALLOWED_UNIPASS_IDS)
const ALLOWED_UNIPASS_HANDLES = csvSet(process.env.DEVAI_ALLOWED_UNIPASS_HANDLES)
const ALLOWED_UNIPASS_EMAILS = csvSet(process.env.DEVAI_ALLOWED_UNIPASS_EMAILS)
const DATA_ROOT = resolve(process.env.DEVAI_DATA_DIR ?? join(projectRoot, 'data'))
const ROOM_DIR = join(DATA_ROOT, 'rooms')
const EVENT_DIR = join(DATA_ROOT, 'events')
const ATTACHMENT_DIR = join(DATA_ROOT, 'attachments')
const GENERATED_DIR = join(DATA_ROOT, 'generated')
const REVOKED_SESSION_FILE = join(DATA_ROOT, 'revoked-sessions.json')
const HOME_DIR = resolve(process.env.DEVAI_HOME_DIR ?? os.homedir())
const DEFAULT_CWD = resolve(process.env.DEVAI_DEFAULT_CWD ?? HOME_DIR)
const MAX_REPLAY_BYTES = Number(process.env.DEVAI_MAX_REPLAY_BYTES ?? 8 * 1024 * 1024)
const MAX_EVENTS_PER_REQUEST = Number(process.env.DEVAI_MAX_EVENTS_PER_REQUEST ?? 5000)
const MAX_INPUT_BYTES = 256 * 1024
const MAX_DISPLAY_TEXT = 20000
const MAX_AGENT_EVENT_TEXT = 12000
const MAX_GIT_DIFF_BYTES = 512 * 1024
const MAX_ATTACHMENT_BYTES = Number(process.env.DEVAI_MAX_ATTACHMENT_BYTES ?? 50 * 1024 * 1024)
const MAX_ATTACHMENTS_PER_TURN = Number(process.env.DEVAI_MAX_ATTACHMENTS_PER_TURN ?? 8)
const MAX_ROOM_ATTACHMENT_BYTES = Number(process.env.DEVAI_MAX_ROOM_ATTACHMENT_BYTES ?? 500 * 1024 * 1024)
const MAX_TOTAL_ATTACHMENT_BYTES = Number(process.env.DEVAI_MAX_TOTAL_ATTACHMENT_BYTES ?? 10 * 1024 * 1024 * 1024)
const TRASH_RETENTION_MS = Number(process.env.DEVAI_TRASH_RETENTION_DAYS ?? 7) * 24 * 60 * 60 * 1000
const ORPHAN_RETENTION_MS = Number(process.env.DEVAI_ORPHAN_RETENTION_HOURS ?? 24) * 60 * 60 * 1000
const ATTACHMENT_CLEANUP_INTERVAL_MS = Number(process.env.DEVAI_ATTACHMENT_CLEANUP_INTERVAL_HOURS ?? 24) * 60 * 60 * 1000
const ATTACHMENT_WARNING_PERCENT = Number(process.env.DEVAI_ATTACHMENT_WARNING_PERCENT ?? 70)
const CODEX_BIN = process.env.DEVAI_CODEX_BIN ?? 'codex'
const CLAUDE_BIN = process.env.DEVAI_CLAUDE_BIN ?? 'claude'
const CODEX_EXTRA_ARGS = parseExtraArgs(process.env.DEVAI_CODEX_EXTRA_ARGS)
const CLAUDE_EXTRA_ARGS = parseExtraArgs(process.env.DEVAI_CLAUDE_EXTRA_ARGS)
const CODEX_SETTINGS_CACHE_MS = Number(process.env.DEVAI_CODEX_SETTINGS_CACHE_MS ?? 30_000)
const FALLBACK_CODEX_MODELS = [
  {
    id: 'gpt-5.6-sol',
    model: 'gpt-5.6-sol',
    displayName: 'GPT-5.6-Sol',
    description: '복잡하고 깊은 작업',
    defaultReasoningEffort: 'medium',
    supportedReasoningEfforts: [],
    isDefault: true,
  },
  {
    id: 'gpt-5.6-terra',
    model: 'gpt-5.6-terra',
    displayName: 'GPT-5.6-Terra',
    description: '일반적인 개발 작업',
    defaultReasoningEffort: 'medium',
    supportedReasoningEfforts: [],
    isDefault: false,
  },
  {
    id: 'gpt-5.6-luna',
    model: 'gpt-5.6-luna',
    displayName: 'GPT-5.6-Luna',
    description: '명확한 반복 작업',
    defaultReasoningEffort: 'medium',
    supportedReasoningEfforts: [],
    isDefault: false,
  },
]
const FALLBACK_CODEX_EFFORTS = new Set(['minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'])
const CLAUDE_MODELS = [
  {
    id: 'claude-sonnet-5',
    model: 'claude-sonnet-5',
    displayName: 'Claude Sonnet 5',
    shortName: 'Sonnet 5',
    description: '균형 잡힌 일반 작업',
    isDefault: true,
  },
  {
    id: 'claude-opus-5',
    model: 'claude-opus-5',
    displayName: 'Claude Opus 5',
    shortName: 'Opus 5',
    description: '가장 복잡하고 깊은 작업',
    isDefault: false,
  },
  {
    id: 'claude-fable-5',
    model: 'claude-fable-5',
    displayName: 'Claude Fable 5',
    shortName: 'Fable 5',
    description: '최신 플래그십 모델',
    isDefault: false,
  },
  {
    id: 'claude-haiku-4-5-20251001',
    model: 'claude-haiku-4-5-20251001',
    displayName: 'Claude Haiku 4.5',
    shortName: 'Haiku 4.5',
    description: '빠르고 가벼운 작업',
    isDefault: false,
  },
]
const CLAUDE_EFFORT_IDS = ['low', 'medium', 'high', 'xhigh', 'max']

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error('DEVAI_SESSION_SECRET must be set to at least 32 characters.')
}

if (!ALLOWED_UNIPASS_IDS.size && !ALLOWED_UNIPASS_HANDLES.size && !ALLOWED_UNIPASS_EMAILS.size) {
  throw new Error('Set DEVAI_ALLOWED_UNIPASS_IDS, DEVAI_ALLOWED_UNIPASS_HANDLES, or DEVAI_ALLOWED_UNIPASS_EMAILS.')
}

await mkdir(ROOM_DIR, { recursive: true })
await mkdir(EVENT_DIR, { recursive: true })
await mkdir(ATTACHMENT_DIR, { recursive: true })
await mkdir(GENERATED_DIR, { recursive: true })

const allowedCwdRoots = await resolveAllowedRoots()
const defaultCwd = await normalizeCwd(DEFAULT_CWD).catch(() => HOME_DIR)

const clientsByRoom = new Map()
const roomUpdateClients = new Set()
const runtimes = new Map()
const turnPromises = new Map()
const writeQueues = new Map()
const codexConfigByCwd = new Map()
const codexConfigRefreshes = new Map()
let codexModels = FALLBACK_CODEX_MODELS
let codexModelsLoadedAt = 0
const revokedSessions = await loadRevokedSessions()
let revokedSessionsWrite = Promise.resolve()
let attachmentStorageQueue = Promise.resolve()

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL ?? 'info',
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: sanitizeLoggedUrl(request.url),
          host: request.headers.host,
          remoteAddress: request.socket?.remoteAddress,
        }
      },
    },
  },
  trustProxy: true,
})

await fastify.register(fastifyCookie)
await fastify.register(fastifyMultipart, {
  limits: {
    files: MAX_ATTACHMENTS_PER_TURN,
    fileSize: MAX_ATTACHMENT_BYTES,
  },
})
await fastify.register(fastifyWebsocket)

fastify.removeContentTypeParser('application/json')
fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, body, done) => {
  const text = String(body ?? '').trim()
  if (!text) {
    done(null, {})
    return
  }
  try {
    done(null, JSON.parse(text))
  } catch (err) {
    err.statusCode = 400
    done(err)
  }
})

fastify.addHook('onSend', async (_request, reply, payload) => {
  reply.header('X-Content-Type-Options', 'nosniff')
  reply.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  reply.header('X-Frame-Options', 'DENY')
  reply.header('Content-Security-Policy', [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "connect-src 'self' ws: wss:",
  ].join('; '))
  return payload
})

fastify.addHook('preHandler', async (request, reply) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return
  const origin = request.headers.origin
  if (!origin) return

  try {
    if (normalizeOrigin(origin) === PUBLIC_ORIGIN) return
    if (PUBLIC_ORIGIN.startsWith('http://localhost') && normalizeOrigin(origin).startsWith('http://localhost')) return
    if (originHostMatchesRequest(origin, request)) return
  } catch {
    return reply.code(403).send({ error: 'Invalid request origin.' })
  }

  return reply.code(403).send({ error: 'Invalid request origin.' })
})

fastify.get('/auth/start', async (request, reply) => {
  const next = sanitizeNextPath(request.query?.next)
  const session = readSession(request)
  if (session) return reply.redirect(next)

  const callbackUrl = new URL('/auth/callback', PUBLIC_ORIGIN)
  callbackUrl.searchParams.set('next', next)

  const loginUrl = new URL('/', UNIPASS_PUBLIC_ORIGIN)
  loginUrl.searchParams.set('redirect_uri', callbackUrl.toString())
  return reply.redirect(loginUrl.toString())
})

fastify.get('/auth/callback', async (request, reply) => {
  const query = request.query ?? {}
  const next = sanitizeNextPath(query.next)

  if (query.error) {
    clearSessionCookie(reply, request)
    return reply.redirect(`/?auth_error=${encodeURIComponent(String(query.error))}`)
  }

  const accessToken = typeof query.access_token === 'string' ? query.access_token : ''
  if (!accessToken) {
    clearSessionCookie(reply, request)
    return reply.redirect('/?auth_error=missing_token')
  }

  const user = await fetchUnipassUser(accessToken)
  if (!user) {
    clearSessionCookie(reply, request)
    return reply.redirect('/?auth_error=invalid_token')
  }

  setSessionCookie(reply, createSessionToken(user))
  return reply.redirect(next)
})

fastify.get('/auth/logout', async (request, reply) => {
  await revokeRequestSessions(request)
  clearSessionCookie(reply, request)
  return reply.redirect('/')
})

fastify.post('/api/login', async (_request, reply) => {
  return reply.code(410).send({ error: 'Unipass login is required.' })
})

fastify.post('/api/logout', async (request, reply) => {
  await revokeRequestSessions(request)
  clearSessionCookie(reply, request)
  return reply.send({ ok: true })
})

fastify.get('/api/me', { preHandler: requireSession }, async (request) => ({
  authenticated: true,
  user: sessionUser(readSession(request)),
}))

fastify.get('/api/workspaces', { preHandler: requireSession }, async () => {
  return { workspaces: await listWorkspaces() }
})

fastify.get('/api/storage', { preHandler: requireSession }, async () => {
  return attachmentStorageSummary()
})

fastify.get('/api/agents', { preHandler: requireSession }, async () => {
  await refreshCodexRuntimeSettings(defaultCwd)
  return {
    agents: [
      { id: 'codex', label: 'Codex', description: 'codex app-server', command: commandToString(codexAppServerCommand()) },
      { id: 'claude', label: 'Claude', description: 'claude stream-json', command: [CLAUDE_BIN, ...claudeStreamArgs('<room-session>')].join(' ') },
    ],
    codex: publicCodexSettings(defaultCwd),
    claude: publicClaudeSettings(),
    permissions: [publicPermissionSetting()],
  }
})

fastify.get('/api/rooms', { preHandler: requireSession }, async () => {
  const rooms = await listRooms()
  await Promise.all([...new Set(rooms.filter((room) => room.agent === 'codex').map((room) => room.cwd))]
    .map((cwd) => refreshCodexRuntimeSettings(cwd)))
  return { rooms: rooms.map(publicRoom) }
})

fastify.post('/api/rooms', { preHandler: requireSession }, async (request, reply) => {
  const agent = normalizeAgent(request.body?.agent)
  const cwd = await normalizeCwd(request.body?.cwd || defaultCwd)
  if (agent === 'codex') await refreshCodexRuntimeSettings(cwd)
  const initialPrompt = cleanDisplayText(request.body?.initialPrompt)
  const codexModel = normalizeCodexModel(request.body?.codexModel)
  const codexEffort = normalizeCodexEffort(request.body?.codexEffort)
  const claudeModel = normalizeClaudeModel(request.body?.claudeModel)
  const claudeEffort = normalizeClaudeEffort(request.body?.claudeEffort)
  const title = cleanTitle(request.body?.title) || titleFromPrompt(initialPrompt) || defaultRoomTitle(agent)
  const now = new Date().toISOString()
  const room = {
    id: crypto.randomUUID(),
    title,
    agent,
    cwd,
    createdAt: now,
    updatedAt: now,
    pinnedAt: null,
    archivedAt: null,
    trashedAt: null,
    status: 'created',
    pid: null,
    command: '',
    agentSessionId: agent === 'claude' ? crypto.randomUUID() : null,
    claudeSessionReady: false,
    lastStartedAt: null,
    lastExitedAt: null,
    exitCode: null,
    exitSignal: null,
    lastUserMessage: initialPrompt ? summarize(initialPrompt, 120) : '',
    codexModel,
    codexEffort,
    claudeModel,
    claudeEffort,
  }

  await writeRoom(room)
  await appendRoomEvent(room.id, {
    type: 'system',
    text: `Room created for ${agent} in ${cwd}.`,
  })

  if (initialPrompt) {
    setTimeout(() => {
      runRoomTurn(room.id, initialPrompt).catch((err) => {
        fastify.log.warn({ err, roomId: room.id }, 'Failed to run initial prompt')
      })
    }, 50)
  }

  const saved = await readRoom(room.id)
  return reply.code(201).send({ room: publicRoom(saved) })
})

fastify.get('/api/rooms/:id', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply, { allowArchived: true })
  if (!room) return
  if (room.agent === 'codex') await refreshCodexRuntimeSettings(room.cwd)
  return { room: publicRoom(room) }
})

fastify.patch('/api/rooms/:id', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply)
  if (!room) return
  const body = request.body || {}
  let changed = false

  if (Object.prototype.hasOwnProperty.call(body, 'agent')) {
    if (body.agent !== 'codex' && body.agent !== 'claude') {
      return reply.code(400).send({ error: 'Unsupported agent.' })
    }
    const nextAgent = normalizeAgent(body.agent)
    if (nextAgent !== room.agent) {
      if (runtimes.has(room.id) || turnPromises.has(room.id) || !roomCanChangeAgent(room)) {
        return reply.code(409).send({ error: '대화를 시작한 채팅방의 실행 엔진은 변경할 수 없습니다.' })
      }
      const previousAgent = room.agent
      if (nextAgent === 'codex') await refreshCodexRuntimeSettings(room.cwd)
      room.agent = nextAgent
      room.agentSessionId = nextAgent === 'claude' ? crypto.randomUUID() : null
      room.claudeSessionReady = false
      room.command = ''
      if (room.title === defaultRoomTitle(previousAgent)) room.title = defaultRoomTitle(nextAgent)
      changed = true
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'title')) {
    const title = cleanTitle(body.title)
    if (!title) return reply.code(400).send({ error: 'Title is required.' })
    room.title = title
    changed = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'cwd')) {
    if (runtimes.has(room.id) || turnPromises.has(room.id)) {
      return reply.code(409).send({ error: '실행 중에는 작업 디렉터리를 변경할 수 없습니다.' })
    }
    room.cwd = await normalizeCwd(body.cwd)
    if (room.agent === 'codex') await refreshCodexRuntimeSettings(room.cwd)
    changed = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'codexModel')) {
    room.codexModel = normalizeCodexModel(body.codexModel)
    changed = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'codexEffort')) {
    room.codexEffort = normalizeCodexEffort(body.codexEffort)
    changed = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'claudeModel')) {
    room.claudeModel = normalizeClaudeModel(body.claudeModel)
    changed = true
  }

  if (Object.prototype.hasOwnProperty.call(body, 'claudeEffort')) {
    room.claudeEffort = normalizeClaudeEffort(body.claudeEffort)
    changed = true
  }

  if (!changed) return reply.code(400).send({ error: 'No supported room fields were provided.' })
  room.updatedAt = new Date().toISOString()
  await writeRoom(room)
  broadcastRoom(room.id, { type: 'room', room: publicRoom(room) })
  return { room: publicRoom(room) }
})

fastify.post('/api/rooms/:id/start', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply)
  if (!room) return
  await appendRoomEvent(room.id, {
    type: 'system',
    text: 'JSON 실행 모드입니다. 메시지를 보내면 새 턴이 시작됩니다.',
  })
  return { room: publicRoom(await readRoom(room.id)) }
})

fastify.post('/api/rooms/:id/stop', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply)
  if (!room) return
  stopRoomProcess(room.id)
  return { ok: true }
})

fastify.post('/api/rooms/:id/archive', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply)
  if (!room) return
  stopRoomProcess(room.id)
  runtimes.delete(room.id)
  room.archivedAt = new Date().toISOString()
  room.pinnedAt = null
  room.status = 'archived'
  room.pid = null
  room.updatedAt = room.archivedAt
  await writeRoom(room)
  await appendRoomEvent(room.id, { type: 'system', text: 'Room archived.' })
  broadcastRoom(room.id, { type: 'room', room: publicRoom(room) })
  return { ok: true }
})

fastify.post('/api/rooms/:id/unarchive', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply, { allowArchived: true })
  if (!room) return
  if (!room.archivedAt) return { room: publicRoom(room) }
  room.archivedAt = null
  room.status = room.lastExitedAt ? 'exited' : 'created'
  room.pid = null
  room.updatedAt = new Date().toISOString()
  await writeRoom(room)
  await appendRoomEvent(room.id, { type: 'system', text: 'Room restored from archive.' })
  broadcastRoom(room.id, { type: 'room', room: publicRoom(room) })
  return { room: publicRoom(room) }
})

fastify.post('/api/rooms/:id/pin', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply)
  if (!room) return
  room.pinnedAt = request.body?.pinned === false ? null : new Date().toISOString()
  await writeRoom(room)
  await appendRoomEvent(room.id, {
    type: 'system',
    text: room.pinnedAt ? 'Room pinned.' : 'Room unpinned.',
  })
  broadcastRoom(room.id, { type: 'room', room: publicRoom(room) })
  return { room: publicRoom(room) }
})

fastify.post('/api/rooms/:id/trash', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply, { allowArchived: true })
  if (!room) return
  stopRoomProcess(room.id)
  runtimes.delete(room.id)
  room.pinnedAt = null
  room.trashedAt = new Date().toISOString()
  room.status = 'trashed'
  room.pid = null
  room.updatedAt = room.trashedAt
  await writeRoom(room)
  await appendRoomEvent(room.id, { type: 'system', text: 'Room moved to trash.' })
  broadcastRoom(room.id, { type: 'room', room: publicRoom(room) })
  return { room: publicRoom(room) }
})

fastify.delete('/api/rooms/:id', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply, { allowArchived: true, allowTrashed: true })
  if (!room) return
  stopRoomProcess(room.id)
  runtimes.delete(room.id)
  await deleteRoomFiles(room.id)
  broadcastRoom(room.id, { type: 'room_deleted', roomId: room.id })
  closeRoomClients(room.id, 1008, 'Room deleted')
  return { ok: true }
})

fastify.get('/api/rooms/:id/events', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply, { allowArchived: true })
  if (!room) return
  const limit = safeTerminalNumber(request.query?.limit, 2000, 1, MAX_EVENTS_PER_REQUEST)
  return readRoomEventsPage(room.id, {
    limit,
    before: safeByteCursor(request.query?.before),
  })
})

fastify.get('/api/rooms/:id/usage', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply, { allowArchived: true })
  if (!room) return
  const usage = await summarizeRoomUsage(room)
  if (room.agent !== 'codex') return usage
  try {
    usage.rateLimits = await readCodexAccountRateLimits(room.cwd)
  } catch (err) {
    fastify.log.warn({ err }, 'Failed to read Codex account rate limits')
    usage.rateLimits = {
      available: false,
      message: 'Codex 계정 한도를 확인하지 못했습니다.',
    }
  }
  return usage
})

fastify.get('/api/rooms/:id/log', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply, { allowArchived: true })
  if (!room) return
  const filePath = eventPath(room.id)
  const file = await stat(filePath).catch(() => null)
  if (!file?.isFile()) return reply.type('text/plain; charset=utf-8').send('')
  return reply
    .header('Content-Disposition', `attachment; filename="${room.id}.jsonl"`)
    .type('application/x-ndjson; charset=utf-8')
    .send(createReadStream(filePath))
})

fastify.post('/api/rooms/:id/attachments', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply)
  if (!room) return
  if (!request.isMultipart()) {
    return reply.code(415).send({ error: 'multipart/form-data is required.' })
  }

  const saved = []
  try {
    for await (const part of request.parts({
      limits: {
        files: MAX_ATTACHMENTS_PER_TURN,
        fileSize: MAX_ATTACHMENT_BYTES,
      },
    })) {
      if (part.type !== 'file') continue
      if (saved.length >= MAX_ATTACHMENTS_PER_TURN) {
        part.file.resume()
        continue
      }
      saved.push(await saveAttachmentPart(room.id, part))
    }
  } catch (err) {
    fastify.log.warn({ err, roomId: room.id }, 'Attachment upload failed')
    const tooLarge = err?.code === 'FST_REQ_FILE_TOO_LARGE' || err?.statusCode === 413
    return reply.code(tooLarge ? 413 : 400).send({
      error: err?.code === 'FST_REQ_FILE_TOO_LARGE'
        ? `Attachment is too large. Max ${formatBytes(MAX_ATTACHMENT_BYTES)}.`
        : err.message || 'Attachment upload failed.',
    })
  }

  if (!saved.length) return reply.code(400).send({ error: 'No attachment files were uploaded.' })

  await queueRoomWrite(room.id, async () => {
    const index = await readAttachmentIndex(room.id)
    index.push(...saved)
    await writeAttachmentIndex(room.id, index)
  })

  for (const attachment of saved) {
    await emitRoomEvent(room.id, {
      type: 'attachment',
      attachment: publicAttachment(room.id, attachment),
      text: `Attachment uploaded: ${attachment.name}`,
    })
  }

  return { attachments: saved.map((item) => publicAttachment(room.id, item)) }
})

fastify.get('/api/rooms/:id/attachments/:attachmentId', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply, { allowArchived: true })
  if (!room) return
  const attachmentId = safeAttachmentId(request.params.attachmentId)
  if (!attachmentId) return reply.code(404).send({ error: 'Attachment not found.' })
  const index = await readAttachmentIndex(room.id)
  const attachment = index.find((item) => item.id === attachmentId)
  if (!attachment) return reply.code(404).send({ error: 'Attachment not found.' })
  const info = await stat(attachment.path).catch(() => null)
  if (!info?.isFile()) return reply.code(404).send({ error: 'Attachment not found.' })
  const disposition = ['image', 'pdf'].includes(attachment.kind) ? 'inline' : 'attachment'
  return reply
    .header('Cache-Control', 'private, max-age=3600')
    .header('Content-Disposition', `${disposition}; filename="${headerSafeFilename(attachment.name)}"`)
    .type(attachment.mime || mimeFor(attachment.path))
    .send(createReadStream(attachment.path))
})

fastify.delete('/api/rooms/:id/attachments/:attachmentId', { preHandler: requireSession }, async (request, reply) => {
  const room = await readExistingRoom(request.params.id, reply)
  if (!room) return
  if (runtimes.has(room.id) || turnPromises.has(room.id)) {
    return reply.code(409).send({ error: '실행 중인 턴이 끝난 뒤 파일을 삭제해 주세요.' })
  }
  const attachmentId = safeAttachmentId(request.params.attachmentId)
  if (!attachmentId) return reply.code(404).send({ error: 'Attachment not found.' })

  const removed = await queueAttachmentStorage(async () => queueRoomWrite(room.id, async () => {
    const index = await readAttachmentIndex(room.id)
    const attachment = index.find((item) => item.id === attachmentId)
    if (!attachment) return null
    await rm(attachment.path, { force: true })
    await writeAttachmentIndex(room.id, index.filter((item) => item.id !== attachmentId))
    return attachment
  }))
  if (!removed) return reply.code(404).send({ error: 'Attachment not found.' })

  await emitRoomEvent(room.id, {
    type: 'attachment_deleted',
    attachmentId: removed.id,
    text: `Attachment deleted: ${removed.name}`,
  })
  return { ok: true, attachmentId: removed.id }
})

fastify.get('/ws/rooms', { websocket: true }, async (socket, request) => {
  const session = readSession(request)
  if (!session) {
    socket.close(1008, 'Authentication required')
    return
  }

  roomUpdateClients.add(socket)
  const rooms = await listRooms()
  sendSocket(socket, { type: 'rooms', rooms: rooms.map(publicRoom) })

  socket.on('close', () => {
    roomUpdateClients.delete(socket)
  })
})

fastify.get('/ws/rooms/:id', { websocket: true }, async (socket, request) => {
  const session = readSession(request)
  if (!session) {
    socket.close(1008, 'Authentication required')
    return
  }

  const roomId = safeRoomId(request.params.id)
  const room = roomId ? await readRoom(roomId) : null
  if (!room || room.archivedAt || room.trashedAt) {
    socket.close(1008, 'Room not found')
    return
  }

  if (room.agent === 'codex') await refreshCodexRuntimeSettings(room.cwd)

  addClient(roomId, socket)
  socket.send(JSON.stringify({ type: 'hello', room: publicRoom(room) }))

  socket.on('message', (rawMessage) => {
    handleSocketMessage(roomId, rawMessage).catch((err) => {
      fastify.log.warn({ err, roomId }, 'WebSocket message failed')
      sendSocket(socket, { type: 'error', error: err.message || 'Message failed.' })
    })
  })

  socket.on('close', () => {
    removeClient(roomId, socket)
  })
})

fastify.get('/healthz', async () => ({ ok: true }))

fastify.get('/vendor/xterm.css', async (_request, reply) => {
  return sendFile(reply, join(nodeModulesRoot, '@xterm/xterm/css/xterm.css'), 'text/css; charset=utf-8', 'public, max-age=31536000, immutable')
})

fastify.get('/vendor/xterm.js', async (_request, reply) => {
  return sendFile(reply, join(nodeModulesRoot, '@xterm/xterm/lib/xterm.js'), 'text/javascript; charset=utf-8', 'public, max-age=31536000, immutable')
})

fastify.get('/vendor/addon-fit.js', async (_request, reply) => {
  return sendFile(reply, join(nodeModulesRoot, '@xterm/addon-fit/lib/addon-fit.js'), 'text/javascript; charset=utf-8', 'public, max-age=31536000, immutable')
})

fastify.get('/*', async (request, reply) => {
  const routePath = request.params?.['*'] || 'index.html'
  const relativePath = routePath === '' ? 'index.html' : routePath
  const filePath = resolve(publicRoot, relativePath)
  if (!filePath.startsWith(`${publicRoot}/`) && filePath !== publicRoot) {
    return reply.code(404).type('text/plain; charset=utf-8').send('Not found\n')
  }
  const file = await stat(filePath).catch(() => null)
  if (!file?.isFile()) {
    return reply.code(404).type('text/plain; charset=utf-8').send('Not found\n')
  }
  const fileName = basename(filePath)
  const cacheControl = ['index.html', 'app.js', 'styles.css'].includes(fileName) ? 'no-store' : 'public, max-age=3600'
  return sendFile(reply, filePath, mimeFor(filePath), cacheControl)
})

try {
  await fastify.listen({ host: HOST, port: PORT })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

runAttachmentMaintenance().catch((err) => fastify.log.error({ err }, 'Initial attachment maintenance failed'))
const attachmentCleanupTimer = setInterval(() => {
  runAttachmentMaintenance().catch((err) => fastify.log.error({ err }, 'Scheduled attachment maintenance failed'))
}, Math.max(60_000, ATTACHMENT_CLEANUP_INTERVAL_MS))
attachmentCleanupTimer.unref()

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

async function shutdown() {
  clearInterval(attachmentCleanupTimer)
  for (const roomId of runtimes.keys()) stopRoomProcess(roomId)
  await fastify.close().catch(() => {})
  process.exit(0)
}

async function requireSession(request, reply) {
  const session = readSession(request)
  if (session) return
  return reply.code(401).send({ error: 'Authentication required.' })
}

function createSessionToken(user) {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    app: 'devai',
    sub: user.id,
    email: user.email ?? null,
    handle: user.handle ?? null,
    displayName: user.displayName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(12).toString('base64url'),
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${body}.${signSessionBody(body)}`
}

function readSession(request) {
  for (const token of sessionCookieValues(request)) {
    const session = parseSessionToken(token)
    if (session) return session
  }
  return null
}

function parseSessionToken(token, options = {}) {
  if (!token || typeof token !== 'string') return null
  const [body, signature] = token.split('.')
  if (!body || !signature) return null
  if (!safeEqual(signature, signSessionBody(body))) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (payload?.app !== 'devai') return null
    if (!payload?.sub || typeof payload.sub !== 'string') return null
    const iat = Number(payload.iat)
    const exp = Number(payload.exp)
    if (!Number.isFinite(iat) || iat < SESSION_MIN_IAT) return null
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null
    if (!options.ignoreRevocation && isSessionRevoked(payload, token)) return null
    return payload
  } catch {
    return null
  }
}

function sessionCookieValues(request) {
  const values = []
  const add = (value) => {
    if (typeof value === 'string' && value && !values.includes(value)) values.push(value)
  }

  add(request.cookies?.[SESSION_COOKIE])
  const raw = request.headers?.cookie
  if (typeof raw === 'string') {
    for (const part of raw.split(';')) {
      const index = part.indexOf('=')
      if (index <= 0) continue
      const name = part.slice(0, index).trim()
      if (name !== SESSION_COOKIE) continue
      const value = part.slice(index + 1).trim()
      try {
        add(decodeURIComponent(value))
      } catch {
        add(value)
      }
    }
  }

  return values
}

function signSessionBody(body) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url')
}

function setSessionCookie(reply, token) {
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    secure: PUBLIC_ORIGIN.startsWith('https://'),
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
  })
}

function clearSessionCookie(reply, request) {
  reply.header('Cache-Control', 'no-store')
  for (const domain of sessionCookieClearDomains(request)) {
    reply.clearCookie(SESSION_COOKIE, {
      path: '/',
      httpOnly: true,
      secure: PUBLIC_ORIGIN.startsWith('https://'),
      sameSite: 'lax',
      ...(domain ? { domain } : {}),
    })
  }
}

async function revokeRequestSessions(request) {
  let changed = pruneRevokedSessions()
  for (const token of sessionCookieValues(request)) {
    const session = parseSessionToken(token, { ignoreRevocation: true })
    if (!session) continue
    const key = sessionRevocationKey(session, token)
    const exp = Number(session.exp)
    if (!key || !Number.isFinite(exp)) continue
    if (revokedSessions.get(key) !== exp) {
      revokedSessions.set(key, exp)
      changed = true
    }
  }
  if (changed) await writeRevokedSessions()
}

function isSessionRevoked(session, token) {
  const key = sessionRevocationKey(session, token)
  if (!key) return false
  const exp = revokedSessions.get(key)
  if (!exp) return false
  if (exp < Math.floor(Date.now() / 1000)) {
    revokedSessions.delete(key)
    writeRevokedSessions().catch((err) => fastify.log.warn({ err }, 'Failed to prune revoked sessions'))
    return false
  }
  return true
}

function sessionRevocationKey(session, token) {
  if (typeof session?.nonce === 'string' && session.nonce) return `nonce:${session.nonce}`
  return `token:${crypto.createHash('sha256').update(String(token || '')).digest('base64url')}`
}

async function loadRevokedSessions() {
  const now = Math.floor(Date.now() / 1000)
  try {
    const parsed = JSON.parse(await readFile(REVOKED_SESSION_FILE, 'utf8'))
    const entries = Object.entries(parsed?.sessions || parsed || {})
      .filter(([key, exp]) => typeof key === 'string' && Number(exp) > now)
      .map(([key, exp]) => [key, Number(exp)])
    return new Map(entries)
  } catch {
    return new Map()
  }
}

async function writeRevokedSessions() {
  revokedSessionsWrite = revokedSessionsWrite.catch(() => {}).then(async () => {
    pruneRevokedSessions()
    const tmpPath = `${REVOKED_SESSION_FILE}.${crypto.randomUUID()}.tmp`
    const sessions = Object.fromEntries([...revokedSessions.entries()].sort(([a], [b]) => a.localeCompare(b)))
    await writeFile(tmpPath, `${JSON.stringify({ sessions }, null, 2)}\n`, 'utf8')
    await rename(tmpPath, REVOKED_SESSION_FILE)
  })
  return revokedSessionsWrite
}

function pruneRevokedSessions() {
  const now = Math.floor(Date.now() / 1000)
  let changed = false
  for (const [key, exp] of revokedSessions.entries()) {
    if (Number(exp) >= now) continue
    revokedSessions.delete(key)
    changed = true
  }
  return changed
}

function sessionCookieClearDomains(request) {
  const host = requestCookieHost(request)
  const domains = [null]
  if (!host || host === 'localhost' || /^[\d.]+$/.test(host) || host.includes(':')) return domains

  domains.push(host)
  domains.push(`.${host}`)

  const parts = host.split('.').filter(Boolean)
  if (parts.length > 2) domains.push(`.${parts.slice(-2).join('.')}`)

  return [...new Set(domains)]
}

function requestCookieHost(request) {
  const host = request?.hostname || request?.headers?.host || new URL(PUBLIC_ORIGIN).hostname
  return String(host || '')
    .split(':')[0]
    .trim()
    .toLowerCase()
}

async function fetchUnipassUser(accessToken) {
  try {
    const response = await fetch(`${UNIPASS_INTERNAL_ORIGIN}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })
    if (!response.ok) return null

    const user = await response.json()
    if (!isAllowedUnipassUser(user)) {
      fastify.log.warn({
        unipassId: user?.id,
        handle: user?.handle,
        email: user?.email,
      }, 'Rejected Unipass user for devi')
      return null
    }
    return normalizeUnipassUser(user)
  } catch (err) {
    fastify.log.warn({ err }, 'Failed to verify Unipass token')
    return null
  }
}

function normalizeUnipassUser(user) {
  return {
    id: String(user.id),
    email: typeof user.email === 'string' ? user.email : null,
    handle: typeof user.handle === 'string' ? user.handle : null,
    displayName: typeof user.displayName === 'string' ? user.displayName : null,
    avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : null,
  }
}

function isAllowedUnipassUser(user) {
  const id = normalizeIdentity(user?.id)
  const handle = normalizeIdentity(user?.handle)
  const email = normalizeIdentity(user?.email)
  return Boolean(
    (id && ALLOWED_UNIPASS_IDS.has(id)) ||
    (handle && ALLOWED_UNIPASS_HANDLES.has(handle)) ||
    (email && ALLOWED_UNIPASS_EMAILS.has(email))
  )
}

function sessionUser(session) {
  return {
    id: session.sub,
    email: session.email ?? null,
    handle: session.handle ?? null,
    displayName: session.displayName ?? null,
    avatarUrl: session.avatarUrl ?? null,
  }
}

function safeEqual(a, b) {
  const left = crypto.createHash('sha256').update(String(a)).digest()
  const right = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(left, right) && String(a).length === String(b).length
}

async function listRooms() {
  const entries = await readdir(ROOM_DIR, { withFileTypes: true }).catch(() => [])
  const rooms = []
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue
    const id = entry.name.slice(0, -5)
    const room = await readRoom(id)
    if (room) rooms.push(room)
  }
  return rooms.sort((a, b) => {
    const trashedOrder = Number(Boolean(a.trashedAt)) - Number(Boolean(b.trashedAt))
    if (trashedOrder) return trashedOrder
    const archivedOrder = Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt))
    if (archivedOrder) return archivedOrder
    if (!a.archivedAt && !b.archivedAt && !a.trashedAt && !b.trashedAt) {
      const pinnedOrder = Number(Boolean(b.pinnedAt)) - Number(Boolean(a.pinnedAt))
      if (pinnedOrder) return pinnedOrder
      if (a.pinnedAt && b.pinnedAt) return String(b.pinnedAt).localeCompare(String(a.pinnedAt))
    }
    return String(b.updatedAt).localeCompare(String(a.updatedAt))
  })
}

async function readExistingRoom(id, reply, options = {}) {
  const roomId = safeRoomId(id)
  if (!roomId) {
    reply.code(404).send({ error: 'Room not found.' })
    return null
  }
  const room = await readRoom(roomId)
  if (!room || (room.archivedAt && !options.allowArchived) || (room.trashedAt && !options.allowTrashed)) {
    reply.code(404).send({ error: 'Room not found.' })
    return null
  }
  return room
}

async function readRoom(id) {
  const roomId = safeRoomId(id)
  if (!roomId) return null
  try {
    const parsed = JSON.parse(await readFile(roomPath(roomId), 'utf8'))
    if (parsed?.id !== roomId) return null
    return normalizeRoom(parsed)
  } catch {
    return null
  }
}

async function deleteRoomFiles(roomId) {
  const safeId = safeRoomId(roomId)
  if (!safeId) throw new Error('Invalid room id.')
  return queueRoomWrite(safeId, async () => {
    await rm(roomPath(safeId), { force: true })
    await rm(eventPath(safeId), { force: true })
    await rm(roomAttachmentDir(safeId), { recursive: true, force: true })
  })
}

function normalizeRoom(room) {
  const agent = normalizeAgent(room.agent)
  const id = safeRoomId(room.id) || crypto.randomUUID()
  return {
    id,
    title: cleanTitle(room.title) || defaultRoomTitle(agent),
    agent,
    cwd: typeof room.cwd === 'string' ? room.cwd : defaultCwd,
    createdAt: safeIsoDate(room.createdAt),
    updatedAt: safeIsoDate(room.updatedAt),
    pinnedAt: room.pinnedAt ? safeIsoDate(room.pinnedAt) : null,
    archivedAt: room.archivedAt ? safeIsoDate(room.archivedAt) : null,
    trashedAt: room.trashedAt ? safeIsoDate(room.trashedAt) : null,
    status: typeof room.status === 'string' ? room.status : 'created',
    pid: Number.isInteger(room.pid) ? room.pid : null,
    command: typeof room.command === 'string' ? room.command : '',
    agentSessionId: cleanSessionId(room.agentSessionId) || (agent === 'claude' ? id : null),
    claudeSessionReady: agent === 'claude' && room.claudeSessionReady === true,
    lastStartedAt: room.lastStartedAt ? safeIsoDate(room.lastStartedAt) : null,
    lastExitedAt: room.lastExitedAt ? safeIsoDate(room.lastExitedAt) : null,
    exitCode: Number.isInteger(room.exitCode) ? room.exitCode : null,
    exitSignal: typeof room.exitSignal === 'string' ? room.exitSignal : null,
    lastUserMessage: typeof room.lastUserMessage === 'string' ? room.lastUserMessage.slice(0, 160) : '',
    codexModel: normalizeCodexModel(room.codexModel),
    codexEffort: normalizeCodexEffort(room.codexEffort),
    claudeModel: normalizeClaudeModel(room.claudeModel),
    claudeEffort: normalizeClaudeEffort(room.claudeEffort),
  }
}

async function writeRoom(room) {
  const roomId = safeRoomId(room.id)
  if (!roomId) throw new Error('Invalid room id.')
  return queueRoomWrite(roomId, async () => {
    const normalized = normalizeRoom(room)
    const tmpPath = `${roomPath(roomId)}.${crypto.randomUUID()}.tmp`
    await writeFile(tmpPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
    await rename(tmpPath, roomPath(roomId))
  })
}

async function appendRoomEvent(roomId, event) {
  const safeId = safeRoomId(roomId)
  if (!safeId) return null
  const saved = {
    time: new Date().toISOString(),
    ...event,
  }
  await queueRoomWrite(safeId, async () => {
    await appendFile(eventPath(safeId), `${JSON.stringify(saved)}\n`, 'utf8')
  })
  return saved
}

async function readRoomEvents(roomId, limit) {
  const page = await readRoomEventsPage(roomId, { limit })
  return page.events
}

async function readRoomEventsPage(roomId, options = {}) {
  const filePath = eventPath(roomId)
  const file = await stat(filePath).catch(() => null)
  if (!file?.isFile() || file.size <= 0) return { events: [], before: null, hasMore: false }

  const limit = Math.max(1, Math.min(MAX_EVENTS_PER_REQUEST, Number(options.limit) || 2000))
  const endOffset = Math.max(0, Math.min(file.size, Number.isFinite(options.before) ? options.before : file.size))
  if (endOffset <= 0) return { events: [], before: null, hasMore: false }

  const chunkSize = 64 * 1024
  const maxBytes = Math.min(MAX_REPLAY_BYTES, endOffset)
  const chunks = []
  const handle = await openFile(filePath, 'r')
  try {
    let cursor = endOffset
    let totalBytes = 0
    let newlineCount = 0
    while (cursor > 0 && totalBytes < maxBytes && newlineCount <= limit) {
      const size = Math.min(chunkSize, cursor, maxBytes - totalBytes)
      const start = cursor - size
      const buffer = Buffer.alloc(size)
      await handle.read(buffer, 0, size, start)
      chunks.unshift({ start, buffer })
      totalBytes += size
      newlineCount += countNewlines(buffer)
      cursor = start
    }
  } finally {
    await handle.close()
  }

  if (!chunks.length) return { events: [], before: null, hasMore: false }

  const baseOffset = chunks[0].start
  const buffer = Buffer.concat(chunks.map((chunk) => chunk.buffer))
  const lines = eventLinesFromBuffer(buffer, baseOffset)
  const selected = lines.slice(-limit)
  const events = selected
    .map((line) => line.text)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)

  const before = selected[0]?.offset ?? null
  return {
    events,
    before: before && before > 0 ? before : null,
    hasMore: Boolean(before && before > 0),
  }
}

function eventLinesFromBuffer(buffer, baseOffset) {
  const lines = []
  let start = baseOffset === 0 ? 0 : buffer.indexOf(0x0a) + 1
  if (start <= 0) start = 0
  for (let index = start; index <= buffer.length; index += 1) {
    if (index < buffer.length && buffer[index] !== 0x0a) continue
    if (index > start) {
      lines.push({
        offset: baseOffset + start,
        text: buffer.subarray(start, index).toString('utf8').trimEnd(),
      })
    }
    start = index + 1
  }
  return lines
}

function countNewlines(buffer) {
  let count = 0
  for (const byte of buffer) if (byte === 0x0a) count += 1
  return count
}

async function summarizeRoomUsage(room) {
  const snapshots = []
  let before
  let pageCount = 0
  while (pageCount < 10) {
    const page = await readRoomEventsPage(room.id, {
      limit: MAX_EVENTS_PER_REQUEST,
      ...(Number.isFinite(before) ? { before } : {}),
    })
    const pageSnapshots = page.events
      .filter((event) => event.type === 'usage')
      .map(parseStoredUsageEvent)
      .filter(hasUsageMetrics)
    snapshots.unshift(...pageSnapshots)
    pageCount += 1
    if (!page.hasMore || (room.agent === 'codex' && snapshots.length >= 2)) break
    before = page.before
  }

  if (!snapshots.length) {
    return {
      available: false,
      provider: room.agent,
      message: '아직 usage 데이터가 없습니다. 첫 응답이 완료된 뒤 다시 확인하세요.',
    }
  }

  const latest = snapshots.at(-1)
  const previous = snapshots.at(-2)
  const cumulative = room.agent === 'codex' && Boolean(previous) && usageIsNonDecreasing(previous, latest)
  const lastTurn = cumulative ? subtractUsageMetrics(latest, previous) : latest
  const session = room.agent === 'codex' ? latest : sumUsageMetrics(snapshots)
  return {
    available: true,
    provider: room.agent,
    cumulative,
    lastTurn,
    session,
    measuredAt: latest.time || null,
  }
}

function parseStoredUsageEvent(event) {
  const text = String(event?.text ?? '')
  const tokenMatch = text.match(/([\d,]+)\s+in\s*\/\s*([\d,]+)\s+out/i)
  const costMatch = text.match(/\$([\d.]+)/)
  return {
    inputTokens: finiteUsageNumber(event?.inputTokens, tokenMatch?.[1]),
    outputTokens: finiteUsageNumber(event?.outputTokens, tokenMatch?.[2]),
    costUsd: finiteUsageNumber(event?.costUsd, costMatch?.[1]),
    durationMs: finiteUsageNumber(event?.durationMs),
    time: event?.time || null,
  }
}

function finiteUsageNumber(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === '') continue
    const number = Number(typeof value === 'string' ? value.replaceAll(',', '') : value)
    if (Number.isFinite(number) && number >= 0) return number
  }
  return null
}

function hasUsageMetrics(usage) {
  return [usage?.inputTokens, usage?.outputTokens, usage?.costUsd, usage?.durationMs]
    .some((value) => Number.isFinite(value))
}

function usageIsNonDecreasing(previous, latest) {
  const pairs = [
    [previous.inputTokens, latest.inputTokens],
    [previous.outputTokens, latest.outputTokens],
    [previous.costUsd, latest.costUsd],
  ].filter(([left, right]) => Number.isFinite(left) && Number.isFinite(right))
  return Boolean(pairs.length && pairs.every(([left, right]) => right >= left))
}

function subtractUsageMetrics(latest, previous) {
  return {
    inputTokens: subtractUsageValue(latest.inputTokens, previous.inputTokens),
    outputTokens: subtractUsageValue(latest.outputTokens, previous.outputTokens),
    costUsd: subtractUsageValue(latest.costUsd, previous.costUsd),
    durationMs: latest.durationMs,
  }
}

function subtractUsageValue(latest, previous) {
  if (!Number.isFinite(latest)) return null
  if (!Number.isFinite(previous) || latest < previous) return latest
  return latest - previous
}

function sumUsageMetrics(snapshots) {
  return {
    inputTokens: sumUsageField(snapshots, 'inputTokens'),
    outputTokens: sumUsageField(snapshots, 'outputTokens'),
    costUsd: sumUsageField(snapshots, 'costUsd'),
    durationMs: sumUsageField(snapshots, 'durationMs'),
  }
}

function sumUsageField(snapshots, key) {
  const values = snapshots.map((item) => item[key]).filter(Number.isFinite)
  return values.length ? values.reduce((total, value) => total + value, 0) : null
}

async function runRoomTurn(roomId, prompt, options = {}) {
  const safeId = safeRoomId(roomId)
  if (!safeId) throw new Error('Invalid room id.')
  const attachments = await loadTurnAttachments(safeId, options.attachments || options.attachmentIds)
  const cleanPrompt = cleanDisplayText(prompt) || (attachments.length ? '첨부 파일을 확인해줘.' : '')
  if (!cleanPrompt && !attachments.length) return
  if (runtimes.has(safeId) || turnPromises.has(safeId)) {
    throw new Error('이미 실행 중인 턴이 있습니다.')
  }

  await updateRoomCodexSettings(safeId, options)
  await updateRoomClaudeSettings(safeId, options)
  const promise = runRoomTurnProcess(safeId, cleanPrompt, attachments)
  turnPromises.set(safeId, promise)
  promise.finally(() => {
    if (turnPromises.get(safeId) === promise) turnPromises.delete(safeId)
  }).catch(() => {})
  return promise
}

async function updateRoomCodexSettings(roomId, options = {}) {
  const hasModel = Object.prototype.hasOwnProperty.call(options, 'codexModel')
  const hasEffort = Object.prototype.hasOwnProperty.call(options, 'codexEffort')
  if (!hasModel && !hasEffort) return

  const room = await readRoom(roomId)
  if (!room || room.archivedAt || room.trashedAt) return
  if (hasModel) room.codexModel = normalizeCodexModel(options.codexModel)
  if (hasEffort) room.codexEffort = normalizeCodexEffort(options.codexEffort)
  room.updatedAt = new Date().toISOString()
  await writeRoom(room)
  broadcastRoom(room.id, { type: 'room', room: publicRoom(room) })
}

async function updateRoomClaudeSettings(roomId, options = {}) {
  const hasModel = Object.prototype.hasOwnProperty.call(options, 'claudeModel')
  const hasEffort = Object.prototype.hasOwnProperty.call(options, 'claudeEffort')
  if (!hasModel && !hasEffort) return

  const room = await readRoom(roomId)
  if (!room || room.archivedAt || room.trashedAt) return
  if (hasModel) room.claudeModel = normalizeClaudeModel(options.claudeModel)
  if (hasEffort) room.claudeEffort = normalizeClaudeEffort(options.claudeEffort)
  room.updatedAt = new Date().toISOString()
  await writeRoom(room)
  broadcastRoom(room.id, { type: 'room', room: publicRoom(room) })
}

async function runRoomTurnProcess(roomId, prompt, attachments = []) {
  let room = await readRoom(roomId)
  if (!room || room.archivedAt || room.trashedAt) throw new Error('Room not found.')
  const baselineChanges = await collectWorkspaceChanges(room.cwd)

  if (room.agent === 'codex') await refreshCodexRuntimeSettings(room.cwd)

  await recordInputEvent(roomId, prompt, attachments)
  room = await readRoom(roomId)
  if (!room || room.archivedAt || room.trashedAt) throw new Error('Room not found.')

  const agentPrompt = promptWithAttachments(prompt, attachments)
  if (room.agent === 'codex') {
    return runCodexAppServerTurn(room, agentPrompt, attachments, baselineChanges)
  }

  return runClaudeRoomTurn(room, agentPrompt, attachments, baselineChanges)
}

async function runClaudeRoomTurn(room, agentPrompt, attachments = [], baselineChanges = null) {
  const roomId = room.id
  const commandSpec = commandForRoom(room, attachments)
  const now = new Date().toISOString()
  const child = spawn(commandSpec.command, commandSpec.args, {
    cwd: room.cwd,
    env: {
      ...process.env,
      HOME: HOME_DIR,
      TERM: 'dumb',
      NO_COLOR: '1',
      FORCE_COLOR: '0',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  const runtime = {
    child,
    agent: room.agent,
    startedAt: now,
    stdoutBuffer: '',
    stderrBuffer: '',
    assistantTextSeen: false,
    assistantAttachmentSources: new Set(),
    assistantAttachmentDigests: new Set(),
    outputQueue: Promise.resolve(),
    resolved: false,
    baselineChanges,
  }
  runtimes.set(roomId, runtime)

  Object.assign(room, {
    status: 'running',
    pid: child.pid,
    command: commandToString(commandSpec),
    lastStartedAt: now,
    lastExitedAt: null,
    exitCode: null,
    exitSignal: null,
    updatedAt: now,
  })
  await writeRoom(room)
  await emitRoomEvent(roomId, {
    type: 'progress',
    phase: 'started',
    text: `${room.agent === 'claude' ? 'Claude' : 'Codex'} JSON 실행을 시작했습니다.`,
  })
  broadcastRoom(roomId, { type: 'room', room: publicRoom(room) })

  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk) => handleAgentStdout(roomId, chunk))
  child.stderr.on('data', (chunk) => handleAgentStderr(roomId, chunk))

  child.stdin.end(`${agentPrompt}\n`)

  return new Promise((resolve, reject) => {
    child.on('error', (err) => {
      handleRoomFailure(roomId, err).then(resolve, reject)
    })
    child.on('close', (code, signal) => {
      handleRoomExit(roomId, code, signal).then(resolve, reject)
    })
  })
}

async function runCodexAppServerTurn(room, agentPrompt, attachments = [], baselineChanges = null) {
  const roomId = room.id
  const commandSpec = codexAppServerCommand()
  const now = new Date().toISOString()
  const child = spawn(commandSpec.command, commandSpec.args, {
    cwd: room.cwd,
    env: {
      ...process.env,
      HOME: HOME_DIR,
      TERM: 'dumb',
      NO_COLOR: '1',
      FORCE_COLOR: '0',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const execution = resolveCodexExecution(room)
  const runtime = {
    child,
    agent: 'codex',
    protocol: 'codex-app-server',
    startedAt: now,
    stdoutBuffer: '',
    stderrBuffer: '',
    assistantTextSeen: false,
    assistantAttachmentSources: new Set(),
    assistantAttachmentDigests: new Set(),
    outputQueue: Promise.resolve(),
    resolved: false,
    nextRpcId: 1,
    pendingRpc: new Map(),
    agentMessagePhases: new Map(),
    roomSnapshot: room,
    agentPrompt,
    attachments,
    execution,
    threadId: '',
    turnId: '',
    latestUsage: null,
    turnCompleted: false,
    turnStatus: '',
    stopRequested: false,
    baselineChanges,
  }
  runtimes.set(roomId, runtime)
  runtime.startupTimer = setTimeout(() => {
    if (runtimes.get(roomId) === runtime && !runtime.turnId) {
      failCodexRuntime(roomId, runtime, 'Codex App Server startup timed out.').catch((err) => {
        fastify.log.warn({ err, roomId }, 'Failed to stop timed out Codex App Server')
      })
    }
  }, 15_000)
  runtime.startupTimer.unref()

  Object.assign(room, {
    status: 'running',
    pid: child.pid,
    command: commandToString(commandSpec),
    lastStartedAt: now,
    lastExitedAt: null,
    exitCode: null,
    exitSignal: null,
    updatedAt: now,
  })
  await writeRoom(room)
  await emitRoomEvent(roomId, {
    type: 'progress',
    phase: 'started',
    text: 'Codex App Server 실행을 시작했습니다.',
  })
  broadcastRoom(roomId, { type: 'room', room: publicRoom(room) })

  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk) => handleAgentStdout(roomId, chunk))
  child.stderr.on('data', (chunk) => handleAgentStderr(roomId, chunk))

  sendCodexRuntimeRequest(runtime, 'initialize', {
    clientInfo: { name: 'devi', title: 'devi', version: '0.1.0' },
  }, 'initialize')

  return new Promise((resolve, reject) => {
    child.on('error', (err) => {
      handleRoomFailure(roomId, err).then(resolve, reject)
    })
    child.on('close', (code, signal) => {
      handleRoomExit(roomId, code, signal).then(resolve, reject)
    })
  })
}

async function recordInputEvent(roomId, text, attachments = []) {
  const cleanText = cleanDisplayText(text)
  if (!cleanText && !attachments.length) return

  await emitRoomEvent(roomId, {
    type: 'input',
    text: cleanText,
    attachments: attachments.map((item) => publicAttachment(roomId, item)).filter(Boolean),
  })
  const room = await readRoom(roomId)
  if (!room) return
  room.lastUserMessage = summarize(cleanText || attachmentSummary(attachments), 120)
  room.updatedAt = new Date().toISOString()
  if (room.title === defaultRoomTitle(room.agent)) room.title = titleFromPrompt(cleanText) || room.title
  await writeRoom(room)
  broadcastRoom(roomId, { type: 'room', room: publicRoom(room) })
}

function handleAgentStdout(roomId, chunk) {
  const runtime = runtimes.get(roomId)
  if (!runtime) return
  runtime.stdoutBuffer += String(chunk)
  const lines = runtime.stdoutBuffer.split(/\r?\n/)
  runtime.stdoutBuffer = lines.pop() ?? ''
  for (const line of lines) {
    runtime.outputQueue = runtime.outputQueue.then(() => handleAgentJsonLine(roomId, line)).catch((err) => {
      fastify.log.warn({ err, roomId }, 'Failed to process agent JSON line')
    })
  }
}

function handleAgentStderr(roomId, chunk) {
  const runtime = runtimes.get(roomId)
  if (!runtime) return
  runtime.stderrBuffer += String(chunk)
  const lines = runtime.stderrBuffer.split(/\r?\n/)
  runtime.stderrBuffer = lines.pop() ?? ''
  for (const line of lines) {
    runtime.outputQueue = runtime.outputQueue.then(async () => {
      const text = cleanDisplayText(line)
      if (!text) return
      if (runtime.protocol === 'codex-app-server' && shouldHideCodexAppServerWarning(text)) return
      await emitRoomEvent(roomId, {
        type: 'progress',
        phase: 'stderr',
        text,
      })
    }).catch((err) => {
      fastify.log.warn({ err, roomId }, 'Failed to append stderr progress')
    })
  }
}

async function handleAgentJsonLine(roomId, line) {
  const text = String(line ?? '').trim()
  if (!text) return

  let event
  try {
    event = JSON.parse(text)
  } catch {
    await emitRoomEvent(roomId, {
      type: 'progress',
      phase: 'stdout',
      text: trimEventText(text),
    })
    return
  }

  const runtime = runtimes.get(roomId)
  if (runtime?.protocol === 'codex-app-server') {
    await handleCodexAppServerMessage(roomId, event, runtime)
    return
  }

  await updateRoomAgentSession(roomId, event)
  const normalizedEvents = normalizeAgentEvents(runtime?.agent, event, runtime)
  for (const item of normalizedEvents) {
    if (item.type === 'assistant_delta' || item.type === 'assistant_message') {
      if (item.text && runtime) runtime.assistantTextSeen = true
    }
    await emitRoomEvent(roomId, item)
  }
  await emitAssistantAttachmentsFromAgentEvent(roomId, runtime, {
    texts: normalizedEvents
      .filter((item) => item.type === 'assistant_message')
      .map((item) => item.text),
    payloads: normalizedEvents.some((item) => item.type === 'tool_result' && item.kind === 'image')
      ? [event]
      : [],
  })
}

async function handleCodexAppServerMessage(roomId, message, runtime) {
  if (Object.prototype.hasOwnProperty.call(message, 'id') && !message.method) {
    await handleCodexRuntimeResponse(roomId, message, runtime)
    return
  }
  if (message.method && Object.prototype.hasOwnProperty.call(message, 'id')) {
    await handleCodexRuntimeServerRequest(roomId, message, runtime)
    return
  }
  if (!message.method) return

  const params = message.params || {}
  if (runtime.threadId && params.threadId && params.threadId !== runtime.threadId) return
  if (runtime.turnId && params.turnId && params.turnId !== runtime.turnId) return

  if (message.method === 'thread/tokenUsage/updated') {
    runtime.latestUsage = codexUsageFromTokenUsage(params.tokenUsage)
    return
  }

  const events = normalizeCodexAppServerNotification(message, runtime)
  for (const event of events) {
    if (event.type === 'assistant_delta' || event.type === 'assistant_message') {
      if (event.text) runtime.assistantTextSeen = true
    }
    await emitRoomEvent(roomId, event)
  }
  const completedItem = message.method === 'item/completed' ? params.item || {} : null
  await emitAssistantAttachmentsFromAgentEvent(roomId, runtime, {
    texts: events
      .filter((event) => event.type === 'assistant_message')
      .map((event) => event.text),
    payloads: completedItem && ['mcpToolCall', 'dynamicToolCall'].includes(String(completedItem.type || ''))
      ? [completedItem.result]
      : [],
  })

  if (message.method !== 'turn/completed') return
  const turn = params.turn || {}
  runtime.turnCompleted = true
  runtime.turnStatus = String(turn.status || 'completed')
  if (runtime.latestUsage) await emitRoomEvent(roomId, runtime.latestUsage)
  if (runtime.turnStatus === 'failed' && !events.some((event) => event.type === 'error')) {
    await emitRoomEvent(roomId, {
      type: 'error',
      text: cleanDisplayText(turn.error?.message) || 'Codex turn failed.',
    })
  }
  setTimeout(() => {
    if (runtimes.get(roomId) === runtime) runtime.child.kill('SIGTERM')
  }, 0).unref()
}

async function handleCodexRuntimeResponse(roomId, message, runtime) {
  const stage = runtime.pendingRpc.get(String(message.id))
  runtime.pendingRpc.delete(String(message.id))
  if (!stage) return

  if (message.error) {
    if (stage === 'threadResume') {
      startCodexRuntimeThread(runtime, false)
      return
    }
    if (stage === 'interrupt') return
    await failCodexRuntime(roomId, runtime, message.error.message || `Codex ${stage} failed.`)
    return
  }

  if (stage === 'initialize') {
    sendCodexRuntimeNotification(runtime, 'initialized', {})
    startCodexRuntimeThread(runtime, Boolean(cleanSessionId(runtime.roomSnapshot.agentSessionId)))
    return
  }

  if (stage === 'threadResume' || stage === 'threadStart') {
    const threadId = cleanSessionId(message.result?.thread?.id)
    if (!threadId) {
      await failCodexRuntime(roomId, runtime, 'Codex thread id was not returned.')
      return
    }
    runtime.threadId = threadId
    await updateRoomAgentSession(roomId, { threadId })
    startCodexRuntimeTurn(runtime)
    return
  }

  if (stage === 'turnStart') {
    runtime.turnId = cleanEventId(message.result?.turn?.id)
    if (!runtime.turnId) {
      await failCodexRuntime(roomId, runtime, 'Codex turn id was not returned.')
      return
    }
    clearTimeout(runtime.startupTimer)
  }
}

function startCodexRuntimeThread(runtime, resume) {
  const room = runtime.roomSnapshot
  const params = {
    cwd: room.cwd,
    model: runtime.execution.resolvedModel,
    approvalPolicy: 'never',
    sandbox: 'danger-full-access',
  }
  if (resume) {
    sendCodexRuntimeRequest(runtime, 'thread/resume', {
      ...params,
      threadId: cleanSessionId(room.agentSessionId),
    }, 'threadResume')
    return
  }
  sendCodexRuntimeRequest(runtime, 'thread/start', {
    ...params,
    ephemeral: false,
  }, 'threadStart')
}

function startCodexRuntimeTurn(runtime) {
  const input = [{ type: 'text', text: runtime.agentPrompt }]
  for (const attachment of runtime.attachments) {
    if (isCodexImageAttachment(attachment)) {
      input.push({ type: 'localImage', path: attachment.path })
    }
  }
  sendCodexRuntimeRequest(runtime, 'turn/start', {
    threadId: runtime.threadId,
    input,
    cwd: runtime.roomSnapshot.cwd,
    model: runtime.execution.resolvedModel,
    effort: runtime.execution.resolvedEffort,
    approvalPolicy: 'never',
  }, 'turnStart')
}

async function handleCodexRuntimeServerRequest(roomId, message, runtime) {
  if (message.method === 'item/commandExecution/requestApproval' || message.method === 'item/fileChange/requestApproval') {
    sendCodexRuntimeResponse(runtime, message.id, { decision: 'acceptForSession' })
    return
  }
  if (message.method === 'item/permissions/requestApproval') {
    sendCodexRuntimeResponse(runtime, message.id, {
      permissions: {
        fileSystem: {
          entries: [{ path: { type: 'special', value: { kind: 'root' } }, access: 'write' }],
        },
        network: { enabled: true },
      },
      scope: 'session',
    })
    return
  }
  if (message.method === 'item/tool/requestUserInput') {
    const questions = Array.isArray(message.params?.questions) ? message.params.questions : []
    const answers = Object.fromEntries(questions
      .map((question) => cleanEventId(question?.id))
      .filter(Boolean)
      .map((id) => [id, { answers: [] }]))
    sendCodexRuntimeResponse(runtime, message.id, { answers })
    await emitRoomEvent(roomId, {
      type: 'progress',
      phase: 'input_request',
      text: 'Codex의 추가 입력 요청을 건너뛰었습니다.',
    })
    return
  }
  sendCodexRuntimeError(runtime, message.id, -32601, `Unsupported Codex server request: ${message.method}`)
}

function normalizeCodexAppServerNotification(message, runtime) {
  const method = String(message.method || '')
  const params = message.params || {}
  const item = params.item || {}
  const itemType = String(item.type || '')

  if (method === 'item/agentMessage/delta') {
    const text = cleanAgentDelta(params.delta)
    const messageId = cleanEventId(params.itemId)
    return text ? [{
      type: 'assistant_delta',
      agent: 'codex',
      text,
      messageId,
      phase: runtime.agentMessagePhases.get(messageId) || '',
    }] : []
  }

  if (method === 'item/commandExecution/outputDelta') {
    const text = cleanAgentDelta(params.delta)
    return text ? [{ type: 'progress', phase: 'command_output', text }] : []
  }

  if (method === 'item/reasoning/summaryTextDelta') {
    const text = cleanAgentDelta(params.delta)
    return text ? [{ type: 'progress', phase: 'reasoning', text }] : []
  }

  if (method === 'item/started') {
    if (itemType === 'agentMessage') {
      const messageId = cleanEventId(item.id)
      const phase = codexMessagePhase(item.phase)
      if (messageId && phase) runtime.agentMessagePhases.set(messageId, phase)
    }
    const tool = codexToolStartFromItem(item)
    return tool ? [tool] : []
  }

  if (method === 'item/completed') {
    if (itemType === 'agentMessage') {
      const text = trimEventText(item.text)
      const messageId = cleanEventId(item.id)
      const phase = codexMessagePhase(item.phase) || runtime.agentMessagePhases.get(messageId) || ''
      if (messageId && phase) runtime.agentMessagePhases.set(messageId, phase)
      return text ? [{
        type: 'assistant_message',
        agent: 'codex',
        text,
        messageId,
        phase,
      }] : []
    }
    const events = []
    const toolResult = codexToolResultFromItem(item)
    if (toolResult) events.push(toolResult)
    if (itemType === 'fileChange') {
      const files = (Array.isArray(item.changes) ? item.changes : [])
        .map(normalizeFileChangeItem)
        .filter(Boolean)
      if (files.length) events.push({ type: 'file_change', files })
    }
    return events
  }

  if (method === 'error' && message.params?.willRetry !== true) {
    const text = cleanDisplayText(params.error?.message)
    return text ? [{ type: 'error', text }] : []
  }

  if (method === 'turn/completed') {
    const turn = params.turn || {}
    return [{
      type: 'turn_completed',
      status: String(turn.status || 'completed'),
      durationMs: Number.isFinite(turn.durationMs) ? turn.durationMs : null,
      text: turn.status === 'interrupted' ? 'Turn interrupted.' : '',
    }]
  }

  if (method === 'configWarning') {
    const text = cleanDisplayText(params.summary)
    if (shouldHideCodexAppServerWarning(text)) return []
    return text ? [{ type: 'progress', phase: 'warning', text }] : []
  }

  return []
}

function codexMessagePhase(value) {
  return value === 'commentary' || value === 'final_answer' ? value : ''
}

function codexToolStartFromItem(item) {
  const itemType = String(item?.type || '')
  if (itemType === 'commandExecution') {
    return {
      type: 'tool',
      kind: 'command',
      toolUseId: cleanEventId(item.id),
      title: 'command',
      command: trimEventText(item.command || 'command'),
      text: trimEventText(item.command || 'command'),
      status: 'running',
    }
  }
  if (itemType === 'fileChange') {
    return {
      type: 'tool',
      kind: 'file',
      toolUseId: cleanEventId(item.id),
      title: 'file change',
      command: 'file change',
      text: 'file change',
      status: 'running',
    }
  }
  if (itemType === 'mcpToolCall' || itemType === 'dynamicToolCall' || itemType === 'collabToolCall') {
    const name = firstText(item.tool, item.name) || itemType
    return {
      type: 'tool',
      kind: toolKindFor(name, '', itemType, itemType),
      toolUseId: cleanEventId(item.id),
      title: summarize(name, 80),
      command: trimEventText(name),
      text: trimEventText(summarizeJson(item.arguments ?? item, 1800)),
      status: 'running',
    }
  }
  return null
}

function codexToolResultFromItem(item) {
  const itemType = String(item?.type || '')
  if (!['commandExecution', 'fileChange', 'mcpToolCall', 'dynamicToolCall', 'collabToolCall'].includes(itemType)) return null
  const exitCode = Number.isInteger(item.exitCode) ? item.exitCode : null
  const status = String(item.status || '').toLowerCase()
  const isError = Boolean(item.error || item.success === false || status === 'failed' || (exitCode !== null && exitCode !== 0))
  const text = itemType === 'commandExecution'
    ? firstText(item.aggregatedOutput)
    : summarizeJson(item.result ?? item.error ?? item.changes ?? item, MAX_AGENT_EVENT_TEXT)
  return {
    type: 'tool_result',
    kind: toolKindFor(item.tool, item.command, itemType, itemType),
    toolUseId: cleanEventId(item.id),
    text: trimEventText(text),
    status: isError ? 'error' : 'done',
    exitCode,
  }
}

function codexUsageFromTokenUsage(tokenUsage) {
  const total = tokenUsage?.total || {}
  const inputTokens = Number(total.inputTokens)
  const outputTokens = Number(total.outputTokens)
  if (!Number.isFinite(inputTokens) && !Number.isFinite(outputTokens)) return null
  return {
    type: 'usage',
    text: `${Number.isFinite(inputTokens) ? inputTokens.toLocaleString('en-US') : 0} in / ${Number.isFinite(outputTokens) ? outputTokens.toLocaleString('en-US') : 0} out`,
    ...(Number.isFinite(inputTokens) ? { inputTokens } : {}),
    ...(Number.isFinite(outputTokens) ? { outputTokens } : {}),
  }
}

async function failCodexRuntime(roomId, runtime, message) {
  await handleRoomFailure(roomId, new Error(cleanDisplayText(message) || 'Codex App Server failed.'))
  runtime.child.kill('SIGTERM')
}

function sendCodexRuntimeRequest(runtime, method, params, stage) {
  const id = runtime.nextRpcId++
  runtime.pendingRpc.set(String(id), stage)
  sendCodexAppServerMessage(runtime.child, { method, id, params })
  return id
}

function sendCodexRuntimeNotification(runtime, method, params) {
  sendCodexAppServerMessage(runtime.child, { method, params })
}

function sendCodexRuntimeResponse(runtime, id, result) {
  sendCodexAppServerMessage(runtime.child, { id, result })
}

function sendCodexRuntimeError(runtime, id, code, message) {
  sendCodexAppServerMessage(runtime.child, { id, error: { code, message } })
}

async function handleRoomExit(roomId, exitCode, signal) {
  const runtime = runtimes.get(roomId)
  if (!runtime) return
  if (runtime?.resolved) return
  if (runtime) runtime.resolved = true
  clearTimeout(runtime.startupTimer)

  await runtime.outputQueue.catch((err) => {
    fastify.log.warn({ err, roomId }, 'Failed to drain agent output queue')
  })
  await flushRuntimeBuffers(roomId)
  runtimes.delete(roomId)

  const room = await readRoom(roomId)
  if (!room || room.archivedAt || room.trashedAt) return
  const now = new Date().toISOString()
  const isCodexAppServer = runtime.protocol === 'codex-app-server'
  const appTurnSucceeded = isCodexAppServer && (
    runtime.stopRequested ||
    (runtime.turnCompleted && ['completed', 'interrupted'].includes(runtime.turnStatus))
  )
  const cleanCode = appTurnSucceeded ? 0 : Number.isInteger(exitCode) ? exitCode : null
  Object.assign(room, {
    status: cleanCode === 0 && (!isCodexAppServer || appTurnSucceeded) ? 'exited' : 'error',
    pid: null,
    lastExitedAt: now,
    exitCode: cleanCode,
    exitSignal: appTurnSucceeded ? null : typeof signal === 'string' ? signal : null,
    updatedAt: now,
  })
  await writeRoom(room)

  const exitEvent = {
    type: 'exit',
    code: room.exitCode,
    signal: room.exitSignal,
    text: appTurnSucceeded
      ? runtime.stopRequested ? 'Turn stopped.' : 'Turn completed.'
      : `Process exited${room.exitCode === null ? '' : ` with code ${room.exitCode}`}${room.exitSignal ? ` (${room.exitSignal})` : ''}.`,
  }
  await emitRoomEvent(roomId, exitEvent)
  broadcastRoom(roomId, { type: 'room', room: publicRoom(room) })
  scheduleWorkspaceChanges(roomId, room.cwd, runtime.baselineChanges)
}

function scheduleWorkspaceChanges(roomId, cwd, baselineChanges = null) {
  const timer = setTimeout(() => {
    emitWorkspaceChanges(roomId, cwd, baselineChanges).catch((err) => {
      fastify.log.debug({ err, roomId }, 'Failed to emit workspace changes')
    })
  }, 0)
  timer.unref()
}

async function emitWorkspaceChanges(roomId, cwd, baselineChanges = null) {
  if (runtimes.has(roomId) || turnPromises.has(roomId)) return
  const room = await readRoom(roomId)
  if (!room || room.archivedAt || room.trashedAt || room.cwd !== cwd) return
  const currentChanges = await collectWorkspaceChanges(cwd)
  const changes = workspaceChangesSinceBaseline(currentChanges, baselineChanges)
  if (runtimes.has(roomId) || turnPromises.has(roomId)) return
  if (changes?.diffFiles?.length) {
    await emitRoomEvent(roomId, {
      type: 'diff',
      title: '현재 작업 디렉터리 변경',
      files: changes.diffFiles,
    })
  }
  if (changes?.items?.length) {
    await emitRoomEvent(roomId, {
      type: 'files',
      title: '변경된 파일',
      items: changes.items,
    })
  }
}

async function handleRoomFailure(roomId, err) {
  const runtime = runtimes.get(roomId)
  if (runtime?.resolved) return
  if (runtime) runtime.resolved = true
  clearTimeout(runtime?.startupTimer)
  runtimes.delete(roomId)

  const room = await readRoom(roomId)
  if (room && !room.archivedAt && !room.trashedAt) {
    Object.assign(room, {
      status: 'error',
      pid: null,
      lastExitedAt: new Date().toISOString(),
      exitCode: null,
      exitSignal: null,
      updatedAt: new Date().toISOString(),
    })
    await writeRoom(room)
  }

  await emitRoomEvent(roomId, {
    type: 'error',
    text: err.message || 'Failed to run process.',
  })
  if (room) broadcastRoom(roomId, { type: 'room', room: publicRoom(room) })
}

async function flushRuntimeBuffers(roomId) {
  const runtime = runtimes.get(roomId)
  if (!runtime) return

  const stdout = runtime.stdoutBuffer.trim()
  runtime.stdoutBuffer = ''
  if (stdout) await handleAgentJsonLine(roomId, stdout)

  const stderr = runtime.stderrBuffer.trim()
  runtime.stderrBuffer = ''
  if (stderr) {
    await emitRoomEvent(roomId, {
      type: 'progress',
      phase: 'stderr',
      text: trimEventText(stderr),
    })
  }
}

function stopRoomProcess(roomId) {
  const runtime = runtimes.get(roomId)
  if (!runtime) return
  try {
    if (runtime.protocol === 'codex-app-server') {
      runtime.stopRequested = true
      if (runtime.threadId && runtime.turnId) {
        sendCodexRuntimeRequest(runtime, 'turn/interrupt', {
          threadId: runtime.threadId,
          turnId: runtime.turnId,
        }, 'interrupt')
      }
      setTimeout(() => {
        if (runtimes.get(roomId) === runtime) runtime.child.kill('SIGTERM')
      }, 3000).unref()
      return
    }
    runtime.child.kill('SIGINT')
    setTimeout(() => {
      if (runtimes.get(roomId) === runtime) runtime.child.kill('SIGTERM')
    }, 1500).unref()
  } catch {
    runtimes.delete(roomId)
  }
}

async function handleSocketMessage(roomId, rawMessage) {
  const message = JSON.parse(rawMessage.toString('utf8'))
  if (message.type === 'input') {
    const prompt = cleanDisplayText(message.text ?? message.displayText ?? message.data ?? '')
    const attachments = Array.isArray(message.attachments) ? message.attachments : message.attachmentIds
    await runRoomTurn(roomId, prompt, {
      attachments,
      codexModel: message.codexModel,
      codexEffort: message.codexEffort,
      claudeModel: message.claudeModel,
      claudeEffort: message.claudeEffort,
    })
    return
  }
  if (message.type === 'resize') return
  if (message.type === 'start') return
  if (message.type === 'stop') {
    stopRoomProcess(roomId)
  }
}

function commandForRoom(room, attachments = []) {
  if (room.agent === 'claude') {
    const sessionId = cleanSessionId(room.agentSessionId) || room.id
    const execution = resolveClaudeExecution(room)
    return {
      command: CLAUDE_BIN,
      args: claudeStreamArgs(sessionId, {
        resume: room.claudeSessionReady,
        model: execution.resolvedModel,
        effort: execution.resolvedEffort,
      }),
    }
  }
  return codexAppServerCommand()
}

function codexAppServerCommand() {
  return { command: CODEX_BIN, args: ['app-server', '--stdio'] }
}

function claudeStreamArgs(sessionId, options = {}) {
  return [
    '--print',
    '--output-format',
    'stream-json',
    '--include-partial-messages',
    '--verbose',
    '--permission-mode',
    'auto',
    ...(options.model ? ['--model', options.model] : []),
    ...(options.effort ? ['--effort', options.effort] : []),
    options.resume ? '--resume' : '--session-id',
    sessionId,
    ...filteredClaudeExtraArgs(),
  ]
}

function isCodexImageAttachment(attachment) {
  if (attachment.kind !== 'image') return false
  const ext = extname(attachment.filename || attachment.path || '').toLowerCase()
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)
}

function promptWithAttachments(prompt, attachments = []) {
  if (!attachments.length) return prompt
  const lines = [
    '첨부 파일이 이 devi 방의 서버 디렉터리에 업로드되어 있습니다.',
    '아래에 적힌 파일 경로만 참고하세요. 이미지 파일은 가능한 경우 Codex CLI 이미지 입력으로도 첨부되어 있습니다.',
    '',
    ...attachments.map((attachment, index) => {
      const size = Number.isFinite(attachment.size) ? `, ${formatBytes(attachment.size)}` : ''
      const mime = attachment.mime ? `, ${attachment.mime}` : ''
      return `${index + 1}. ${attachment.name}${mime}${size}\n   path: ${attachment.path}`
    }),
    '',
    '사용자 요청:',
    prompt || '첨부 파일을 확인해줘.',
  ]
  return lines.join('\n').slice(0, MAX_INPUT_BYTES)
}

function attachmentSummary(attachments = []) {
  if (!attachments.length) return ''
  const names = attachments.map((item) => item.name).filter(Boolean)
  return `첨부 ${attachments.length}개${names.length ? `: ${names.join(', ')}` : ''}`
}

async function emitRoomEvent(roomId, event) {
  const saved = await appendRoomEvent(roomId, event)
  if (saved) broadcastRoom(roomId, saved)
  return saved
}

async function updateRoomAgentSession(roomId, event) {
  const sessionId = cleanSessionId(extractSessionId(event))
  if (!sessionId) return
  const room = await readRoom(roomId)
  if (!room || room.archivedAt || room.trashedAt) return
  const claudeSessionReady = room.agent === 'claude'
  if (room.agentSessionId === sessionId && room.claudeSessionReady === claudeSessionReady) return
  room.agentSessionId = sessionId
  room.claudeSessionReady = claudeSessionReady
  room.updatedAt = new Date().toISOString()
  await writeRoom(room)
  broadcastRoom(roomId, { type: 'room', room: publicRoom(room) })
}

function normalizeAgentEvents(agent, event, runtime) {
  const events = []
  const eventType = eventTypeOf(event)
  const extractedMessageId = extractMessageId(event)
  if (extractedMessageId && runtime) runtime.assistantMessageId = extractedMessageId
  const messageId = extractedMessageId || cleanEventId(runtime?.assistantMessageId)
  const eventAgent = agent === 'claude' ? 'claude' : 'codex'

  const tool = extractToolStart(event)
  if (tool) events.push(tool)

  const toolResult = extractToolResult(event)
  if (toolResult) events.push(toolResult)

  const assistantDelta = extractAssistantDelta(event)
  if (assistantDelta) {
    events.push({
      type: 'assistant_delta',
      agent: eventAgent,
      text: assistantDelta,
      messageId,
    })
  } else {
    const assistantMessage = extractAssistantMessage(event, runtime)
    if (assistantMessage) {
      events.push({
        type: 'assistant_message',
        agent: eventAgent,
        text: assistantMessage,
        messageId,
      })
    }
  }

  const usage = extractUsageEvent(event)
  if (usage) events.push(usage)

  const fileChange = extractFileChangeEvent(event, eventType)
  if (fileChange) events.push(fileChange)

  const turnCompleted = extractTurnCompletedEvent(event, eventType)
  if (turnCompleted) events.push(turnCompleted)

  const progress = extractProgressEvent(agent, event, eventType)
  if (progress && !events.some((item) => ['assistant_delta', 'assistant_message', 'tool', 'tool_result', 'turn_completed'].includes(item.type))) {
    events.push(progress)
  }

  return events
}

function extractAssistantDelta(event) {
  const nestedEvent = event?.event && typeof event.event === 'object' ? event.event : null
  const type = `${eventTypeOf(event)} ${eventTypeOf(nestedEvent)}`
  if (!/(delta|partial|content_block)/i.test(type)) return ''
  const text = firstText(
    nestedEvent?.delta?.text,
    nestedEvent?.delta?.content,
    nestedEvent?.text_delta,
    nestedEvent?.text,
    event?.delta?.text,
    event?.delta?.content,
    event?.data?.delta,
    event?.data?.text,
    event?.item?.delta,
    event?.text_delta,
    event?.delta
  )
  return cleanAgentDelta(text)
}

function extractAssistantMessage(event, runtime) {
  const type = eventTypeOf(event)
  const itemType = String(event?.item?.type ?? '').toLowerCase()
  if (type === 'result' && runtime?.assistantTextSeen) return ''

  if (event?.message?.role === 'assistant') {
    return trimEventText(textFromContent(event.message.content))
  }

  if (itemType === 'agent_message' || (itemType === 'message' && event?.item?.role === 'assistant')) {
    return trimEventText(firstText(
      event?.item?.text,
      textFromContent(event?.item?.content),
      event?.item?.message
    ))
  }

  if (/assistant|message|final|result|response\.completed|agent_message/i.test(type)) {
    const text = firstText(
      textFromContent(event?.message?.content),
      textFromContent(event?.item?.content),
      textFromContent(event?.content),
      event?.result,
      event?.final_response,
      event?.final,
      event?.output_text,
      event?.text,
      event?.message,
      event?.data?.text,
      event?.data?.message
    )
    return trimEventText(text)
  }

  return ''
}

function extractToolStart(event) {
  const type = eventTypeOf(event)
  if (/tool_result|tool\.result|result$/i.test(type)) return null
  const eventItemType = String(event?.item?.type ?? '').toLowerCase()
  if (eventItemType === 'command_execution' && /(completed|done|finished|result)/i.test(type)) return null

  const block = findObject(event, (item) => {
    const itemType = String(item?.type ?? '').toLowerCase()
    return itemType === 'tool_use' || itemType === 'function_call' || itemType === 'command_execution' || Boolean(item?.tool_name || item?.toolName)
  })
  const directCommand = firstText(
    event?.command,
    event?.cmd,
    event?.data?.command,
    event?.data?.cmd,
    event?.item?.command,
    event?.item?.cmd
  )

  if (!block && !directCommand && !/(tool|command|exec|shell|function_call)/i.test(type)) return null

  const input = block?.input ?? block?.arguments ?? event?.input ?? event?.arguments ?? event?.data?.input ?? event?.item?.input
  const name = firstText(
    block?.name,
    block?.tool_name,
    block?.toolName,
    event?.tool_name,
    event?.toolName,
    event?.name,
    event?.data?.name,
    event?.item?.name
  ) || 'tool'
  const command = firstText(
    directCommand,
    input?.command,
    input?.cmd,
    input?.script,
    block?.command,
    block?.cmd,
    typeof input === 'string' ? input : ''
  )
  const id = firstText(block?.id, event?.item?.id, event?.tool_use_id, event?.toolUseId, event?.call_id, event?.id)
  const text = command || summarizeJson(input || event?.data || event?.item || event, 1800)

  return {
    type: 'tool',
    kind: toolKindFor(name, command, type, eventItemType),
    toolUseId: cleanEventId(id),
    title: summarize(name, 80),
    command: trimEventText(command || name),
    text: trimEventText(text),
    status: 'running',
  }
}

function extractToolResult(event) {
  const type = eventTypeOf(event)
  const block = findObject(event, (item) => {
    const itemType = String(item?.type ?? '').toLowerCase()
    return itemType === 'tool_result' || itemType === 'command_execution'
  })
  const isCommandExecution = String(block?.type ?? '').toLowerCase() === 'command_execution'
  if (!block && !/(tool_result|tool\.result|command_output|exec_output)/i.test(type)) return null
  if (isCommandExecution && !/(completed|done|finished|result)/i.test(type)) return null

  const id = firstText(block?.tool_use_id, block?.id, event?.item?.id, event?.tool_use_id, event?.toolUseId, event?.call_id, event?.id)
  const text = firstText(
    block?.aggregated_output,
    textFromContent(block?.content),
    textFromContent(event?.content),
    event?.aggregated_output,
    event?.output,
    event?.result,
    event?.data?.output,
    event?.data?.result,
    event?.text
  )
  const exitCode = Number.isInteger(block?.exit_code) ? block.exit_code : Number.isInteger(event?.exit_code) ? event.exit_code : null
  const status = String(block?.status || event?.status || '').toLowerCase()
  const isError = Boolean(block?.is_error || event?.is_error || event?.error || (Number.isInteger(exitCode) && exitCode !== 0) || status === 'failed')
  return {
    type: 'tool_result',
    kind: toolKindFor(firstText(block?.name, event?.name, event?.item?.name), '', type, String(block?.type ?? '').toLowerCase()),
    toolUseId: cleanEventId(id),
    text: trimEventText(text || event?.error?.message || ''),
    status: isError ? 'error' : 'done',
    exitCode,
  }
}

function extractUsageEvent(event) {
  const type = eventTypeOf(event)
  if (!/(result|usage|completed|done)/i.test(type)) return null

  const usage = event?.usage || event?.message?.usage || event?.data?.usage || {}
  const parts = []
  const durationMs = Number(event?.duration_ms ?? event?.durationMs ?? event?.elapsed_ms)
  if (Number.isFinite(durationMs) && durationMs > 0) parts.push(formatDuration(durationMs))

  const inputTokens = Number(usage.input_tokens ?? usage.prompt_tokens ?? event?.input_tokens)
  const outputTokens = Number(usage.output_tokens ?? usage.completion_tokens ?? event?.output_tokens)
  if (Number.isFinite(inputTokens) || Number.isFinite(outputTokens)) {
    parts.push(`${Number.isFinite(inputTokens) ? inputTokens.toLocaleString('en-US') : 0} in / ${Number.isFinite(outputTokens) ? outputTokens.toLocaleString('en-US') : 0} out`)
  }

  const cost = Number(event?.total_cost_usd ?? event?.cost_usd ?? usage.total_cost_usd)
  if (Number.isFinite(cost) && cost > 0) parts.push(`$${cost.toFixed(4)}`)

  if (!parts.length) return null
  return {
    type: 'usage',
    text: parts.join(' · '),
    ...(Number.isFinite(inputTokens) ? { inputTokens } : {}),
    ...(Number.isFinite(outputTokens) ? { outputTokens } : {}),
    ...(Number.isFinite(cost) && cost > 0 ? { costUsd: cost } : {}),
    ...(Number.isFinite(durationMs) && durationMs > 0 ? { durationMs } : {}),
  }
}

function extractTurnCompletedEvent(event, eventType) {
  if (!/(^|[._-])turn[._-]?completed$|response\.completed/i.test(eventType)) return null
  const durationMs = Number(event?.duration_ms ?? event?.durationMs ?? event?.elapsed_ms ?? event?.elapsedMs)
  const status = firstText(event?.status, event?.data?.status)
  return {
    type: 'turn_completed',
    status: status || 'done',
    durationMs: Number.isFinite(durationMs) && durationMs > 0 ? durationMs : null,
    text: trimEventText(firstText(event?.message, event?.summary, event?.text, event?.data?.message, event?.data?.summary)),
  }
}

function extractFileChangeEvent(event, eventType) {
  const block = findObject(event, (item) => {
    const type = String(item?.type ?? item?.kind ?? '').toLowerCase()
    return type === 'file_change' || type === 'file.change'
  })
  if (!block && !/file[._-]?change/i.test(eventType)) return null
  const source = block || event
  const rawFiles = Array.isArray(source.files)
    ? source.files
    : Array.isArray(source.items)
      ? source.items
      : Array.isArray(source.changes)
        ? source.changes
        : [source]
  const files = rawFiles.map(normalizeFileChangeItem).filter(Boolean)
  if (!files.length) return null
  return {
    type: 'file_change',
    files,
  }
}

function normalizeFileChangeItem(item) {
  const path = firstText(item?.path, item?.file, item?.filename, item?.name)
  if (!path) return null
  const add = Number(item?.add ?? item?.adds ?? item?.added ?? item?.additions ?? 0)
  const del = Number(item?.del ?? item?.deleted ?? item?.deletions ?? item?.removals ?? 0)
  const rawOperation = firstText(item?.op, item?.operation, item?.status, item?.kind?.type, item?.kind)
  const operation = /create|add|new/i.test(rawOperation)
    ? 'new'
    : /delete|remove/i.test(rawOperation)
      ? 'deleted'
      : /move|rename/i.test(rawOperation)
        ? 'renamed'
        : 'modified'
  return {
    path: summarize(path, 240),
    op: operation,
    add: Number.isFinite(add) ? Math.max(0, Math.floor(add)) : 0,
    del: Number.isFinite(del) ? Math.max(0, Math.floor(del)) : 0,
  }
}

function extractProgressEvent(agent, event, eventType) {
  if (/^(assistant|result)$/.test(eventType)) return null
  if (/(completed|done|finished|exit)/i.test(eventType)) return null
  if (/tool|command|exec|delta|message/i.test(eventType)) return null

  const sessionId = cleanSessionId(extractSessionId(event))
  if (/system|init|session|started|start|turn|status|progress|reasoning|thinking|plan/i.test(eventType)) {
    const text = firstText(
      event?.summary,
      event?.status,
      event?.message,
      event?.text,
      event?.data?.summary,
      event?.data?.status,
      event?.data?.message,
      sessionId ? `${agent === 'claude' ? 'Claude' : 'Codex'} 세션 ${sessionId} 초기화` : ''
    )
    return {
      type: 'progress',
      kind: progressKindFor(eventType),
      phase: eventType || 'event',
      text: trimEventText(text || `${agent === 'claude' ? 'Claude' : 'Codex'} 진행 중`),
    }
  }

  return null
}

function toolKindFor(name, command, eventType, itemType) {
  const text = `${name || ''} ${command || ''} ${eventType || ''} ${itemType || ''}`.toLowerCase()
  if (/web|search|browser|open_url|fetch/.test(text)) return 'web'
  if (/image|screenshot|view_image|vision/.test(text)) return 'image'
  if (/file|edit|patch|apply_patch|write/.test(text)) return 'file'
  if (/reason|thinking|plan/.test(text)) return 'reasoning'
  if (/command|exec|shell|bash|cmd|terminal/.test(text)) return 'command'
  return 'tool'
}

function progressKindFor(eventType) {
  if (/web|search|browser/.test(eventType)) return 'web'
  if (/reason|thinking|plan/.test(eventType)) return 'reasoning'
  return 'progress'
}

function extractSessionId(event) {
  const direct = firstText(
    event?.session_id,
    event?.sessionId,
    event?.conversation_id,
    event?.conversationId,
    event?.thread_id,
    event?.threadId,
    event?.data?.session_id,
    event?.data?.sessionId,
    event?.message?.session_id
  )
  if (direct) return direct

  const type = eventTypeOf(event)
  if (/session|conversation|thread/.test(type)) return firstText(event?.id, event?.session?.id)
  return ''
}

function extractMessageId(event) {
  return cleanEventId(firstText(
    event?.event?.message?.id,
    event?.event?.item?.id,
    event?.event?.data?.id,
    event?.message?.id,
    event?.item?.id,
    event?.data?.id,
    event?.id
  ))
}

function eventTypeOf(event) {
  return String(event?.type ?? event?.event ?? event?.kind ?? event?.name ?? event?.msg?.type ?? '').toLowerCase()
}

function firstText(...values) {
  for (const value of values) {
    const text = textFromContent(value)
    if (text) return text
  }
  return ''
}

function textFromContent(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map(textFromContent).filter(Boolean).join('\n')
  }
  if (typeof value !== 'object') return ''

  const type = String(value.type ?? '').toLowerCase()
  if (type === 'text' || type === 'output_text' || type === 'input_text') return textFromContent(value.text)
  if (type === 'tool_result') return textFromContent(value.content)
  if (typeof value.text === 'string') return value.text
  if (typeof value.content === 'string' || Array.isArray(value.content)) return textFromContent(value.content)
  if (typeof value.message === 'string') return value.message
  return ''
}

function findObject(value, predicate, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 5) return null
  if (predicate(value)) return value
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findObject(item, predicate, depth + 1)
      if (found) return found
    }
    return null
  }
  for (const key of Object.keys(value)) {
    const found = findObject(value[key], predicate, depth + 1)
    if (found) return found
  }
  return null
}

function summarizeJson(value, max) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return summarize(value, max)
  try {
    return summarize(JSON.stringify(value, null, 2), max)
  } catch {
    return ''
  }
}

function trimEventText(value) {
  const text = String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
  return text.length > MAX_AGENT_EVENT_TEXT ? `${text.slice(0, MAX_AGENT_EVENT_TEXT).trimEnd()}\n...` : text
}

function cleanAgentDelta(value) {
  const text = String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  return text.length > MAX_AGENT_EVENT_TEXT ? text.slice(0, MAX_AGENT_EVENT_TEXT) : text
}

function shouldHideCodexAppServerWarning(value) {
  return /could not find bubblewrap on PATH/i.test(String(value || ''))
}

function cleanEventId(value) {
  const text = String(value ?? '').trim()
  return /^[A-Za-z0-9_.:-]{1,160}$/.test(text) ? text : ''
}

function cleanSessionId(value) {
  const text = String(value ?? '').trim()
  return /^[A-Za-z0-9_.:-]{1,160}$/.test(text) ? text : ''
}

function formatDuration(ms) {
  const seconds = Math.max(1, Math.round(ms / 1000))
  if (seconds < 60) return `${seconds}초`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes}분 ${rest}초` : `${minutes}분`
}

function commandToString(commandSpec) {
  return [commandSpec.command, ...commandSpec.args].map(shellQuote).join(' ')
}

function shellQuote(value) {
  const text = String(value)
  if (/^[A-Za-z0-9_./:=@%+-]+$/.test(text)) return text
  return `'${text.replaceAll("'", "'\\''")}'`
}

function filteredClaudeExtraArgs() {
  return filterCliArgs(CLAUDE_EXTRA_ARGS, {
    dropFlags: new Set(['--print', '-p', '--include-partial-messages', '--verbose', '--continue', '-c', '--fork-session']),
    dropOptions: new Set(['--output-format', '--session-id', '--resume', '--model', '--effort']),
  })
}

function claudeExtraSettingOverrides() {
  let model = ''
  let effort = ''
  for (let index = 0; index < CLAUDE_EXTRA_ARGS.length; index += 1) {
    const arg = String(CLAUDE_EXTRA_ARGS[index])
    if (arg === '--model') {
      model = normalizeClaudeModel(CLAUDE_EXTRA_ARGS[index + 1])
      index += 1
      continue
    }
    if (arg.startsWith('--model=')) {
      model = normalizeClaudeModel(arg.slice('--model='.length))
      continue
    }
    if (arg === '--effort') {
      effort = normalizeClaudeEffort(CLAUDE_EXTRA_ARGS[index + 1])
      index += 1
      continue
    }
    if (arg.startsWith('--effort=')) {
      effort = normalizeClaudeEffort(arg.slice('--effort='.length))
      continue
    }
  }
  return { model, effort }
}

function filterCliArgs(args, options) {
  const out = []
  const dropFlags = options.dropFlags ?? new Set()
  const dropOptions = options.dropOptions ?? new Set()
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (dropFlags.has(arg)) continue
    if (dropOptions.has(arg)) {
      if (args[index + 1] && !String(args[index + 1]).startsWith('-')) index += 1
      continue
    }
    if ([...dropOptions].some((option) => arg.startsWith(`${option}=`))) continue
    out.push(arg)
  }
  return out
}

async function refreshCodexRuntimeSettings(cwd, options = {}) {
  const cacheKey = resolve(typeof cwd === 'string' && cwd ? cwd : defaultCwd)
  const cached = codexConfigByCwd.get(cacheKey)
  const now = Date.now()
  if (!options.force && cached && now - cached.loadedAt < CODEX_SETTINGS_CACHE_MS && now - codexModelsLoadedAt < CODEX_SETTINGS_CACHE_MS) {
    return cached
  }
  if (codexConfigRefreshes.has(cacheKey)) return codexConfigRefreshes.get(cacheKey)

  const refresh = readCodexAppServerSettings(cacheKey)
    .then(({ config, models }) => {
      if (models.length) {
        codexModels = models
        codexModelsLoadedAt = Date.now()
      } else if (!codexModelsLoadedAt) {
        codexModelsLoadedAt = Date.now()
      }
      const value = { config, loadedAt: Date.now() }
      codexConfigByCwd.set(cacheKey, value)
      return value
    })
    .catch((err) => {
      fastify.log.warn({ err, cwd: cacheKey }, 'Failed to resolve Codex model settings')
      const value = cached || { config: {}, loadedAt: Date.now() }
      codexConfigByCwd.set(cacheKey, value)
      if (!codexModelsLoadedAt) codexModelsLoadedAt = Date.now()
      return value
    })
    .finally(() => codexConfigRefreshes.delete(cacheKey))

  codexConfigRefreshes.set(cacheKey, refresh)
  return refresh
}

function readCodexAppServerSettings(cwd) {
  return new Promise((resolveSettings, reject) => {
    const child = spawn(CODEX_BIN, ['app-server', '--stdio'], {
      cwd,
      env: { ...process.env, HOME: HOME_DIR },
      stdio: ['pipe', 'pipe', 'ignore'],
    })
    const lines = readline.createInterface({ input: child.stdout })
    const responses = new Map()
    let initialized = false
    let settled = false

    const finish = (err) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      lines.close()
      child.kill('SIGTERM')
      if (err) {
        reject(err)
        return
      }
      const configResult = responses.get(1)
      const modelResult = responses.get(2)
      resolveSettings({
        config: configResult?.config || {},
        models: normalizeCodexCatalog(modelResult?.data),
      })
    }

    const timer = setTimeout(() => finish(new Error('Codex settings lookup timed out.')), 8_000)
    timer.unref()

    child.on('error', finish)
    child.stdin.on('error', finish)
    child.on('close', (code) => {
      if (!settled && (!initialized || responses.size < 2)) {
        finish(new Error(`Codex app server exited before settings were resolved (${code ?? 'unknown'}).`))
      }
    })
    lines.on('line', (line) => {
      let message
      try {
        message = JSON.parse(line)
      } catch {
        return
      }
      if (message.id === 0) {
        if (message.error) return finish(new Error(message.error.message || 'Codex initialization failed.'))
        initialized = true
        sendCodexAppServerMessage(child, { method: 'initialized', params: {} })
        sendCodexAppServerMessage(child, { method: 'config/read', id: 1, params: { includeLayers: false, cwd } })
        sendCodexAppServerMessage(child, { method: 'model/list', id: 2, params: { limit: 100, includeHidden: false } })
        return
      }
      if (message.id !== 1 && message.id !== 2) return
      if (message.error) return finish(new Error(message.error.message || 'Codex settings lookup failed.'))
      responses.set(message.id, message.result || {})
      if (responses.size === 2) finish()
    })

    sendCodexAppServerMessage(child, {
      method: 'initialize',
      id: 0,
      params: {
        clientInfo: { name: 'devi', title: 'devi', version: '0.1.0' },
      },
    })
  })
}

function readCodexAccountRateLimits(cwd) {
  return new Promise((resolveLimits, reject) => {
    const child = spawn(CODEX_BIN, ['app-server', '--stdio'], {
      cwd: resolve(typeof cwd === 'string' && cwd ? cwd : defaultCwd),
      env: { ...process.env, HOME: HOME_DIR },
      stdio: ['pipe', 'pipe', 'ignore'],
    })
    const lines = readline.createInterface({ input: child.stdout })
    let initialized = false
    let settled = false

    const finish = (err, result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      lines.close()
      child.kill('SIGTERM')
      if (err) reject(err)
      else resolveLimits(normalizeCodexRateLimits(result))
    }

    const timer = setTimeout(() => finish(new Error('Codex rate limit lookup timed out.')), 8_000)
    timer.unref()

    child.on('error', finish)
    child.stdin.on('error', finish)
    child.on('close', (code) => {
      if (!settled) finish(new Error(`Codex app server exited before rate limits were resolved (${code ?? 'unknown'}).`))
    })
    lines.on('line', (line) => {
      let message
      try {
        message = JSON.parse(line)
      } catch {
        return
      }
      if (message.id === 0) {
        if (message.error) return finish(new Error(message.error.message || 'Codex initialization failed.'))
        initialized = true
        sendCodexAppServerMessage(child, { method: 'initialized', params: {} })
        sendCodexAppServerMessage(child, { method: 'account/rateLimits/read', id: 1, params: {} })
        return
      }
      if (!initialized || message.id !== 1) return
      if (message.error) return finish(new Error(message.error.message || 'Codex rate limit lookup failed.'))
      finish(null, message.result || {})
    })

    sendCodexAppServerMessage(child, {
      method: 'initialize',
      id: 0,
      params: {
        clientInfo: { name: 'devi', title: 'devi', version: '0.1.0' },
      },
    })
  })
}

function normalizeCodexRateLimits(result) {
  const fallback = result?.rateLimits && typeof result.rateLimits === 'object'
    ? { [result.rateLimits.limitId || 'codex']: result.rateLimits }
    : {}
  const source = result?.rateLimitsByLimitId && typeof result.rateLimitsByLimitId === 'object'
    ? result.rateLimitsByLimitId
    : fallback
  const limits = Object.entries(source).flatMap(([id, snapshot]) => {
    if (!snapshot || typeof snapshot !== 'object') return []
    const windows = [
      normalizeCodexRateLimitWindow('primary', snapshot.primary),
      normalizeCodexRateLimitWindow('secondary', snapshot.secondary),
    ].filter(Boolean)
    if (!windows.length) return []
    return [{
      id: cleanDisplayText(snapshot.limitId || id),
      name: cleanDisplayText(snapshot.limitName) || (id === 'codex' ? 'Codex' : id),
      planType: cleanDisplayText(snapshot.planType),
      reached: Boolean(snapshot.rateLimitReachedType || snapshot.spendControlReached),
      windows,
    }]
  }).sort((left, right) => {
    if (left.id === 'codex') return -1
    if (right.id === 'codex') return 1
    return left.name.localeCompare(right.name)
  })
  const primary = limits.find((item) => item.id === 'codex') || limits[0]
  return {
    available: Boolean(limits.length),
    planType: primary?.planType || null,
    limits,
    credits: normalizeCodexCredits(result?.rateLimits?.credits),
    measuredAt: new Date().toISOString(),
    ...(!limits.length ? { message: '현재 계정에 표시할 Codex 한도 정보가 없습니다.' } : {}),
  }
}

function normalizeCodexRateLimitWindow(kind, window) {
  if (!window || typeof window !== 'object') return null
  const usedPercent = Number(window.usedPercent)
  const windowMinutes = Number(window.windowDurationMins)
  const resetsAtSeconds = Number(window.resetsAt)
  if (!Number.isFinite(usedPercent) || !Number.isFinite(windowMinutes)) return null
  return {
    kind,
    usedPercent: Math.max(0, Math.min(100, usedPercent)),
    remainingPercent: Math.max(0, Math.min(100, 100 - usedPercent)),
    windowMinutes: Math.max(1, windowMinutes),
    resetsAt: Number.isFinite(resetsAtSeconds) && resetsAtSeconds > 0
      ? new Date(resetsAtSeconds * 1000).toISOString()
      : null,
  }
}

function normalizeCodexCredits(credits) {
  if (!credits || typeof credits !== 'object') return null
  return {
    hasCredits: Boolean(credits.hasCredits),
    unlimited: Boolean(credits.unlimited),
    balance: cleanDisplayText(credits.balance),
  }
}

function sendCodexAppServerMessage(child, message) {
  if (!child.stdin.destroyed) child.stdin.write(`${JSON.stringify(message)}\n`)
}

function normalizeCodexCatalog(items) {
  if (!Array.isArray(items)) return []
  return items.flatMap((item) => {
    const model = normalizeCodexModelSlug(item?.model || item?.id)
    if (!model) return []
    const efforts = Array.isArray(item.supportedReasoningEfforts)
      ? item.supportedReasoningEfforts.flatMap((effort) => {
          const id = normalizeCodexEffortSlug(effort?.reasoningEffort)
          return id ? [{ id, description: cleanDisplayText(effort?.description) }] : []
        })
      : []
    return [{
      id: model,
      model,
      displayName: cleanTitle(item.displayName) || model,
      description: cleanDisplayText(item.description),
      defaultReasoningEffort: normalizeCodexEffortSlug(item.defaultReasoningEffort),
      supportedReasoningEfforts: efforts,
      isDefault: item.isDefault === true,
    }]
  })
}

function publicCodexSettings(cwd) {
  const execution = resolveCodexExecution({ cwd })
  return {
    models: codexModels.map((item) => ({
      id: item.model,
      name: item.displayName,
      shortName: shortModelName(item.displayName, item.model),
      description: codexModelDescription(item),
      defaultEffort: item.defaultReasoningEffort || null,
      efforts: modelEffortOptions(item),
    })),
    resolvedModel: execution.resolvedModel,
    resolvedEffort: execution.resolvedEffort,
  }
}

function modelEffortOptions(model) {
  const source = model?.supportedReasoningEfforts?.length
    ? model.supportedReasoningEfforts
    : [...FALLBACK_CODEX_EFFORTS].map((id) => ({ id, description: '' }))
  return source.map((item) => ({
    id: item.id,
    name: effortDisplayName(item.id),
    description: effortDescription(item.id, item.description),
  }))
}

function resolveRoomExecution(room) {
  if (room.agent === 'claude') return resolveClaudeExecution(room)
  return resolveCodexExecution(room)
}

function publicClaudeSettings() {
  const execution = resolveClaudeExecution({})
  const efforts = CLAUDE_EFFORT_IDS.map((id) => ({
    id,
    name: effortDisplayName(id),
    description: effortDescription(id, ''),
  }))
  return {
    models: CLAUDE_MODELS.map((item) => ({
      id: item.model,
      name: item.displayName,
      shortName: item.shortName,
      description: item.description,
      defaultEffort: null,
      efforts,
    })),
    resolvedModel: execution.resolvedModel,
    resolvedEffort: execution.resolvedEffort,
  }
}

function resolveClaudeExecution(source = {}) {
  const cliOverrides = claudeExtraSettingOverrides()
  const selectedModel = normalizeClaudeModel(source.claudeModel)
  const configuredModel = normalizeClaudeModel(cliOverrides.model)
  const recommendedModel = CLAUDE_MODELS.find((item) => item.isDefault)?.model || CLAUDE_MODELS[0]?.model || ''
  const resolvedModel = selectedModel || configuredModel || recommendedModel
  const selectedEffort = normalizeClaudeEffort(source.claudeEffort)
  const configuredEffort = normalizeClaudeEffort(cliOverrides.effort)
  const resolvedEffort = selectedEffort || configuredEffort || 'medium'
  return {
    provider: 'claude',
    model: selectedModel || 'default',
    resolvedModel,
    effort: selectedEffort || 'default',
    resolvedEffort,
    permission: publicPermissionSetting().id,
  }
}

function resolveCodexExecution(source = {}) {
  const cwd = resolve(typeof source.cwd === 'string' && source.cwd ? source.cwd : defaultCwd)
  const config = codexConfigByCwd.get(cwd)?.config || codexConfigByCwd.get(defaultCwd)?.config || {}
  const cliOverrides = codexExtraSettingOverrides()
  const selectedModel = normalizeCodexModel(source.codexModel)
  const configuredModel = normalizeCodexModel(cliOverrides.model || config.model)
  const recommendedModel = codexModels.find((item) => item.isDefault)?.model || codexModels[0]?.model || ''
  const resolvedModel = selectedModel || configuredModel || recommendedModel
  const selectedEffort = normalizeCodexEffort(source.codexEffort)
  const configuredEffort = normalizeCodexEffort(cliOverrides.effort || config.model_reasoning_effort)
  const model = codexModels.find((item) => item.model === resolvedModel)
  const resolvedEffort = selectedEffort || configuredEffort || model?.defaultReasoningEffort || 'medium'
  return {
    provider: 'codex',
    model: selectedModel || 'default',
    resolvedModel,
    effort: selectedEffort || 'default',
    resolvedEffort,
    permission: publicPermissionSetting().id,
  }
}

function codexExtraSettingOverrides() {
  let model = ''
  let effort = ''
  for (let index = 0; index < CODEX_EXTRA_ARGS.length; index += 1) {
    const arg = String(CODEX_EXTRA_ARGS[index])
    if (arg === '-m' || arg === '--model') {
      model = normalizeCodexModel(CODEX_EXTRA_ARGS[index + 1])
      index += 1
      continue
    }
    if (arg.startsWith('--model=')) {
      model = normalizeCodexModel(arg.slice('--model='.length))
      continue
    }
    if (arg === '-c' || arg === '--config') {
      const override = parseCodexConfigOverride(CODEX_EXTRA_ARGS[index + 1])
      if (override.key === 'model') model = normalizeCodexModel(override.value)
      if (override.key === 'model_reasoning_effort') effort = normalizeCodexEffort(override.value)
      index += 1
      continue
    }
    if (arg.startsWith('--config=')) {
      const override = parseCodexConfigOverride(arg.slice('--config='.length))
      if (override.key === 'model') model = normalizeCodexModel(override.value)
      if (override.key === 'model_reasoning_effort') effort = normalizeCodexEffort(override.value)
    }
  }
  return { model, effort }
}

function parseCodexConfigOverride(value) {
  const text = String(value ?? '')
  const separator = text.indexOf('=')
  if (separator < 0) return { key: '', value: '' }
  return {
    key: text.slice(0, separator).trim(),
    value: text.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2'),
  }
}

function publicPermissionSetting() {
  return {
    id: 'full',
    name: 'Full',
    description: '샌드박스 제한 없이 실행',
  }
}

function shortModelName(displayName, model) {
  const match = String(displayName || model).match(/(?:^|[-\s])(sol|terra|luna)$/i)
  if (match) return `${match[1][0].toUpperCase()}${match[1].slice(1).toLowerCase()}`
  return String(displayName || model)
}

function codexModelDescription(model) {
  const known = {
    'gpt-5.6-sol': '복잡하고 깊은 작업',
    'gpt-5.6-terra': '일반적인 개발 작업',
    'gpt-5.6-luna': '명확한 반복 작업',
  }
  return known[model.model] || model.description || 'Codex CLI 제공 모델'
}

function effortDisplayName(value) {
  const names = {
    minimal: 'Minimal',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    xhigh: 'XHigh',
    max: 'Max',
    ultra: 'Ultra',
  }
  return names[value] || value
}

function effortDescription(value, fallback = '') {
  const descriptions = {
    minimal: '가장 빠른 응답',
    low: '빠른 확인과 간단한 작업',
    medium: '속도와 품질의 균형',
    high: '깊은 추론과 검토',
    xhigh: '매우 깊은 분석',
    max: '가장 어려운 작업을 위한 최대 추론',
    ultra: '하위 에이전트를 활용한 최대 추론',
  }
  return descriptions[value] || fallback || 'Codex reasoning effort'
}

async function collectWorkspaceChanges(cwd) {
  const root = await runCapture('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], { maxBytes: 8192 })
  if (root.code !== 0) return null
  const gitRoot = root.stdout.trim()
  if (!gitRoot) return null

  const status = await runCapture('git', ['-C', gitRoot, 'status', '--short'], { maxBytes: 64 * 1024 })
  const items = parseGitStatus(status.stdout)
  if (!items.length) return null

  const diff = await runCapture('git', ['-C', gitRoot, 'diff', 'HEAD', '--unified=2', '--no-ext-diff', '--'], {
    maxBytes: MAX_GIT_DIFF_BYTES,
  })
  const untrackedDiff = await collectUntrackedDiff(gitRoot, MAX_GIT_DIFF_BYTES - diff.stdout.length)
  return {
    items,
    diffFiles: parseUnifiedDiff(`${diff.stdout}\n${untrackedDiff}`),
  }
}

async function collectUntrackedDiff(gitRoot, maxBytes) {
  if (maxBytes <= 0) return ''
  const listed = await runCapture('git', ['-C', gitRoot, 'ls-files', '--others', '--exclude-standard', '-z'], {
    maxBytes: 64 * 1024,
  })
  if (listed.code !== 0 || !listed.stdout) return ''
  const paths = listed.stdout.split('\0').filter(Boolean).slice(0, 12)
  let output = ''
  for (const path of paths) {
    const remaining = maxBytes - output.length
    if (remaining <= 0) break
    const diff = await runCapture('git', [
      '-C', gitRoot,
      'diff', '--no-index', '--unified=2', '--no-ext-diff', '--', '/dev/null', path,
    ], { maxBytes: remaining })
    if (diff.stdout) output += `${diff.stdout}\n`
  }
  return output
}

function runCapture(command, args, options = {}) {
  const maxBytes = options.maxBytes ?? 128 * 1024
  const timeoutMs = options.timeoutMs ?? 5000
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let killed = false
    const timer = setTimeout(() => {
      killed = true
      child.kill('SIGTERM')
    }, timeoutMs)
    timer.unref()

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk) => {
      if (stdout.length < maxBytes) stdout += String(chunk).slice(0, maxBytes - stdout.length)
    })
    child.stderr.on('data', (chunk) => {
      if (stderr.length < maxBytes) stderr += String(chunk).slice(0, maxBytes - stderr.length)
    })
    child.on('error', (err) => {
      clearTimeout(timer)
      resolve({ code: 127, stdout, stderr: err.message })
    })
    child.on('close', (code, signal) => {
      clearTimeout(timer)
      resolve({ code: Number.isInteger(code) ? code : killed ? 124 : 1, signal, stdout, stderr })
    })
  })
}

function publicRoom(room) {
  const alive = runtimes.has(room.id)
  const execution = resolveRoomExecution(room)
  return {
    ...room,
    resolvedModel: execution.resolvedModel,
    resolvedEffort: execution.resolvedEffort,
    execution,
    status: alive ? 'running' : room.status === 'running' ? 'stopped' : room.status,
    alive,
    pid: alive ? room.pid : null,
  }
}

function addClient(roomId, socket) {
  if (!clientsByRoom.has(roomId)) clientsByRoom.set(roomId, new Set())
  clientsByRoom.get(roomId).add(socket)
}

function removeClient(roomId, socket) {
  const clients = clientsByRoom.get(roomId)
  if (!clients) return
  clients.delete(socket)
  if (!clients.size) clientsByRoom.delete(roomId)
}

function broadcastRoom(roomId, payload) {
  const clients = clientsByRoom.get(roomId)
  const roomListPayload = payload?.type === 'room' || payload?.type === 'room_deleted'
  if (!clients?.size && (!roomListPayload || !roomUpdateClients.size)) return
  const message = JSON.stringify(payload)
  if (clients) {
    for (const socket of clients) sendSocket(socket, message, true)
  }
  if (roomListPayload) {
    for (const socket of roomUpdateClients) sendSocket(socket, message, true)
  }
}

function closeRoomClients(roomId, code, reason) {
  const clients = clientsByRoom.get(roomId)
  if (!clients) return
  for (const socket of clients) {
    try {
      socket.close(code, reason)
    } catch {}
  }
  clientsByRoom.delete(roomId)
}

function sendSocket(socket, payload, alreadySerialized = false) {
  if (!socket || socket.readyState !== 1) return
  socket.send(alreadySerialized ? payload : JSON.stringify(payload))
}

function queueRoomWrite(roomId, task) {
  const previous = writeQueues.get(roomId) ?? Promise.resolve()
  const next = previous.catch(() => {}).then(task)
  writeQueues.set(roomId, next)
  next.finally(() => {
    if (writeQueues.get(roomId) === next) writeQueues.delete(roomId)
  }).catch(() => {})
  return next
}

async function listWorkspaces() {
  const dirs = new Map()
  const defaultInfo = await describeWorkspace(defaultCwd)
  if (defaultInfo) dirs.set(defaultInfo.path, defaultInfo)
  dirs.set(HOME_DIR, workspaceInfo(HOME_DIR, 'Home', { project: false, git: false }))

  const entries = await readdir(HOME_DIR, { withFileTypes: true }).catch(() => [])
  await Promise.all(entries.map(async (entry) => {
    if (!entry.isDirectory()) return
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return
    const dir = join(HOME_DIR, entry.name)
    const info = await describeWorkspace(dir)
    if (info) dirs.set(info.path, info)
  }))

  return [...dirs.values()].sort((a, b) => {
    if (Boolean(a.git) !== Boolean(b.git)) return a.git ? -1 : 1
    if (Boolean(a.project) !== Boolean(b.project)) return a.project ? -1 : 1
    return a.label.localeCompare(b.label)
  })
}

async function describeWorkspace(dir) {
  const resolved = await realpath(dir).catch(() => null)
  if (!resolved) return null
  if (!isAllowedCwd(resolved)) return null
  const checks = await Promise.all([
    stat(join(resolved, '.git')).catch(() => null),
    stat(join(resolved, 'package.json')).catch(() => null),
    stat(join(resolved, 'README.md')).catch(() => null),
    stat(join(resolved, 'pyproject.toml')).catch(() => null),
  ])
  const interesting = checks.some(Boolean)
  if (!interesting) return null
  return workspaceInfo(resolved, basename(resolved), {
    project: true,
    git: Boolean(checks[0]),
  })
}

function workspaceInfo(path, label, options = {}) {
  return {
    path,
    label,
    project: options.project !== false,
    git: Boolean(options.git),
  }
}

async function resolveAllowedRoots() {
  const raw = String(process.env.DEVAI_ALLOWED_CWD_ROOTS ?? HOME_DIR)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const roots = raw.length ? raw : [HOME_DIR]
  const resolved = []
  for (const root of roots) {
    const path = await realpath(resolve(root)).catch(() => null)
    if (path) resolved.push(path)
  }
  return resolved.length ? resolved : [HOME_DIR]
}

async function normalizeCwd(value) {
  const requested = typeof value === 'string' && value.trim() ? value.trim() : defaultCwd
  const path = await realpath(resolve(requested))
  const info = await stat(path)
  if (!info.isDirectory()) throw new Error('Working directory must be a directory.')
  if (!isAllowedCwd(path)) throw new Error('Working directory is not allowed.')
  return path
}

function isAllowedCwd(path) {
  return allowedCwdRoots.some((root) => path === root || path.startsWith(`${root}/`))
}

async function emitAssistantAttachmentsFromAgentEvent(roomId, runtime, options = {}) {
  if (!runtime) return
  const used = safeNonNegativeInteger(runtime.assistantAttachmentCount)
  if (used >= MAX_ATTACHMENTS_PER_TURN) return
  const room = runtime.roomSnapshot || await readRoom(roomId)
  if (!room) return

  const saved = []
  const texts = Array.isArray(options.texts) ? options.texts : []
  for (const text of texts) {
    for (const candidate of assistantAttachmentPathCandidates(text)) {
      if (used + saved.length >= MAX_ATTACHMENTS_PER_TURN) break
      const attachment = await saveAssistantAttachmentPath(room, candidate, runtime).catch((err) => {
        fastify.log.debug({ err, roomId, candidate }, 'Skipped assistant attachment path')
        return null
      })
      if (attachment) saved.push(attachment)
    }
  }

  const payloads = Array.isArray(options.payloads) ? options.payloads : []
  for (const payload of payloads) {
    const remaining = MAX_ATTACHMENTS_PER_TURN - used - saved.length
    if (remaining <= 0) break
    const embedded = embeddedAssistantImages(payload, {
      maxItems: remaining,
      maxBase64Chars: Math.ceil(MAX_ATTACHMENT_BYTES * 4 / 3) + 32,
    })
    for (const image of embedded) {
      const attachment = await saveAssistantImageData(room.id, image, runtime).catch((err) => {
        fastify.log.debug({ err, roomId }, 'Skipped embedded assistant image')
        return null
      })
      if (attachment) saved.push(attachment)
    }
  }

  if (!saved.length) return
  await queueRoomWrite(room.id, async () => {
    const index = await readAttachmentIndex(room.id)
    index.push(...saved)
    await writeAttachmentIndex(room.id, index)
  })
  runtime.assistantAttachmentCount = used + saved.length
  await emitRoomEvent(room.id, {
    type: 'assistant_attachment',
    agent: runtime.agent === 'claude' ? 'claude' : 'codex',
    text: saved.length === 1 ? '파일 1개를 첨부했습니다.' : `파일 ${saved.length}개를 첨부했습니다.`,
    attachments: saved.map((item) => publicAttachment(room.id, item)).filter(Boolean),
  })
}

async function saveAssistantAttachmentPath(room, candidate, runtime) {
  const requested = resolve(room.cwd, candidate)
  const sourcePath = await realpath(requested)
  if (!assistantAttachmentPathAllowed(room, sourcePath)) throw new Error('Assistant attachment path is outside allowed roots.')
  if (runtime.assistantAttachmentSources.has(sourcePath)) return null

  const info = await stat(sourcePath)
  if (!info.isFile() || info.size <= 0 || info.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`Assistant attachment must be a file no larger than ${formatBytes(MAX_ATTACHMENT_BYTES)}.`)
  }
  const detected = await detectAssistantAttachmentFile(sourcePath)
  if (!detected) throw new Error('Assistant attachment type or signature is not supported.')

  const id = crypto.randomUUID()
  const filename = `${id}${detected.extension}`
  const dir = roomAttachmentDir(room.id)
  await mkdir(dir, { recursive: true })
  const tmpPath = join(dir, `${filename}.tmp`)
  const finalPath = join(dir, filename)
  try {
    const copied = await queueAttachmentStorage(async () => {
      await assertAttachmentCapacity(room.id, info.size)
      await pipeline(createReadStream(sourcePath), createWriteStream(tmpPath, { flags: 'wx' }))
      const result = await stat(tmpPath)
      if (!result.isFile() || result.size !== info.size || !(await detectAssistantAttachmentFile(tmpPath))) {
        throw new Error('Assistant attachment changed while it was being copied.')
      }
      await rename(tmpPath, finalPath)
      return result
    })
    runtime.assistantAttachmentSources.add(sourcePath)
    if (pathWithin(GENERATED_DIR, sourcePath)) await rm(sourcePath, { force: true })
    return normalizeAttachment(room.id, {
      id,
      name: assistantAttachmentName(sourcePath, detected.extension),
      filename,
      mime: detected.mime,
      size: copied.size,
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    await rm(tmpPath, { force: true }).catch(() => {})
    await rm(finalPath, { force: true }).catch(() => {})
    throw err
  }
}

async function saveAssistantImageData(roomId, image, runtime) {
  const buffer = Buffer.from(String(image?.data || '').replace(/\s+/g, ''), 'base64')
  if (!buffer.length || buffer.length > MAX_ATTACHMENT_BYTES) {
    throw new Error(`Embedded assistant image exceeds ${formatBytes(MAX_ATTACHMENT_BYTES)}.`)
  }
  const detected = detectRasterImage(buffer)
  if (!detected) throw new Error('Embedded assistant data is not a supported raster image.')
  const digest = crypto.createHash('sha256').update(buffer).digest('hex')
  if (runtime.assistantAttachmentDigests.has(digest)) return null

  const id = crypto.randomUUID()
  const filename = `${id}${detected.extension}`
  const dir = roomAttachmentDir(roomId)
  await mkdir(dir, { recursive: true })
  const tmpPath = join(dir, `${filename}.tmp`)
  const finalPath = join(dir, filename)
  try {
    await queueAttachmentStorage(async () => {
      await assertAttachmentCapacity(roomId, buffer.length)
      await writeFile(tmpPath, buffer, { flag: 'wx' })
      await rename(tmpPath, finalPath)
    })
    runtime.assistantAttachmentDigests.add(digest)
    return normalizeAttachment(roomId, {
      id,
      name: cleanAttachmentName(image?.name || `assistant-image${detected.extension}`),
      filename,
      mime: detected.mime,
      size: buffer.length,
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    await rm(tmpPath, { force: true }).catch(() => {})
    await rm(finalPath, { force: true }).catch(() => {})
    throw err
  }
}

async function detectRasterImageFile(path) {
  const handle = await openFile(path, 'r')
  try {
    const buffer = Buffer.alloc(16)
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
    return detectRasterImage(buffer.subarray(0, bytesRead))
  } finally {
    await handle.close()
  }
}

async function detectAssistantAttachmentFile(path) {
  const handle = await openFile(path, 'r')
  try {
    const buffer = Buffer.alloc(512)
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0)
    const sample = buffer.subarray(0, bytesRead)
    const raster = detectRasterImage(sample)
    if (raster) return raster
    const extension = extname(path).toLowerCase()
    const zip = sample.length >= 4 && sample[0] === 0x50 && sample[1] === 0x4b && [0x03, 0x05, 0x07].includes(sample[2]) && [0x04, 0x06, 0x08].includes(sample[3])
    if (zip && ['.zip', '.docx', '.xlsx', '.pptx'].includes(extension)) {
      const mime = {
        '.zip': 'application/zip',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      }[extension]
      return { extension, mime }
    }
    if (extension === '.pdf' && sample.subarray(0, 5).toString('ascii') === '%PDF-') return { extension, mime: 'application/pdf' }
    if (['.gz', '.tgz'].includes(extension) && sample[0] === 0x1f && sample[1] === 0x8b) return { extension, mime: 'application/gzip' }
    if (extension === '.tar' && sample.subarray(257, 262).toString('ascii') === 'ustar') return { extension, mime: 'application/x-tar' }
    return null
  } finally {
    await handle.close()
  }
}

function assistantAttachmentPathAllowed(room, path) {
  const roots = [room.cwd, DATA_ROOT, ...allowedCwdRoots].filter(Boolean)
  return roots.some((root) => path === root || path.startsWith(`${root}/`))
}

function assistantAttachmentName(path, extension) {
  const original = cleanAttachmentName(path)
  const stem = original.slice(0, Math.max(0, original.length - extname(original).length)) || 'assistant-file'
  return cleanAttachmentName(`${stem}${extension}`)
}

async function saveAttachmentPart(roomId, part) {
  const id = crypto.randomUUID()
  const name = cleanAttachmentName(part.filename)
  const mime = cleanAttachmentMime(part.mimetype)
  const ext = attachmentExtension(name, mime)
  const filename = `${id}${ext}`
  const dir = roomAttachmentDir(roomId)
  await mkdir(dir, { recursive: true })

  const tmpPath = join(dir, `${filename}.tmp`)
  const finalPath = join(dir, filename)
  try {
    await pipeline(part.file, createWriteStream(tmpPath, { flags: 'wx' }))
    if (part.file.truncated) {
      throw new Error(`Attachment is too large. Max ${formatBytes(MAX_ATTACHMENT_BYTES)}.`)
    }
    const info = await stat(tmpPath)
    if (!info.isFile()) throw new Error('Attachment upload failed.')
    if (info.size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`Attachment is too large. Max ${formatBytes(MAX_ATTACHMENT_BYTES)}.`)
    }
    await queueAttachmentStorage(async () => {
      await assertAttachmentCapacity(roomId)
      await rename(tmpPath, finalPath)
    })
    return normalizeAttachment(roomId, {
      id,
      name,
      filename,
      mime,
      size: info.size,
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    await rm(tmpPath, { force: true }).catch(() => {})
    await rm(finalPath, { force: true }).catch(() => {})
    throw err
  }
}

async function loadTurnAttachments(roomId, values) {
  const ids = cleanAttachmentIds(values).slice(0, MAX_ATTACHMENTS_PER_TURN)
  if (!ids.length) return []
  const index = await readAttachmentIndex(roomId)
  const byId = new Map(index.map((item) => [item.id, item]))
  const attachments = []
  for (const id of ids) {
    const attachment = byId.get(id)
    if (!attachment) continue
    const info = await stat(attachment.path).catch(() => null)
    if (info?.isFile()) attachments.push(attachment)
  }
  return attachments
}

function cleanAttachmentIds(values) {
  const raw = Array.isArray(values) ? values : []
  const ids = []
  for (const value of raw) {
    const id = safeAttachmentId(value)
    if (id && !ids.includes(id)) ids.push(id)
  }
  return ids
}

function queueAttachmentStorage(task) {
  const next = attachmentStorageQueue.catch(() => {}).then(task)
  attachmentStorageQueue = next
  return next
}

async function assertAttachmentCapacity(roomId, incomingBytes = 0) {
  const required = safeNonNegativeInteger(incomingBytes)
  const roomBytes = await attachmentDirectoryBytes(roomId)
  if (roomBytes + required > MAX_ROOM_ATTACHMENT_BYTES) {
    throw attachmentQuotaError(`이 채팅방의 첨부파일 한도 ${formatBytes(MAX_ROOM_ATTACHMENT_BYTES)}를 초과합니다.`)
  }

  let totalBytes = await totalAttachmentBytes()
  if (totalBytes + required > MAX_TOTAL_ATTACHMENT_BYTES) {
    await purgeTrashedRoomsForCapacity(required)
    totalBytes = await totalAttachmentBytes()
  }
  if (totalBytes + required > MAX_TOTAL_ATTACHMENT_BYTES) {
    throw attachmentQuotaError(`서버 첨부파일 한도 ${formatBytes(MAX_TOTAL_ATTACHMENT_BYTES)}를 초과합니다.`)
  }
  logAttachmentStorageLevel(totalBytes + required)
}

function attachmentQuotaError(message) {
  const error = new Error(message)
  error.code = 'ATTACHMENT_QUOTA_EXCEEDED'
  error.statusCode = 413
  return error
}

async function attachmentDirectoryBytes(roomId) {
  const safeId = safeRoomId(roomId)
  if (!safeId) return 0
  const entries = await readdir(roomAttachmentDir(safeId), { withFileTypes: true }).catch(() => [])
  let bytes = 0
  for (const entry of entries) {
    if (!entry.isFile() || entry.name === 'index.json') continue
    const info = await stat(join(roomAttachmentDir(safeId), entry.name)).catch(() => null)
    if (info?.isFile()) bytes += info.size
  }
  return bytes
}

async function totalAttachmentBytes() {
  const entries = await readdir(ATTACHMENT_DIR, { withFileTypes: true }).catch(() => [])
  let bytes = 0
  for (const entry of entries) {
    if (!entry.isDirectory() || !safeRoomId(entry.name)) continue
    bytes += await attachmentDirectoryBytes(entry.name)
  }
  return bytes
}

async function attachmentStorageSummary() {
  const entries = await readdir(ATTACHMENT_DIR, { withFileTypes: true }).catch(() => [])
  let usedBytes = 0
  let fileCount = 0
  let roomCount = 0
  for (const entry of entries) {
    if (!entry.isDirectory() || !safeRoomId(entry.name)) continue
    roomCount += 1
    const files = await readdir(join(ATTACHMENT_DIR, entry.name), { withFileTypes: true }).catch(() => [])
    for (const file of files) {
      if (!file.isFile() || file.name === 'index.json') continue
      const info = await stat(join(ATTACHMENT_DIR, entry.name, file.name)).catch(() => null)
      if (!info?.isFile()) continue
      usedBytes += info.size
      fileCount += 1
    }
  }
  const usedPercent = MAX_TOTAL_ATTACHMENT_BYTES > 0
    ? Math.min(100, (usedBytes / MAX_TOTAL_ATTACHMENT_BYTES) * 100)
    : 100
  return {
    usedBytes,
    usedPercent: Number(usedPercent.toFixed(2)),
    totalQuotaBytes: MAX_TOTAL_ATTACHMENT_BYTES,
    roomQuotaBytes: MAX_ROOM_ATTACHMENT_BYTES,
    fileLimitBytes: MAX_ATTACHMENT_BYTES,
    fileCount,
    roomCount,
    level: attachmentStorageLevel(usedPercent),
    retention: {
      trashDays: Math.round(TRASH_RETENTION_MS / (24 * 60 * 60 * 1000)),
      orphanHours: Math.round(ORPHAN_RETENTION_MS / (60 * 60 * 1000)),
      cleanupIntervalHours: Math.round(ATTACHMENT_CLEANUP_INTERVAL_MS / (60 * 60 * 1000)),
    },
  }
}

function attachmentStorageLevel(percent) {
  if (percent >= 95) return 'critical'
  if (percent >= 85) return 'high'
  if (percent >= ATTACHMENT_WARNING_PERCENT) return 'warning'
  return 'normal'
}

function logAttachmentStorageLevel(bytes) {
  const percent = MAX_TOTAL_ATTACHMENT_BYTES > 0 ? (bytes / MAX_TOTAL_ATTACHMENT_BYTES) * 100 : 100
  const level = attachmentStorageLevel(percent)
  if (level === 'normal') return
  const details = { usedBytes: bytes, quotaBytes: MAX_TOTAL_ATTACHMENT_BYTES, percent: Number(percent.toFixed(2)) }
  if (level === 'critical') fastify.log.error(details, 'Attachment storage is critically full')
  else fastify.log.warn(details, 'Attachment storage usage is high')
}

async function purgeTrashedRoomsForCapacity(incomingBytes = 0) {
  const trashed = (await listRooms())
    .filter((room) => room.trashedAt)
    .sort((left, right) => String(left.trashedAt).localeCompare(String(right.trashedAt)))
  let totalBytes = await totalAttachmentBytes()
  for (const room of trashed) {
    if (totalBytes + incomingBytes <= MAX_TOTAL_ATTACHMENT_BYTES) break
    const reclaimed = await attachmentDirectoryBytes(room.id)
    await deleteRoomFiles(room.id)
    closeRoomClients(room.id, 1008, 'Room expired under storage pressure')
    totalBytes = Math.max(0, totalBytes - reclaimed)
    fastify.log.warn({ roomId: room.id, reclaimedBytes: reclaimed }, 'Purged trashed room under attachment storage pressure')
  }
}

async function runAttachmentMaintenance() {
  return queueAttachmentStorage(async () => {
    const now = Date.now()
    const result = { expiredRooms: 0, orphanDirectories: 0, orphanFiles: 0, missingIndexEntries: 0, generatedFiles: 0 }
    const rooms = await listRooms()
    for (const room of rooms) {
      const trashedAt = room.trashedAt ? new Date(room.trashedAt).valueOf() : NaN
      if (!Number.isFinite(trashedAt) || now - trashedAt < TRASH_RETENTION_MS) continue
      await deleteRoomFiles(room.id)
      closeRoomClients(room.id, 1008, 'Room expired from trash')
      result.expiredRooms += 1
    }

    const attachmentDirs = await readdir(ATTACHMENT_DIR, { withFileTypes: true }).catch(() => [])
    for (const entry of attachmentDirs) {
      if (!entry.isDirectory()) continue
      const roomId = safeRoomId(entry.name)
      if (!roomId) continue
      const dir = roomAttachmentDir(roomId)
      const room = await readRoom(roomId)
      if (!room) {
        const info = await stat(dir).catch(() => null)
        if (info && now - info.mtimeMs >= ORPHAN_RETENTION_MS) {
          await rm(dir, { recursive: true, force: true })
          result.orphanDirectories += 1
        }
        continue
      }

      const index = await readAttachmentIndex(roomId)
      const diskFiles = await readdir(dir, { withFileTypes: true }).catch(() => [])
      const indexedNames = new Set(index.map((item) => item.filename))
      for (const file of diskFiles) {
        if (!file.isFile() || file.name === 'index.json' || indexedNames.has(file.name)) continue
        const filePath = join(dir, file.name)
        const info = await stat(filePath).catch(() => null)
        if (info && now - info.mtimeMs >= ORPHAN_RETENTION_MS) {
          await rm(filePath, { force: true })
          result.orphanFiles += 1
        }
      }
      const existing = []
      for (const attachment of index) {
        const info = await stat(attachment.path).catch(() => null)
        if (info?.isFile()) existing.push(attachment)
        else result.missingIndexEntries += 1
      }
      if (existing.length !== index.length) await writeAttachmentIndex(roomId, existing)
    }

    result.generatedFiles = await cleanGeneratedFiles(GENERATED_DIR, now)
    const usedBytes = await totalAttachmentBytes()
    logAttachmentStorageLevel(usedBytes)
    fastify.log.info({ ...result, usedBytes }, 'Attachment maintenance completed')
    return result
  })
}

async function cleanGeneratedFiles(directory, now, removeDirectory = false) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => [])
  let removed = 0
  for (const entry of entries) {
    const itemPath = join(directory, entry.name)
    if (entry.isDirectory()) {
      removed += await cleanGeneratedFiles(itemPath, now, true)
      continue
    }
    const info = await stat(itemPath).catch(() => null)
    if (info && now - info.mtimeMs >= ORPHAN_RETENTION_MS) {
      await rm(itemPath, { force: true })
      removed += 1
    }
  }
  if (removeDirectory) {
    const remaining = await readdir(directory).catch(() => [])
    if (!remaining.length) await rm(directory, { recursive: true, force: true })
  }
  return removed
}

function pathWithin(root, target) {
  const base = resolve(root)
  const path = resolve(target)
  return path === base || path.startsWith(`${base}/`)
}

async function readAttachmentIndex(roomId) {
  const safeId = safeRoomId(roomId)
  if (!safeId) return []
  try {
    const parsed = JSON.parse(await readFile(attachmentIndexPath(safeId), 'utf8'))
    const items = Array.isArray(parsed?.attachments) ? parsed.attachments : Array.isArray(parsed) ? parsed : []
    return items
      .map((item) => normalizeAttachment(safeId, item))
      .filter(Boolean)
      .slice(-1000)
  } catch {
    return []
  }
}

async function writeAttachmentIndex(roomId, items) {
  const safeId = safeRoomId(roomId)
  if (!safeId) throw new Error('Invalid room id.')
  const dir = roomAttachmentDir(safeId)
  await mkdir(dir, { recursive: true })
  const normalized = items
    .map((item) => normalizeAttachment(safeId, item))
    .filter(Boolean)
    .slice(-1000)
  const tmpPath = `${attachmentIndexPath(safeId)}.${crypto.randomUUID()}.tmp`
  await writeFile(tmpPath, `${JSON.stringify({ attachments: normalized.map(storedAttachment) }, null, 2)}\n`, 'utf8')
  await rename(tmpPath, attachmentIndexPath(safeId))
}

function normalizeAttachment(roomId, item) {
  const id = safeAttachmentId(item?.id)
  const filename = safeAttachmentFilename(item?.filename)
  if (!id || !filename) return null
  const dir = roomAttachmentDir(roomId)
  const path = resolve(dir, filename)
  if (path !== join(dir, filename) || !path.startsWith(`${dir}/`)) return null
  const mime = cleanAttachmentMime(item?.mime)
  return {
    id,
    name: cleanAttachmentName(item?.name || filename),
    filename,
    mime,
    size: safeNonNegativeInteger(item?.size),
    createdAt: safeIsoDate(item?.createdAt),
    kind: attachmentKind(filename, mime),
    path,
  }
}

function storedAttachment(item) {
  return {
    id: item.id,
    name: item.name,
    filename: item.filename,
    mime: item.mime,
    size: item.size,
    createdAt: item.createdAt,
  }
}

function publicAttachment(roomId, item) {
  const attachment = normalizeAttachment(roomId, item)
  return attachment ? {
    id: attachment.id,
    name: attachment.name,
    mime: attachment.mime,
    size: attachment.size,
    kind: attachment.kind,
    path: attachment.path,
    url: `/api/rooms/${roomId}/attachments/${attachment.id}`,
    relativePath: `data/attachments/${roomId}/${attachment.filename}`,
    createdAt: attachment.createdAt,
  } : null
}

function roomAttachmentDir(roomId) {
  return join(ATTACHMENT_DIR, roomId)
}

function attachmentIndexPath(roomId) {
  return join(roomAttachmentDir(roomId), 'index.json')
}

function safeAttachmentId(value) {
  const text = String(value ?? '').trim()
  return /^[0-9a-f-]{36}$/i.test(text) ? text.toLowerCase() : ''
}

function safeAttachmentFilename(value) {
  const text = String(value ?? '').trim()
  return /^[0-9a-f-]{36}(?:\.[a-z0-9]{1,12})?$/i.test(text) ? text.toLowerCase() : ''
}

function cleanAttachmentName(value) {
  const raw = String(value || 'attachment')
    .replace(/\0/g, '')
    .replaceAll('\\', '/')
  const name = basename(raw)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return summarize(name || 'attachment', 180)
}

function headerSafeFilename(value) {
  return cleanAttachmentName(value).replace(/["\\\r\n]/g, '_')
}

function cleanAttachmentMime(value) {
  const text = String(value || '').trim().toLowerCase()
  return /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(text) ? text.slice(0, 120) : ''
}

function attachmentExtension(name, mime) {
  const ext = extname(name).toLowerCase()
  if (/^\.[a-z0-9]{1,12}$/.test(ext)) return ext
  const byMime = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'text/markdown': '.md',
    'application/json': '.json',
  }
  return byMime[mime] || ''
}

function attachmentKind(filename, mime) {
  const ext = extname(filename).toLowerCase()
  if (mime.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext)) return 'image'
  if (mime === 'application/pdf' || ext === '.pdf') return 'pdf'
  if (mime.startsWith('text/') || ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts'].includes(ext)) return 'text'
  return 'document'
}

function safeNonNegativeInteger(value) {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0
}

function formatBytes(value) {
  const bytes = Number(value)
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B'
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${Math.round(bytes)} B`
}

function roomPath(roomId) {
  return join(ROOM_DIR, `${roomId}.json`)
}

function eventPath(roomId) {
  return join(EVENT_DIR, `${roomId}.jsonl`)
}

function safeRoomId(value) {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value) ? value : null
}

function normalizeAgent(value) {
  return value === 'claude' ? 'claude' : 'codex'
}

function normalizeCodexModel(value) {
  const model = normalizeCodexModelSlug(value)
  if (!model || model === 'default') return ''
  return model
}

function normalizeCodexEffort(value) {
  const effort = normalizeCodexEffortSlug(value)
  if (!effort || effort === 'default') return ''
  return effort
}

function normalizeCodexModelSlug(value) {
  const model = String(value ?? '').trim().toLowerCase()
  return /^[a-z0-9][a-z0-9._:-]{0,99}$/.test(model) ? model : ''
}

function normalizeCodexEffortSlug(value) {
  const effort = String(value ?? '').trim().toLowerCase()
  return FALLBACK_CODEX_EFFORTS.has(effort) ? effort : ''
}

function normalizeClaudeModel(value) {
  const model = String(value ?? '').trim().toLowerCase()
  return CLAUDE_MODELS.some((item) => item.model === model) ? model : ''
}

function normalizeClaudeEffort(value) {
  const effort = String(value ?? '').trim().toLowerCase()
  return CLAUDE_EFFORT_IDS.includes(effort) ? effort : ''
}

function cleanTitle(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, 80)
}

function cleanDisplayText(value) {
  if (typeof value !== 'string') return ''
  return value.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().slice(0, MAX_DISPLAY_TEXT)
}

function defaultRoomTitle(agent) {
  return agent === 'claude' ? 'New Claude room' : 'New Codex room'
}

function titleFromPrompt(prompt) {
  const cleaned = cleanDisplayText(prompt)
  if (!cleaned) return ''
  return summarize(cleaned.split('\n')[0], 54)
}

function summarize(value, max) {
  const clean = String(value ?? '').replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}...` : clean
}

function safeIsoDate(value) {
  const date = new Date(value)
  return Number.isFinite(date.valueOf()) ? date.toISOString() : new Date().toISOString()
}

function safeTerminalNumber(value, fallback, min, max) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, Math.floor(number)))
}

function safeByteCursor(value) {
  if (value === undefined || value === null || value === '') return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) return null
  return Math.floor(number)
}

function parseExtraArgs(value) {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string')
  } catch {
    return String(value).split(/\s+/).filter(Boolean)
  }
  return []
}

function csvSet(value) {
  return new Set(String(value ?? '')
    .split(',')
    .map(normalizeIdentity)
    .filter(Boolean))
}

function normalizeIdentity(value) {
  return String(value ?? '').trim().toLowerCase()
}

function sanitizeNextPath(value) {
  if (typeof value !== 'string') return '/'
  const trimmed = value.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/'
  return trimmed.slice(0, 300) || '/'
}

function normalizeOrigin(value) {
  const url = new URL(value)
  return url.origin
}

function originHostMatchesRequest(origin, request) {
  const originHost = new URL(origin).host
  const requestHost = String(request.headers.host ?? '').split(',')[0].trim()
  return Boolean(originHost && requestHost && originHost === requestHost)
}

function sanitizeLoggedUrl(value) {
  try {
    const url = new URL(value, PUBLIC_ORIGIN)
    for (const key of ['password', 'token', 'access_token', 'refresh_token']) url.searchParams.delete(key)
    return `${url.pathname}${url.search}`
  } catch {
    return value
  }
}

function mimeFor(filePath) {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.html') return 'text/html; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.js') return 'text/javascript; charset=utf-8'
  if (ext === '.json') return 'application/json; charset=utf-8'
  if (ext === '.webmanifest') return 'application/manifest+json; charset=utf-8'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.png') return 'image/png'
  if (ext === '.ico') return 'image/x-icon'
  return 'application/octet-stream'
}

async function sendFile(reply, filePath, contentType, cacheControl) {
  const file = await stat(filePath).catch(() => null)
  if (!file?.isFile()) return reply.code(404).type('text/plain; charset=utf-8').send('Not found\n')
  return reply.header('Cache-Control', cacheControl).type(contentType).send(createReadStream(filePath))
}
