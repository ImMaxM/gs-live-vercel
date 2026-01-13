export interface MSSEntity {
  name: string;
  uuid: string;
  type: string;
}

export interface MSSGap {
  timeToLead: number;
  lapsToLead: number;
  timeToNext: number;
  lapsToNext: number;
}

export interface MSSTyreDetail {
  type: string; // "S", "M", "H", "I", "W"
  wear: string; // "n" = new, "u" = used
  laps: number;
}

export interface MSSDriverRanking {
  driver: MSSEntity;
  team: MSSEntity;
  position: number | null;
  carNumber: string;
  pit: boolean;
  time: number;
  gap: MSSGap | null;
  overtaken: boolean;
  lapped: boolean;
  lapsCompleted: number;
  raceTime: number;
  fastestLapTime: number;
  fastestLap: boolean;
  pitStops: number;
  retirement: string | null;
  tyre: string | null;
  tyreDetail: MSSTyreDetail[];
  racePoints: number | null;
  championshipPosition: number | null;
  championshipPoints: number | null;
  averageSpeed: number | null;
  bestSpeed: number | null;
  stage: string | null;
}

export interface MSSRaceDetail {
  safetyCar: number[];
  virtualSafetyCar: number[];
  redFlag: number[];
}

export interface MSSLiveStandingsResponse {
  session: MSSEntity;
  event: MSSEntity;
  eventNumber: number;
  season: MSSEntity;
  series: MSSEntity;
  sessionState: string; // "Complete", "In Progress", "Finished", etc.
  lapTotal: number;
  lapsAvailable: number;
  raceDetail: MSSRaceDetail | null;
  lap: number;
  lapNotes: string;
  ranking: MSSDriverRanking[];
  teamRanking: unknown[];
  constructorRanking: unknown[];
}
