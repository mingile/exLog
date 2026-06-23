"use client";

import { useEffect, useState } from "react";
import {
  LibraryCategory,
  LibraryExercise,
  Exercise,
  SessionDraft,
} from "./types";
import { groupExercisesByCategory, getFirstValidCategory } from "@/lib/library";
import { createSessionMetadata } from "@/lib/session-utils";
import { Button } from "@/components/ui/button";
import { useExerciseLibrary } from "@/hooks/useExerciseLibrary";
import { getPreviousRecord } from "@/lib/previous-record";

function convertLibraryExerciseToSessionExercise(
  libraryExercise: LibraryExercise,
): Exercise {
  return {
    id: libraryExercise.id,
    name: libraryExercise.name,
    sets: getPreviousRecord(libraryExercise.name, libraryExercise.equipment),
    part: libraryExercise.category,
    exercisePageId: libraryExercise.notionPageId,
  };
}

interface LibraryClientProps {
  onConfirmSelection: (draft: SessionDraft) => void;
}

export function LibraryClient({ onConfirmSelection }: LibraryClientProps) {
  const { libraryState, refetch } = useExerciseLibrary();
  const [selectedCategory, setSelectedCategory] =
    useState<LibraryCategory | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(
    new Set(),
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (libraryState.status === "success" && selectedCategory === null) {
      const firstCategory = getFirstValidCategory(libraryState.categories);
      if (firstCategory) {
        setSelectedCategory(firstCategory);
      }
    }
  }, [libraryState, selectedCategory]);

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
        sessionExercises.push(
          convertLibraryExerciseToSessionExercise(libraryExercise),
        );
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

      localStorage.setItem(
        "workout.currentSession.v1",
        JSON.stringify(draftData),
      );

      onConfirmSelection(draftData);
    } catch (error) {
      console.error("localStorage 저장 실패:", error);
      setValidationError("선택 내용을 저장하지 못했습니다. 다시 시도해주세요");
    }
  }

  if (libraryState.status === "loading") {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <p className="text-muted-foreground">운동 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (libraryState.status === "error") {
    return (
      <div className="flex flex-col h-screen items-center justify-center px-4">
        <p className="text-destructive mb-4">운동 목록을 불러오지 못했습니다</p>
        <p className="text-sm text-muted-foreground mb-4">{libraryState.message}</p>
        <Button onClick={refetch}>다시 시도</Button>
      </div>
    );
  }

  if (libraryState.status === "empty") {
    return (
      <div className="flex flex-col h-screen items-center justify-center px-4">
        <p className="text-muted-foreground mb-4">등록된 운동이 없습니다</p>
        <p className="text-sm text-muted-foreground">
          Exercise DB에 운동을 추가해주세요
        </p>
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
        {libraryState.status === "success" &&
          libraryState.source === "builtin" &&
          libraryState.message && (
            <div className="mt-2 px-3 py-2 bg-primary/10 border border-primary/30 rounded text-xs text-primary">
              {libraryState.message}
            </div>
          )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-background border-b z-10">
          <div className="flex overflow-x-auto p-2 gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-accent"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-2">
          {currentExercises.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {selectedCategory}에 등록된 운동이 없습니다
            </p>
          ) : (
            currentExercises.map((exercise) => (
              <div
                key={exercise.id}
                onClick={() => toggleExerciseSelection(exercise.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedExercises.has(exercise.id)
                    ? "bg-accent border-primary"
                    : "bg-card hover:bg-accent"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">
                      {exercise.name}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      {exercise.equipment && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {exercise.equipment}
                        </span>
                      )}
                      {exercise.primaryEffect && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {exercise.primaryEffect}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-2">
                    {selectedExercises.has(exercise.id) && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-primary-foreground"
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

      <div className="border-t p-4 bg-background">
        {validationError && (
          <div className="mb-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive">{validationError}</p>
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
