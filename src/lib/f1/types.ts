export const SUBSCRIBED_STREAMS = [
  "WeatherData",
  "RaceControlMessages",
] as const;

export type StreamName = (typeof SUBSCRIBED_STREAMS)[number];

export interface WeatherData {
  AirTemp: string;
  Humidity: string;
  Pressure: string;
  Rainfall: string;
  TrackTemp: string;
  WindDirection: string;
  WindSpeed: string;
  _kf?: boolean;
}

export interface RaceControlMessages {
  Messages?: Array<{
    Utc?: string;
    Lap?: number;
    Category?: string;
    Message?: string;
    Status?: string;
    Flag?: string;
    Scope?: string;
    Sector?: number;
    RacingNumber?: string;
  }>;
}

export interface F1LiveData {
  WeatherData: WeatherData | null;
  RaceControlMessages: RaceControlMessages | null;
}

export type F1EventType = "payload" | "connected" | "disconnected" | "error";

export interface F1Event {
  type: F1EventType;
  data: unknown;
  timestamp: number;
}

export type EventCallback = (event: F1Event) => void;
