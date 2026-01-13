import { env } from "~/env";
import type { MSSLiveStandingsResponse } from "./types";

const MSS_API_BASE = "https://api.motorsportstats.com/core/2.0.0";

// Hardcoded session UUID for now will be dynamic later
const CURRENT_SESSION_UUID = "6310beca-dcc5-4be7-95b3-f5a9d33f27b7";

export interface MSSClientOptions {
  sessionUuid?: string;
}

class MSSClient {
  private static instance: MSSClient | null = null;
  private cachedData: MSSLiveStandingsResponse | null = null;
  private lastFetch = 0;
  private fetchInterval = 1000;
  private isFetching = false;
  private isSessionCompleted = false;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): MSSClient {
    MSSClient.instance ??= new MSSClient();
    return MSSClient.instance;
  }

  isCompleted(): boolean {
    return this.isSessionCompleted;
  }

  async getLiveStandings(
    options?: MSSClientOptions,
  ): Promise<MSSLiveStandingsResponse | null> {
    const sessionUuid = options?.sessionUuid ?? CURRENT_SESSION_UUID;
    const now = Date.now();

    // If session is completed, just return cached data
    if (this.isSessionCompleted && this.cachedData) {
      return this.cachedData;
    }

    // Return cached data if still fresh
    if (this.cachedData && now - this.lastFetch < this.fetchInterval) {
      return this.cachedData;
    }

    // Prevent concurrent fetches
    if (this.isFetching) {
      return this.cachedData;
    }

    try {
      this.isFetching = true;
      const data = await this.fetchLiveStandings(sessionUuid);
      this.cachedData = data;
      this.lastFetch = now;

      // Check if session is completed - stop polling if so
      if (data?.sessionState === "Complete") {
        this.isSessionCompleted = true;
      }

      return data;
    } catch (err) {
      console.error("Failed to fetch live standings:", err);
      return this.cachedData; // Return stale data on error
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Force fetch fresh data (ignores cache)
   */
  async fetchLiveStandings(
    sessionUuid: string,
  ): Promise<MSSLiveStandingsResponse | null> {
    const url = `${MSS_API_BASE}/liveStandings/${sessionUuid}`;
    // const url = "http://localhost:3035/live";

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Api-Key": env.MSS_API_KEY,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn("Session not found:", sessionUuid);
        return null;
      }
      throw new Error(
        `MSS API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as MSSLiveStandingsResponse;
    // console.log(
    // `Fetched live standings for ${data.event.name} - ${data.session.name}`,
    // );
    return data;
  }

  getCachedData(): MSSLiveStandingsResponse | null {
    return this.cachedData;
  }

  clearCache(): void {
    this.cachedData = null;
    this.lastFetch = 0;
    this.isSessionCompleted = false;
  }
}

export const getMSSClient = MSSClient.getInstance.bind(MSSClient);
