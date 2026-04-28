import { getMongoDb } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

function generateExerciseId(): string {
  const randomStr = randomBytes(8).toString("hex");
  return `ex_${randomStr}`;
}

interface BackfillResult {
  totalRows: number;
  alreadyHadId: number;
  newlyAssigned: number;
  failed: number;
  errors: Array<{ pageId: string; error: string }>;
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const user_key = cookieStore.get("user_key")?.value;

    if (!user_key) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getMongoDb();
    const collection = db.collection("connections_info");
    const connection = await collection.findOne({ user_key });

    if (!connection) {
      return NextResponse.json({ error: "No connection found" }, { status: 404 });
    }

    const accessToken = connection.access_token;
    const exerciseDbId = connection.workout_exercise_db_id;

    if (!accessToken) {
      return NextResponse.json({ error: "No access token found" }, { status: 401 });
    }

    if (!exerciseDbId) {
      return NextResponse.json({ error: "Exercise database not configured" }, { status: 400 });
    }

    const result: BackfillResult = {
      totalRows: 0,
      alreadyHadId: 0,
      newlyAssigned: 0,
      failed: 0,
      errors: [],
    };

    let hasMore = true;
    let startCursor: string | undefined = undefined;

    while (hasMore) {
      const queryBody: any = {
        page_size: 100,
      };

      if (startCursor) {
        queryBody.start_cursor = startCursor;
      }

      const queryResponse = await fetch(
        `https://api.notion.com/v1/databases/${exerciseDbId}/query`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(queryBody),
        }
      );

      if (!queryResponse.ok) {
        const errorData = await queryResponse.json();
        console.error("Failed to query Exercise DB:", errorData);
        return NextResponse.json(
          { error: "Failed to query Exercise DB", details: errorData },
          { status: queryResponse.status }
        );
      }

      const queryData = await queryResponse.json();
      const pages = queryData.results || [];
      result.totalRows += pages.length;

      for (const page of pages) {
        try {
          const exerciseIdProp = page.properties?.exercise_id;
          
          let hasExerciseId = false;
          if (exerciseIdProp) {
            if (exerciseIdProp.type === "rich_text" && exerciseIdProp.rich_text?.length > 0) {
              hasExerciseId = true;
            } else if (exerciseIdProp.type === "title" && exerciseIdProp.title?.length > 0) {
              hasExerciseId = true;
            }
          }

          if (hasExerciseId) {
            result.alreadyHadId++;
            continue;
          }

          const newExerciseId = generateExerciseId();

          const updateResponse = await fetch(
            `https://api.notion.com/v1/pages/${page.id}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                properties: {
                  exercise_id: {
                    rich_text: [
                      {
                        text: {
                          content: newExerciseId,
                        },
                      },
                    ],
                  },
                },
              }),
            }
          );

          if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            console.error(`Failed to update page ${page.id}:`, errorData);
            result.failed++;
            result.errors.push({
              pageId: page.id,
              error: errorData.message || "Unknown error",
            });
            continue;
          }

          result.newlyAssigned++;
        } catch (error) {
          console.error(`Error processing page ${page.id}:`, error);
          result.failed++;
          result.errors.push({
            pageId: page.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      hasMore = queryData.has_more || false;
      startCursor = queryData.next_cursor;
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Exercise backfill failed:", error);
    return NextResponse.json(
      {
        error: "Exercise backfill failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
