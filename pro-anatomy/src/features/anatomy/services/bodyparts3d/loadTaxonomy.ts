import { buildTaxonomy, describeTaxonomy, EMPTY_TAXONOMY, type PartTaxonomy } from './taxonomy'

const SOURCES = {
  names: 'isa_parts_list_e.json',
  isa: 'isa_inclusion_relation_list.json',
  elementParts: 'bodyparts3d_isa_element_parts.json',
} as const

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} → ${response.status} ${response.statusText}`)
  return response.json() as Promise<unknown>
}

/**
 * Loads the three BodyParts3D hierarchy files and normalises them into a PartTaxonomy.
 * Failures are non-fatal: the viewer can still show the model, only the presets degrade.
 *
 * `baseUrl` is where the JSON files live, e.g. `/models/male`.
 */
export async function loadPartTaxonomy(baseUrl: string): Promise<PartTaxonomy> {
  const base = baseUrl.replace(/\/$/, '')

  try {
    const [names, isa, elementParts] = await Promise.all([
      fetchJson(`${base}/${SOURCES.names}`),
      fetchJson(`${base}/${SOURCES.isa}`),
      fetchJson(`${base}/${SOURCES.elementParts}`),
    ])

    const taxonomy = buildTaxonomy({ names, isa, elementParts })
    const summary = describeTaxonomy(taxonomy)

    if (taxonomy.conceptByName.size === 0 || taxonomy.partsOf.size === 0) {
      console.warn(
        `[taxonomy] The hierarchy files parsed but look empty (${summary}). ` +
          `Presets will fall back to the flat compound list. ` +
          `Run \`node scripts/inspect-bodyparts3d.mjs\` and share the output to fix the adapters.`,
      )
    } else if (import.meta.env.DEV) {
      console.info(`[taxonomy] loaded ${summary} from ${base}`)
    }

    return taxonomy
  } catch (error) {
    console.warn(
      `[taxonomy] Could not load the hierarchy from ${base}. ` +
        `Presets will fall back to the flat compound list.`,
      error,
    )
    return EMPTY_TAXONOMY
  }
}
