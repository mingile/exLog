import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getNotionSyncErrorStatusCode } from "@/lib/notion/errors";
import { writeNotionSets } from "@/lib/notion/writeSets";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const user_key = cookieStore.get("user_key")?.value;
  const body = await req.json();

  if (!user_key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saved_at = body.saved_at;
  const exercises = body.exercises;
  const sessionPageId = body.sessionPageId;

  try {
    const result = await writeNotionSets({
      userKey: user_key,
      savedAt: saved_at,
      exercises,
      sessionPageId,
    });

    return NextResponse.json(result);
  } catch (error) {
    const statusCode = getNotionSyncErrorStatusCode(error);
    if (statusCode !== undefined) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Notion write failed",
        },
        { status: statusCode },
      );
    }

    console.error("Notion write failed", error);
    return NextResponse.json({ error: "Notion write failed" }, { status: 500 });
  }
}
