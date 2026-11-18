import { record, text } from './validation.ts'
import { single, provenance } from './shared.ts'
export type Workspace = { version: 1; name: string; subtitle: string; body: string }
export const sample: Workspace = {
  version: 1,
  name: 'The bench beside the river',
  subtitle: 'A small story about a familiar place.',
  body: 'On the first warm morning, Mira took the long way to the market. The river was quiet, and someone had left a small pot of yellow flowers on the old bench.\n\nShe sat for a moment. Across the water, a bicycle bell rang twice. A man with a paper bag stopped to look at the flowers, then smiled as if he had remembered something.\n\nBy noon, three people had added a note beneath the pot. Mira brought a pencil the next day. Some places become a meeting place before anyone decides to call them one.',
}
export function parseWorkspace(value: unknown): Workspace {
  const o = record(value, 'Workspace')
  if (o.version !== 1) throw new Error('Expected SD/1 workspace.')
  return {
    version: 1,
    name: single(o.name, 'Story title', 80),
    subtitle: single(o.subtitle, 'Subtitle', 160, true),
    body: text(o.body, 'Story text', 10000, true),
  }
}
export function paragraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}
export function statistics(body: string) {
  return {
    words: body.trim() ? body.trim().split(/\s+/).length : 0,
    characters: body.length,
    paragraphs: paragraphs(body).length,
  }
}
export function exportWorkspace(value: Workspace) {
  const w = parseWorkspace(value)
  return { ...w, provenance: provenance('SD', 'vue-story-draft-desk', w) }
}
export function exportText(value: Workspace) {
  const w = parseWorkspace(value),
    marker = exportWorkspace(w).provenance.marker
  return `${w.name}\n${w.subtitle ? `${w.subtitle}\n` : ''}\n${w.body}\n\n${marker} · CodeSculptor · vue-story-draft-desk\n`
}
