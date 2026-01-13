import type { LiveTimingsPayload, DriverTelemetry } from "../../../payload";
import type { F1LiveData, RaceControlMessages } from "./types";
import type { MSSLiveStandingsResponse, MSSDriverRanking } from "../mss/types";

export function transformToPayload(
  cachedData: F1LiveData,
  mssData: MSSLiveStandingsResponse | null,
): LiveTimingsPayload | null {
  // Don't emit until we have at least weather data
  if (!cachedData.WeatherData) {
    return null;
  }

  const weather = cachedData.WeatherData;
  const raceControl = cachedData.RaceControlMessages;

  // Parse wind direction
  const windDirDeg = weather?.WindDirection
    ? parseFloat(weather.WindDirection)
    : 0;
  const windDirCompass = degToCompass(windDirDeg);

  // Build race control messages
  const messages = buildRaceControlMessages(raceControl);

  // Build drivers from MSS data
  const drivers = mssData ? buildDrivers(mssData.ranking) : [];

  // Determine session status
  const sessionStatus = mssData
    ? mapSessionState(mssData.sessionState)
    : "inactive";

  const payload: LiveTimingsPayload = {
    session: {
      name: mssData?.session.name ?? "Unknown Session",
      status: sessionStatus,
      lap: mssData?.lap ?? 0,
      lapTotal: mssData?.lapTotal ?? 0,
    },
    event: {
      name: mssData?.event.name ?? "Unknown Event",
      country: {
        name: "United Arab Emirates", // MSS doesn't provide country directly
        alpha3: "ARE",
      },
    },
    weather: {
      conditions: weather?.Rainfall === "1" ? "Rainy" : "Sunny",
      wind: {
        speedKmh: weather?.WindSpeed ? parseFloat(weather.WindSpeed) : 0,
        directionDeg: windDirDeg,
        directionCompass: windDirCompass,
      },
      trackTempC: weather?.TrackTemp ? parseFloat(weather.TrackTemp) : 0,
      airTempC: weather?.AirTemp ? parseFloat(weather.AirTemp) : 0,
      humidityPercent: weather?.Humidity ? parseFloat(weather.Humidity) : 0,
      pressureHpa: weather?.Pressure ? parseFloat(weather.Pressure) : 0,
    },
    trackStatus: determineTrackStatus(mssData?.raceDetail, mssData?.lap ?? 0),
    drivers,
    raceControlMessages: messages,
  };

  return payload;
}

function determineTrackStatus(
  raceDetail:
    | { safetyCar: number[]; virtualSafetyCar: number[]; redFlag: number[] }
    | null
    | undefined,
  currentLap: number,
): LiveTimingsPayload["trackStatus"] {
  if (!raceDetail) {
    return {
      message: "TRACK CLEAR — NO CURRENT OBSTRUCTIONS",
      flagStatus: "green",
    };
  }

  // Check if current lap has any flags (check current lap and also if we're still under that condition)
  // Red flag takes priority
  if (raceDetail.redFlag.includes(currentLap)) {
    return { message: "RED FLAG — SESSION SUSPENDED", flagStatus: "red" };
  }

  // Safety car
  if (raceDetail.safetyCar.includes(currentLap)) {
    return { message: "SAFETY CAR DEPLOYED", flagStatus: "sc" };
  }

  // Virtual safety car
  if (raceDetail.virtualSafetyCar.includes(currentLap)) {
    return { message: "VIRTUAL SAFETY CAR", flagStatus: "vsc" };
  }

  // Default: green flag
  return {
    message: "TRACK CLEAR — NO CURRENT OBSTRUCTIONS",
    flagStatus: "green",
  };
}

function mapSessionState(state: string): "active" | "inactive" | "finished" {
  switch (state.toLowerCase()) {
    case "running":
    case "live":
      return "active";
    case "complete":
    case "completed":
    case "finished":
      return "finished";
    default:
      return "inactive";
  }
}

