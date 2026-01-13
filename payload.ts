export interface LiveTimingsPayload {
  // Session & Event Info
  session: {
    name: string; // e.g., "Race Session"
    status: "active" | "finished" | "complete";
    lap: number; // e.g., 52
    lapTotal: number; // e.g., 70
  };
  event: {
    name: string; // e.g., "British Grand Prix"
    country: {
      name: string;
      alpha3: string; // e.g., "GBR"
    };
  };

  // Weather & Environment (Top Right Header)
  weather: {
    conditions: string; // e.g., "Sunny"
    wind: {
      speedKmh: number; // 3.6
      directionDeg: number; // 205
      directionCompass: string; // "S"
    };
    trackTempC: number; // 44.0
    airTempC: number; // 27.1
    humidityPercent: number; // 43.0
    pressureHpa: number; // 996.4
  };

  flagStatus: "green" | "sc" | "vsc" | "red";

  // Main Leaderboard Data
  drivers: DriverTelemetry[];

  // Race Control Messages (Bottom Right Panel)
  raceControlMessages: RaceControlMessage[];
}

export interface DriverTelemetry {
  uuid: string;
  tla: string; // e.g., "VER"
  position: number; // Explicit position is safer than array index
  positionChange: number; // e.g., 1, 0, -1
  teamId: string; // Needed for the team color strip (e.g., Red Bull Blue)

  // Timing
  gap: string; // String allows "LEADER", "+1 LAP", or "+1.750"
  interval: string; // String allows "+1.750"
  lastLapTime: string; // Formatted "1:23.076"
  lastLapTimeMs?: number; // Raw ms for comparison
  bestLapTime: string; // Formatted "1:22.104"
  bestLapTimeMs?: number; // Raw ms for comparison
  averageSpeedMph: number; // 233.847

  // Pit & Tyres
  pitStatus: "in_pit" | "on_track";
  pitStopCount: number; // e.g., 1

  // Tyre Data
  currentTyre: {
    compound: "soft" | "medium" | "hard" | "intermediate" | "wet";
    ageLaps: number; // e.g., 16
    isNew: boolean; // Often visualized by solid vs hollow circle
    wear?: string; // "u" for Worn, "n" for Normal/New
  };

  // The colored bars showing previous stints
  tyreHistory: {
    compound: "soft" | "medium" | "hard" | "intermediate" | "wet";
    laps: number; // e.g., 5
    wear?: string; // "u" for Worn, "n" for Normal/New
  }[];

  // retirement data
  // retirement: {
  // }
}

export interface RaceControlMessage {
  id: string; // Unique ID for React lists/keys
  utc: string; // "2026-01-13T20:26:36.000Z"
  lap: number; // 52
  category: string; // Other, 
  message: string; // The text content
}
