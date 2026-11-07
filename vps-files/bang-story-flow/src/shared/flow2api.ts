import type { AspectRatio, ModelOption } from './types'

/**
 * The model families of a local Flow2API server (github.com/TheSmallHanCat/flow2api), which fronts
 * Google Flow with an OpenAI-compatible API. Unlike Higgsfield, the aspect ratio and the duration are
 * part of the model id itself ("veo-3.1-fast-i2v-6s-landscape"), so this catalog stores families and
 * composes the full id from the project's aspect ratio and the clip's length.
 */

export interface FlowImageModel {
  /** Family id without the orientation suffix; the full id adds "-landscape" or "-portrait". */
  id: string
  name: string
  family: string
  tags: string[]
}

export interface FlowVideoModel {
  /** Family id without the "-{seconds}s-{orientation}" suffix. */
  id: string
  name: string
  family: string
  /** How the clip's image reaches the model: as its first frame, or as a reference it opens on. */
  input: 'first-frame' | 'reference'
  /** Lengths the family can generate, in seconds; the full id embeds one of them. */
  durations: number[]
  tags: string[]
}

export const FLOW_IMAGE_MODELS: FlowImageModel[] = [
  { id: 'gemini-3.1-flash-image', name: 'Nano Banana 2.1', family: 'Gemini', tags: [] },
  { id: 'gemini-3.0-pro-image', name: 'Nano Banana Pro', family: 'Gemini', tags: [] },
  { id: 'gemini-3.1-flash-lite-image', name: 'Nano Banana 2 Lite', family: 'Gemini', tags: ['Cepat'] }
]

export const FLOW_VIDEO_MODELS: FlowVideoModel[] = [
  { id: 'veo-3.1-fast-i2v', name: 'Veo 3.1 Fast', family: 'Veo', input: 'first-frame', durations: [4, 6], tags: [] },
  { id: 'veo-3.1-quality-i2v', name: 'Veo 3.1 Quality', family: 'Veo', input: 'first-frame', durations: [4, 6], tags: [] },
  { id: 'veo-3.1-lite-i2v', name: 'Veo 3.1 Lite', family: 'Veo', input: 'first-frame', durations: [4, 6], tags: ['Cepat'] },
  { id: 'omni-1.1-flash', name: 'Omni 1.1 Flash', family: 'Omni', input: 'reference', durations: [4, 6, 8, 10], tags: [] }
]

export const DEFAULT_FLOW_IMAGE_MODEL = 'gemini-3.1-flash-image'
export const DEFAULT_FLOW_VIDEO_MODEL = 'veo-3.1-fast-i2v'

/** Reference images one Flow request takes along; the server caps reference images at 3. */
export const FLOW_MAX_REFS = 3

/** Flow documents no prompt limit; keep the conservative default the Higgsfield image models use. */
export const FLOW_PROMPT_LIMIT = 4000

export function getFlowImageModel(id: string | null | undefined): FlowImageModel {
  return FLOW_IMAGE_MODELS.find((m) => m.id === id) ?? FLOW_IMAGE_MODELS.find((m) => m.id === DEFAULT_FLOW_IMAGE_MODEL)!
}

export function getFlowVideoModel(id: string | null | undefined): FlowVideoModel {
  return FLOW_VIDEO_MODELS.find((m) => m.id === id) ?? FLOW_VIDEO_MODELS.find((m) => m.id === DEFAULT_FLOW_VIDEO_MODEL)!
}

function orientation(aspect: AspectRatio): 'landscape' | 'portrait' {
  return aspect === '9:16' ? 'portrait' : 'landscape'
}

/** The full image model id for a project frame, e.g. "gemini-3.1-flash-image-portrait". */
export function flowImageModelId(m: FlowImageModel, aspect: AspectRatio): string {
  return `${m.id}-${orientation(aspect)}`
}

/** The video length to request: the shortest the family offers that covers the clip, or the longest. */
export function fitFlowDuration(m: FlowVideoModel, seconds: number): number {
  const want = Math.max(1, Math.ceil(seconds))
  const values = [...m.durations].sort((a, b) => a - b)
  return values.find((v) => v >= want) ?? values[values.length - 1]
}

/** The full video model id, e.g. "veo-3.1-fast-i2v-6s-landscape". */
export function flowVideoModelId(m: FlowVideoModel, aspect: AspectRatio, seconds: number): string {
  return `${m.id}-${fitFlowDuration(m, seconds)}s-${orientation(aspect)}`
}

/** Picker rows, the default first with a "Rekomendasi" tag, like the Higgsfield pickers. */
export function flowModelOptions(kind: 'image' | 'video'): ModelOption[] {
  if (kind === 'image') {
    return [...FLOW_IMAGE_MODELS.filter((m) => m.id === DEFAULT_FLOW_IMAGE_MODEL), ...FLOW_IMAGE_MODELS.filter((m) => m.id !== DEFAULT_FLOW_IMAGE_MODEL)].map(
      (m) => ({
        id: m.id,
        name: m.name,
        family: m.family,
        description: `pakai lembar karakter (maks ${FLOW_MAX_REFS}) · dibuat oleh Google Flow`,
        tags: m.id === DEFAULT_FLOW_IMAGE_MODEL ? ['Rekomendasi', ...m.tags] : m.tags
      })
    )
  }
  return [...FLOW_VIDEO_MODELS.filter((m) => m.id === DEFAULT_FLOW_VIDEO_MODEL), ...FLOW_VIDEO_MODELS.filter((m) => m.id !== DEFAULT_FLOW_VIDEO_MODEL)].map(
    (m) => ({
      id: m.id,
      name: m.name,
      family: m.family,
      description: [
        `${m.durations.join(' / ')} dtk`,
        m.input === 'reference' ? 'gambar klip jadi referensi' : 'mulai dari gambar klip'
      ].join(' · '),
      tags: m.id === DEFAULT_FLOW_VIDEO_MODEL ? ['Rekomendasi', ...m.tags] : m.tags
    })
  )
}
