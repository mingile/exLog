import { getNotionConnection } from "@/lib/notion/connection";
import { NotionSyncError } from "@/lib/notion/errors";

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
};

export async function writeNotionSets(
  params: WriteSetsParams,
): Promise<WriteSetsResult> {
  const { userKey, savedAt, exercises, sessionPageId } = params;
  const connection = await getNotionConnection(userKey);
  const accessToken = connection.accessToken;
  const databaseId = connection.workoutSetsDbId;

  if (!databaseId) {
    throw new NotionSyncError("No databaseId found", 404);
  }

  let created_count = 0;

  for (const exercise of exercises) {
    if (!exercise.exercisePageId) {
      console.error("exercisePageId missing:", {
        exerciseName: exercise.name,
        exerciseId: exercise.id,
      });
      throw new NotionSyncError(
        `Exercise "${exercise.name}" has no exercisePageId. Please select from library.`,
        400,
      );
    }

    for (const set of exercise.sets) {
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
        throw new NotionSyncError(
          "Failed to create database record",
          response.status,
        );
      }

      await response.json();
      created_count++;
    }
  }

  return { ok: true, created_count };
}
