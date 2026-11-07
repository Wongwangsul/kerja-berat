import { readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import type { KeyTestResult } from '@shared/types'
import { getSecret, requireSecret } from '../secrets'
import { getSettings } from '../settings'
import { ApiError, readError } from './http'

/**
 * Client for a Flow2API server the user runs on their own machine (github.com/TheSmallHanCat/flow2api).
 * It fronts Google Flow with an OpenAI-compatible API. Generation is one long streaming request
 * (POST /v1/chat/completions with stream: true) whose final chunk carries the result URL inside the
 * assistant message; there are no job ids to poll and nothing to cancel server-side, unlike Higgsfield.
 * The key used here is Flow2API's own local api_key from its setting.toml — never a Google credential,
 * which only ever lives inside the Flow2API server itself.
 */

export interface FlowResult {
  /** The completion id ("chatcmpl-..."), kept on the asset for reference; it cannot be polled. */
  id: string | null
  url: string
}

// Server-side defaults allow 300 s per image and 1500 s per video, plus queue waits before them.
const IMAGE_TIMEOUT_MS = 15 * 60 * 1000
const VIDEO_TIMEOUT_MS = 30 * 60 * 1000

function base(): string {
  return getSettings().flowBaseUrl.trim().replace(/\/+$/, '') || 'http://localhost:8000'
}

function friendly(status: number, detail: string): ApiError {
  if (status === 401)
    return new ApiError('Kunci API Flow2API tidak valid. Samakan dengan api_key di file setting.toml Flow2API.', status)
  if (status === 429) return new ApiError('Flow2API sedang membatasi permintaan. Tunggu sebentar lalu coba lagi.', status, true)
  if (status >= 500) return new ApiError(`Flow2API bermasalah (${status}): ${detail}`, status, true)
  return new ApiError(`Flow2API menolak permintaan: ${detail}`, status)
}

interface FlowPayload {
  id?: string
  object?: string
  url?: string
  choices?: { message?: { content?: unknown } }[]
  error?: { message?: string; status_code?: number | string }
}

/** The result URL rides in the assistant message: a Markdown image, an HTML video tag, or payload.url. */
function resultUrl(payload: FlowPayload): string | null {
  if (typeof payload.url === 'string' && payload.url.trim()) return payload.url.trim()
  const content = payload.choices?.[0]?.message?.content
  if (typeof content !== 'string') return null
  const md = /!\[[^\]]*\]\(([^)\s]+)\)/.exec(content)
  if (md) return md[1]
  const tag = /<video[^>]*\ssrc=['"]([^'"]+)['"]/i.exec(content)
  if (tag) return tag[1]
  const bare = /https?:\/\/[^\s)'"]+/.exec(content)
  return bare ? bare[0] : null
}

async function generate(
  model: string,
  prompt: string,
  images: string[],
  signal: AbortSignal | undefined,
  timeoutMs: number,
  onTick?: (elapsedMs: number) => void
): Promise<FlowResult> {
  const content: unknown = images.length
    ? [{ type: 'text', text: prompt }, ...images.map((url) => ({ type: 'image_url', image_url: { url } }))]
    : prompt
  const timeout = AbortSignal.timeout(timeoutMs)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
  let res: Response
  try {
    res = await fetch(`${base()}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${requireSecret('flow2api')}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify({ model, messages: [{ role: 'user', content }], stream: true }),
      signal: combined
    })
  } catch (e) {
    if (signal?.aborted) throw e
    if ((e as Error).name === 'TimeoutError') throw new Error('Flow2API terlalu lama merespons. Coba lagi nanti.')
    throw new Error(`Tidak bisa terhubung ke Flow2API di ${base()}. Pastikan layanannya berjalan, lalu coba lagi.`)
  }
  if (!res.ok) throw friendly(res.status, await readError(res))
  if (!res.body) throw new Error('Flow2API tidak mengirim jawaban.')

  // Streaming is required: a non-streamed call sits silent for minutes and dies on HTTP timeouts,
  // while the stream sends progress chunks the whole way and one final completion payload.
  const started = Date.now()
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let final: FlowPayload | null = null
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const data = line.trim().startsWith('data:') ? line.trim().slice(5).trim() : ''
      if (!data || data === '[DONE]') continue
      let payload: FlowPayload
      try {
        payload = JSON.parse(data) as FlowPayload
      } catch {
        continue
      }
      if (payload.error) {
        const code = Number(payload.error.status_code) || 500
        throw friendly(code, payload.error.message ?? 'tanpa keterangan')
      }
      if (payload.object === 'chat.completion') final = payload
      else onTick?.(Date.now() - started)
    }
  }
  if (!final) throw new Error('Flow2API mengakhiri jawaban tanpa hasil. Coba lagi.')
  const url = resultUrl(final)
  if (!url) throw new Error('Flow2API selesai tanpa file hasil.')
  return { id: final.id ?? null, url }
}

export async function generateImage(
  model: string,
  prompt: string,
  refDataUrls: string[],
  signal?: AbortSignal,
  onTick?: (elapsedMs: number) => void
): Promise<FlowResult> {
  return generate(model, prompt, refDataUrls, signal, IMAGE_TIMEOUT_MS, onTick)
}

export async function generateVideo(
  model: string,
  prompt: string,
  imageDataUrl: string,
  signal?: AbortSignal,
  onTick?: (elapsedMs: number) => void
): Promise<FlowResult> {
  return generate(model, prompt, [imageDataUrl], signal, VIDEO_TIMEOUT_MS, onTick)
}

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
}

/** Flow2API takes reference images inline, so a local file travels as a data URL — no upload step. */
export async function dataUrlForFile(absPath: string): Promise<string> {
  const bytes = await readFile(absPath)
  const mime = MIME[extname(absPath).toLowerCase()] ?? 'image/png'
  return `data:${mime};base64,${bytes.toString('base64')}`
}

/** The model list is the cheapest authenticated call; it also proves the local server is up. */
export async function testCredentials(cred?: string): Promise<KeyTestResult> {
  const key = cred ?? getSecret('flow2api')
  if (!key) return { ok: false, message: 'Kunci belum diatur' }
  let res: Response
  try {
    res = await fetch(`${base()}/v1/models`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000)
    })
  } catch {
    return { ok: false, message: `Tidak bisa terhubung ke Flow2API di ${base()}. Pastikan layanannya berjalan.` }
  }
  if (!res.ok) return { ok: false, message: friendly(res.status, await readError(res)).message }
  const out = (await res.json().catch(() => ({}))) as { data?: unknown[] }
  const n = Array.isArray(out.data) ? out.data.length : 0
  return { ok: true, message: n ? `Terhubung · ${n} model tersedia` : 'Terhubung' }
}
