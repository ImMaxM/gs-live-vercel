"use client";

import { useF1Live } from "~/components/providers/F1LiveProvider";
import { useEffect, useRef, useState, useMemo } from "react";
import {
  Flag,
  Info,
  Timer,
  TriangleAlert,
  Clock,
  type LucideIcon,
} from "lucide-react";

const ICON_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  Other: { icon: Info, color: "text-secondary" },
  Flag: { icon: Flag, color: "text-primary" },
  BlueFlag: { icon: Flag, color: "text-blue-800" },
  UnderInvestigation: { icon: TriangleAlert, color: "text-yellow-600" },
  TimePenalty: { icon: Timer, color: "text-purple-700" },
  GreenFlag: { icon: Flag, color: "text-green-600" },
  YellowFlag: { icon: Flag, color: "text-yellow-600" },
};

const getCategory = (cat: string, msg: string) => {
  const m = msg.toLowerCase();
  if (m.includes("blue flag")) return "BlueFlag";
  if (m.includes("under investigation") || m.includes("noted"))
    return "UnderInvestigation";
  if (m.includes("time penalty")) return "TimePenalty";
  if (m.includes("green light")) return "GreenFlag";
  if (m.includes("yellow")) return "YellowFlag";
  return cat;
};

const formatTime = (utc?: string) => {
  if (!utc) return "";
  try {
    const d = utc.includes("T") ? new Date(utc) : new Date();
    if (!utc.includes("T")) {
      const [h, m, s] = utc.split(":").map(Number);
      d.setHours(h ?? 0, m ?? 0, s ?? 0);
    }
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);

    const diffMs = Date.now() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);

    let rel = "just now";
    if (diffMonth >= 1)
      rel = diffMonth === 1 ? "a month ago" : `${diffMonth} months ago`;
    else if (diffDay >= 1)
      rel = diffDay === 1 ? "yesterday" : `${diffDay} days ago`;
    else if (diffHour >= 1) rel = `${diffHour}h ago`;
    else if (diffMin >= 1) rel = `${diffMin}m ago`;

    return `${time} (${rel})`;
  } catch {
    return utc;
  }
};

export function RaceControl() {
  const { payload } = useF1Live();
  const [showBlue, setShowBlue] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => {
    return (payload?.raceControlMessages ?? [])
      .map((msg) => ({
        ...msg,
        effectiveCat: getCategory(msg.category, msg.message),
      }))
      .filter((msg) => showBlue || msg.effectiveCat !== "BlueFlag");
  }, [payload?.raceControlMessages, showBlue]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [messages.length]);

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <h2 className="text-primary text-sm font-medium">Race Control</h2>
        <button
          onClick={() => setShowBlue(!showBlue)}
          className={`flex items-center gap-1.5 rounded px-2 py-1 text-[10px] transition-colors ${
            showBlue
              ? "bg-blue-800/30 text-blue-400"
              : "bg-white/5 text-white/40"
          }`}
        >
          <Flag className="h-3 w-3" /> {showBlue ? "Hide" : "Show"} Blue Flags
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2">
        {messages.map((msg) => {
          const { icon: Icon, color } =
            ICON_CONFIG[msg.effectiveCat] ?? ICON_CONFIG.Other!;
          return (
            <div key={msg.id} className="relative flex">
              <div className="mr-3 flex flex-col items-center">
                <div className="flex h-6 w-6 items-center justify-center">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="my-2 min-h-4 w-px flex-1 bg-white/20" />
              </div>
              <div className="flex-1 pb-2">
                <div className="mb-2 flex h-6 items-center gap-2 text-[10px] text-white/50">
                  <div className="flex items-center gap-1.5 font-mono tracking-wide">
                    <Clock className="h-3 w-3 text-white/30" />{" "}
                    {formatTime(msg.utc)}
                  </div>
                  <span className="ml-auto opacity-60">Lap {msg.lap}</span>
                </div>
                <div className="w-full rounded-sm bg-[#21212D] p-2 text-[12px] leading-relaxed font-normal text-white/90 uppercase">
                  {msg.message}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
