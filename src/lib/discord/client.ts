"use client";

import { DiscordSDK, type DiscordSDKMock } from "@discord/embedded-app-sdk";

let discordSdk: DiscordSDK | DiscordSDKMock;

const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

if (!clientId) {
  throw new Error("NEXT_PUBLIC_DISCORD_CLIENT_ID is not defined");
}

// Check if we're running inside Discord's iframe
const isEmbedded = (() => {
  if (typeof window === "undefined") return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has("frame_id");
})();

if (isEmbedded) {
  discordSdk = new DiscordSDK(clientId);
}

export { discordSdk, isEmbedded };
