"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { TEAM_COLORS } from "~/constants/teams";

interface DriverImageProps {
  uuid: string;
  tla: string;
  teamId: string;
  className?: string;
  size?: number; // pixel size for width/height
}

export function DriverImage({
  uuid,
  tla,
  teamId,
  className = "",
  size = 24, // Default to 24px (h-6 w-6)
}: DriverImageProps) {
  const localUrl = `/assets/drivers/${uuid}.png`;
  const remoteUrl = `https://content.motorsportstats.com/driverProfilePicture/driverProfilePicture-${uuid}.jpg`;

  const [src, setSrc] = useState(localUrl);
  const [hasError, setHasError] = useState(false);
  const teamColor = TEAM_COLORS[teamId] ?? "#666666";

  // Reset state when uuid changes
  useEffect(() => {
    setSrc(localUrl);
    setHasError(false);
  }, [uuid, localUrl]);

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center border ${className}`}
        style={{
          borderColor: teamColor,
          backgroundColor: `${teamColor}40`,
          color: teamColor,
          width: size,
          height: size,
          fontSize: Math.max(8, size / 2.5), // Scale font size roughly
        }}
      >
        {tla.charAt(0)}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden border ${className}`}
      style={{
        borderColor: teamColor,
        backgroundColor: `${teamColor}40`,
        width: size,
        height: size,
      }}
    >
      <Image
        src={src}
        alt={tla}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={() => {
          if (src === localUrl) {
            setSrc(remoteUrl);
          } else {
            setHasError(true);
          }
        }}
      />
    </div>
  );
}
