"use client";

import dynamic from "next/dynamic";
import { Header } from "~/components/layout/Header";
import { StatusBar } from "~/components/ui/StatusBar";
import { SoundNotifications } from "~/components/SoundNotifications";
import { useF1Live } from "~/components/providers/F1LiveProvider";
import { useEffect, useState } from "react";
import {
  DiscordActivity,
  type Auth,
} from "~/components/providers/DiscordActivity";
import { DiscordActivityStatus } from "~/components/DiscordActivityStatus";

// Dynamic imports for heavy components - loads on-demand
const TimingsTable = dynamic(
  () => import("~/components/ui/TimingsTable").then((mod) => mod.TimingsTable),
  { ssr: false },
);

const RightPanel = dynamic(
  () => import("~/components/ui/RightPanel").then((mod) => mod.RightPanel),
  { ssr: false },
);

const WidgetView = dynamic(
  () => import("~/components/ui/WidgetView").then((mod) => mod.WidgetView),
  { ssr: false },
);

function DelayCountdown({ seconds }: { seconds: number }) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeDisplay =
    minutes > 0 ? `${minutes}:${String(secs).padStart(2, "0")}` : `${secs}s`;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 py-20">
      <div className="text-center">
        <div className="text-primary text-lg font-semibold">
          Broadcast Delay Active
        </div>
        <div className="text-secondary mt-1 text-sm">
          Syncing with your video feed...
        </div>
        <div className="text-fire mt-4 text-3xl font-bold tabular-nums">
          {timeDisplay}
        </div>
        <div className="text-secondary mt-1 text-xs">
          until data is displayed
        </div>
      </div>
    </div>
  );
}

function MainContent({
  auth,
  isEmbedded,
  signOut,
}: {
  auth: Auth | null;
  isEmbedded: boolean;
  signOut: () => Promise<void>;
}) {
  const { delayRemaining, connectionStatus, payload } = useF1Live();

  const showConnectionLost =
    (connectionStatus === "reconnecting" ||
      connectionStatus === "disconnected") &&
    payload !== null;

  return (
    <div className="bg-background min-h-screen">
      <SoundNotifications />
      <DiscordActivityStatus isEmbedded={isEmbedded} />
      <Header auth={auth} isEmbedded={isEmbedded} signOut={signOut} />
      <StatusBar />

      <main className="flex h-screen flex-col overflow-y-auto pt-20 lg:flex-row lg:overflow-hidden">
        <div className="relative w-full min-w-0 flex-1 lg:w-[75%] lg:overflow-x-hidden lg:overflow-y-auto">
          {showConnectionLost && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[2px]">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  Connection lost
                </div>
                <div className="text-secondary mt-4 flex items-center justify-center gap-2 text-sm font-medium">
                  Reconnecting...
                </div>
              </div>
            </div>
          )}

          <div
            className={`w-full overflow-x-auto transition-opacity duration-300 ${showConnectionLost ? "opacity-40" : ""}`}
          >
            {delayRemaining > 0 ? (
              <DelayCountdown seconds={delayRemaining} />
            ) : (
              <TimingsTable />
            )}
          </div>
        </div>

        <div className="w-full lg:w-[25%]">
          <RightPanel />
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  const [isWidgetMode, setIsWidgetMode] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsWidgetMode(window.innerWidth < 400 || window.innerHeight < 250);
    };

    checkSize();

    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  return (
    <DiscordActivity>
      {({ auth, isEmbedded, signOut }) => {
        if (isWidgetMode) {
          return <WidgetView />;
        }

        return (
          <MainContent auth={auth} isEmbedded={isEmbedded} signOut={signOut} />
        );
      }}
    </DiscordActivity>
  );
}
