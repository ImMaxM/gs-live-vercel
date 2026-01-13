"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LiveTimingsPayload } from "../../../payload";
import { useSettings } from "./SettingsProvider";
import pako from "pako";

// Helper to decompress SSE data (base64 -> deflate -> JSON)
function decompressData<T>(base64: string): T {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decompressed = pako.inflate(bytes, { to: "string" });
  return JSON.parse(decompressed) as T;
}

export type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

export interface WeatherData {
  AirTemp: string;
  Humidity: string;
  Pressure: string;
  Rainfall: string;
  TrackTemp: string;
  WindDirection: string;
  WindSpeed: string;
}

interface F1LiveContextValue {
  payload: LiveTimingsPayload | null;
  weather: WeatherData | null;
  isConnected: boolean;
  lastUpdate: number | null;
  sseConnected: boolean;
  connectionStatus: ConnectionStatus;
  delayRemaining: number;
}

const F1LiveContext = createContext<F1LiveContextValue>({
  payload: null,
  weather: null,
  isConnected: false,
  lastUpdate: null,
  sseConnected: false,
  connectionStatus: "disconnected",
  delayRemaining: 0,
});

export function useF1Live() {
  return useContext(F1LiveContext);
}

interface F1LiveProviderProps {
  children: ReactNode;
}

export function F1LiveProvider({ children }: F1LiveProviderProps) {
  const { streamDelayEnabled, streamDelaySeconds } = useSettings();
  const [payload, setPayload] = useState<LiveTimingsPayload | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [delayRemaining, setDelayRemaining] = useState(0);
  const reconnectAttempts = useRef(0);
  const baseDelay = 1000; // Base delay for exponential backoff

  // Track pending delayed payloads
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const firstPayloadReceived = useRef(false);

  // Extract weather data from payload for backward compatibility
  useEffect(() => {
    if (payload?.weather) {
      setWeather({
        AirTemp: payload.weather.airTempC.toString(),
        Humidity: payload.weather.humidityPercent.toString(),
        Pressure: payload.weather.pressureHpa.toString(),
        Rainfall: payload.weather.conditions === "Rainy" ? "1" : "0",
        TrackTemp: payload.weather.trackTempC.toString(),
        WindDirection: payload.weather.wind.directionDeg.toString(),
        WindSpeed: payload.weather.wind.speedKmh.toString(),
      });
    }
  }, [payload]);

  // Handle initial delay countdown
  useEffect(() => {
    if (delayRemaining <= 0) return;

    const timer = setInterval(() => {
      setDelayRemaining((prev) => {
        const next = prev - 1;
        return next <= 0 ? 0 : next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [delayRemaining]);

  useEffect(() => {
    // Reset state when delay settings change
    firstPayloadReceived.current = false;
    setDelayRemaining(0);
    setPayload(null);

    // Clear any pending timers
    pendingTimers.current.forEach((t) => clearTimeout(t));
    pendingTimers.current = [];

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      eventSource = new EventSource("/api/realtime");

      eventSource.onopen = () => {
        setSseConnected(true);
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
      };

      eventSource.addEventListener("status", (e: MessageEvent<string>) => {
        const data = decompressData<{
          connected: boolean;
          timestamp: number;
        }>(e.data);
        setIsConnected(data.connected);
      });

      eventSource.addEventListener("payload", (e: MessageEvent<string>) => {
        const { data, timestamp } = decompressData<{
          data: LiveTimingsPayload;
          timestamp: number;
        }>(e.data);

        if (streamDelayEnabled && streamDelaySeconds > 0) {
          if (!firstPayloadReceived.current) {
            firstPayloadReceived.current = true;
            setDelayRemaining(streamDelaySeconds);
          }

          const timer = setTimeout(() => {
            if (isMounted) {
              setPayload(data);
              setLastUpdate(timestamp);
            }
          }, streamDelaySeconds * 1000);

          pendingTimers.current.push(timer);
        } else {
          setPayload(data);
          setLastUpdate(timestamp);
        }
      });

      eventSource.addEventListener("heartbeat", (e: MessageEvent<string>) => {
        const data = decompressData<{ timestamp: number }>(e.data);
        console.log("Heartbeat:", new Date(data.timestamp).toISOString());
      });

      eventSource.addEventListener("error", (e: Event) => {
        if (e instanceof MessageEvent && typeof e.data === "string") {
          try {
            const errorData = decompressData<{
              message: string;
              timestamp: number;
            }>(e.data);
            console.error("Server error:", errorData);
          } catch {
            console.error("Server error:", e.data);
          }
        }
      });

      eventSource.onerror = () => {
        if (!isMounted) return;

        setSseConnected(false);
        setIsConnected(false);
        eventSource?.close();
        eventSource = null;

        setConnectionStatus("reconnecting");
        reconnectAttempts.current++;

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
        const delay = Math.min(
          baseDelay * Math.pow(2, reconnectAttempts.current - 1),
          30000,
        );

        console.log(
          `Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts.current})...`,
        );
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    // Defer SSE connection to allow initial paint first
    const deferredConnect = setTimeout(connect, 50);

    return () => {
      isMounted = false;
      clearTimeout(deferredConnect);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      pendingTimers.current.forEach((t) => clearTimeout(t));
      eventSource?.close();
    };
  }, [streamDelayEnabled, streamDelaySeconds]);

  return (
    <F1LiveContext.Provider
      value={{
        payload,
        weather,
        isConnected,
        lastUpdate,
        sseConnected,
        connectionStatus,
        delayRemaining,
      }}
    >
      {children}
    </F1LiveContext.Provider>
  );
}
