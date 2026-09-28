const GZIP_MAGIC = [0x1f, 0x8b] as const

/**
 * Decompresses a gzip payload. Some hosts already strip the gzip layer
 * (Content-Encoding), so the magic bytes decide, not the file extension.
 */
export async function gunzipIfNeeded(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const head = new Uint8Array(buffer, 0, Math.min(2, buffer.byteLength))
  if (head[0] !== GZIP_MAGIC[0] || head[1] !== GZIP_MAGIC[1]) return buffer

  const body = new Response(buffer).body
  if (!body) return buffer
  return new Response(body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
}
