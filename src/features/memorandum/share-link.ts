import { MemorandumSchema, type Memorandum } from "@/types/memorandum"

// ---------------------------------------------------------------------------
// The share link.
//
// A completed memorandum travels to the other party inside the URL *fragment*.
// A fragment is never included in the HTTP request, so the sale price, both
// parties' names and their conveyancers' details never reach our server, our
// logs, or any CDN in between. That privacy property is the entire reason this
// feature needs no backend.
//
// What it is NOT: tamper-proof. With no server there is no secret, so there is
// no integrity guarantee available, and a hash inside the payload would prove
// nothing to anyone who can recompute it. A memorandum of sale is not legally
// binding, so this is acceptable — but nothing in the UI may imply otherwise.
// See docs/PLAN_MEMORANDUM_OF_SALE.md §3.
// ---------------------------------------------------------------------------

/** Bumped only on a breaking payload change. Anything else is refused. */
const PREFIX = "v1."

/**
 * Ordinary prose compresses about 2:1, so a well-filled memorandum lands near
 * 1,100 characters of URL. Pathological input does not compress at all and can
 * reach ~5,000, which messaging apps mangle — hence the check at generate time
 * rather than trusting the field caps to bound this.
 */
export const SHARE_LINK_COMFORTABLE_CHARS = 1800

/**
 * Refused before inflating. Guards against a crafted link asking us to
 * decompress megabytes; comfortably above any legitimate document.
 */
const MAX_COMPRESSED_BYTES = 64 * 1024

/** Feature detection, so an old browser gets told rather than handed a broken link. */
export function canBuildShareLink(): boolean {
  return typeof CompressionStream === "function" && typeof DecompressionStream === "function"
}

// Uint8Array<ArrayBuffer> rather than plain Uint8Array: the stream writer only
// accepts a non-shared buffer, and the default type parameter allows a
// SharedArrayBuffer.
async function pipeThrough(
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array<ArrayBuffer>> {
  // The writer's promises are deliberately swallowed: when the input is not
  // valid gzip both sides reject, and letting the write side reject unobserved
  // surfaces as an unhandled rejection that crashes the process. The read below
  // reports the same failure, and that is the one callers act on.
  const writer = stream.writable.getWriter()
  const written = writer
    .write(bytes)
    .then(() => writer.close())
    .catch(() => undefined)

  const reader = stream.readable.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }

  await written

  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

function toBase64Url(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Not base64url")
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Encodes a validated memorandum into the fragment portion of a share link. */
export async function encodeMemorandum(memorandum: Memorandum): Promise<string> {
  if (!canBuildShareLink()) throw new Error("This browser cannot build share links")
  const json = new TextEncoder().encode(JSON.stringify(memorandum))
  const compressed = await pipeThrough(json, new CompressionStream("gzip"))
  return PREFIX + toBase64Url(compressed)
}

export type DecodeFailure =
  | "empty"
  | "unknown-version"
  | "malformed"
  | "too-large"
  | "not-a-memorandum"

export type DecodeResult =
  | { ok: true; memorandum: Memorandum }
  | { ok: false; reason: DecodeFailure }

/**
 * Decodes a fragment back into a memorandum.
 *
 * Never throws: the input is attacker-controlled, and the caller needs to tell
 * the user which kind of broken this is — a truncated paste reads very
 * differently to a link from a future version of the app.
 */
export async function decodeMemorandum(fragment: string): Promise<DecodeResult> {
  const raw = fragment.startsWith("#") ? fragment.slice(1) : fragment
  if (raw.trim() === "") return { ok: false, reason: "empty" }
  if (!raw.startsWith(PREFIX)) return { ok: false, reason: "unknown-version" }

  const encoded = raw.slice(PREFIX.length)
  if (encoded === "") return { ok: false, reason: "malformed" }

  let compressed: Uint8Array<ArrayBuffer>
  try {
    compressed = fromBase64Url(encoded)
  } catch {
    return { ok: false, reason: "malformed" }
  }

  // Checked before inflating, not after.
  if (compressed.length > MAX_COMPRESSED_BYTES) return { ok: false, reason: "too-large" }

  let json: string
  try {
    const inflated = await pipeThrough(compressed, new DecompressionStream("gzip"))
    json = new TextDecoder().decode(inflated)
  } catch {
    return { ok: false, reason: "malformed" }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return { ok: false, reason: "malformed" }
  }

  const result = MemorandumSchema.safeParse(parsed)
  if (!result.success) return { ok: false, reason: "not-a-memorandum" }
  return { ok: true, memorandum: result.data }
}

export interface ShareLink {
  url: string
  /** True when the link is long enough that messaging apps may mangle it. */
  tooLong: boolean
  length: number
}

/** Builds the full link and reports whether it is comfortably shareable. */
export async function buildShareLink(
  memorandum: Memorandum,
  origin: string,
  path = "/memorandum/confirm",
): Promise<ShareLink> {
  const fragment = await encodeMemorandum(memorandum)
  const url = `${origin}${path}#${fragment}`
  return { url, tooLong: url.length > SHARE_LINK_COMFORTABLE_CHARS, length: url.length }
}
