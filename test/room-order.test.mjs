import assert from 'node:assert/strict'
import test from 'node:test'

import { sortRoomsByRecency } from '../public/room-order.js'

test('moves the most recently updated active room to the top', () => {
  const rooms = [
    { id: 'newer', updatedAt: '2026-09-10T10:00:00.000Z' },
    { id: 'older', updatedAt: '2026-09-10T09:00:00.000Z' },
  ]

  rooms[1] = { ...rooms[1], updatedAt: '2026-09-10T11:00:00.000Z' }

  assert.deepEqual(sortRoomsByRecency(rooms).map((room) => room.id), ['older', 'newer'])
})

test('keeps pinned rooms first while sorting regular rooms by recent activity', () => {
  const rooms = [
    { id: 'regular-new', updatedAt: '2026-09-10T12:00:00.000Z' },
    { id: 'pinned-old', pinnedAt: '2026-09-09T08:00:00.000Z', updatedAt: '2026-09-09T08:00:00.000Z' },
    { id: 'regular-old', updatedAt: '2026-09-10T09:00:00.000Z' },
  ]

  assert.deepEqual(sortRoomsByRecency(rooms).map((room) => room.id), [
    'pinned-old',
    'regular-new',
    'regular-old',
  ])
})

test('keeps archived and trashed rooms out of the active-room ordering', () => {
  const rooms = [
    { id: 'trashed', trashedAt: '2026-09-10T13:00:00.000Z', updatedAt: '2026-09-10T13:00:00.000Z' },
    { id: 'archived', archivedAt: '2026-09-10T12:00:00.000Z', updatedAt: '2026-09-10T12:00:00.000Z' },
    { id: 'active', updatedAt: '2026-09-10T09:00:00.000Z' },
  ]

  assert.deepEqual(sortRoomsByRecency(rooms).map((room) => room.id), ['active', 'archived', 'trashed'])
})
