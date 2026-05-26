import { useEffect, useState } from "react";
import { LibraryState, LibraryExercise, LibraryCategory } from "@/app/types";
import {
  transformNotionRowToLibraryExercise,
  groupExercisesByCategory,
  getOrderedCategories,
  getFirstValidCategory,
} from "@/lib/library";
import builtinExercises from "@/data/exercises.json";

function transformBuiltinExerciseToLibraryExercise(
  builtin: { id: string; name: string; part: string; equipment: string },
): LibraryExercise {
  return {
    id: builtin.id,
    name: builtin.name,
    category: builtin.part as LibraryCategory,
    equipment: builtin.equipment,
  };
}

export function useExerciseLibrary() {
  const [libraryState, setLibraryState] = useState<LibraryState>({
    status: "loading",
  });

  async function fetchExercises() {
    try {
      setLibraryState({ status: "loading" });

      const statusRes = await fetch("/api/notion/status", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      let notionConnected = false;
      let dbConnected = false;

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        notionConnected = statusData.notionConnected || false;
        dbConnected = statusData.dbConnected || false;
      }

      if (!notionConnected || !dbConnected) {
        const exercises: LibraryExercise[] = builtinExercises.map(
          transformBuiltinExerciseToLibraryExercise,
        );

        if (exercises.length === 0) {
          setLibraryState({ status: "empty" });
          return;
        }

        const grouped = groupExercisesByCategory(exercises);
        const categories = getOrderedCategories(grouped);

        setLibraryState({
          status: "success",
          exercises,
          categories,
          source: "builtin",
          message: "노션 미연동 상태입니다. 기본 운동 목록을 사용 중입니다.",
        });
        return;
      }

      const res = await fetch("/api/notion/exercise-read", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        const errorData = await res.json();
        setLibraryState({
          status: "error",
          message: errorData.error || "Failed to fetch exercises",
        });
        return;
      }

      const data = await res.json();
      const notionRows = data.data || [];

      if (notionRows.length === 0) {
        setLibraryState({ status: "empty" });
        return;
      }

      const exercises: LibraryExercise[] = [];
      for (const row of notionRows) {
        const exercise = transformNotionRowToLibraryExercise(row);
        if (exercise) {
          exercises.push(exercise);
        }
      }

      if (exercises.length === 0) {
        setLibraryState({ status: "empty" });
        return;
      }

      const grouped = groupExercisesByCategory(exercises);
      const categories = getOrderedCategories(grouped);

      setLibraryState({
        status: "success",
        exercises,
        categories,
        source: "notion",
      });
    } catch (error) {
      console.error("Failed to fetch exercises:", error);
      setLibraryState({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  useEffect(() => {
    fetchExercises();
  }, []);

  return { libraryState, refetch: fetchExercises };
}
