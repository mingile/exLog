import { getMongoDb } from "@/lib/mongodb";
import { NotionSyncError } from "@/lib/notion/errors";

export type NotionConnection = {
  accessToken: string;
  workoutSetsDbId?: string;
  workoutSessionDbId?: string;
  workoutExerciseDbId?: string;
};

export async function getNotionConnection(
  userKey: string,
): Promise<NotionConnection> {
  const db = await getMongoDb();
  const connection = await db
    .collection("connections_info")
    .findOne({ user_key: userKey });

  if (!connection?.access_token) {
    throw new NotionSyncError("No connection found", 404);
  }

  return {
    accessToken: connection.access_token,
    workoutSetsDbId: connection.workout_sets_db_id,
    workoutSessionDbId: connection.workout_session_db_id,
    workoutExerciseDbId: connection.workout_exercise_db_id,
  };
}
