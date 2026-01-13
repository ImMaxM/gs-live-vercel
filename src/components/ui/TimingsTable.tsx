"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useF1Live } from "~/components/providers/F1LiveProvider";
import { useSettings } from "~/components/providers/SettingsProvider";
import { PitIndicator } from "~/components/ui/PitIndicator";
import { TyreStrategy } from "~/components/ui/TyreStrategy";
import { DriverImage } from "~/components/ui/DriverImage";
import type { DriverTelemetry } from "../../../payload";

// CSS Grid template for consistent column alignment across all rows
// Columns: Position | Driver | Gap | Interval | LastLap | FastestLap | AvgSpeed | Pit | Tyres
const GRID_TEMPLATE =
  "grid-cols-[50px_minmax(155px,1fr)_minmax(85px,1fr)_minmax(85px,1fr)_minmax(85px,1fr)_minmax(85px,1fr)_minmax(95px,1fr)_70px_minmax(410px,3fr)]";

const COLUMN_WIDTHS = {
  position: "",
  driver: "",
  gap: "",
  interval: "",
  lastLap: "",
  fastestLap: "",
  avgSpeed: "",
  pit: "",
  tyres: "",
} as const;

function FlashText({
  value,
  color, // Inherit text color by default
  highlightColor = "#ffffff", // Default white flash
}: {
  value: string | number;
  color?: string;
  highlightColor?: string;
}) {
  return (
    <motion.span
      key={String(value)}
      initial={{
        color: highlightColor,
        textShadow: `0 0 10px ${highlightColor}`,
      }}
      animate={{ color: color, textShadow: "0 0 0px transparent" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {value}
    </motion.span>
  );
}

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

function DriverRow({
  driver,
  overallFastestTimeMs,
  speedUnit,
}: {
  driver: DriverTelemetry;
  overallFastestTimeMs: number | null;
  speedUnit: string;
}) {
  const isOverallFastest =
    driver.bestLapTimeMs !== undefined &&
    overallFastestTimeMs !== null &&
    driver.bestLapTimeMs === overallFastestTimeMs;

  const isPersonalBest =
    driver.lastLapTimeMs !== undefined &&
    driver.bestLapTimeMs !== undefined &&
    driver.lastLapTimeMs === driver.bestLapTimeMs &&
    driver.lastLapTimeMs > 0;

  return (
    <motion.div
      layout
      layoutId={driver.uuid}
      initial={false}
      transition={{
        layout: {
          type: "spring",
          stiffness: 400,
          damping: 40,
        },
      }}
      className={`grid ${GRID_TEMPLATE} h-10 items-center hover:bg-white/5`}
    >
      {/* Position */}
      <div
        className={`${COLUMN_WIDTHS.position} text-primary flex items-center justify-center self-stretch text-center text-lg font-semibold`}
      >
        {driver.position}
      </div>

      {/* Driver */}
      <div
        className={`${COLUMN_WIDTHS.driver} border-border flex items-center justify-between self-stretch border-l px-3`}
      >
        <div className="flex items-center gap-2">
          <DriverImage
            uuid={driver.uuid}
            tla={driver.tla}
            teamId={driver.teamId}
            size={24}
            className="rounded-full"
          />
          <span className="text-primary font-medium tracking-wide">
            {driver.tla}
          </span>
        </div>
        <PositionChange change={driver.positionChange} />
      </div>

      {/* Gap */}
      <div
        className={`${COLUMN_WIDTHS.gap} text-primary border-border flex items-center justify-center self-stretch border-l px-3 text-sm font-normal`}
      >
        {driver.gap || "—"}
      </div>

      {/* Interval */}
      <div
        className={`${COLUMN_WIDTHS.interval} text-primary border-border flex items-center justify-center self-stretch border-l px-3 text-sm font-normal`}
      >
        {driver.interval || "—"}
      </div>

      {/* Last Lap */}
      <div
        className={`${COLUMN_WIDTHS.lastLap} border-border flex items-center justify-center self-stretch border-l px-3 text-sm font-normal ${
          isPersonalBest ? "text-green-500" : "text-primary"
        }`}
      >
        <FlashText
          value={driver.lastLapTime || "—"}
          color={isPersonalBest ? "#22c55e" : undefined} // Green if PB
          highlightColor="#ffffff"
        />
      </div>

      {/* Fastest Lap */}
      <div
        className={`${COLUMN_WIDTHS.fastestLap} border-border flex items-center justify-center self-stretch border-l px-3 text-sm font-normal ${
          isOverallFastest ? "text-fuchsia-500" : "text-primary"
        }`}
      >
        <FlashText
          value={driver.bestLapTime || "—"}
          color={isOverallFastest ? "#d946ef" : undefined} // Purple if Overall Best (fuchsia-500)
          highlightColor={isOverallFastest ? "#d946ef" : "#ffffff"} // Flash purple if best, else white
        />
      </div>

      {/* Avg Speed */}
      <div
        className={`${COLUMN_WIDTHS.avgSpeed} text-primary border-border flex items-center justify-center self-stretch border-l px-3 text-sm font-normal`}
      >
        {driver.averageSpeedMph > 0 ? (
          <div className="flex items-baseline gap-1">
            <span>
              {speedUnit === "kph"
                ? (driver.averageSpeedMph * 1.60934).toFixed(3)
                : driver.averageSpeedMph.toFixed(3)}
            </span>
            <span className="text-primary text-[10px]">{speedUnit}</span>
          </div>
        ) : (
          "—"
        )}
      </div>

      {/* Pit */}
      <div
        className={`${COLUMN_WIDTHS.pit} border-border flex items-center justify-center self-stretch border-l px-3`}
      >
        <PitIndicator inPit={driver.pitStatus === "in_pit"} />
      </div>

      {/* Tyres */}
      <div
        className={`${COLUMN_WIDTHS.tyres} text-primary border-border flex items-center justify-center self-stretch border-l px-3 text-xs font-normal`}
      >
        <TyreStrategy driver={driver} />
      </div>
    </motion.div>
  );
}

export function TimingsTable() {
  const { payload } = useF1Live();
  const { speedUnit } = useSettings();
  const drivers: DriverTelemetry[] = payload?.drivers ?? [];

  if (drivers.length < 1) {
    // Skeleton loading state for better LCP
    return (
      <div className="w-full">
        <div className="relative flex w-full">
          <div className="relative flex-1">
            <div className="flex flex-col">
              {/* Top spacer with lines */}
              <div className={`grid ${GRID_TEMPLATE} h-2`}>
                <div className={`${COLUMN_WIDTHS.position} h-full`} />
                <div
                  className={`${COLUMN_WIDTHS.driver} border-border h-full border-l`}
                />
                <div
                  className={`${COLUMN_WIDTHS.gap} border-border h-full border-l`}
                />
                <div
                  className={`${COLUMN_WIDTHS.interval} border-border h-full border-l`}
                />
                <div
                  className={`${COLUMN_WIDTHS.lastLap} border-border h-full border-l`}
                />
                <div
                  className={`${COLUMN_WIDTHS.fastestLap} border-border h-full border-l`}
                />
                <div
                  className={`${COLUMN_WIDTHS.avgSpeed} border-border h-full border-l`}
                />
                <div
                  className={`${COLUMN_WIDTHS.pit} border-border h-full border-l`}
                />
                <div
                  className={`${COLUMN_WIDTHS.tyres} border-border h-full border-l`}
                />
              </div>

              {/* Skeleton Header */}
              <div
                className={`grid ${GRID_TEMPLATE} text-header h-6 items-center text-center text-[10px] tracking-wider uppercase`}
              >
                <div
                  className={`${COLUMN_WIDTHS.position} flex h-full items-center justify-center font-medium`}
                />
                <div
                  className={`${COLUMN_WIDTHS.driver} border-border flex h-full items-center justify-center border-l px-3 font-medium`}
                >
                  Driver
                </div>
                <div
                  className={`${COLUMN_WIDTHS.gap} border-border flex h-full items-center justify-center border-l font-medium`}
                >
                  Gap
                </div>
                <div
                  className={`${COLUMN_WIDTHS.interval} border-border flex h-full items-center justify-center border-l font-medium`}
                >
                  Interval
                </div>
                <div
                  className={`${COLUMN_WIDTHS.lastLap} border-border flex h-full items-center justify-center border-l font-medium`}
                >
                  Last Lap
                </div>
                <div
                  className={`${COLUMN_WIDTHS.fastestLap} border-border flex h-full items-center justify-center border-l font-medium`}
                >
                  Fastest Lap
                </div>
                <div
                  className={`${COLUMN_WIDTHS.avgSpeed} border-border flex h-full items-center justify-center border-l font-medium`}
                >
                  Avg Speed
                </div>
                <div
                  className={`${COLUMN_WIDTHS.pit} border-border flex h-full items-center justify-center border-l font-medium`}
                >
                  Pit
                </div>
                <div
                  className={`${COLUMN_WIDTHS.tyres} border-border flex h-full items-center justify-center border-l font-medium`}
                >
                  Tyres
                </div>
              </div>

              {/* Skeleton Rows */}
              {Array.from({ length: 22 }).map((_, i) => (
                <div
                  key={i}
                  className={`grid ${GRID_TEMPLATE} h-10 items-center`}
                >
                  {/* Position */}
                  <div className="flex items-center justify-center self-stretch">
                    <div className="h-5 w-6 animate-pulse rounded bg-[#333]" />
                  </div>

                  {/* Driver */}
                  <div className="border-border flex items-center justify-between self-stretch border-l px-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 animate-pulse rounded-full bg-[#333]" />
                      <div className="h-4 w-10 animate-pulse rounded bg-[#333]" />
                    </div>
                    <div className="h-3 w-6 animate-pulse rounded bg-[#333]" />
                  </div>

                  {/* Gap */}
                  <div className="border-border flex items-center justify-center self-stretch border-l px-3">
                    <div className="h-4 w-12 animate-pulse rounded bg-[#333]" />
                  </div>

                  {/* Interval */}
                  <div className="border-border flex items-center justify-center self-stretch border-l px-3">
                    <div className="h-4 w-10 animate-pulse rounded bg-[#333]" />
                  </div>

                  {/* Last Lap */}
                  <div className="border-border flex items-center justify-center self-stretch border-l px-3">
                    <div className="h-4 w-14 animate-pulse rounded bg-[#333]" />
                  </div>

                  {/* Fastest Lap */}
                  <div className="border-border flex items-center justify-center self-stretch border-l px-3">
                    <div className="h-4 w-14 animate-pulse rounded bg-[#333]" />
                  </div>

                  {/* Avg Speed */}
                  <div className="border-border flex items-center justify-center self-stretch border-l px-3">
                    <div className="h-4 w-16 animate-pulse rounded bg-[#333]" />
                  </div>

                  {/* Pit */}
                  <div className="border-border flex items-center justify-center self-stretch border-l px-3">
                    <div className="h-4 w-6 animate-pulse rounded bg-[#333]" />
                  </div>

                  {/* Tyres */}
                  <div className="border-border flex items-center justify-center gap-2 self-stretch border-l px-3">
                    <div className="h-5 w-5 animate-pulse rounded bg-[#333]" />
                    <div className="h-5 w-10 animate-pulse rounded bg-[#333]" />
                    <div className="h-2 w-80 animate-pulse rounded-full bg-[#333]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sortedDrivers = [...drivers].sort((a, b) => a.position - b.position);

  // Calculate overall fastest lap time
  const validBestTimes = drivers
    .map((d) => d.bestLapTimeMs)
    .filter((t): t is number => t !== undefined && t > 0);
  const overallFastestTimeMs =
    validBestTimes.length > 0 ? Math.min(...validBestTimes) : null;

  return (
    <div className="w-full">
      <div className="relative flex w-full">
        {/* Content */}
        <div className="relative flex-1">
          <div className="flex flex-col">
            {/* Top spacer with lines */}
            <div
              className={`grid ${GRID_TEMPLATE} bg-background sticky top-0 z-10 h-2`}
            >
              <div className={`${COLUMN_WIDTHS.position} h-full`} />
              <div
                className={`${COLUMN_WIDTHS.driver} border-border h-full border-l`}
              />
              <div
                className={`${COLUMN_WIDTHS.gap} border-border h-full border-l`}
              />
              <div
                className={`${COLUMN_WIDTHS.interval} border-border h-full border-l`}
              />
              <div
                className={`${COLUMN_WIDTHS.lastLap} border-border h-full border-l`}
              />
              <div
                className={`${COLUMN_WIDTHS.fastestLap} border-border h-full border-l`}
              />
              <div
                className={`${COLUMN_WIDTHS.avgSpeed} border-border h-full border-l`}
              />
              <div
                className={`${COLUMN_WIDTHS.pit} border-border h-full border-l`}
              />
              <div
                className={`${COLUMN_WIDTHS.tyres} border-border h-full border-l`}
              />
            </div>

            {/* Header */}
            <div
              className={`grid ${GRID_TEMPLATE} bg-background text-header sticky top-2 z-10 h-6 items-center text-center text-[10px] tracking-wider uppercase`}
            >
              <div
                className={`${COLUMN_WIDTHS.position} bg-background flex h-full items-center justify-center font-medium`}
              />
              <div
                className={`${COLUMN_WIDTHS.driver} bg-background border-border flex h-full items-center justify-center border-l px-3 font-medium`}
              >
                Driver
              </div>
              <div
                className={`${COLUMN_WIDTHS.gap} bg-background border-border flex h-full items-center justify-center border-l font-medium`}
              >
                Gap
              </div>
              <div
                className={`${COLUMN_WIDTHS.interval} bg-background border-border flex h-full items-center justify-center border-l font-medium`}
              >
                Interval
              </div>
              <div
                className={`${COLUMN_WIDTHS.lastLap} bg-background border-border flex h-full items-center justify-center border-l font-medium`}
              >
                Last Lap
              </div>
              <div
                className={`${COLUMN_WIDTHS.fastestLap} bg-background border-border flex h-full items-center justify-center border-l font-medium`}
              >
                Fastest Lap
              </div>
              <div
                className={`${COLUMN_WIDTHS.avgSpeed} bg-background border-border flex h-full items-center justify-center border-l font-medium`}
              >
                Avg Speed
              </div>
              <div
                className={`${COLUMN_WIDTHS.pit} bg-background border-border flex h-full items-center justify-center border-l font-medium`}
              >
                Pit
              </div>
              <div
                className={`${COLUMN_WIDTHS.tyres} bg-background border-border flex h-full items-center justify-center border-l font-medium`}
              >
                Tyres
              </div>
            </div>

            {/* Rows */}
            <AnimatePresence mode="popLayout">
              {sortedDrivers.map((driver) => (
                <DriverRow
                  key={driver.uuid}
                  driver={driver}
                  overallFastestTimeMs={overallFastestTimeMs}
                  speedUnit={speedUnit}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
