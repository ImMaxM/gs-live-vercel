import { transformToPayload } from "./transform";
import type {
  F1LiveData,
  F1Event,
  EventCallback,
  StreamName,
  WeatherData,
  RaceControlMessages,
} from "./types";
import { SUBSCRIBED_STREAMS } from "./types";
import { getMSSClient } from "../mss/client";
import type { MSSLiveStandingsResponse } from "../mss/types";

const BASE_HTTP = "https://livetiming.formula1.com";
const BASE_WS = "wss://livetiming.formula1.com";
const HUBS = [{ name: "Streaming" }];
const CLIENT_PROTOCOL = "1.5";

class F1SignalRClient {
  private static instance: F1SignalRClient | null = null;

  private socket: WebSocket | null = null;
  private connectionToken: string | null = null;
  private cookie: string | null = null;
  private isConnecting = false;
  private isConnected = false;
  private nextInvokeId = 1;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private mssPollingTimer: ReturnType<typeof setInterval> | null = null;
  private subscribers = new Set<EventCallback>();

  // cacged data latest state of each stream
  private cachedData: F1LiveData = {
    WeatherData: null,
    RaceControlMessages: null,
  };

  // Cached MSS data
  private mssData: MSSLiveStandingsResponse | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): F1SignalRClient {
    F1SignalRClient.instance ??= new F1SignalRClient();
    return F1SignalRClient.instance;
  }

  subscribe(callback: EventCallback): () => void {
    this.subscribers.add(callback);

    // Start connection if this is the first subscriber
    if (
      this.subscribers.size === 1 &&
      !this.isConnected &&
      !this.isConnecting
    ) {
      void this.connect();
      this.startMSSPolling();
    }

    // Send cached payload immediately to new subscriber
    const payload = transformToPayload(this.cachedData, this.mssData);
    if (payload) {
      callback({
        type: "payload",
        data: payload,
        timestamp: Date.now(),
      });
    }

    if (this.isConnected) {
      callback({
        type: "connected",
        data: null,
        timestamp: Date.now(),
      });
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
      // Stop MSS polling if no more subscribers
      if (this.subscribers.size === 0) {
        this.stopMSSPolling();
      }
    };
  }

  getCachedData(): F1LiveData {
    return { ...this.cachedData };
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  private startMSSPolling(): void {
    // Initial fetch
    void this.fetchMSSData();

    // Poll every 2 seconds
    this.mssPollingTimer = setInterval(() => {
      void this.fetchMSSData();
    }, 1000);
  }

  private stopMSSPolling(): void {
    if (this.mssPollingTimer) {
      clearInterval(this.mssPollingTimer);
      this.mssPollingTimer = null;
    }
  }

  private async fetchMSSData(): Promise<void> {
    try {
      const mssClient = getMSSClient();

      // If session is completed, stop polling
      if (mssClient.isCompleted()) {
        this.stopMSSPolling();
        return;
      }

      const data = await mssClient.getLiveStandings();

      if (data) {
        // Compare with previous data to avoid sending unchanged payloads
        const dataStr = JSON.stringify(data);
        const prevStr = JSON.stringify(this.mssData);
        const hasChanged = dataStr !== prevStr;

        this.mssData = data;

        // Only emit payload if data has changed
        if (hasChanged) {
          const payload = transformToPayload(this.cachedData, this.mssData);
          if (payload) {
            this.emit({
              type: "payload",
              data: payload,
              timestamp: Date.now(),
            });
          }
        }

        // Stop polling after emitting final data if session completed
        if (mssClient.isCompleted()) {
          this.stopMSSPolling();
        }
      }
    } catch (err) {
      console.error("Error fetching MSS data:", err);
    }
  }

  private emit(event: F1Event): void {
    for (const callback of this.subscribers) {
      try {
        callback(event);
      } catch (err) {
        console.error("Error in subscriber callback:", err);
      }
    }
  }

  private encodedHubParam(): string {
    return encodeURIComponent(JSON.stringify(HUBS));
  }

  private buildNegotiateUrl(): string {
    const connectionData = this.encodedHubParam();
    return `${BASE_HTTP}/signalr/negotiate?connectionData=${connectionData}&clientProtocol=${CLIENT_PROTOCOL}`;
  }

  private buildConnectUrl(connectionToken: string): string {
    const connectionData = this.encodedHubParam();
    const encodedToken = encodeURIComponent(connectionToken);
    return `${BASE_WS}/signalr/connect?clientProtocol=${CLIENT_PROTOCOL}&transport=webSockets&connectionToken=${encodedToken}&connectionData=${connectionData}`;
  }

  private parseCookieHeader(
    setCookieHeader: string | string[] | undefined,
  ): string {
    if (!setCookieHeader) return "";

    const parts = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : [setCookieHeader];
    const simple = parts
      .map((c) => (typeof c === "string" ? c.split(";")[0] : ""))
      .filter(Boolean);

    return simple.join("; ");
  }

  private async negotiate(): Promise<{ token: string; cookie: string }> {
    const url = this.buildNegotiateUrl();

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "BestHTTP",
        "Accept-Encoding": "gzip,identity",
      },
    });

    if (!response.ok) {
      throw new Error(`Negotiation failed with status ${response.status}`);
    }

    const data = (await response.json()) as { ConnectionToken?: string };
    const token = data.ConnectionToken;

    if (!token) {
      throw new Error("Negotiation did not return a ConnectionToken.");
    }

    const setCookie = response.headers.get("set-cookie");
    const cookie = this.parseCookieHeader(setCookie ?? undefined);

    if (!cookie) {
      throw new Error("Negotiation did not return a Set-Cookie header.");
    }

    return { token, cookie };
  }

  private async connect(): Promise<void> {
    if (this.isConnecting ?? this.isConnected) {
      return;
    }

    this.isConnecting = true;

    try {
      const { token, cookie } = await this.negotiate();
      this.connectionToken = token;
      this.cookie = cookie;

      const url = this.buildConnectUrl(token);

      // Bun's native WebSocket
      this.socket = new WebSocket(url, {
        headers: {
          "User-Agent": "BestHTTP",
          "Accept-Encoding": "gzip,identity",
          Cookie: cookie,
        },
      } as unknown as string[]);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        this.emit({
          type: "connected",
          data: null,
          timestamp: Date.now(),
        });

        // Subscribe to streams after a short delay (wait for handshake)
        setTimeout(() => {
          this.subscribeToStreams();
        }, 250);
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data as string);
      };

      this.socket.onclose = (event) => {
        console.log(
          `WebSocket closed: code=${event.code}, reason=${event.reason}`,
        );
        this.handleDisconnect();
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.emit({
          type: "error",
          data: error,
          timestamp: Date.now(),
        });
      };
    } catch (err) {
      console.error("Connection error:", err);
      this.isConnecting = false;
      this.emit({
        type: "error",
        data: err,
        timestamp: Date.now(),
      });
      this.scheduleReconnect();
    }
  }

  private handleDisconnect(): void {
    this.isConnected = false;
    this.isConnecting = false;
    this.socket = null;

    this.emit({
      type: "disconnected",
      data: null,
      timestamp: Date.now(),
    });

    // Only reconnect if we have subscribers
    if (this.subscribers.size > 0) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached. Giving up.");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      30000,
    );

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
    );

    this.reconnectTimer = setTimeout(() => {
      void this.connect();
    }, delay);
  }

  private subscribeToStreams(): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      console.warn("Cannot subscribe socket not open");
      return;
    }

    const payload = {
      H: "Streaming",
      M: "Subscribe",
      A: [SUBSCRIBED_STREAMS as unknown as string[]],
      I: this.nextInvokeId++,
    };

    // console.log(`Subscribing to streams: ${SUBSCRIBED_STREAMS.join(", ")}`);
    this.socket.send(JSON.stringify(payload));
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as {
        R?: Partial<Record<StreamName, unknown>>;
        M?: Array<{
          H?: string;
          M?: string;
          A?: unknown[];
        }>;
        C?: string;
        S?: number;
        G?: string;
      };

      let dataUpdated = false;

      // Handle subscription response with initial data
      if (message.R) {
        for (const [streamName, streamData] of Object.entries(message.R)) {
          if (this.updateCachedData(streamName as StreamName, streamData)) {
            dataUpdated = true;
          }
        }
      }

      // Handle real-time updates via M (Messages) array
      if (message.M && Array.isArray(message.M)) {
        for (const msg of message.M) {
          if (msg.H === "Streaming" && msg.M === "feed" && msg.A) {
            const [streamName, streamData] = msg.A as [string, unknown];
            if (this.updateCachedData(streamName as StreamName, streamData)) {
              dataUpdated = true;
            }
          }
        }
      }

      // Emit transformed payload if any data was updated
      if (dataUpdated) {
        const payload = transformToPayload(this.cachedData, this.mssData);
        if (payload) {
          this.emit({
            type: "payload",
            data: payload,
            timestamp: Date.now(),
          });
        }
      }

      // Keep-alive messages ({}) and control frames are ignored silently
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  }

  private updateCachedData(
    streamName: StreamName,
    streamData: unknown,
  ): boolean {
    if (!streamData) return false;

    switch (streamName) {
      case "WeatherData":
        this.cachedData.WeatherData = {
          ...this.cachedData.WeatherData,
          ...(streamData as Partial<WeatherData>),
        } as WeatherData;
        return true;
      case "RaceControlMessages":
        this.cachedData.RaceControlMessages = {
          ...this.cachedData.RaceControlMessages,
          ...(streamData as Partial<RaceControlMessages>),
        } as RaceControlMessages;
        return true;
      default:
        return false;
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopMSSPolling();

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  reconnect(): void {
    this.disconnect();
    void this.connect();
  }
}

export const getF1Client = F1SignalRClient.getInstance.bind(F1SignalRClient);

export type { F1SignalRClient };

export type {
  WeatherData,
  RaceControlMessages,
  F1LiveData,
  F1Event,
  F1EventType,
  StreamName,
} from "./types";
