"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Exercises,
  SessionMetadata,
  Exercise,
  SetItem,
  Session,
} from "./types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ruleDecision } from "@/lib/weightUnit";
import { TrashIcon, Plus } from "lucide-react";
import { convertInputToKg } from "@/lib/weightUnit";
import { nextWeight } from "@/lib/weightUnit";
import { useExerciseLibrary } from "@/hooks/useExerciseLibrary";
import { groupExercisesByCategory } from "@/lib/library";

export function WorkoutSessionClient({
  exercises,
  displayWeightUnit,
  addSet,
  changeWeight,
  changeReps,
  toggleDone,
  changeMemo,
  deleteSet,
  changeEquipment,
  changeUnit,
  sessionMetadata,
  addExercisesToSession,
  onSave,
  onStartNewSession,
  saving,
}: {
  exercises: Exercises;
  displayWeightUnit: (
    weight: number,
    unit: "kg" | "lb",
  ) => { displayWeight: number; displayUnit: "kg" | "lb" };
  nextWeight: (
    weight: number,
    equipment: string,
    direction: "increase" | "decrease",
  ) => number;
  addSet: (exIdx: number) => void;
  changeWeight: (exIdx: number, setIdx: number, nextWeight: number) => void;
  changeReps: (exIdx: number, setIdx: number, delta: number) => void;
  toggleDone: (exIdx: number, setIdx: number) => void;
  changeMemo: (exIdx: number, setIdx: number, value: string) => void;
  deleteSet: (exId: string, setIdx: number) => void;
  changeEquipment: (exIdx: number, setIdx: number, equipment: string) => void;
  changeUnit: (exIdx: number, setIdx: number, unit: "kg" | "lb") => void;
  sessionMetadata: SessionMetadata | null;
  addExercisesToSession: (newExercises: Exercises) => void;
  onSave: () => void;
  onStartNewSession: () => void;
  saving: boolean;
}) {
  const [isAddExerciseSheetOpen, setIsAddExerciseSheetOpen] = useState(false);
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(
    null,
  );

  return (
    <main className="p-2 space-y-2">
      {exercises.map((ex, i) => {
        return (
          <Accordion
            key={ex.id}
            type="single"
            collapsible
            value={openAccordionIndex === i ? `item-${i}` : ""}
            onValueChange={(val) =>
              setOpenAccordionIndex(val === `item-${i}` ? i : null)
            }
          >
            <AccordionItem
              value={`item-${i}`}
              className="rounded-lg border px-2"
            >
              <AccordionTrigger className="py-3">
                <div className="flex w-full items-center justify-between pr-2">
                  <span className="text-base font-medium">{ex.name}</span>
                  {openAccordionIndex === i && (
                    <PlusButton exerciseIndex={i} addSet={addSet} />
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent className="pb-3">
                <div className="space-y-3">
                  {ex.sets.map((set, j) => (
                    <Row
                      key={`${ex.id}-set-${j}`}
                      exerciseIndex={i}
                      setIndex={j}
                      weight={set.weight}
                      equipment={set.equipment}
                      reps={set.reps}
                      memo={set.memo || ""}
                      done={set.done}
                      exId={ex.id}
                      deleteSet={deleteSet}
                      onWeightChange={changeWeight}
                      onRepsDelta={changeReps}
                      onToggleDone={toggleDone}
                      changeMemo={changeMemo}
                      displayWeightUnit={displayWeightUnit}
                      nextWeight={nextWeight}
                      changeEquipment={changeEquipment}
                      changeUnit={changeUnit}
                      unit={set.unit}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}

      <Sheet
        open={isAddExerciseSheetOpen}
        onOpenChange={setIsAddExerciseSheetOpen}
      >
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-14 border-2 border-dashed flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            운동 추가
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[85vh] overflow-hidden flex flex-col p-2"
        >
          <AddExerciseBottomSheet
            exercises={exercises}
            addExercisesToSession={addExercisesToSession}
            onClose={() => setIsAddExerciseSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button onClick={onSave} disabled={saving}>
          {saving ? "저장중..." : "저장"}
        </Button>
        <Button onClick={onStartNewSession}>새 세션</Button>
      </div>
    </main>
  );

  function PlusButton({
    exerciseIndex,
    addSet,
  }: {
    exerciseIndex: number;
    addSet: (exIdx: number) => void;
  }) {
    return (
      <Button
        type="button"
        className="h-9 w-9 rounded-full p-0 text-lg active:scale-95 transition-transform"
        onClick={(e) => {
          e.stopPropagation();
          addSet(exerciseIndex);
        }}
      >
        +
      </Button>
    );
  }
}

function Row({
  exId,
  exerciseIndex,
  setIndex,
  weight,
  equipment,
  reps,
  done,
  onWeightChange,
  onRepsDelta,
  onToggleDone,
  memo,
  changeMemo,
  deleteSet,
  displayWeightUnit,
  nextWeight,
  changeEquipment,
  changeUnit,
  unit,
}: {
  exId: string;
  exerciseIndex: number;
  setIndex: number;
  weight: number;
  equipment: string;
  reps: number;
  done: boolean;
  onWeightChange: (exIdx: number, setIdx: number, nextWeight: number) => void;
  onRepsDelta: (exIdx: number, setIdx: number, delta: number) => void;
  onToggleDone: (exIdx: number, setIdx: number) => void;
  memo: string;
  changeMemo: (exIdx: number, setIdx: number, value: string) => void;
  deleteSet: (exId: string, setIdx: number) => void;
  displayWeightUnit: (
    weight: number,
    unit: "kg" | "lb",
  ) => { displayWeight: number; displayUnit: "kg" | "lb" };
  nextWeight: (
    weight: number,
    equipment: string,
    direction: "increase" | "decrease",
  ) => number;
  changeEquipment: (exIdx: number, setIdx: number, equipment: string) => void;
  changeUnit: (exIdx: number, setIdx: number, unit: "kg" | "lb") => void;
  unit: "kg" | "lb";
}) {
  const { displayWeight, displayUnit } = displayWeightUnit(weight, unit);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [draftWeight, setDraftWeight] = useState<string>(String(displayWeight));
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (isEditingWeight) return;
    setDraftWeight(String(displayWeight));
  }, [displayWeight, isEditingWeight]);

  useEffect(() => {
    setIsCollapsed(done);
  }, [done]);

  function beginWeightEdit() {
    setDraftWeight(String(displayWeight));
    setIsEditingWeight(true);
  }

  function commitWeightEdit() {
    const nextKg = convertInputToKg(draftWeight, unit);

    if (nextKg === null) {
      setDraftWeight(String(displayWeight));
      setIsEditingWeight(false);
      return;
    }

    onWeightChange(exerciseIndex, setIndex, nextKg);
    setIsEditingWeight(false);
  }

  function cancelWeightEdit() {
    setDraftWeight(String(displayWeight));
    setIsEditingWeight(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    setIsSwiping(true);
    setSwipeOffset(0);
    (e.currentTarget as HTMLElement).dataset.startX = String(touch.clientX);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isSwiping) return;

    const touch = e.touches[0];
    const startX = Number((e.currentTarget as HTMLElement).dataset.startX);
    const currentX = touch.clientX;
    const diff = currentX - startX;

    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -100));
    }
  }

  function handleTouchEnd() {
    if (swipeOffset < -50) {
      deleteSet(exId, setIndex);
    }
    setIsSwiping(false);
    setSwipeOffset(0);
  }

  function handleCollapse() {
    setIsCollapsed(!isCollapsed);
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 bg-red-500 flex items-center justify-end pr-4">
        <TrashIcon className="size-6 text-white" />
      </div>
      <div
        className={`rounded-xl border bg-card p-3 space-y-3 ${isCollapsed ? "bg-green-100" : "bg-card"}`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isCollapsed ? "none" : "all 0.3s ease-in-out",
        }}
      >
        <div className="flex items-center justify-between">
          <div
            className={`relative flex items-center gap-2 flex-wrap`}
            style={{
              color: isCollapsed ? "black" : "",
              fontWeight: isCollapsed ? "bold" : "normal",
            }}
          >
            <span
              className={`${isCollapsed ? "text-green-700" : "text-black"}`}
            >
              세트 {setIndex + 1}
            </span>
            {isCollapsed ? (
              <div className="flex items-center gap-2 flex-wrap ml-auto text-green-700">
                <span className="font-semibold text-md">
                  {displayWeight}
                  {displayUnit} × {reps}회
                </span>
                {memo.trim() !== "" && (
                  <span className="text-md text-green-800 italic truncate max-w-[150px]">
                    "{memo}"
                  </span>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                className="ml-3 size-8"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSet(exId, setIndex);
                }}
              >
                <TrashIcon className="h-5 w-5" />
              </Button>
            )}
          </div>
          <label
            className="flex items-center gap-2 text-sm text-muted-foreground"
            style={{ color: isCollapsed ? "black" : "" }}
          >
            {done ? "완료" : "진행중"}
            <input
              type="checkbox"
              className="h-5 w-5 accent-blue-500"
              checked={done}
              onChange={() => onToggleDone(exerciseIndex, setIndex)}
            />
          </label>
        </div>
        {isCollapsed ? null : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">무게</span>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant={unit === "kg" ? "default" : "outline"}
                      className="h-5 px-2 text-xs"
                      onClick={() => changeUnit(exerciseIndex, setIndex, "kg")}
                    >
                      kg
                    </Button>
                    <Button
                      type="button"
                      variant={unit === "lb" ? "default" : "outline"}
                      className="h-5 px-2 text-xs"
                      onClick={() => changeUnit(exerciseIndex, setIndex, "lb")}
                    >
                      lb
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-3"
                    onClick={() =>
                      onWeightChange(
                        exerciseIndex,
                        setIndex,
                        nextWeight(weight, equipment, "decrease"),
                      )
                    }
                  >
                    -
                  </Button>
                  {isEditingWeight ? (
                    <input
                      type="number"
                      inputMode="decimal"
                      step={displayUnit === "kg" ? "0.1" : "1"}
                      className="flex-1 min-w-0 rounded-md border bg-background px-2 py-1 text-center text-base font-semibold outline-none focus:border-blue-400"
                      value={draftWeight}
                      onChange={(e) => setDraftWeight(e.currentTarget.value)}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          cancelWeightEdit();
                        }
                      }}
                      onBlur={commitWeightEdit}
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-base font-semibold truncate"
                      onClick={beginWeightEdit}
                    >
                      {displayWeight}
                      {displayUnit}
                    </button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-3"
                    onClick={() =>
                      onWeightChange(
                        exerciseIndex,
                        setIndex,
                        nextWeight(weight, equipment, "increase"),
                      )
                    }
                  >
                    +
                  </Button>
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="text-xs text-muted-foreground mb-2">횟수</div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-3"
                    onClick={() => onRepsDelta(exerciseIndex, setIndex, -1)}
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center text-lg font-semibold">
                    {reps}회
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-3"
                    onClick={() => onRepsDelta(exerciseIndex, setIndex, +1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-400"
                value={equipment}
                onChange={(e) =>
                  changeEquipment(exerciseIndex, setIndex, e.target.value)
                }
              >
                <option value="">기구 선택</option>
                <option value="cable-machine">케이블 머신</option>
                <option value="smith-machine">스미스 머신</option>
                <option value="plate-machine">원판 머신</option>
                <option value="barbell">바벨</option>
                <option value="dumbbell">덤벨</option>
              </select>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">메모</div>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-400"
                type="text"
                value={memo}
                onChange={(e) =>
                  changeMemo(exerciseIndex, setIndex, e.target.value)
                }
                placeholder="세트 메모"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function createDefaultSet(equipment?: string): SetItem {
  return {
    weight: 0,
    reps: 0,
    done: false,
    synced: false,
    equipment: equipment || "cable-machine",
    memo: "",
    unit: equipment === "cable-machine" ? "lb" : "kg",
  };
}

function getPreviousRecord(
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
            return matchingSets.map((set) => ({
              weight: set.weight,
              reps: set.reps,
              done: false,
              synced: false,
              equipment: set.equipment,
              memo: "",
              unit: ruleDecision(set.equipment).unit,
            }));
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
        return foundExercise.sets.map((set) => ({
          weight: set.weight,
          reps: set.reps,
          done: false,
          synced: false,
          equipment: set.equipment || equipment || "cable-machine",
          memo: "",
          unit: ruleDecision(set.equipment || equipment || "cable-machine")
            .unit,
        }));
      }
    }

    // 이전 기록을 찾지 못한 경우
    return [createDefaultSet(equipment)];
  } catch (error) {
    console.error("Failed to load previous record:", error);
    return [createDefaultSet(equipment)];
  }
}

function AddExerciseBottomSheet({
  exercises: currentExercises,
  addExercisesToSession,
  onClose,
}: {
  exercises: Exercises;
  addExercisesToSession: (newExercises: Exercises) => void;
  onClose: () => void;
}) {
  const { libraryState } = useExerciseLibrary();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (libraryState.status === "success" && selectedCategory === null) {
      if (libraryState.categories.length > 0) {
        setSelectedCategory(libraryState.categories[0]);
      }
    }
  }, [libraryState, selectedCategory]);

  function toggleExerciseSelection(exerciseId: string) {
    setSelectedExerciseIds((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }
      return next;
    });
  }

  function handleConfirm() {
    if (libraryState.status !== "success") return;
    if (selectedExerciseIds.size === 0) return;

    const selectedIds = Array.from(selectedExerciseIds);
    const exerciseMap = new Map(
      libraryState.exercises.map((ex) => [ex.id, ex]),
    );

    const newExercises: Exercise[] = [];
    for (const id of selectedIds) {
      const libraryEx = exerciseMap.get(id);
      if (libraryEx) {
        newExercises.push({
          id: libraryEx.id,
          name: libraryEx.name,
          sets: getPreviousRecord(libraryEx.name, libraryEx.equipment),
          part: libraryEx.category as string,
          exercisePageId: libraryEx.notionPageId,
        });
      }
    }

    addExercisesToSession(newExercises);
    setSelectedExerciseIds(new Set());
    onClose();
  }

  if (libraryState.status === "loading") {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">운동 목록을 불러오는 중...</p>
      </div>
    );
  }

  if (libraryState.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <p className="text-red-500 mb-2">운동 목록을 불러오지 못했습니다</p>
        <p className="text-sm text-gray-500">{libraryState.message}</p>
      </div>
    );
  }

  if (libraryState.status === "empty") {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <p className="text-gray-500 mb-2">등록된 운동이 없습니다</p>
        <p className="text-sm text-gray-400">
          Exercise DB에 운동을 추가해주세요
        </p>
      </div>
    );
  }

  const { exercises: libraryExercises, categories } = libraryState;
  const grouped = groupExercisesByCategory(libraryExercises);

  const existingPageIds = new Set(
    currentExercises.map((ex) => ex.exercisePageId).filter(Boolean),
  );

  const availableExercises = (
    selectedCategory ? grouped.get(selectedCategory as any) || [] : []
  ).filter((ex) => !existingPageIds.has(ex.notionPageId));

  const filteredExercises = searchQuery
    ? availableExercises.filter((ex) =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : availableExercises;

  return (
    <>
      <SheetHeader>
        <SheetTitle>운동 추가</SheetTitle>
        <SheetDescription>
          세션에 추가할 운동을 선택하세요 (중복 제외됨)
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto mt-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="운동 이름 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sticky top-0 bg-white border-b z-10 pb-2">
          <div className="flex overflow-x-auto gap-2">
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

        <div className="mt-4 space-y-2">
          {filteredExercises.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchQuery
                ? "검색 결과가 없습니다"
                : existingPageIds.size > 0 && availableExercises.length === 0
                  ? "추가 가능한 운동이 없습니다 (모두 추가됨)"
                  : `${selectedCategory}에 등록된 운동이 없습니다`}
            </p>
          ) : (
            filteredExercises.map((exercise) => {
              const isSelected = selectedExerciseIds.has(exercise.id);
              return (
                <div
                  key={exercise.id}
                  onClick={() => toggleExerciseSelection(exercise.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-blue-50 border-blue-500"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {exercise.name}
                      </h3>
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
                      {isSelected && (
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
              );
            })
          )}
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <Button
          className="w-full"
          onClick={handleConfirm}
          disabled={selectedExerciseIds.size === 0}
          variant={selectedExerciseIds.size === 0 ? "outline" : "default"}
        >
          추가하기 ({selectedExerciseIds.size})
        </Button>
      </div>
    </>
  );
}
