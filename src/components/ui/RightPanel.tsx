"use client";

import { CrowdEngineer } from "./CrowdEngineer";
import { RaceControl } from "./RaceControl";

export function RightPanel() {
  return (
    <div className="bg-background border-border flex h-full flex-col border lg:border-y-0 lg:border-r-0">
      {/* Top: Crowd Engineer */}
      <CrowdEngineer />

      {/* Bottom: Race Control */}
      <div className="flex max-h-[65vh] flex-1 flex-col overflow-hidden lg:max-h-none">
        <RaceControl />
      </div>
    </div>
  );
}
