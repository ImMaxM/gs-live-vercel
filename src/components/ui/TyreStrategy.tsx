"use client";

import { useState } from "react";
import Image from "next/image";
import type { DriverTelemetry } from "../../../payload";

const TYRE_COLORS: Record<string, string> = {
  soft: "#C23A23",
  medium: "#EEC618",
  hard: "#ffffff",
  intermediate: "#3FA654",
  wet: "#3b82f6",
};

const TYRE_LABELS: Record<string, string> = {
  soft: "S",
  medium: "M",
  hard: "H",
  intermediate: "I",
  wet: "W",
};

export function TyreStrategy({ driver }: { driver: DriverTelemetry }) {
  const [hoveredStintIndex, setHoveredStintIndex] = useState<number | null>(
    null,
  );
  const [showAbove, setShowAbove] = useState(false);

  if (!driver.currentTyre) return null;

  const historyLaps =
    driver.tyreHistory?.reduce((acc, stint) => acc + stint.laps, 0) || 0;
  const totalLaps = historyLaps + driver.currentTyre.ageLaps;

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setShowAbove(spaceBelow < 250);
    setHoveredStintIndex(0);
  };

  return (
    <div className="flex h-full w-full items-center px-2 pr-4">
      {/* Left: Current Tyre Info */}
      <div className="flex min-w-20 items-center gap-2">
        <div className="relative h-5.75 w-5.75 shrink-0">
          <Image
            src={`/assets/tyres/${driver.currentTyre.compound}.svg`}
            alt={driver.currentTyre.compound}
            fill
            className="object-contain"
          />
        </div>
        <div className="flex flex-col text-xs leading-none">
          <span className="text-primary font-medium">
            {driver.currentTyre.ageLaps} Laps
          </span>
          <span className="text-secondary font-light">
            {driver.pitStopCount} Pit{driver.pitStopCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Right: History Bar */}
      <div
        className="relative flex flex-1 flex-col gap-1"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHoveredStintIndex(null)}
      >
        {/* Tooltip - Full History Summary - Outside overflow container */}
        {hoveredStintIndex !== null && (
          <div
            className={`border-border bg-sidebar pointer-events-none absolute right-0 z-50 w-90 rounded-xl border p-3 shadow-2xl ${
              showAbove ? "bottom-full mb-2" : "top-6"
            }`}
          >
            <h4 className="text-primary mb-2 text-xs font-semibold tracking-wider uppercase">
              Tyre History
            </h4>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-secondary border-b border-white/10 text-[10px] uppercase">
                  <th className="pb-1.5 pl-1 font-medium">Stint</th>
                  <th className="pb-1.5 font-medium">Compound</th>
                  <th className="pb-1.5 text-center font-medium">Laps</th>
                  <th className="pr-1 pb-1.5 text-right font-medium">Wear</th>
                </tr>
              </thead>
              <tbody className="text-[11px]">
                {driver.tyreHistory?.map((stint, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/5"
                  >
                    <td className="text-secondary py-1.5 pl-1 font-medium">
                      {i + 1}
                    </td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-2">
                        <div className="relative h-3.5 w-3.5">
                          <Image
                            src={`/assets/tyres/${stint.compound}.svg`}
                            alt={stint.compound}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <span className="text-primary capitalize">
                          {stint.compound}
                        </span>
                      </div>
                    </td>
                    <td className="text-primary font-variant-numeric py-1.5 text-center tabular-nums">
                      {stint.laps}
                    </td>
                    <td className="py-1.5 pr-1 text-right">
                      <span
                        className={`${stint.wear === "u" ? "text-yellow-500" : "text-green-500"} font-medium`}
                      >
                        {stint.wear === "u" ? "Used" : "New"}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Current Stint */}
                <tr className="border-t border-white/10 bg-white/5">
                  <td className="text-secondary py-1.5 pl-1 font-medium">
                    Curr
                  </td>
                  <td className="py-1.5">
                    <div className="flex items-center gap-2">
                      <div className="relative h-3.5 w-3.5">
                        <Image
                          src={`/assets/tyres/${driver.currentTyre.compound}.svg`}
                          alt={driver.currentTyre.compound}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="text-primary capitalize">
                        {driver.currentTyre.compound}
                      </span>
                    </div>
                  </td>
                  <td className="text-primary font-variant-numeric py-1.5 text-center font-bold tabular-nums">
                    {driver.currentTyre.ageLaps}
                  </td>
                  <td className="py-1.5 pr-1 text-right">
                    <span
                      className={`${driver.currentTyre.wear === "u" ? "text-yellow-500" : "text-green-500"} font-medium`}
                    >
                      {driver.currentTyre.wear === "u" ? "Used" : "New"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Bars Container */}
        <div className="flex h-1.25 w-full gap-0.5 overflow-hidden rounded-full bg-white/5">
          {driver.tyreHistory?.map((stint, i) => (
            <div
              key={i}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${(stint.laps / totalLaps) * 100}%`,
                backgroundColor: TYRE_COLORS[stint.compound],
              }}
            />
          ))}
          {/* Current Stint (Projected/Current) */}
          <div
            className="h-full rounded-r-full"
            style={{
              width: `${(driver.currentTyre.ageLaps / totalLaps) * 100}%`,
              backgroundColor: TYRE_COLORS[driver.currentTyre.compound],
            }}
          />
        </div>

        {/* Labels under bars */}
        <div className="flex w-full gap-0.5 text-[10px] leading-none font-semibold uppercase">
          {driver.tyreHistory?.map((stint, i) => (
            <div
              key={i}
              className="truncate"
              style={{
                width: `${(stint.laps / totalLaps) * 100}%`,
                color: TYRE_COLORS[stint.compound],
              }}
            >
              {TYRE_LABELS[stint.compound]} ({stint.laps}L)
            </div>
          ))}
          <div
            className="truncate"
            style={{
              width: `${(driver.currentTyre.ageLaps / totalLaps) * 100}%`,
              color: TYRE_COLORS[driver.currentTyre.compound],
            }}
          >
            {TYRE_LABELS[driver.currentTyre.compound]} (
            {driver.currentTyre.ageLaps}L)
          </div>
        </div>
      </div>
    </div>
  );
}
