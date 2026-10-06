import { extname } from 'node:path'

const RASTER_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const DOWNLOAD_EXTENSIONS = new Set(['.zip', '.pdf', '.docx', '.xlsx', '.pptx', '.tar', '.gz', '.tgz'])
const DATA_IMAGE_PATTERN = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i

export function assistantImagePathCandidates(value) {
  const text = String(value ?? '')
  const candidates = []
  const add = (raw) => {
    const path = cleanLocalImageTarget(raw)
    if (path && !candidates.includes(path)) candidates.push(path)
  }

  const markdownLink = /!?\[[^\]\n]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g
  for (const match of text.matchAll(markdownLink)) add(match[1] || match[2])

  const rawPath = /(?:^|[\s'"`(])((?:\/|\.\.\/|\.\/)[^\s'"`()<>]+?\.(?:png|jpe?g|webp|gif)(?::\d+)?)(?=$|[\s'"`),])/gim
  for (const match of text.matchAll(rawPath)) add(match[1])

  return candidates
}

export function assistantAttachmentPathCandidates(value) {
  const text = String(value ?? '')
  const candidates = assistantImagePathCandidates(text)
  const add = (raw) => {
    const path = cleanLocalAttachmentTarget(raw)
    if (path && !candidates.includes(path)) candidates.push(path)
  }

  const markdownLink = /!?\[[^\]\n]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^"']*["'])?\s*\)/g
  for (const match of text.matchAll(markdownLink)) add(match[1] || match[2])
  return candidates
}

export function embeddedAssistantImages(value, options = {}) {
  const maxItems = positiveInteger(options.maxItems, 8)
  const maxBase64Chars = positiveInteger(options.maxBase64Chars, 70 * 1024 * 1024)
  const images = []
  const seen = new Set()
  const visited = new Set()

  const add = (data, mime = '', name = '') => {
    const cleanData = String(data || '').replace(/\s+/g, '')
    if (!cleanData || cleanData.length > maxBase64Chars) return
    const cleanMime = String(mime || '').trim().toLowerCase()
    const key = `${cleanMime}:${cleanData.slice(0, 96)}:${cleanData.length}`
    if (seen.has(key) || images.length >= maxItems) return
    seen.add(key)
    images.push({ data: cleanData, mime: cleanMime, name: String(name || '') })
  }

  const addDataUrl = (url, name = '') => {
    const match = String(url || '').match(DATA_IMAGE_PATTERN)
    if (match) add(match[2], match[1], name)
  }

  const walk = (item, depth = 0) => {
    if (images.length >= maxItems || depth > 8 || item === null || item === undefined) return
    if (typeof item === 'string') {
      addDataUrl(item)
      return
    }
    if (typeof item !== 'object' || visited.has(item)) return
    visited.add(item)
    if (Array.isArray(item)) {
      for (const child of item) walk(child, depth + 1)
      return
    }

    const type = String(item.type || '').toLowerCase()
    const mime = item.mimeType || item.mime_type || item.mime || ''
    const name = item.name || item.filename || ''
    if (type === 'image' && typeof item.data === 'string') add(item.data, mime, name)
    if (typeof item.image_url === 'string') addDataUrl(item.image_url, name)
    if (typeof item.imageUrl === 'string') addDataUrl(item.imageUrl, name)
    if (typeof item.url === 'string') addDataUrl(item.url, name)

    for (const [key, child] of Object.entries(item)) {
      if (['data', 'image_url', 'imageUrl', 'url'].includes(key)) continue
      walk(child, depth + 1)
    }
  }

  walk(value)
  return images
}

export function detectRasterImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 6) return null
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: 'image/png', extension: '.png' }
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', extension: '.jpg' }
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { mime: 'image/webp', extension: '.webp' }
  }
  const signature = buffer.subarray(0, 6).toString('ascii')
  if (signature === 'GIF87a' || signature === 'GIF89a') {
    return { mime: 'image/gif', extension: '.gif' }
  }
  return null
}

function cleanLocalImageTarget(value) {
  let text = String(value || '').trim().replace(/^<|>$/g, '')
  if (!text || /^(?:https?:|data:|blob:)/i.test(text)) return ''
  try {
    text = decodeURIComponent(text)
  } catch {}
  text = text.replace(/:\d+$/, '').replace(/[?#].*$/, '')
  return RASTER_EXTENSIONS.has(extname(text).toLowerCase()) ? text : ''
}

function cleanLocalAttachmentTarget(value) {
  let text = String(value || '').trim().replace(/^<|>$/g, '')
  if (!text || /^(?:https?:|data:|blob:)/i.test(text)) return ''
  try {
    text = decodeURIComponent(text)
  } catch {}
  text = text.replace(/:\d+$/, '').replace(/[?#].*$/, '')
  const extension = extname(text).toLowerCase()
  return RASTER_EXTENSIONS.has(extension) || DOWNLOAD_EXTENSIONS.has(extension) ? text : ''
}

function positiveInteger(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback
}
