import type { NextRequest } from "next/server";
import { getClientIp } from "@/lib/http/client-ip";
import { canAccept, register, unregister } from "@/lib/realtime/broker";

export const dynamic = "force-dynamic";

function envInt(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Railway cuts any HTTP response after 15 minutes. Ending the stream a bit
// earlier on our own terms lets the browser reconnect cleanly after `retry`.
const MAX_LIFETIME_MS = envInt("SSE_MAX_LIFETIME_MS", 14 * 60_000);
const RETRY_MS = envInt("SSE_RETRY_MS", 3_000);

export async function GET(request: NextRequest) {
  // null (unknown IP) is only limited by the global cap.
  const ip = getClientIp(request);
  if (!canAccept(ip)) {
    return new Response("Too many live connections", {
      status: 503,
      headers: { "Retry-After": "30" },
    });
  }

  const encoder = new TextEncoder();
  let clientId: number | null = null;
  let lifetime: ReturnType<typeof setTimeout> | null = null;
  let closed = false;
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    if (lifetime) clearTimeout(lifetime);
    if (clientId != null) unregister(clientId);
    request.signal.removeEventListener("abort", cleanup);
    try {
      controllerRef?.close();
    } catch {
      // already closed or errored
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
      const send = (chunk: string): boolean => {
        if (closed) return false;
        try {
          controller.enqueue(encoder.encode(chunk));
          return true;
        } catch {
          cleanup();
          return false;
        }
      };
      clientId = register(ip, send);
      send(`retry: ${RETRY_MS}\n: connected\n\n`);
      lifetime = setTimeout(cleanup, MAX_LIFETIME_MS);
      request.signal.addEventListener("abort", cleanup, { once: true });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
