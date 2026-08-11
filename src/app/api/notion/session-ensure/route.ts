import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getNotionSyncErrorStatusCode } from "@/lib/notion/errors";
import { ensureNotionSession } from "@/lib/notion/sessionEnsure";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const user_key = cookieStore.get("user_key")?.value;
  const body = await req.json();

  const { sessionId, sessionName, startedAt } = body;

  if (!user_key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!sessionId || !sessionName || !startedAt) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  try {
    const result = await ensureNotionSession({
      userKey: user_key,
      sessionId,
      sessionName,
      startedAt,
    });

    return NextResponse.json(result);
  } catch (error) {
    const statusCode = getNotionSyncErrorStatusCode(error);
    if (statusCode !== undefined) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Session ensure failed",
        },
        { status: statusCode },
      );
    }

    console.error("Session ensure failed", error);
    return NextResponse.json(
      { error: "Session ensure failed" },
      { status: 500 },
    );
  }
}
