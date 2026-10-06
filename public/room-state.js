export function roomCanChangeAgent(room, events = []) {
  if (!room || room.alive || room.archivedAt || room.trashedAt) return false
  if (room.lastStartedAt || String(room.lastUserMessage || '').trim()) return false
  return !events.some((event) => event?.type === 'input')
}

export function roomJustFinished(previous, next) {
  if (!previous?.alive || !next || next.alive) return false
  return ['exited', 'error', 'stopped'].includes(next.status)
}
