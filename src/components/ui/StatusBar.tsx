"use client";

import { useF1Live } from "~/components/providers/F1LiveProvider";

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; defaultMessage: string }
> = {
  green: {
    bg: "bg-green-flag",
    text: "text-white",
    defaultMessage: "TRACK CLEAR — NO CURRENT OBSTRUCTIONS",
  },
  yellow: {
    bg: "bg-yellow-500",
    text: "text-black",
    defaultMessage: "YELLOW FLAG — CAUTION",
  },
  red: {
    bg: "bg-red-600",
    text: "text-white",
    defaultMessage: "RED FLAG — SESSION STOPPED",
  },
  sc: {
    bg: "bg-amber-500",
    text: "text-black",
    defaultMessage: "SAFETY CAR DEPLOYED",
  },
  vsc: {
    bg: "bg-amber-400",
    text: "text-black",
    defaultMessage: "VIRTUAL SAFETY CAR",
  },
};

export function StatusBar() {
  const { payload } = useF1Live();

  const flagStatus = payload?.trackStatus?.flagStatus ?? "green";
  const message = payload?.trackStatus?.message;

  const style = STATUS_STYLES[flagStatus] ?? STATUS_STYLES.green!;
  const displayMessage = message ?? style.defaultMessage;

  return (
    <div
      className={`${style.bg} ${style.text} fixed top-14 right-0 left-0 z-40 flex h-6 w-full items-center justify-center px-4 py-1 text-xs font-normal tracking-wider uppercase transition-colors duration-300`}
    >
      <span>{displayMessage}</span>
    </div>
  );
}
