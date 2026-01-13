import { cookies } from "next/headers";
import { NextResponse } from "next/server";

interface AuthData {
  access_token: string;
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    global_name: string | null;
    public_flags: number;
  };
  expires: number;
}

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("discord_auth");

  if (!authCookie) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const authData = JSON.parse(authCookie.value) as AuthData;

    // check if token is expired
    if (Date.now() > authData.expires) {
      // clear expired cookie
      cookieStore.delete("discord_auth");
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      user: authData.user,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("discord_auth");
  return NextResponse.json({ success: true });
}
