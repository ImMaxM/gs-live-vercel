"use client";

import { useEffect, useState } from "react";
import type { CommandResponse } from "@discord/embedded-app-sdk";
import { TyreLoader } from "../ui/TyreLoader";
import * as Sentry from "@sentry/nextjs";
import {
  discordSdk,
  isEmbedded as checkIsEmbedded,
} from "~/lib/discord/client";

// for development, react strict mode causes issues
let isAuthInProgress = false;
let cachedAuth: CommandResponse<"authenticate"> | null = null;

export type Auth = CommandResponse<"authenticate">;

// web auth structure (from cookie session)
interface WebAuthResponse {
  authenticated: boolean;
  user?: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    global_name: string | null;
    public_flags: number;
  };
  access_token?: string;
}

interface DiscordActivityProps {
  children: (props: {
    auth: Auth | null;
    isLoading: boolean;
    isEmbedded: boolean;
    signOut: () => Promise<void>;
  }) => React.ReactNode;
}

interface TokenResponse {
  access_token: string;
}

export function DiscordActivity({ children }: DiscordActivityProps) {
  const [auth, setAuth] = useState<Auth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signOut = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    setAuth(null);
    Sentry.setUser(null); // Clear Sentry user context
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    async function setupDiscordSdk() {
      try {
        // Set a timeout to prevent infinite loading (30 seconds)
        timeoutId = setTimeout(() => {
          setError("Connection timeout - please reload");
          setIsLoading(false);
        }, 30000);

        // Check if we're embedded in Discord
        const embedded = checkIsEmbedded;
        setIsEmbedded(embedded);

        if (!embedded) {
          // check for web based auth since they are not in discord
          const webAuthResponse = await fetch("/api/auth/me");
          const webAuth = (await webAuthResponse.json()) as WebAuthResponse;

          if (webAuth.authenticated && webAuth.user) {
            setAuth({
              access_token: "", // stored in httponly cookie
              user: {
                id: webAuth.user.id,
                username: webAuth.user.username,
                discriminator: webAuth.user.discriminator,
                avatar: webAuth.user.avatar,
                global_name: webAuth.user.global_name,
                public_flags: webAuth.user.public_flags,
              },
              scopes: ["identify"],
              expires: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
              ).toString(),
              application: {
                id: process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID ?? "",
                name: "GridScout Live",
                icon: null,
                description: "GridScout Live",
              },
            });

            // Set Sentry user context
            Sentry.setUser({
              id: webAuth.user.id,
              username: webAuth.user.username,
            });
          } else {
            // pass
          }

          clearTimeout(timeoutId);
          setIsLoading(false);
          return;
        }

        // Check if we already have cached auth from a previous mount
        if (cachedAuth) {
          setAuth(cachedAuth);
          Sentry.setUser({
            id: cachedAuth.user.id,
            username: cachedAuth.user.username,
          });
          clearTimeout(timeoutId);
          setIsLoading(false);
          return;
        }

        // Prevent duplicate auth attempts (React Strict Mode / hot reload)
        if (isAuthInProgress) {
          clearTimeout(timeoutId);
          return;
        }
        isAuthInProgress = true;

        // Wait for Discord SDK to be ready
        await discordSdk.ready();

        const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
        if (!clientId) {
          throw new Error("NEXT_PUBLIC_DISCORD_CLIENT_ID is not defined");
        }

        // Authorise with Discord Client
        const { code } = await discordSdk.commands.authorize({
          client_id: clientId,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify"],
        });

        // Exchange code for access token via API
        const response = await fetch("/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Token exchange failed:", errorText);
          throw new Error("Failed to get access token");
        }

        const tokenData = (await response.json()) as TokenResponse;

        // Authenticate with Discord client
        const authResult = await discordSdk.commands.authenticate({
          access_token: tokenData.access_token,
        });

        if (!authResult) {
          throw new Error("Authentication failed");
        }

        // Cache the auth result for subsequent mounts
        cachedAuth = authResult;
        setAuth(authResult);

        // Set Sentry user context
        Sentry.setUser({
          id: authResult.user.id,
          username: authResult.user.username,
        });

        clearTimeout(timeoutId);
      } catch (err) {
        console.error("Setup error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        clearTimeout(timeoutId);
      } finally {
        setIsLoading(false);
        // setIsLoading(true);
      }
    }

    void setupDiscordSdk();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (error && isEmbedded) {
    // Only show error screen if we're in Discord and auth failed
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">Error</h1>
          <p className="mt-2 text-gray-400">{error}</p>
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-[#5865f2] px-4 py-2 text-sm font-medium transition-colors hover:bg-[#4752c4]"
            >
              Reload
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center text-white">
        <TyreLoader />
      </div>
    );
  }

  // path auth (which may be null for web users), isLoading, and isEmbedded to children
  return <>{children({ auth, isLoading, isEmbedded, signOut })}</>;
}
