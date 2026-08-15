import { NextResponse } from "next/server";
import { createOAuthHandoff } from "@/lib/notion-oauth-handoff";
import { resolveUserKey } from "@/lib/notion-oauth-start";

export async function POST() {
  try {
    const userKey = await resolveUserKey();
    const handoffId = await createOAuthHandoff(userKey);

    return NextResponse.json(
      { handoffId },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to create handoff" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
