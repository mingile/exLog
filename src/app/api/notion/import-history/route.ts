import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildSessionsFromNotion,
  type NotionDatabasePage,
} from "@/lib/notion/buildSessionsFromNotion";
import { getNotionConnection } from "@/lib/notion/connection";

const NOTION_VERSION = "2022-06-28";

type NotionQueryResponse = {
  results?: { id?: string; properties?: Record<string, unknown> }[];
  has_more?: boolean;
  next_cursor?: string;
};

function extractTitle(property: unknown): string | null {
  const title = (property as { title?: { plain_text?: string }[] } | undefined)
    ?.title;
  if (!title?.length) return null;
  const text = title.map((item) => item.plain_text ?? "").join("");
  if (text.trim() === "") return null;
  return text.trim();
}

async function fetchAllNotionDatabasePages(
  accessToken: string,
  databaseId: string,
): Promise<NotionDatabasePage[]> {
  const pages: NotionDatabasePage[] = [];
  let startCursor: string | undefined;

  do {
    const body: Record<string, unknown> = { page_size: 100 };
    if (startCursor) {
      body.start_cursor = startCursor;
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = (await response.json()) as NotionQueryResponse;

    if (!response.ok) {
      console.error("Notion database query failed:", { databaseId, data });
      throw new Error("Failed to query Notion database");
    }

    for (const page of data.results ?? []) {
      if (!page.id || !page.properties) continue;
      pages.push({
        id: page.id,
        properties: page.properties,
      });
    }

    startCursor = data.has_more ? data.next_cursor : undefined;
  } while (startCursor);

  return pages;
}

function buildExerciseNameByPageId(
  exercisePages: NotionDatabasePage[],
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const page of exercisePages) {
    const name = extractTitle(page.properties["이름"]);
    if (name) {
      map[page.id] = name;
    }
  }

  return map;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userKey = cookieStore.get("user_key")?.value;

    if (!userKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await getNotionConnection(userKey);
    const { accessToken, workoutSetsDbId, workoutSessionDbId, workoutExerciseDbId } =
      connection;

    if (!workoutSetsDbId) {
      return NextResponse.json(
        { error: "No Workout Sets database connected" },
        { status: 404 },
      );
    }

    if (!workoutSessionDbId) {
      return NextResponse.json(
        { error: "No Session database connected" },
        { status: 404 },
      );
    }

    const [setPages, sessionPages] = await Promise.all([
      fetchAllNotionDatabasePages(accessToken, workoutSetsDbId),
      fetchAllNotionDatabasePages(accessToken, workoutSessionDbId),
    ]);

    let exerciseNameByPageId: Record<string, string> | undefined;
    if (workoutExerciseDbId) {
      const exercisePages = await fetchAllNotionDatabasePages(
        accessToken,
        workoutExerciseDbId,
      );
      exerciseNameByPageId = buildExerciseNameByPageId(exercisePages);
    }

    const sessions = buildSessionsFromNotion({
      setPages,
      sessionPages,
      exerciseNameByPageId,
    });

    return NextResponse.json({ sessions }, { status: 200 });
  } catch (error) {
    console.error("Import history failed", error);

    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : 500;

    const message =
      error instanceof Error ? error.message : "Import history failed";

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
