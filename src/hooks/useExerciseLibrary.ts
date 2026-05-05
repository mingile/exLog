import { useEffect, useState } from "react";
import { LibraryState, LibraryExercise, LibraryCategory } from "@/app/types";
import {
  transformNotionRowToLibraryExercise,
  groupExercisesByCategory,
  getOrderedCategories,
  getFirstValidCategory,
} from "@/lib/library";

export function useExerciseLibrary() {
  const [libraryState, setLibraryState] = useState<LibraryState>({
    status: "loading",
  });

  async function fetchExercises() {
    try {
      setLibraryState({ status: "loading" });

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
