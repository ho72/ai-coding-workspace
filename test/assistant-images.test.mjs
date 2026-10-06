import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assistantAttachmentPathCandidates,
  assistantImagePathCandidates,
  detectRasterImage,
  embeddedAssistantImages,
} from '../src/assistant-images.js'

test('extracts downloadable archive paths only from explicit markdown links', () => {
  assert.deepEqual(assistantAttachmentPathCandidates([
    '[결과 ZIP](/workspace/data/generated/result.zip)',
    '[보고서](</workspace/My Project/report.pdf>)',
    '소스 파일 /workspace/project/server.js',
    '그냥 적은 /workspace/archive.zip 경로',
  ].join('\n')), [
    '/workspace/data/generated/result.zip',
    '/workspace/My Project/report.pdf',
  ])
})

test('extracts local raster image paths from links and plain text', () => {
  assert.deepEqual(assistantImagePathCandidates([
    '결과: [화면](</workspace/My Project/capture.png>)',
    '추가 파일 /workspace/output/mobile.webp',
    '무시 https://example.com/remote.png',
    '중복 /workspace/output/mobile.webp',
  ].join('\n')), [
    '/workspace/My Project/capture.png',
    '/workspace/output/mobile.webp',
  ])
})

test('finds MCP image blocks and data URLs without returning remote URLs', () => {
  const tinyPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB'
  const images = embeddedAssistantImages({
    content: [{ type: 'image', data: tinyPng, mimeType: 'image/png' }],
    structuredContent: { image_url: `data:image/png;base64,${tinyPng}` },
    remote: { image_url: 'https://example.com/image.png' },
  })
  assert.equal(images.length, 1)
  assert.equal(images[0].mime, 'image/png')
  assert.equal(images[0].data, tinyPng)
})

test('detects supported raster signatures and rejects arbitrary bytes', () => {
  assert.deepEqual(detectRasterImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), {
    mime: 'image/png',
    extension: '.png',
  })
  assert.deepEqual(detectRasterImage(Buffer.from('GIF89a', 'ascii')), {
    mime: 'image/gif',
    extension: '.gif',
  })
  assert.equal(detectRasterImage(Buffer.from('not-an-image')), null)
})
