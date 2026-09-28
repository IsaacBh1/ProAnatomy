import { readFile } from 'node:fs/promises'

const base = 'public/models/male'
const files = [
  'isa_parts_list_e.json',
  'isa_inclusion_relation_list.json',
  'bodyparts3d_isa_element_parts.json',
  'bodyparts3d_partof_element_parts.json',
  'atlas.json',
]

const sample = (value, depth = 0) => {
  const json = JSON.stringify(value, null, 2) ?? 'undefined'
  return json.length > 900 ? `${json.slice(0, 900)}\n… (${json.length} chars total)` : json
}

for (const file of files) {
  console.log(`\n=== ${file} ===`)
  try {
    const data = JSON.parse(await readFile(`${base}/${file}`, 'utf8'))

    if (Array.isArray(data)) {
      console.log('shape: array, length:', data.length)
      console.log('sample[0]:', sample(data[0]))
    } else if (data && typeof data === 'object') {
      const keys = Object.keys(data)
      console.log('shape: object, keys:', keys.length)
      console.log('first 5 keys:', keys.slice(0, 5))
      console.log(`sample["${keys[0]}"]:`, sample(data[keys[0]]))
    } else {
      console.log('shape:', typeof data, '—', data)
    }
  } catch (error) {
    console.log('ERROR:', error.message)
  }
}
