import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "~/lib/utils/rate-limit";

interface TokenRequest {
  code: string;
}

interface TokenResponse {
  access_token: string;
}

export async function POST(request: Request) {
  // Rate limiting  use stricter token limits
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`token:${clientIp}`, RATE_LIMITS.token);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
        },
      }
    );
  }

  try {
    const body = (await request.json()) as TokenRequest;
    const { code } = body;

    const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Missing Discord credentials" },
        { status: 500 }
      );
    }

    const origin = request.headers.get("origin") ?? request.headers.get("referer")?.replace(/\/$/, "") ?? "";
    const redirectUri = `${origin}/api/token`;

    const response = await fetch("https://discord.com/api/oauth2/token", {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Discord OAuth error:", errorText);
      return NextResponse.json(
        { error: "Failed to exchange code for token" },
        { status: response.status }
      );
    }

    const tokenData = (await response.json()) as TokenResponse;

    return NextResponse.json({ access_token: tokenData.access_token });
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