function buildDrivers(ranking: MSSDriverRanking[]): DriverTelemetry[] {
  return ranking
    .filter((r) => r.position !== null) // Filter out drivers without position (DNS, etc.)
    .map((r) => {
      // Get current tyre info from tyreDetail
      const currentTyreDetail = r.tyreDetail[r.tyreDetail.length - 1];
      const currentTyre = currentTyreDetail
        ? {
            compound: mapTyreCompound(currentTyreDetail.type),
            ageLaps: currentTyreDetail.laps,
            isNew: currentTyreDetail.wear === "n",
            wear: currentTyreDetail.wear,
          }
        : {
            compound: mapTyreCompound(r.tyre ?? "M"),
            ageLaps: 0,
            isNew: true,
          };

      // Build tyre history
      // Build tyre history - exclude the last one as it's the current tyre
      const tyreHistory = r.tyreDetail.slice(0, -1).map((t) => ({
        compound: mapTyreCompound(t.type),
        laps: t.laps,
        wear: t.wear,
      }));

      // Format gap string
      const gap = formatGap(r.gap, r.position ?? 0);
      const interval = formatInterval(r.gap);

      return {
        uuid: r.driver.uuid,
        tla: extractTLA(r.driver.name),
        position: r.position ?? 0,
        // TODO: Calculate actual position change when MSS provides previous position, maybe grab quali result?
        positionChange: 0,
        teamId: r.team.uuid,
        gap,
        interval,
        lastLapTime: formatLapTime(r.time),
        lastLapTimeMs: r.time,
        bestLapTime: formatLapTime(r.fastestLapTime),
        bestLapTimeMs: r.fastestLapTime,
        averageSpeedMph: kphToMph(r.averageSpeed ?? 0),
        pitStatus: r.pit ? "in_pit" : "on_track",
        pitStopCount: r.pitStops,
        currentTyre,
        tyreHistory,
      } satisfies DriverTelemetry;
    });
}

function mapTyreCompound(
  type: string,
): "soft" | "medium" | "hard" | "intermediate" | "wet" {
  switch (type.toUpperCase()) {
    case "S":
      return "soft";
    case "M":
      return "medium";
    case "H":
      return "hard";
    case "I":
      return "intermediate";
    case "W":
      return "wet";
    default:
      return "medium";
  }
}

function extractTLA(fullName: string): string {
  // Extract first 3 letters of last name
  const parts = fullName.trim().split(" ");
  const lastName = parts[parts.length - 1] ?? "";
  return lastName.substring(0, 3).toUpperCase();
}

function formatGap(gap: MSSDriverRanking["gap"], position: number): string {
  if (position === 1) return "LEADER";
  if (!gap) return "";

  if (gap.lapsToLead > 0) {
    return gap.lapsToLead === 1 ? "+1 LAP" : `+${gap.lapsToLead} LAPS`;
  }

  // timeToLead is in milliseconds
  return `+${formatTimeGap(gap.timeToLead)}`;
}

function formatInterval(gap: MSSDriverRanking["gap"]): string {
  if (!gap) return "";

  if (gap.lapsToNext > 0) {
    return gap.lapsToNext === 1 ? "+1 LAP" : `+${gap.lapsToNext} LAPS`;
  }

  return `+${formatTimeGap(gap.timeToNext)}`;
}

function formatTimeGap(ms: number): string {
  // Convert ms to seconds with 3 decimal places
  const seconds = ms / 1000;
  return seconds.toFixed(3);
}

function formatLapTime(ms: number): string {
  if (ms <= 0) return "";

  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}:${seconds.toFixed(3).padStart(6, "0")}`;
  }
  return seconds.toFixed(3);
}

function kphToMph(kph: number): number {
  return Math.round(kph * 0.621371 * 1000) / 1000;
}

function degToCompass(deg: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(deg / 45) % 8;
  return directions[index] ?? "N";
}

function buildRaceControlMessages(raceControl: RaceControlMessages | null) {
  if (!raceControl?.Messages) return [];

  return raceControl.Messages.map((msg, index) => ({
    id: `${msg.Utc}-${index}`,
    utc: msg.Utc ? new Date(msg.Utc).toISOString() : "",
    lap: msg.Lap ?? 0,
    category: msg.Category ?? "RACE CONTROL",
    message: msg.Message ?? "",
  })).reverse();
}
