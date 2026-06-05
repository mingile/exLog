import { SetItem, Session } from "@/app/types";
import { ruleDecision } from "./weightUnit";

export function createDefaultSet(equipment?: string): SetItem {
  return {
    weight: 0,
    reps: 0,
    done: false,
    synced: false,
    equipment: equipment || "cable-machine",
    memo: "",
    unit: equipment === "cable-machine" ? "lb" : "kg",
    setType: "main",
  };
}

export function getPreviousRecord(
  exerciseName: string,
  equipment?: string,
): SetItem[] {
  try {
    const sessionKey = "workout.sessions.v1";
    const sessionsData = localStorage.getItem(sessionKey);

    if (!sessionsData) {
      return [createDefaultSet(equipment)];
    }

    const sessions: Session[] = JSON.parse(sessionsData);

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return [createDefaultSet(equipment)];
    }

    // savedAt 기준으로 내림차순 정렬 (최신 순)
    const sortedSessions = [...sessions].sort((a, b) => {
      const dateA = new Date(a.savedAt).getTime();
      const dateB = new Date(b.savedAt).getTime();
      return dateB - dateA;
    });

    // 1차 시도: 운동명 + Equipment 모두 일치하는 기록 찾기
    if (equipment) {
      for (const session of sortedSessions) {
        const foundExercise = session.exercises.find(
          (ex) =>
            ex.name === exerciseName &&
            ex.sets.some((set) => set.equipment === equipment),
        );

        if (foundExercise && foundExercise.sets.length > 0) {
          const matchingSets = foundExercise.sets.filter(
            (set) => set.equipment === equipment,
          );
          if (matchingSets.length > 0) {
            // 첫번째 세트만 가져오기
            return [
              {
                weight: matchingSets[0].weight,
                reps: matchingSets[0].reps,
                done: false,
                synced: false,
                equipment: matchingSets[0].equipment,
                memo: "",
                unit: ruleDecision(matchingSets[0].equipment).unit,
                setType: "main",
              },
            ];
          }
        }
      }
    }

    // 2차 시도: 운동명만 일치하는 기록 찾기
    for (const session of sortedSessions) {
      const foundExercise = session.exercises.find(
        (ex) => ex.name === exerciseName,
      );

      if (foundExercise && foundExercise.sets.length > 0) {
        return [
          {
            weight: foundExercise.sets[0].weight,
            reps: foundExercise.sets[0].reps,
            done: false,
            synced: false,
            equipment:
              foundExercise.sets[0].equipment || equipment || "cable-machine",
            memo: "",
            unit: ruleDecision(
              foundExercise.sets[0].equipment || equipment || "cable-machine",
            ).unit,
            setType: "main",
          },
        ];
      }
    }

    // 이전 기록을 찾지 못한 경우
    return [createDefaultSet(equipment)];
  } catch (error) {
    console.error("Failed to load previous record:", error);
    return [createDefaultSet(equipment)];
  }
}
