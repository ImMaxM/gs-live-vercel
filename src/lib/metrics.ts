import { Registry, Gauge, Counter, collectDefaultMetrics } from "prom-client";

export const registry = new Registry();

// Collect default Node.js metrics (memory, CPU, event loop, etc.)
collectDefaultMetrics({ register: registry });

// SSE Client Metrics

/** Currently connected SSE clients */
export const sseClientsGauge = new Gauge({
  name: "gridscout_sse_clients_connected",
  help: "Number of currently connected SSE clients",
  registers: [registry],
});

/** Total SSE connections over time */
export const sseConnectionsTotal = new Counter({
  name: "gridscout_sse_connections_total",
  help: "Total number of SSE connections since server start",
  registers: [registry],
});

// F1 Feed Metrics

/** Upstream F1 connection status (1 = connected, 0 = disconnected) */
export const f1ConnectionStatus = new Gauge({
  name: "gridscout_f1_connection_status",
  help: "Upstream F1 feed connection status (1 = connected, 0 = disconnected)",
  registers: [registry],
});

/** Total events received from F1 feed, labeled by event type */
export const f1EventsReceived = new Counter({
  name: "gridscout_f1_events_received_total",
  help: "Total events received from upstream F1 feed",
  labelNames: ["event_type"] as const,
  registers: [registry],
});

// SSE Message Metrics

/** Total SSE messages sent to clients, labeled by event type */
export const sseMessagesSent = new Counter({
  name: "gridscout_sse_messages_sent_total",
  help: "Total SSE messages sent to clients",
  labelNames: ["event_type"] as const,
  registers: [registry],
});
