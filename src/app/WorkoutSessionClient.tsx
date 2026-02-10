"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Exercises } from "./types";

export function WorkoutSessionClient({ exercises, addSet, changeWeight, changeReps, toggleDone }: { exercises: Exercises, addSet: (exIdx: number) => void, changeWeight: (exIdx: number, setIdx: number, delta: number) => void, changeReps: (exIdx: number, setIdx: number, delta: number) => void, toggleDone: (exIdx: number, setIdx: number) => void }) {

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
                                    <div className="grid grid-cols-6 justify-items-center">
                                        <div>세트번호</div>
                                        <div>무게</div>
                                        <div>횟수</div>
                                        <div>무게 증감</div>
                                        <div>횟수 증감</div>
                                        <div>완료</div>
                                    </div>
                                    {ex.sets.map((set, j) => (
                                        <Row
                                            key={ex.id}
                                            exerciseIndex={i}
                                            setIndex={j}
                                            weight={set.weight}
                                            reps={set.reps}
                                            done={set.done}
                                            onWeightDelta={changeWeight}
                                            onRepsDelta={changeReps}
                                            onToggleDone={toggleDone}
                                        />
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                );
            })}
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

    function Row({
        exerciseIndex,
        setIndex,
        weight,
        reps,
        done,
        onWeightDelta,
        onRepsDelta,
        onToggleDone,
    }: {
        exerciseIndex: number;
        setIndex: number;
        weight: number;
        reps: number;
        done: boolean;
        onWeightDelta: (exIdx: number, setIdx: number, delta: number) => void;
        onRepsDelta: (exIdx: number, setIdx: number, delta: number) => void;
        onToggleDone: (exIdx: number, setIdx: number) => void;
    }) {
        return (
            <div className="grid grid-cols-6 justify-items-center">
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
}
