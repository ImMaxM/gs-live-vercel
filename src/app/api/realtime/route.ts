import { getF1Client } from "~/lib/f1/client";
import type { LiveTimingsPayload } from "../../../../payload";
import pako from "pako";
import {
  sseClientsGauge,
  sseConnectionsTotal,
  sseMessagesSent,
  f1ConnectionStatus,
  f1EventsReceived,
} from "~/lib/metrics";

export async function GET(): Promise<Response> {
  const client = getF1Client();

  // Track new connection
  sseClientsGauge.inc();
  sseConnectionsTotal.inc();

  // Cleanup state tored in closure for access from cancel callback
  let cleanupFn: (() => void) | null = null;
  let isCleanedUp = false;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // helper to send SSE formatted data with compression
      const sendEvent = (event: string, data: unknown) => {
        if (isCleanedUp) return;

        // Compress JSON data using deflate, then base64 encode for SSE transport
        const jsonStr = JSON.stringify(data);
        const compressed = pako.deflate(jsonStr);
        const base64 = Buffer.from(compressed).toString("base64");

        const payload = `event: ${event}\ndata: ${base64}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
          sseMessagesSent.inc({ event_type: event });
        } catch {
          // stream closed, ignore
        }
      };

      // Send initial connection status and cached data
      // const cachedData = client.getCachedData();
      const isConnected = client.getConnectionStatus();
      f1ConnectionStatus.set(isConnected ? 1 : 0);

      sendEvent("status", {
        connected: isConnected,
        timestamp: Date.now(),
      });

      // Subscribe to F1 client events
      const unsubscribe = client.subscribe((event) => {
        f1EventsReceived.inc({ event_type: event.type });

        switch (event.type) {
          case "payload":
            sendEvent("payload", {
              data: event.data as LiveTimingsPayload,
              timestamp: event.timestamp,
            });
            break;
          case "connected":
            f1ConnectionStatus.set(1);
            sendEvent("status", {
              connected: true,
              timestamp: event.timestamp,
            });
            break;
          case "disconnected":
            f1ConnectionStatus.set(0);
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

      // Store cleanup function in closure
      cleanupFn = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        clearInterval(heartbeatInterval);
        unsubscribe();
        sseClientsGauge.dec();
      };
    },
    cancel() {
      // Called when client disconnects (refresh, close tab, navigate away)
      if (cleanupFn) cleanupFn();
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
