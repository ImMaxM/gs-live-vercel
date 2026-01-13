"use client";

import { useEffect, useRef } from "react";
import { useF1Live } from "./providers/F1LiveProvider";
import { discordSdk } from "~/lib/discord/client";

export function DiscordActivityStatus({ isEmbedded }: { isEmbedded: boolean }) {
  const { payload, isConnected } = useF1Live();
  const lastActivityRef = useRef<string>("");

  useEffect(() => {
    if (!isEmbedded || !discordSdk) return;

    async function updateActivity() {
      try {
        // Build activity details based on current state
        let details = "GridScout Live";
        let state = "Waiting for session...";

        if (payload && isConnected) {
          const session = payload.session;
          const event = payload.event;

          // Build the details line (what the user is doing)
          details = `Watching the ${event.name}`;

          // Build the state line (more context)
          if (session.status === "active") {
            if (session.lapTotal > 0) {
              state = `${session.name} • Lap ${session.lap}/${session.lapTotal}`;
            } else {
              state = session.name;
            }
          } else if (
            session.status === "finished" ||
            session.status === "complete"
          ) {
            state = `${session.name} • Finished`;
          } else {
            state = session.name;
          }
        } else if (!isConnected) {
          state = "Connecting...";
        }

        // Create a key to avoid unnecessary updates
        const activityKey = `${details}|${state}`;
        if (activityKey === lastActivityRef.current) {
          return; // No change, skip update
        }
        lastActivityRef.current = activityKey;

        // Update Discord activity
        await discordSdk.commands.setActivity({
          activity: {
            type: 3, // WATCHING
            details,
            state,
            assets: {
              large_image: "gridscout_logo", // Must be configured in Discord Developer Portal
              large_text: "GridScout Live",
            },
          },
        });
      } catch (err) {
        // Silently fail activity updates are not rcitical
        console.warn("Failed to update Discord activity:", err);
      }
    }

    void updateActivity();
  }, [isEmbedded, payload, isConnected]);

  // This component doesn't render anything
  return null;
}
