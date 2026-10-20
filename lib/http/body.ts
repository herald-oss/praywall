import { MAX_JSON_BYTES } from "@/lib/config";
import { HttpError } from "./errors";

/**
 * Reads a JSON request body defensively:
 * - Requires `Content-Type: application/json`. A cross-site HTML form can
 *   only send form/text types, so this also blocks form-based CSRF.
 * - Caps the body size so nobody can make the server buffer megabytes.
 * - Maps malformed JSON to a 400 instead of a 500.
 */
export async function readJson(
  request: Request,
  maxBytes: number = MAX_JSON_BYTES
): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new HttpError(415, "unsupported_media_type");
  }

  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new HttpError(413, "payload_too_large");

  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "invalid_json");

  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new HttpError(413, "payload_too_large");
    }
    chunks.push(value);
  }

  const text = new TextDecoder().decode(
    chunks.length === 1 ? chunks[0] : concat(chunks, size)
  );
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "invalid_json");
  }
}

function concat(chunks: Uint8Array[], size: number): Uint8Array {
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}
