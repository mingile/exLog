'use client';

import { WorkoutSessionClient } from "./WorkoutSessionClient";
import { HeaderControls } from "./HeaderControls";
import { useEffect, useState } from "react";
import { Exercise, Exercises } from "./types";

export function RootClient() {

    const exerciseTemplate: Record<string, Exercise[]> = {
        back: [
            {
                id: "pullup",
                name: "Pull - Up",
                sets: [{ weight: 0, reps: 5, done: false }],
            },
            {
                id: "latpulldown",
                name: "Latpulldown",
                sets: [{ weight: 55, reps: 12, done: false }],
            },
            {
                id: "lateralrow",
                name: "Lateral-Row",
                sets: [{ weight: 80, reps: 12, done: false }],
            },
            {
                id: "barbellrow",
                name: "Barbell-Row",
                sets: [{ weight: 60, reps: 12, done: false }],
            },
            {
                id: "facepull",
                name: "Face-Pull",
                sets: [{ weight: 40, reps: 12, done: false }]
            }
        ],
        chest: [
            {
                id: "chestpress",
                name: "Chest-Press",
                sets: [{ weight: 63, reps: 12, done: false }],
            },
            {
                id: "inclinebenchpress",
                name: "Incline-Bench-Press",
                sets: [{ weight: 15, reps: 12, done: false }],
            },
            {
                id: "cablecrossover",
                name: "Cable-Cross",
                sets: [{ weight: 27, reps: 12, done: false }],
            },
            {
                id: "pecdeckfly",
                name: "Pec-Deck-Fly",
                sets: [{ weight: 27, reps: 12, done: false }],
            },
            {
                id: "dumbbellpullover",
                name: "Dumbbell-Pullover",
                sets: [{ weight: 18, reps: 12, done: false }],
            },
        ],
        legs: [
            {
                id: "legpress",
                name: "Leg-Press",
                sets: [{ weight: 112, reps: 12, done: false }],
            },
            {
                id: "legcurl",
                name: "Leg-Curl",
                sets: [{ weight: 30, reps: 12, done: false }],
            },
            {
                id: "calfraise",
                name: "Calf-Rise",
                sets: [{ weight: 31, reps: 12, done: false }],
            },
            {
                id: "hipthrust",
                name: "Hip-Thrust",
                sets: [{ weight: 40, reps: 12, done: false }],
            },
            {
                id: "hipabduction",
                name: "Hip-Abduction",
                sets: [{ weight: 40, reps: 12, done: false }],
            },
            {
                id: "hipadduction",
                name: "Hip-Adduction",
                sets: [{ weight: 40, reps: 12, done: false }],
            },
            {
                id: "bulgariansplitsquat",
                name: "Bulgarian-Split-Squat",
                sets: [{ weight: 8, reps: 12, done: false }],
            }
        ],
        shoulders: [
            {
                id: "ohp",
                name: "Overhead-Press",
                sets: [{ weight: 40, reps: 12, done: false }],
            },
            {
                id: "shoulderpress",
                name: "Shoulder-Press",
                sets: [{ weight: 50, reps: 12, done: false }],
            },
            {
                id: "lateralraise",
                name: "Lateral-Raise",
                sets: [{ weight: 60, reps: 12, done: false }],
            },
            {
                id: "uprightrow",
                name: "Upright-Row",
                sets: [{ weight: 40, reps: 12, done: false }],
            }
        ],
    };

    const [exercises, setExercises] = useState<Exercises>(exerciseTemplate.back);
    const [hydrated, setHydrated] = useState(false);
    const [selectedPart, setSelectedPart] = useState<("back" | "chest" | "legs" | "shoulders")>("back");


    useEffect(() => {
        const storedEx = localStorage.getItem("workout.session.v1");
        function isObject(v: unknown): v is Record<string, unknown> {
            return typeof v === "object" && v !== null;
        }
        function isNumber(v: unknown): v is number {
            return typeof v === "number" && Number.isFinite(v);
        }
        function isSetItem(
            v: unknown,
        ): v is { weight: number; reps: number; done: boolean } {
            if (!isObject(v)) return false;
            return (
                isNumber(v.weight) && isNumber(v.reps) && typeof v.done === "boolean"
            );
        }
        function isExercise(
            v: unknown,
        ): v is { id: string; name: string; sets: unknown[] } {
            if (!isObject(v)) return false;
            if (typeof v.id !== "string" || v.id.trim() === "") return false;
            if (typeof v.name !== "string" || v.name.trim() === "") return false;
            if (!Array.isArray(v.sets)) return false;
            if (v.sets.length === 0) return false;
            return v.sets.every(isSetItem);
        }
        function isExerciseArray(v: unknown): v is {
            id: string;
            name: string;
            sets: { weight: number; reps: number; done: boolean }[];
        }[] {
            if (!Array.isArray(v)) return false;
            if (v.length === 0) return false;
            return v.every(isExercise);
        }
        function isPart(v: unknown): v is "back" | "chest" | "legs" | "shoulders" {
            return typeof v === "string" && ["back", "chest", "legs", "shoulders"].includes(v);
        }

        function isSession(v: unknown): v is { selectedPart: "back" | "chest" | "legs" | "shoulders"; exercises: Exercises } {
            if (!isObject(v)) return false;
            return isPart(v.selectedPart) && isExerciseArray(v.exercises);
        }

        try {
            if (storedEx) {
                const parsedEx = JSON.parse(storedEx);
                if (isSession(parsedEx)) {
                    setExercises(parsedEx.exercises);
                    setSelectedPart(parsedEx.selectedPart);
                } else {
                    localStorage.removeItem("workout.session.v1");
                }
            }
        } catch (e) {
            console.error("올바르지 않은 JSON 데이터", e);
            localStorage.removeItem("workout.session.v1");
        } finally {
            setHydrated(true);
        }
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        localStorage.setItem("workout.session.v1", JSON.stringify({ selectedPart, exercises }));
    }, [selectedPart, exercises, hydrated]);

    function changeReps(exIdx: number, setIdx: number, delta: number) {
        setExercises((prev) =>
            prev.map((ex, i) => {
                if (i !== exIdx) return ex;
                return {
                    ...ex,
                    sets: ex.sets.map((s, j) => {
                        if (j !== setIdx) return s;
                        return { ...s, reps: s.reps + delta };
                    }),
                };
            }),
        );
    }

    function changeWeight(exIdx: number, setIdx: number, delta: number) {
        setExercises((prev) =>
            prev.map((ex, i) => {
                if (i !== exIdx) return ex;
                return {
                    ...ex,
                    sets: ex.sets.map((s, j) => {
                        if (j !== setIdx) return s;
                        return { ...s, weight: s.weight + delta };
                    }),
                };
            }),
        );
    }

    function toggleDone(exIdx: number, setIdx: number) {
        setExercises((prev) =>
            prev.map((ex, i) => {
                if (i !== exIdx) return ex;
                return {
                    ...ex,
                    sets: ex.sets.map((s, j) => {
                        if (j !== setIdx) return s;
                        return { ...s, done: !s.done };
                    }),
                };
            }),
        );
    }
    function addSet(exIdx: number) {
        setExercises((prev) =>
            prev.map((ex, i) => {
                if (i !== exIdx) return ex;
                return {
                    ...ex,
                    sets: [
                        ...ex.sets,
                        {
                            weight: ex.sets[ex.sets.length - 1].weight,
                            reps: ex.sets[ex.sets.length - 1].reps,
                            done: false,
                        },
                    ],
                };
            }),
        );
    }

    function clearDoneStatus() {
        if (confirm("초기화 하시겠습니까?")) {
            setExercises((prev) =>
                prev.map((ex) => {
                    const resetSets = ex.sets.map((set) => {
                        return {
                            ...set,
                            done: false,
                        };
                    });
                    return {
                        ...ex,
                        sets: resetSets,
                    };
                }),
            );
        }
    }
    function onSelectPart(part: "back" | "chest" | "legs" | "shoulders") {
        setSelectedPart(part);
        setExercises(exerciseTemplate[part]);

    }

    const customDate = () => {
        const today = new Date();
        const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
        return (
            <span className="text-sm text-muted-foreground px-1 w-full">{formattedDate}</span>
        );
    }

    return (
        <>
            <HeaderControls customDate={customDate} selectedPart={selectedPart} onSelectPart={onSelectPart} clearDoneStatus={clearDoneStatus} exercises={exercises} />
            <WorkoutSessionClient exercises={exercises} changeReps={changeReps} changeWeight={changeWeight} toggleDone={toggleDone} addSet={addSet} />
        </>
    );
}