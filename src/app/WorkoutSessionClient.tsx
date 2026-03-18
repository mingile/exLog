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
import { useRef } from "react";
import { TrashIcon } from "lucide-react";

export function WorkoutSessionClient({
  exercises,
  addSet,
  changeWeight,
  changeReps,
  toggleDone,
  displayUnit,
  setDisplayUnit,
  setShowHistory,
  showHistory,
  changeMemo,
  changeName,
  deleteSet,
}: {
  exercises: Exercises;
  addSet: (exIdx: number) => void;
  changeWeight: (exIdx: number, setIdx: number, delta: number) => void;
  changeReps: (exIdx: number, setIdx: number, delta: number) => void;
  toggleDone: (exIdx: number, setIdx: number) => void;
  displayUnit: "kg" | "lb";
  setDisplayUnit: (unit: "kg" | "lb") => void;
  setShowHistory: (show: boolean) => void;
  showHistory: boolean;
  changeMemo: (exIdx: number, setIdx: number, value: string) => void;
  changeName: (exIdx: number, value: string) => void;
  deleteSet: (exId: string, setIdx: number) => void;
}) {
  const router = useRouter();

  function kgToLb(kg: number) {
    return Math.round(kg * 2.205);
  }

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
                      displayUnit={displayUnit}
                      changeEquipment={changeEquipment}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        );
      })}

      <div className="grid grid-cols-2 gap-2 pt-2">
        <Button onClick={() => setDisplayUnit(displayUnit === "kg" ? "lb" : "kg")}>
          단위변환
        </Button>
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
  displayUnit,
  changeEquipment,
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
  displayWeightUnit: (weight: number, equipment: string, displayUnit: "kg" | "lb") => { displayWeight: number, unit: "kg" | "lb" };
  nextWeight: (weight: number, equipment: string, direction: "increase"|"decrease") => number;
  displayUnit: "kg" | "lb";
  changeEquipment: (exIdx: number, setIdx: number, equipment: string) => void;
}) {
  const { displayWeight, unit } = displayWeightUnit(weight, equipment, displayUnit);
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
          <div className="mt-1 text-lg font-semibold">{weightLabel}</div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <div className="text-xs text-muted-foreground">횟수</div>
          <div className="mt-1 text-lg font-semibold">{reps}회</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <ControlBlock
          label="무게 조절"
          onMinus={() => onWeightDelta(exerciseIndex, setIndex, -5)}
          onPlus={() => onWeightDelta(exerciseIndex, setIndex, +5)}
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