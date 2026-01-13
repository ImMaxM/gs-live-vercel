"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type SpeedUnit = "mph" | "kph";
type TempUnit = "c" | "f";

interface SettingsContextValue {
  speedUnit: SpeedUnit;
  setSpeedUnit: (unit: SpeedUnit) => void;
  tempUnit: TempUnit;
  setTempUnit: (unit: TempUnit) => void;
  streamDelayEnabled: boolean;
  setStreamDelayEnabled: (enabled: boolean) => void;
  streamDelaySeconds: number;
  setStreamDelaySeconds: (seconds: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined,
);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Initialise with defaults, then load from localStorage on mount
  const [speedUnit, setSpeedUnitState] = useState<SpeedUnit>("mph");
  const [tempUnit, setTempUnitState] = useState<TempUnit>("c");
  const [streamDelayEnabled, setStreamDelayEnabledState] = useState(false);
  const [streamDelaySeconds, setStreamDelaySecondsState] = useState(30);
  const [soundEnabled, setSoundEnabledState] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage
    try {
      const storedSpeed = localStorage.getItem("gs_speed_unit");
      const storedTemp = localStorage.getItem("gs_temp_unit");
      const storedDelayEnabled = localStorage.getItem("gs_delay_enabled");
      const storedDelaySeconds = localStorage.getItem("gs_delay_seconds");

      if (storedSpeed === "kph") setSpeedUnitState("kph");
      if (storedTemp === "f") setTempUnitState("f");
      if (storedDelayEnabled === "true") setStreamDelayEnabledState(true);
      if (storedDelaySeconds) {
        const secs = parseInt(storedDelaySeconds, 10);
        if (!isNaN(secs)) setStreamDelaySecondsState(secs);
      }
      const storedSound = localStorage.getItem("gs_sound_enabled");
      if (storedSound === "true") setSoundEnabledState(true);
    } catch (e) {
      console.error("Failed to load settings:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setSpeedUnit = (unit: SpeedUnit) => {
    setSpeedUnitState(unit);
    localStorage.setItem("gs_speed_unit", unit);
  };

  const setTempUnit = (unit: TempUnit) => {
    setTempUnitState(unit);
    localStorage.setItem("gs_temp_unit", unit);
  };

  const setStreamDelayEnabled = (enabled: boolean) => {
    setStreamDelayEnabledState(enabled);
    localStorage.setItem("gs_delay_enabled", enabled.toString());
  };

  const setStreamDelaySeconds = (seconds: number) => {
    setStreamDelaySecondsState(seconds);
    localStorage.setItem("gs_delay_seconds", seconds.toString());
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem("gs_sound_enabled", enabled.toString());
  };

  return (
    <SettingsContext.Provider
      value={{
        speedUnit,
        setSpeedUnit,
        tempUnit,
        setTempUnit,
        streamDelayEnabled,
        setStreamDelayEnabled,
        streamDelaySeconds,
        setStreamDelaySeconds,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}
