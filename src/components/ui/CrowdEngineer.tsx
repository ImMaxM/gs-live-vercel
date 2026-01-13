"use client";

export function CrowdEngineer() {
  return (
    <div className="bg-background relative flex h-65 flex-col border-b border-white/10">
      <div className="flex items-center justify-between px-4 py-2">
        <h2 className="text-primary text-sm font-medium">
          GridScout Crowd Engineer
        </h2>
        <span className="text-primary text-sm font-medium">Your points: 0</span>
      </div>

      {/* Horizontal line */}
      <div className="bg-border h-px w-full" />

      <div className="flex flex-1 items-center justify-center">
        <span className="text-primary text-xl font-medium">Coming Soon</span>
      </div>
    </div>
  );
}
