"use client";

import { CrowdEngineer } from "./CrowdEngineer";
import { RaceControl } from "./RaceControl";

export function RightPanel() {
  return (
    <div className="bg-background border-border flex h-full flex-col border-l">
      {/* Top: Crowd Engineer */}
      <CrowdEngineer />

      {/* Bottom: Race Control */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <RaceControl />
      </div>
    </div>
  );
}
