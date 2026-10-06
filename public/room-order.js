export function compareRoomsByRecency(a, b) {
  const trashedOrder = Number(Boolean(a?.trashedAt)) - Number(Boolean(b?.trashedAt))
  if (trashedOrder) return trashedOrder

  const archivedOrder = Number(Boolean(a?.archivedAt)) - Number(Boolean(b?.archivedAt))
  if (archivedOrder) return archivedOrder

  if (!a?.archivedAt && !b?.archivedAt && !a?.trashedAt && !b?.trashedAt) {
    const pinnedOrder = Number(Boolean(b?.pinnedAt)) - Number(Boolean(a?.pinnedAt))
    if (pinnedOrder) return pinnedOrder
    if (a?.pinnedAt && b?.pinnedAt) return String(b.pinnedAt).localeCompare(String(a.pinnedAt))
  }

  return String(b?.updatedAt || '').localeCompare(String(a?.updatedAt || ''))
}

export function sortRoomsByRecency(rooms = []) {
  return [...rooms].sort(compareRoomsByRecency)
}
