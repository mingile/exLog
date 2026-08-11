import { getNotionConnection } from "@/lib/notion/connection";
import { notionSyncError } from "@/lib/notion/errors";

const EQUIPMENT_TO_NOTION: Record<string, string> = {
  "cable-machine": "케이블",
  "smith-machine": "스미스",
  "plate-machine": "원판",
  barbell: "바벨",
  dumbbell: "덤벨",
};

export type WriteSetItem = {
  setNo: number;
  weight: number;
  reps: number;
  memo: string;
  equipment: string;
};

export type WriteExercise = {
  id: string;
  name: string;
  part?: string;
  exercisePageId?: string;
  sets: WriteSetItem[];
};

export type WriteSetsParams = {
  userKey: string;
  savedAt: string;
  exercises: WriteExercise[];
  sessionPageId?: string;
};

export type WriteSetsResult = {
  ok: true;
  created_count: number;
  skipped_count: number;
};

function setDedupeKey(exercisePageId: string, setNo: number): string {
  return `${exercisePageId}:${setNo}`;
}

function getRelationPageId(
  properties: Record<string, unknown> | undefined,
  propertyName: string,
): string | null {
  if (!properties) return null;
  const property = properties[propertyName] as
    | { relation?: { id?: string }[] }
    | undefined;
  if (!property?.relation?.length) return null;
  const id = property.relation[0]?.id;
  return typeof id === "string" && id.trim() !== "" ? id : null;
}

function getSetNoFromProperties(
  properties: Record<string, unknown> | undefined,
): number | null {
  if (!properties) return null;
  const setNo = (properties["Set No"] as { number?: number } | undefined)
    ?.number;
  return typeof setNo === "number" && Number.isFinite(setNo) ? setNo : null;
}

async function fetchExistingSetKeys(
  accessToken: string,
  databaseId: string,
  sessionPageId: string,
): Promise<Set<string>> {
  const keys = new Set<string>();
  let startCursor: string | undefined;

  do {
    const body: Record<string, unknown> = {
      page_size: 100,
      filter: {
        property: "Session",
        relation: {
          contains: sessionPageId,
        },
      },
    };
    if (startCursor) {
      body.start_cursor = startCursor;
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Notion Sets query error:", errorData);
      throw notionSyncError("Failed to query Sets DB", response.status);
    }

    const data = (await response.json()) as {
      results?: { properties?: Record<string, unknown> }[];
      has_more?: boolean;
      next_cursor?: string;
    };

    for (const page of data.results ?? []) {
      const exercisePageId = getRelationPageId(page.properties, "Exercise");
      const setNo = getSetNoFromProperties(page.properties);
      if (exercisePageId && setNo !== null) {
        keys.add(setDedupeKey(exercisePageId, setNo));
      }
    }

    startCursor = data.has_more ? data.next_cursor : undefined;
  } while (startCursor);

  return keys;
}

export async function writeNotionSets(
  params: WriteSetsParams,
): Promise<WriteSetsResult> {
  const { userKey, savedAt, exercises, sessionPageId } = params;
  const connection = await getNotionConnection(userKey);
  const accessToken = connection.accessToken;
  const databaseId = connection.workoutSetsDbId;

  if (!databaseId) {
    throw notionSyncError("No databaseId found", 404);
  }

  let created_count = 0;
  let skipped_count = 0;

  const existingSetKeys = sessionPageId
    ? await fetchExistingSetKeys(accessToken, databaseId, sessionPageId)
    : new Set<string>();

  for (const exercise of exercises) {
    if (!exercise.exercisePageId) {
      console.error("exercisePageId missing:", {
        exerciseName: exercise.name,
        exerciseId: exercise.id,
      });
      throw notionSyncError(
        `Exercise "${exercise.name}" has no exercisePageId. Please select from library.`,
        400,
      );
    }

    for (const set of exercise.sets) {
      const dedupeKey = setDedupeKey(exercise.exercisePageId, set.setNo);

      if (existingSetKeys.has(dedupeKey)) {
        skipped_count++;
        console.log("Skipping existing row:", exercise.name, "set", set.setNo);
        continue;
      }

      const notion_payload = {
        parent: {
          database_id: databaseId,
        },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: `${exercise.name} - #${set.setNo}`,
                },
              },
            ],
          },
          "Set No": {
            number: set.setNo,
          },
          Weight: {
            number: set.weight,
          },
          Reps: {
            number: set.reps,
          },
          Date: {
            date: {
              start: savedAt,
            },
          },
          Part: {
            select: {
              name: exercise.part || "기타",
            },
          },
          Exercise: {
            relation: [
              {
                id: exercise.exercisePageId,
              },
            ],
          },
          Memo: {
            rich_text: [
              {
                text: {
                  content: set.memo,
                },
              },
            ],
          },
          Equipment: EQUIPMENT_TO_NOTION[set.equipment]
            ? { select: { name: EQUIPMENT_TO_NOTION[set.equipment] } }
            : undefined,
          Session: sessionPageId
            ? {
                relation: [
                  {
                    id: sessionPageId,
                  },
                ],
              }
            : undefined,
        },
      };

      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify(notion_payload),
      });

      console.log("Notion payload:", notion_payload);
      console.log("Creating row:", exercise.name, "set", set.setNo);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Notion API error:", {
          payload: notion_payload,
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        throw notionSyncError(
          "Failed to create database record",
          response.status,
        );
      }

      await response.json();
      existingSetKeys.add(dedupeKey);
      created_count++;
    }
  }

  console.log("writeNotionSets completed", {
    created_count,
    skipped_count,
  });

  return { ok: true, created_count, skipped_count };
}
