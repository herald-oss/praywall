import type { Prayer } from "@/lib/db/schema";

type PrayerWithUser = Prayer & { userName: string | null };
type SSEClient = (data: PrayerWithUser) => void;

const clients = new Set<SSEClient>();

export function notifySSEClients(prayer: PrayerWithUser) {
  clients.forEach((client) => client(prayer));
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send: SSEClient = (data) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          clients.delete(send);
        }
      };

      clients.add(send);

      // Send keepalive every 30s
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(keepalive);
          clients.delete(send);
        }
      }, 30000);

      // Cleanup on close
      const cleanup = () => {
        clearInterval(keepalive);
        clients.delete(send);
      };

      // Handle abort
      controller.enqueue(encoder.encode(": connected\n\n"));

      return cleanup;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
