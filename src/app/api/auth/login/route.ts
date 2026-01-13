import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateOAuthState, OAUTH_STATE_COOKIE } from "~/lib/utils/oauth-security";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "~/lib/utils/rate-limit";
import { getOrigin } from "~/lib/utils/url-utils";

export async function GET(request: Request) {
  // rate limitings
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`auth:${clientIp}`, RATE_LIMITS.auth);
  
  if (!rateLimit.allowed) {
    return new NextResponse("Too many requests. Please try again later.", {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000)),
      },
    });
  }

  // const url = new URL(request.url);
  const origin = getOrigin(request);
  const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(new URL("/?error=server_config", origin));
  }

  const state = generateOAuthState();

  // Store state in httpOnly cookie for validation on callback
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutesm OAuth flow should complete within this time
    path: "/",
  });

  // Build Discord OAuth URL with state parameter
  const redirectUri = `${origin}/api/auth/callback`;

  const oauthUrl = new URL("https://discord.com/oauth2/authorize");
  oauthUrl.searchParams.set("client_id", clientId);
  oauthUrl.searchParams.set("response_type", "code");
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("scope", "identify");
  oauthUrl.searchParams.set("state", state);

  return NextResponse.redirect(oauthUrl.toString());
}
