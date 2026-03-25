"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Exercises } from "./types";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TrashIcon } from "lucide-react";

export function WorkoutSessionClient({
  exercises,
  displayWeightUnit,
  nextWeight,
  addSet,
  changeWeight,
  changeReps,
  toggleDone,
  setShowHistory,
  showHistory,
  changeMemo,
  changeName,
  deleteSet,
  changeEquipment,
  changeUnit,
}: {
  exercises: Exercises;
  displayWeightUnit: (weight: number, unit: "kg" | "lb") => { displayWeight: number, displayUnit: "kg" | "lb" };
  nextWeight: (weight: number, equipment: string, direction: "increase"|"decrease") => number;
  addSet: (exIdx: number) => void;
  changeWeight: (exIdx: number, setIdx: number, nextWeight: number) => void;
  changeReps: (exIdx: number, setIdx: number, delta: number) => void;
  toggleDone: (exIdx: number, setIdx: number) => void;
  setShowHistory: (show: boolean) => void;
  showHistory: boolean;
  changeMemo: (exIdx: number, setIdx: number, value: string) => void;
  changeName: (exIdx: number, value: string) => void;
  deleteSet: (exId: string, setIdx: number) => void;
  changeEquipment: (exIdx: number, setIdx: number, equipment: string) => void;
  changeUnit: (exIdx: number, setIdx: number, unit: "kg" | "lb") => void;
}) {
  const router = useRouter();


  const originalNames = useRef<Record<number, string>>({});
  
  return (
    <main className="p-2 space-y-2">
      {exercises.map((ex, i) => {
        return (
          <Accordion key={ex.id} type="single" collapsible>
            <AccordionItem value={`item-${i}`} className="rounded-lg border px-2">
              <AccordionTrigger className="py-3">
                <div className="flex w-full items-center justify-between pr-2">
                  <input
                    type="text"
                    value={ex.name}
                    onFocus={() => originalNames.current[i] = ex.name}
                    // react의 controlled input vs uncontrolled input
                    onChange={(e) => {
                      changeName(i, e.currentTarget.value)
                    }
                    }
                    onBlur={(e) => {
                      if(e.currentTarget.value.trim() === "" || e.currentTarget.value === originalNames.current[i]){
                        changeName(i, originalNames.current[i]);
                        console.log(e.currentTarget.value);
                      }
                    }} 
                    
                    className="text-base font-medium"
                  />
                  <PlusButton exerciseIndex={i} addSet={addSet} />
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

      <div className="grid grid-cols-1 gap-2 pt-2">
        <Button onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "기록 닫기" : "지난기록"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            router.push("/api/notion/auth");
          }}
        >
          Notion 연동
        </Button>
        <Button variant="outline" onClick={() => router.push("/settings/notion")}>
          Notion 설정
        </Button>
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
        className="h-9 w-9 rounded-full p-0 text-lg"
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
  displayWeightUnit: (weight: number, unit: "kg" | "lb") => { displayWeight: number, displayUnit: "kg" | "lb" };
  nextWeight: (weight: number, equipment: string, direction: "increase"|"decrease") => number;
  changeEquipment: (exIdx: number, setIdx: number, equipment: string) => void;
  changeUnit: (exIdx: number, setIdx: number, unit: "kg" | "lb") => void;
  unit: "kg" | "lb";
}) {
  const { displayWeight, displayUnit } = displayWeightUnit(weight, unit);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [draftWeight, setDraftWeight] = useState<string>(String(displayWeight));

  useEffect(() => {
    if (isEditingWeight) return;
    setDraftWeight(String(displayWeight));
  }, [displayWeight, isEditingWeight]);

  function beginWeightEdit() {
    setDraftWeight(String(displayWeight));
    setIsEditingWeight(true);
  }

  function convertInputToKg(value: string): number | null {
    const trimmed = value.trim();
    if (trimmed === "") return null;

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return null;

    if (unit === "kg") {
      const normalizedKg = Math.round(parsed * 10) / 10;
      if (normalizedKg < 0) return null;
      return normalizedKg;
    }

    const normalizedLb = Math.round(parsed);
    if (normalizedLb < 0) return null;
    return Math.round((normalizedLb / KG_TO_LB) * 10) / 10;
  }

  function commitWeightEdit() {
    const nextKg = convertInputToKg(draftWeight);

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

  return (
    <div className="rounded-xl border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">세트 {setIndex + 1}
        <Button variant="outline" className="ml-3 size-8" 
        onClick={e => {
          e.stopPropagation();
          deleteSet(exId, setIndex);
        }}>
          <TrashIcon className="h-5 w-5" />
        </Button>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          완료
          <input
            type="checkbox"
            className="h-5 w-5 accent-blue-500"
            checked={done}
            onChange={() => onToggleDone(exerciseIndex, setIndex)}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="text-xs text-muted-foreground">무게</div>
          {isEditingWeight ? (
            <div className="mt-1 flex items-center justify-center gap-1">
              <input
                type="number"
                inputMode="decimal"
                step={displayUnit === "kg" ? "0.1" : "1"}
                className="w-20 rounded-md border bg-background px-2 py-1 text-center text-lg font-semibold outline-none focus:border-blue-400"
                value={draftWeight}
                onChange={(e) => setDraftWeight(e.currentTarget.value)}
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
              <span className="text-lg font-semibold">{displayUnit}</span>
            </div>
          ) : (
            <button
              type="button"
              className="mt-1 text-lg font-semibold"
              onClick={beginWeightEdit}
            >
              {displayWeight}{displayUnit}
            </button>
          )}
          <div className="mt-2 flex justify-center gap-2">
            <Button
              type="button"
              variant={unit === "kg" ? "default" : "outline"}
              className="h-7 px-3 text-xs"
              onClick={() => changeUnit(exerciseIndex, setIndex, "kg")}
            >
              kg
            </Button>
            <Button
              type="button"
              variant={unit === "lb" ? "default" : "outline"}
              className="h-7 px-3 text-xs"
              onClick={() => changeUnit(exerciseIndex, setIndex, "lb")}
            >
              lb
            </Button>
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="text-xs text-muted-foreground">횟수</div>
          <div className="mt-1 text-lg font-semibold">{reps}회</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ControlBlock
          label="무게 조절"
          onMinus={() => onWeightChange(exerciseIndex, setIndex, nextWeight(weight, equipment, "decrease"))}
          onPlus={() => onWeightChange(exerciseIndex, setIndex, nextWeight(weight, equipment, "increase"))}
        />
        <ControlBlock
          label="횟수 조절"
          onMinus={() => onRepsDelta(exerciseIndex, setIndex, -1)}
          onPlus={() => onRepsDelta(exerciseIndex, setIndex, +1)}
        />
      </div>

      <div className="space-y-1">
      <div className="text-xs text-muted-foreground">기구</div>
        <select
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-400"
          value={equipment}
          onChange={(e) => changeEquipment(exerciseIndex, setIndex, e.target.value)}
        >
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
          onChange={(e) => changeMemo(exerciseIndex, setIndex, e.target.value)}
          placeholder="세트 메모"
        />
      </div>
    </div>
  );
}

function ControlBlock({
  label,
  onMinus,
  onPlus,
}: {
  label: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="rounded-lg border p-2">
      <div className="mb-2 text-center text-xs text-muted-foreground">{label}</div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" className="h-10" onClick={onMinus}>
          -
        </Button>
        <Button type="button" variant="outline" className="h-10" onClick={onPlus}>
          +
        </Button>
      </div>
    </div>
  );
}