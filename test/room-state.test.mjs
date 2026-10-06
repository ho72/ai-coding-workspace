import assert from 'node:assert/strict'
import test from 'node:test'

import { roomCanChangeAgent, roomJustFinished } from '../public/room-state.js'

test('allows changing the agent in an unused room', () => {
  const room = {
    agent: 'codex',
    alive: false,
    lastStartedAt: null,
    lastUserMessage: '',
    archivedAt: null,
    trashedAt: null,
  }

  assert.equal(roomCanChangeAgent(room, [{ type: 'system', text: 'Room created.' }]), true)
})

test('does not change the agent after a conversation has started', () => {
  const emptyRoom = { agent: 'codex', alive: false, lastStartedAt: null, lastUserMessage: '' }

  assert.equal(roomCanChangeAgent({ ...emptyRoom, lastUserMessage: 'hello' }), false)
  assert.equal(roomCanChangeAgent({ ...emptyRoom, lastStartedAt: '2026-09-12T10:00:00.000Z' }), false)
  assert.equal(roomCanChangeAgent(emptyRoom, [{ type: 'input', text: 'hello' }]), false)
  assert.equal(roomCanChangeAgent({ ...emptyRoom, alive: true }), false)
})

test('does not change the agent in archived or trashed rooms', () => {
  const emptyRoom = { agent: 'codex', alive: false, lastStartedAt: null, lastUserMessage: '' }

  assert.equal(roomCanChangeAgent({ ...emptyRoom, archivedAt: '2026-09-12T10:00:00.000Z' }), false)
  assert.equal(roomCanChangeAgent({ ...emptyRoom, trashedAt: '2026-09-12T10:00:00.000Z' }), false)
})

test('detects a running room finishing successfully or with an error', () => {
  assert.equal(roomJustFinished(
    { id: 'room-1', alive: true, status: 'running' },
    { id: 'room-1', alive: false, status: 'exited' },
  ), true)
  assert.equal(roomJustFinished(
    { id: 'room-1', alive: true, status: 'running' },
    { id: 'room-1', alive: false, status: 'error' },
  ), true)
})

test('does not report ordinary room updates as completions', () => {
  assert.equal(roomJustFinished(
    { id: 'room-1', alive: false, status: 'created' },
    { id: 'room-1', alive: false, status: 'exited' },
  ), false)
  assert.equal(roomJustFinished(
    { id: 'room-1', alive: true, status: 'running' },
    { id: 'room-1', alive: true, status: 'running' },
  ), false)
})
