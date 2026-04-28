"use client";

import { useEffect, useState } from "react";
import { LibraryCategory, LibraryExercise, LibraryState, Exercise, SetItem, SessionDraft } from "./types";
import {
  transformNotionRowToLibraryExercise,
  groupExercisesByCategory,
  getOrderedCategories,
  getFirstValidCategory,
} from "@/lib/library";
import { createSessionMetadata } from "@/lib/session-utils";
import { Button } from "@/components/ui/button";

const CATEGORY_ORDER: LibraryCategory[] = [
  "등",
  "가슴",
  "하체",
  "어깨",
  "팔",
  "코어",
  "유산소",
  "기타",
];

function createDefaultSet(equipment?: string): SetItem {
  return {
    weight: 0,
    reps: 0,
    done: false,
    synced: false,
    equipment: equipment || "cable-machine",
    memo: "",
    unit: "kg",
    rpe: null,
  };
}

function convertLibraryExerciseToSessionExercise(
  libraryExercise: LibraryExercise
): Exercise {
  return {
    id: libraryExercise.id,
    name: libraryExercise.name,
    sets: [createDefaultSet(libraryExercise.equipment)],
    part: libraryExercise.category,
    exercisePageId: libraryExercise.notionPageId,
  };
}

interface LibraryClientProps {
  onConfirmSelection: (draft: SessionDraft) => void;
}

export function LibraryClient({ onConfirmSelection }: LibraryClientProps) {
  const [libraryState, setLibraryState] = useState<LibraryState>({
    status: "loading",
  });
  const [selectedCategory, setSelectedCategory] = useState<LibraryCategory | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

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

      const firstCategory = getFirstValidCategory(categories);
      if (firstCategory) {
        setSelectedCategory(firstCategory);
      }
    } catch (error) {
      console.error("Failed to fetch exercises:", error);
      setLibraryState({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  function toggleExerciseSelection(exerciseId: string) {
    setSelectedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
    
    if (validationError) {
      setValidationError(null);
    }
  }

  function handleConfirmSelection() {
    if (selectedExercises.size === 0) {
      setValidationError("운동을 최소 1개 이상 선택해주세요");
      return;
    }

    if (libraryState.status !== "success") {
      setValidationError("운동 데이터를 불러오지 못했습니다");
      return;
    }

    const selectedIds: string[] = Array.from(selectedExercises);
    
    const exerciseMap = new Map<string, LibraryExercise>();
    for (const exercise of libraryState.exercises) {
      exerciseMap.set(exercise.id, exercise);
    }

    const sessionExercises: Exercise[] = [];
    for (const id of selectedIds) {
      const libraryExercise = exerciseMap.get(id);
      if (libraryExercise) {
        sessionExercises.push(convertLibraryExerciseToSessionExercise(libraryExercise));
      }
    }

    if (sessionExercises.length === 0) {
      setValidationError("선택한 운동 데이터를 변환하지 못했습니다");
      return;
    }

    try {
      const sessionMetadata = createSessionMetadata();

      const draftData: SessionDraft = {
        session: sessionMetadata,
        exercises: sessionExercises,
      };

      localStorage.setItem("workout.currentSession.v1", JSON.stringify(draftData));

      onConfirmSelection(draftData);
    } catch (error) {
      console.error("localStorage 저장 실패:", error);
      setValidationError("선택 내용을 저장하지 못했습니다. 다시 시도해주세요");
    }
  }

  if (libraryState.status === "loading") {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <p className="text-gray-500">운동 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (libraryState.status === "error") {
    return (
      <div className="flex flex-col h-screen items-center justify-center px-4">
        <p className="text-red-500 mb-4">운동 목록을 불러오지 못했습니다</p>
        <p className="text-sm text-gray-500 mb-4">{libraryState.message}</p>
        <Button onClick={fetchExercises}>다시 시도</Button>
      </div>
    );
  }

  if (libraryState.status === "empty") {
    return (
      <div className="flex flex-col h-screen items-center justify-center px-4">
        <p className="text-gray-500 mb-4">등록된 운동이 없습니다</p>
        <p className="text-sm text-gray-400">Exercise DB에 운동을 추가해주세요</p>
      </div>
    );
  }

  const { exercises, categories } = libraryState;
  const grouped = groupExercisesByCategory(exercises);
  const currentExercises = selectedCategory
    ? grouped.get(selectedCategory) || []
    : [];

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">운동 라이브러리</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="flex overflow-x-auto p-2 gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-2">
          {currentExercises.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {selectedCategory}에 등록된 운동이 없습니다
            </p>
          ) : (
            currentExercises.map((exercise) => (
              <div
                key={exercise.id}
                onClick={() => toggleExerciseSelection(exercise.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedExercises.has(exercise.id)
                    ? "bg-blue-50 border-blue-500"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{exercise.name}</h3>
                    <div className="flex gap-2 mt-1">
                      {exercise.equipment && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {exercise.equipment}
                        </span>
                      )}
                      {exercise.primaryEffect && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {exercise.primaryEffect}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-2">
                    {selectedExercises.has(exercise.id) && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t p-4 bg-white">
        {validationError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{validationError}</p>
          </div>
        )}
        <Button 
          className="w-full" 
          onClick={handleConfirmSelection}
          variant={selectedExercises.size === 0 ? "outline" : "default"}
        >
          선택 완료 ({selectedExercises.size})
        </Button>
      </div>
    </div>
  );
}
