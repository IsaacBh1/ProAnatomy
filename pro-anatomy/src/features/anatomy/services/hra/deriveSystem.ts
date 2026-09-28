import type { SystemId } from '@/types/anatomy'

/** First match wins, so specific rules come before broad ones. */
const RULES: ReadonlyArray<readonly [SystemId, RegExp]> = [
  ['integumentary', /\bskin\b|integument|epiderm|dermis|whole.?body/],
  ['nervous', /nerve|neural|nervous|plexus|ganglion|sciatic|brain|cerebr|cerebell|thalam|hippocamp|mening|spinal cord/],
  ['cardiac', /heart|cardiac|atrium|atria|ventric|myocard|coronary/],
  ['arterial', /arter|aorta|carotid/],
  ['venous', /\bvein|venous|\bvena\b|jugular|saphenous/],
  ['respiratory', /lung|pulmon|respirat|trache|bronch|alveol|diaphragm|larynx|pharynx/],
  ['digestive', /stomach|intestin|liver|colon|esophag|digest|pancrea|gallbladder|duoden|jejun|ileum|cecum|rectum|appendix|sigmoid/],
  ['urinary', /kidney|renal|bladder|ureter|urethra|urinary|nephr/],
  ['reproductive', /ovar|uter|fallop|vagin|reproduct|vulva|clitor|cervix|placenta|mammary|breast/],
  ['lymphatic', /lymph|spleen|thymus|tonsil|node/],
  ['endocrine', /thyroid|adrenal|pituitar|pineal|endocrine|parathyroid/],
  ['sensory', /\beyes?\b|\bear\b|\bnose\b|tongue|sensory|retina|cochlea|cornea|\biris\b|\blens\b/],
  ['skeletal', /bone|skelet|vertebra|\brib|femur|tibia|fibula|humerus|radius|ulna|pelvis|scapula|clavicle|sternum|patella|sacrum|coccyx|skull|mandible|maxilla|cranium|calcaneus|talus|metacarp|metatars|phalang/],
  ['muscular', /muscle|muscular|glute|bicep|tricep|delt|pector|abdomin/],
]

/** The HRA glb has no system metadata, so we infer it from the organ name. */
export function deriveSystem(name: string): SystemId {
  const text = name.toLowerCase()
  return RULES.find(([, pattern]) => pattern.test(text))?.[0] ?? 'other'
}
