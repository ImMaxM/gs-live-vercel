"use client";

import { useSoundNotifications } from "~/hooks/useSoundNotifications";

/**
 * Invisible component that handles sound notifications.
 * Place this component inside F1LiveProvider and SettingsProvider.
 */
export function SoundNotifications() {
  useSoundNotifications();
  return null;
}
