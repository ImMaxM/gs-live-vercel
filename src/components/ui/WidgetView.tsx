"use client";

import { useF1Live } from "~/components/providers/F1LiveProvider";
import { DriverImage } from "~/components/ui/DriverImage";
import type { DriverTelemetry } from "../../../payload";
import Image from "next/image";
import { motion } from "framer-motion";

import logo from "../../../public/assets/logo.png";

// CSS Grid template for consistent column alignment (matching TimingsTable pattern)
const GRID_TEMPLATE = "grid-cols-[32px_125px_80px_80px]";

// Exact copy from TimingsTable
function PositionChange({ change }: { change: number }) {
  if (change === 0) {
    return (
      <div className="flex items-center gap-2">
        <svg
          width="8"
          height="1"
          viewBox="0 0 8 1"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line y1="0.5" x2="8" y2="0.5" stroke="#9A9A9A" />
        </svg>

        <span className="text-primary w-3 text-center text-sm tabular-nums">
          0
        </span>
      </div>
    );
  }

  if (change > 0) {
    return (
      <span className="text-primary flex items-center gap-1.5">
        <svg
          width="9"
          height="5"
          viewBox="0 0 9 5"
          className="text-success"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.30005 3.625L4.30005 0.625L0.300049 3.625"
            stroke="#009966"
            strokeMiterlimit="10"
          />
        </svg>
        <span className="w-3 text-center text-sm tabular-nums">{change}</span>
      </span>
    );
  }

  return (
    <span className="text-primary flex items-center gap-1.5">
      <svg
        width="9"
        height="5"
        viewBox="0 0 9 5"
        className="text-fire"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0.300049 0.399902L4.30005 3.3999L8.30005 0.399902"
          stroke="#D91F1F"
          strokeMiterlimit="10"
        />
      </svg>
      <span className="w-3 text-center text-sm tabular-nums">
        {Math.abs(change)}
      </span>
    </span>
  );
}

function DriverRow({ driver }: { driver: DriverTelemetry }) {
  return (
    <div
      className={`grid ${GRID_TEMPLATE} flex-1 items-center overflow-hidden`}
    >
      {/* Position */}
      <div className="text-md flex h-full items-center justify-center font-semibold text-white">
        {driver.position}
      </div>

      {/* Driver */}
      <div className="border-border flex h-full items-center justify-between border-l px-3">
        <div className="flex items-center gap-2">
          <DriverImage
            uuid={driver.uuid ?? ""}
            tla={driver.tla}
            teamId={driver.teamId}
            size={20}
            className="rounded-full"
          />
          <span className="text-sm font-semibold text-white">{driver.tla}</span>
        </div>
        <PositionChange change={driver.positionChange} />
      </div>

      {/* Gap */}
      <div className="border-border flex h-full items-center justify-center border-l px-2 text-center text-xs text-white">
        {driver.position === 1 ? "LEADER" : driver.gap || "+0.000"}
      </div>

      {/* Interval */}
      <div className="border-border flex h-full items-center justify-center border-l px-2 text-center text-xs text-white">
        {driver.position === 1 ? "—" : driver.interval || "+0.000"}
      </div>
    </div>
  );
}

export function WidgetView() {
  const { payload } = useF1Live();
  const drivers: DriverTelemetry[] = payload?.drivers ?? [];
  const topDrivers = [...drivers]
    .sort((a, b) => a.position - b.position)
    .slice(0, 3);

  // Lap progress
  const currentLap = payload?.session.lap ?? 0;
  const totalLaps = payload?.session.lapTotal ?? 1;
  const progressPercent = totalLaps > 0 ? (currentLap / totalLaps) * 100 : 0;

  // Track Status
  const flagStatus = payload?.flagStatus ?? "green";

  // Status bar styles based on flag
  const statusStyles: Record<
    string,
    { bg: string; text: string; message: string }
  > = {
    green: {
      bg: "bg-green-flag",
      text: "text-white",
      message: "TRACK CLEAR — NO CURRENT OBSTRUCTIONS",
    },
    yellow: {
      bg: "bg-yellow-500",
      text: "text-black",
      message: "YELLOW FLAG — CAUTION",
    },
    red: {
      bg: "bg-red-600",
      text: "text-white",
      message: "RED FLAG — SESSION STOPPED",
    },
    sc: {
      bg: "bg-amber-500",
      text: "text-black",
      message: "SAFETY CAR DEPLOYED",
    },
    vsc: {
      bg: "bg-amber-400",
      text: "text-black",
      message: "VIRTUAL SAFETY CAR",
    },
  };
  const statusStyle = statusStyles[flagStatus] ?? statusStyles.green!;
  const trackStatus = statusStyle.message;

  return (
    <div className="bg-background flex h-screen w-screen flex-col overflow-hidden text-white">
      {/* Header Badge */}
      <div className="flex items-center gap-2 p-1.5">
        <Image
          src={logo}
          alt="GridScout Logo"
          width={32}
          height={32}
          className="h-7 w-7 rounded"
        />

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-primary text-sm font-semibold tracking-wide">
              GRIDSCOUT
            </span>
            <span className="border-fire bg-fire/50 text-primary rounded-full border px-1 py-0.5 text-[9px] leading-none font-bold uppercase">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div
        className={`${statusStyle.bg} ${statusStyle.text} px-2 py-1 text-center text-[10px] font-medium tracking-wide whitespace-nowrap uppercase transition-colors duration-300`}
      >
        {trackStatus}
      </div>

      {/* Table Header */}
      <div
        className={`grid ${GRID_TEMPLATE} text-header h-6 items-center text-[10px] tracking-wider uppercase`}
      >
        <div className="flex h-full items-center justify-center font-medium"></div>
        <div className="border-border flex h-full items-center justify-center border-l px-2 font-medium">
          Driver
        </div>
        <div className="border-border flex h-full items-center justify-center border-l px-2 font-medium">
          Gap
        </div>
        <div className="border-border flex h-full items-center justify-center border-l px-2 font-medium">
          Interval
        </div>
      </div>

      {/* Rows */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {topDrivers.map((d) => (
          <DriverRow key={d.uuid} driver={d} />
        ))}
      </div>

      {/* Footer Progress */}
      <div className="relative h-1.5 w-full bg-[#333]">
        <motion.div
          className="bg-fire absolute top-0 left-0 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
