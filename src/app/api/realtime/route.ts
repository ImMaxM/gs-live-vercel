import { getF1Client } from "~/lib/f1/client";
import type { LiveTimingsPayload } from "../../../../payload";
import pako from "pako";

export async function GET(): Promise<Response> {
  const client = getF1Client();

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // helper to send SSE formatted data with compression
      const sendEvent = (event: string, data: unknown) => {
        // Compress JSON data using deflate, then base64 encode for SSE transport
        const jsonStr = JSON.stringify(data);
        const compressed = pako.deflate(jsonStr);
        const base64 = Buffer.from(compressed).toString("base64");

        const payload = `event: ${event}\ndata: ${base64}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // stream closed, ignore
        }
      };

      // Send initial connection status and cached data
      // const cachedData = client.getCachedData();
      const isConnected = client.getConnectionStatus();

      sendEvent("status", {
        connected: isConnected,
        timestamp: Date.now(),
      });

      // Subscribe to F1 client events
      const unsubscribe = client.subscribe((event) => {
        switch (event.type) {
          case "payload":
            sendEvent("payload", {
              data: event.data as LiveTimingsPayload,
              timestamp: event.timestamp,
            });
            break;
          case "connected":
            sendEvent("status", {
              connected: true,
              timestamp: event.timestamp,
            });
            break;
          case "disconnected":
            sendEvent("status", {
              connected: false,
              timestamp: event.timestamp,
            });
            break;
          case "error":
            sendEvent("error", {
              message:
                event.data instanceof Error
                  ? event.data.message
                  : String(event.data),
              timestamp: event.timestamp,
            });
            break;
        }
      });

      // Send periodic heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        sendEvent("heartbeat", { timestamp: Date.now() });
      }, 30000);

      // Cleanup when client disconnects
      const cleanup = () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
      };

      // triggered when the client closes the connection
      const originalCancel = controller.close.bind(controller);
      controller.close = () => {
        cleanup();
        originalCancel();
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // disables nginx buffering
    },
  });
}
