import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseGitStatus,
  parseUnifiedDiff,
  workspaceChangesSinceBaseline,
} from '../src/workspace-changes.js'

test('parses staged, unstaged, untracked, deleted, and renamed status entries', () => {
  assert.deepEqual(parseGitStatus([
    ' M public/app.js',
    'M  src/server.js',
    '?? src/new-file.js',
    ' D src/old-file.js',
    'R  old.js -> new.js',
  ].join('\n')), [
    { op: 'modified', path: 'public/app.js' },
    { op: 'modified', path: 'src/server.js' },
    { op: 'new', path: 'src/new-file.js' },
    { op: 'deleted', path: 'src/old-file.js' },
    { op: 'renamed', path: 'new.js' },
  ])
})

test('parses tracked, deleted, and untracked unified diffs', () => {
  const files = parseUnifiedDiff([
    'diff --git a/src/app.js b/src/app.js',
    '--- a/src/app.js',
    '+++ b/src/app.js',
    '@@ -1,2 +1,2 @@',
    '-old',
    '+new',
    ' same',
    'diff --git a/src/deleted.js b/src/deleted.js',
    '--- a/src/deleted.js',
    '+++ /dev/null',
    '@@ -1 +0,0 @@',
    '-gone',
    'diff --git a/src/new.js b/src/new.js',
    '--- /dev/null',
    '+++ b/src/new.js',
    '@@ -0,0 +1 @@',
    '+added',
  ].join('\n'))

  assert.deepEqual(files.map(({ path, add, del }) => ({ path, add, del })), [
    { path: 'src/app.js', add: 1, del: 1 },
    { path: 'src/deleted.js', add: 0, del: 1 },
    { path: 'src/new.js', add: 1, del: 0 },
  ])
})

test('keeps only files whose diff changed since the turn baseline', () => {
  const unchanged = { path: 'existing.js', add: 1, del: 0, lines: [{ s: '+', t: 'before' }] }
  const changed = { path: 'changed.js', add: 1, del: 0, lines: [{ s: '+', t: 'after' }] }
  const result = workspaceChangesSinceBaseline({
    items: [
      { path: 'existing.js', op: 'modified' },
      { path: 'changed.js', op: 'modified' },
    ],
    diffFiles: [unchanged, changed],
  }, {
    items: [
      { path: 'existing.js', op: 'modified' },
      { path: 'changed.js', op: 'modified' },
    ],
    diffFiles: [unchanged, { ...changed, lines: [{ s: '+', t: 'before' }] }],
  })

  assert.deepEqual(result, {
    items: [{ path: 'changed.js', op: 'modified' }],
    diffFiles: [changed],
  })
})
