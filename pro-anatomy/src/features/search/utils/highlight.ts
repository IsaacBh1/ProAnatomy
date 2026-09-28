export interface TextSegment {
  text: string
  match: boolean
}

/** Splits `text` into runs, flagging the parts that match any token (case-insensitive). */
export function splitByMatch(text: string, tokens: readonly string[]): TextSegment[] {
  if (!text) return []
  const lower = text.toLowerCase()
  // Some Unicode characters change length when lower-cased; skip highlighting rather than misalign.
  if (lower.length !== text.length || tokens.length === 0) return [{ text, match: false }]

  const marked = new Array<boolean>(text.length).fill(false)
  for (const token of tokens) {
    if (!token) continue
    for (let at = lower.indexOf(token); at !== -1; at = lower.indexOf(token, at + token.length)) {
      marked.fill(true, at, at + token.length)
    }
  }

  const segments: TextSegment[] = []
  let start = 0
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || marked[i] !== marked[start]) {
      segments.push({ text: text.slice(start, i), match: marked[start] })
      start = i
    }
  }
  return segments
}
