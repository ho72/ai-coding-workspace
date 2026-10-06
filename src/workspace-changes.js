export function parseGitStatus(text) {
  return String(text ?? '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(0, 80)
    .map((line) => {
      const status = line.slice(0, 2)
      const rawPath = line.slice(3).trim()
      const path = rawPath.includes(' -> ') ? rawPath.split(' -> ').pop() : rawPath
      let op = 'modified'
      if (status.includes('?') || status.includes('A')) op = 'new'
      else if (status.includes('D')) op = 'deleted'
      else if (status.includes('R')) op = 'renamed'
      return { op, path }
    })
}

export function parseUnifiedDiff(text) {
  const files = []
  let current = null
  const pushCurrent = () => {
    if (!current || !current.path || !current.lines.length) return
    files.push(current)
  }

  for (const line of String(text ?? '').split('\n')) {
    if (line.startsWith('diff --git ')) {
      pushCurrent()
      current = { path: '', add: 0, del: 0, lines: [] }
      continue
    }
    if (!current) continue
    if (line.startsWith('+++ b/')) {
      current.path = line.slice(6)
      continue
    }
    if (line.startsWith('--- a/') && !current.path) {
      current.path = line.slice(6)
      continue
    }
    if (line.startsWith('@@')) {
      addDiffLine(current, '@', line)
      continue
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      current.add += 1
      addDiffLine(current, '+', line.slice(1))
      continue
    }
    if (line.startsWith('-') && !line.startsWith('---')) {
      current.del += 1
      addDiffLine(current, '-', line.slice(1))
      continue
    }
    if (line.startsWith(' ')) addDiffLine(current, ' ', line.slice(1))
  }
  pushCurrent()
  return files.slice(0, 12)
}

export function workspaceChangesSinceBaseline(current, baseline) {
  if (!current) return null
  if (!baseline) return current
  const baselineDiffs = new Map((baseline.diffFiles || []).map((file) => [file.path, workspaceDiffSignature(file)]))
  const changedDiffs = (current.diffFiles || []).filter((file) => baselineDiffs.get(file.path) !== workspaceDiffSignature(file))
  const changedPaths = new Set(changedDiffs.map((file) => file.path))
  const baselineItems = new Map((baseline.items || []).map((item) => [item.path, item.op]))
  const items = (current.items || []).filter((item) => changedPaths.has(item.path) || baselineItems.get(item.path) !== item.op)
  if (!items.length && !changedDiffs.length) return null
  return { items, diffFiles: changedDiffs }
}

function workspaceDiffSignature(file) {
  return JSON.stringify([
    Number(file?.add || 0),
    Number(file?.del || 0),
    Array.isArray(file?.lines) ? file.lines : [],
  ])
}

function addDiffLine(file, sign, text) {
  if (file.lines.length >= 140) return
  file.lines.push({ s: sign, t: String(text ?? '').slice(0, 500) })
}
