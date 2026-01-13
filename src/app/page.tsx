"use client";

import { DiscordActivity } from "~/components/providers/DiscordActivity";
import { Header } from "~/components/layout/Header";
import { StatusBar } from "~/components/ui/StatusBar";
import { TimingsTable } from "~/components/ui/TimingsTable";
import { WidgetView } from "~/components/ui/WidgetView";
import { RightPanel } from "~/components/ui/RightPanel";
import { SoundNotifications } from "~/components/SoundNotifications";
import { useF1Live } from "~/components/providers/F1LiveProvider";
import { useEffect, useState } from "react";

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
  auth: Parameters<
    Parameters<typeof DiscordActivity>[0]["children"]
  >[0]["auth"];
  isEmbedded: boolean;
  signOut: () => Promise<void>;
}) {
  const { delayRemaining } = useF1Live();

  return (
    <div className="bg-background min-h-screen">
      <SoundNotifications />
      <Header auth={auth} isEmbedded={isEmbedded} signOut={signOut} />
      <StatusBar />

      <main className="flex h-screen flex-col overflow-y-auto pt-20 lg:flex-row lg:overflow-hidden">
        <div className="w-full min-w-0 flex-1 lg:w-[75%] lg:overflow-x-hidden lg:overflow-y-auto">
          <div className="w-full overflow-x-auto">
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
