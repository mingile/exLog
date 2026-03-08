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

export function WorkoutSessionClient({ exercises, addSet, changeWeight, changeReps, toggleDone, displayUnit, setDisplayUnit, setShowHistory, showHistory, changeMemo }: { exercises: Exercises, addSet: (exIdx: number) => void, changeWeight: (exIdx: number, setIdx: number, delta: number) => void, changeReps: (exIdx: number, setIdx: number, delta: number) => void, toggleDone: (exIdx: number, setIdx: number) => void, displayUnit: "kg" | "lb", setDisplayUnit: (unit: "kg" | "lb") => void, setShowHistory: (show: boolean) => void, showHistory: boolean, changeMemo: (exIdx : number, setIdx: number, value: string) => void }) {

    const router = useRouter();

    return (
        <main className="p-2">
            {exercises.map((ex, i) => {
                return (
                    <Accordion key={ex.id} type="single" collapsible>
                        <AccordionItem value={`item-${i}`}>
                            <AccordionTrigger>
                                <div className="flex flex-row justify-between items-center w-full">
                                    <div>{ex.name}</div>
                                    <PlusButton exerciseIndex={i} addSet={addSet} />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="grid grid-cols-1 gap-1">
                                    <div className="grid grid-cols-7 justify-items-center">
                                        <div>세트번호</div>
                                        <div>무게</div>
                                        <div>횟수</div>
                                        <div>무게 증감</div>
                                        <div>횟수 증감</div>
                                        <div>메모</div>
                                        <div>완료</div>
                                    </div>
                                    {ex.sets.map((set, j) => (
                                        <Row
                                            key={`${ex.id}-set-${j}`}
                                            exerciseIndex={i}
                                            setIndex={j}
                                            weight={displayUnit === "kg" ? set.weight+"kg" : kgToLb(set.weight).toString()+"lb"}
                                            reps={set.reps}
                                            memo={set.memo || ""}
                                            done={set.done}
                                            onWeightDelta={changeWeight}
                                            onRepsDelta={changeReps}
                                            onToggleDone={toggleDone}
                                            changeMemo={changeMemo}
                                        />
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                );
            })}            
            <div className="mt-4 flex gap-1">
                <Button className="px-3" onClick={() => setDisplayUnit(displayUnit === "kg" ? "lb" : "kg")}>
                    단위변환
                </Button>
                <Button className="px-3" onClick={() => setShowHistory(!showHistory)}>
                    지난기록
                </Button>
                <Button className="px-3" onClick={() => {
                    router.push("/api/notion/auth");
                }}>
                    Notion 연동
                </Button>
                <Button
  onClick={() => router.push("/settings/notion")}
>
  Notion 설정
</Button>
            </div>
        </main>
    );

    function kgToLb(kg: number) {
        return Math.round(kg * 2.205);
    }

    function PlusButton({
        exerciseIndex,
        addSet,
    }: {
        exerciseIndex: number;
        addSet: (exIdx: number) => void;
    }) {
        return (
            <Button
                onClick={(e) => {
                    e.stopPropagation();
                    addSet(exerciseIndex);
                }}
                className="w-5 h-5"
            >
                +
            </Button>
        );
    }

}
function Row({
    exerciseIndex,
    setIndex,
    weight,
    reps,
    done,
    onWeightDelta,
    onRepsDelta,
    onToggleDone,
    memo,
    changeMemo,
}: {
    exerciseIndex: number;
    setIndex: number;
    weight: string;
    reps: number;
    done: boolean;
    onWeightDelta: (exIdx: number, setIdx: number, delta: number) => void;
    onRepsDelta: (exIdx: number, setIdx: number, delta: number) => void;
    onToggleDone: (exIdx: number, setIdx: number) => void;
    memo: string;
    changeMemo: (exIdx: number, setIdx: number, value: string) => void;
}) {
    return (
        <div className="grid grid-cols-7 justify-items-center">
            <div>{setIndex + 1}</div>
            <div>{weight}</div>
            <div>{reps}</div>
            <div>
                <Button
                    className="w-1 h-1 ps-3 pe-3"
                    onClick={() => onWeightDelta(exerciseIndex, setIndex, -5)}
                    >
                    -
                </Button>
                <span className="text-sm"> / </span>
                <Button
                    className="w-1 h-1 ps-3 pe-3"
                    onClick={() => onWeightDelta(exerciseIndex, setIndex, +5)}
                    >
                    +
                </Button>
            </div>

            <div>
                <Button
                    className="w-1 h-1 ps-3 pe-3"
                    onClick={() => onRepsDelta(exerciseIndex, setIndex, -1)}
                    >
                    -
                </Button>
                <span className="text-sm"> / </span>
                <Button
                    className="w-1 h-1 ps-3 pe-3"
                    onClick={() => onRepsDelta(exerciseIndex, setIndex, +1)}
                    >
                    +
                </Button>
            </div>
            <input className="text-center border rounded border-orange-200" type="text" value={memo} onChange={ e =>changeMemo(exerciseIndex, setIndex, e.target.value)}/>

            <input
                type="checkbox"
                className="w-4 h-4 accent-blue-500"
                checked={done}
                onChange={() => onToggleDone(exerciseIndex, setIndex)}
            />
            <div className="border-t border-gray-300 my-0 h-1 mt-1"></div>
        </div>
    );
}
