interface PitIndicatorProps {
  inPit: boolean;
}

export function PitIndicator({ inPit }: PitIndicatorProps) {
  if (inPit) {
    return (
      <div className="border-success rounded-sm border-[1.5px] px-1 py-0.5">
        <span className="text-success block text-[10px] leading-none font-semibold uppercase">
          In Pit
        </span>
      </div>
    );
  }

  return (
    <div className="border-secondary rounded-sm border px-1 py-0.5">
      <span className="text-secondary block text-[10px] leading-none font-semibold uppercase">
        In Pit
      </span>
    </div>
  );
}
