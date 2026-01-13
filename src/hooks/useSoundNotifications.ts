"use client";

import { useEffect, useRef } from "react";
import { useF1Live } from "~/components/providers/F1LiveProvider";
import { useSettings } from "~/components/providers/SettingsProvider";
import { playSound } from "~/lib/sounds";

export function useSoundNotifications() {
  const { payload } = useF1Live();
  const { soundEnabled } = useSettings();

  // Track previous values to detect changes
  const prevFlagStatus = useRef<string | null>(null);
  const prevMessageCount = useRef<number>(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render to avoid sounds on initial load
    if (isFirstRender.current) {
      if (payload) {
        prevFlagStatus.current = payload.flagStatus ?? "green";
        prevMessageCount.current = payload.raceControlMessages?.length ?? 0;
        isFirstRender.current = false;
      }
      return;
    }

    if (!soundEnabled || !payload) return;

    const currentFlagStatus = payload.flagStatus ?? "green";
    const currentMessageCount = payload.raceControlMessages?.length ?? 0;

    // Check for flag status changes
    if (prevFlagStatus.current !== currentFlagStatus) {
      switch (currentFlagStatus) {
        case "sc":
        case "vsc":
          playSound("yellow");
          break;
        case "red":
          playSound("red");
          break;
        case "green":
          // Only play green if coming from a non-green status
          if (prevFlagStatus.current && prevFlagStatus.current !== "green") {
            playSound("green");
          }
          break;
      }
      prevFlagStatus.current = currentFlagStatus;
    }

    // Check for new race control messages
    if (currentMessageCount > prevMessageCount.current) {
      playSound("message");
    }
    prevMessageCount.current = currentMessageCount;
  }, [payload, soundEnabled]);
}
