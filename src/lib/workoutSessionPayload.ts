import { Exercises, SavedExercise } from "@/app/types";

/**
 * done=true인 세트만 추출하여 로컬 저장용 payload를 생성한다.
 * workout.sessions.v1에 저장되는 형태와 동일하다.
 */
export function createLocalExercisesPayload(
  exercises: Exercises
): (SavedExercise & { part: string })[] {
  return exercises
    .map((ex) => {
      const doneSets = ex.sets
        .map((set, i) => ({ set, setNo: i + 1 }))
        .filter(({ set }) => set.done);
      return {
        ...ex,
        sets: doneSets,
      };
    })
    .filter((ex) => ex.sets.length > 0)
    .map((ex) => {
      return {
        id: ex.id,
        name: ex.name,
        part: ex.part || "기타",
        exercisePageId: ex.exercisePageId,
        sets: ex.sets.map(({ set, setNo }) => ({
          setNo,
          weight: set.weight,
          reps: set.reps,
          memo: set.memo,
          equipment: set.equipment,
        })),
      };
    });
}

/**
 * 세션 히스토리 payload를 생성한다.
 */
export function createHistoryPayload(params: {
  sessionId: string;
  sessionName: string;
  savedAt: string;
  localExercises: (SavedExercise & { part: string })[];
}): {
  id: string;
  savedAt: string;
  sessionName: string;
  exercises: (SavedExercise & { part: string })[];
} {
  return {
    id: params.sessionId,
    savedAt: params.savedAt,
    sessionName: params.sessionName,
    exercises: params.localExercises,
  };
}

/**
 * done=true && synced=false인 세트만 추출하여 Notion 동기화용 payload를 생성한다.
 */
export function createNotionExercisesPayload(
  exercises: Exercises
): (SavedExercise & {
  part: string;
  exercisePageId?: string;
})[] {
  return exercises
    .map((ex) => {
      const unsyncedSets = ex.sets
        .map((set, i) => ({ set, setNo: i + 1 }))
        .filter(({ set }) => set.done && !set.synced);
      return {
        ...ex,
        sets: unsyncedSets,
      };
    })
    .filter((ex) => ex.sets.length > 0)
    .map((ex) => {
      return {
        id: ex.id,
        name: ex.name,
        part: ex.part || "기타",
        exercisePageId: ex.exercisePageId,
        sets: ex.sets.map(({ set, setNo }) => ({
          setNo,
          weight: set.weight,
          reps: set.reps,
          memo: set.memo,
          equipment: set.equipment,
        })),
      };
    });
}

/**
 * done=true && synced=false인 세트를 synced=true로 변경한 새 배열을 반환한다.
 * 원본 exercises를 직접 mutate하지 않는다.
 */
export function markSyncedSets(exercises: Exercises): Exercises {
  return exercises.map((ex) => ({
    ...ex,
    sets: ex.sets.map((set) =>
      set.done && !set.synced ? { ...set, synced: true } : set
    ),
  }));
}
