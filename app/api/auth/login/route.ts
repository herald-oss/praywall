import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Look up the user by username to get the fake email
    const users = await db
      .select({ id: user.id, username: user.username, name: user.name })
      .from(user)
      .where(eq(user.username, username.toLowerCase()))
      .limit(1);

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const fakeEmail = `${username.toLowerCase()}@praywall.local`;
    const headersList = await headers();

    const result = await auth.api.signInEmail({
      body: {
        email: fakeEmail,
        password,
      },
      headers: headersList,
    });

    if (!result?.user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: result.user.id,
        username: users[0].username,
        name: users[0].name,
      },
      token: result.token,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 }
    );
  }
}
