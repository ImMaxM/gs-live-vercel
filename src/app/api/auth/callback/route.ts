import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE } from "~/lib/utils/oauth-security";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "~/lib/utils/rate-limit";
import { getOrigin } from "~/lib/utils/url-utils";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name: string | null;
  public_flags: number;
}

export async function GET(request: Request) {
  // rate limits
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`auth:${clientIp}`, RATE_LIMITS.auth);
  
  if (!rateLimit.allowed) {
    // const url = new URL(request.url);
    const origin = getOrigin(request);
    return NextResponse.redirect(new URL("/?error=rate_limited", origin));
  }

  const url = new URL(request.url);
  const origin = getOrigin(request);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const state = url.searchParams.get("state");

  if (error) {
    return NextResponse.redirect(new URL("/?error=auth_denied", origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?error=no_code", origin));
  }

  // Validate CSRF state parameter
  const cookieStore = await cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  // Clear the state cookie regardless of validation result
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!state || !storedState || state !== storedState) {
    console.error("OAuth state mismatch, possible CSRF attack");
    return NextResponse.redirect(new URL("/?error=invalid_state", origin));
  }

  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = `${origin}/api/auth/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL("/?error=server_config", origin)
    );
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return NextResponse.redirect(
        new URL("/?error=token_exchange", url.origin)
      );
    }

    const tokenData = (await tokenResponse.json()) as TokenResponse;

    // fetch user data
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL("/?error=user_fetch", origin));
    }

    const userData = (await userResponse.json()) as DiscordUser;

    // Store auth data in http only cookie
    const authData = {
      access_token: tokenData.access_token,
      user: userData,
      expires: Date.now() + tokenData.expires_in * 1000,
    };

    cookieStore.set("discord_auth", JSON.stringify(authData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokenData.expires_in,
      path: "/",
    });

    return NextResponse.redirect(new URL("/", origin));
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/?error=unknown", origin));
  }
}
