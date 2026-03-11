'use client';

import { WorkoutSessionClient } from "./WorkoutSessionClient";
import { HeaderControls } from "./HeaderControls";
import { useEffect, useState } from "react";
import { Exercises, Part } from "./types";
import { WorkoutHistoryClient } from "./WorkoutHistoryClient";

const exerciseTemplate: Record<Part, Exercises> = {
    back: [
        {
            id: "pullup",
            name: "Pull - Up",
            sets: [{ weight: 0, reps: 5, done: false, synced: false, memo: "" }],
        },
        {
            id: "latpulldown",
            name: "Latpulldown",
            sets: [{ weight: 55, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "lateralrow",
            name: "Lateral-Row",
            sets: [{ weight: 80, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "barbellrow",
            name: "Barbell-Row",
            sets: [{ weight: 60, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "facepull",
            name: "Face-Pull",
            sets: [{ weight: 40, reps: 12, done: false, synced: false, memo: "" }]
        },
        {
            id: "seatedcablerow",
            name: "Seated-Cable-Row",
            sets: [{ weight: 30, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "deadlift",
            name: "Deadlift",
            sets: [{ weight: 80, reps: 5, done: false, synced: false, memo: "" }]
        }
    ],
    chest: [
        {
            id: "chestpress",
            name: "Chest-Press",
            sets: [{ weight: 63, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "inclinebenchpress",
            name: "Incline-Bench-Press",
            sets: [{ weight: 15, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "cablecrossover",
            name: "Cable-Cross",
            sets: [{ weight: 27, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "pecdeckfly",
            name: "Pec-Deck-Fly",
            sets: [{ weight: 27, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "dumbbellpullover",
            name: "Dumbbell-Pullover",
            sets: [{ weight: 18, reps: 12, done: false, synced: false, memo: ""}],
        },
    ],
    legs: [
        {
            id: "legpress",
            name: "Leg-Press",
            sets: [{ weight: 112, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "legcurl",
            name: "Leg-Curl",
            sets: [{ weight: 30, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "calfraise",
            name: "Calf-Rise",
            sets: [{ weight: 31, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "hipthrust",
            name: "Hip-Thrust",
            sets: [{ weight: 40, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "hipabduction",
            name: "Hip-Abduction",
            sets: [{ weight: 40, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "hipadduction",
            name: "Hip-Adduction",
            sets: [{ weight: 40, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "bulgariansplitsquat",
            name: "Bulgarian-Split-Squat",
            sets: [{ weight: 8, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "glutekickback",
            name: "Glute-Kickback",
            sets: [{ weight: 20, reps: 12, done: false, synced: false, memo: "" }],
        }
    ],
    shoulders: [
        {
            id: "ohp",
            name: "Overhead-Press",
            sets: [{ weight: 40, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "shoulderpress",
            name: "Shoulder-Press",
            sets: [{ weight: 50, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "lateralraise",
            name: "Lateral-Raise",
            sets: [{ weight: 60, reps: 12, done: false, synced: false, memo: "" }],
        },
        {
            id: "uprightrow",
            name: "Upright-Row",
            sets: [{ weight: 40, reps: 12, done: false, synced: false, memo: "" }],
        }
    ],
};

export function RootClient() {

    const [exercises, setExercises] = useState<Exercises>(exerciseTemplate.back);
    const [hydrated, setHydrated] = useState(false);
    const [selectedPart, setSelectedPart] = useState<Part>("back");
    const [displayUnit, setDisplayUnit] = useState<"kg" | "lb">("kg");
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [historyVersion, setHistoryVersion] = useState<number>(0);
    const [saving, setSaving] = useState<boolean>(false);
    const [notionReady, setNotionReady] = useState<boolean>(false);

    useEffect(()=>{
        fetch('/api/notion/status')
        .then(res => res.json())
        .then(data => {
            setNotionReady(data.notionConnected && data.dbConnected);
        })
        .catch(err => {
            console.error('Notion 상태 조회 중 오류', err);
            setNotionReady(false);
        })
    }, [])

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
        ): v is { weight: number; reps: number; done: boolean, synced: boolean, memo: string } {
            if (!isObject(v)) return false;
            return (
                isNumber(v.weight) && isNumber(v.reps) && typeof v.done === "boolean" && typeof v.synced === "boolean" && typeof v.memo === "string"
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
            sets: { weight: number; reps: number; done: boolean, synced: boolean, memo: string }[];
        }[] {
            if (!Array.isArray(v)) return false;
            if (v.length === 0) return false;
            return v.every(isExercise);
        }
        function isPart(v: unknown): v is Part {
            return typeof v === "string" && ["back", "chest", "legs", "shoulders"].includes(v);
        }

        function isSession(v: unknown): v is { selectedPart: Part; exercises: Exercises } {
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
        localStorage.setItem("workout.settings.v1", JSON.stringify({ displayUnit }));
    }, [selectedPart, exercises, hydrated, displayUnit]);


    function changeReps(exIdx: number, setIdx: number, delta: number) {
        setExercises((prev) =>
            prev.map((ex, i) => {
                if (i !== exIdx) return ex;
                return {
                    ...ex,
                    sets: ex.sets.map((s, j) => {
                        if (j !== setIdx) return s;
                        return { ...s, reps: s.reps + delta, synced: false };
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
                        return { ...s, weight: s.weight + delta, synced: false };
                    }),
                };
            }),
        );
    }

    function changeMemo(exIdx: number, setIdx: number, value: string){
        setExercises((prev) =>
        prev.map((ex, i) => {
            if (i !== exIdx) return ex;
            return{
                ...ex,
                sets: ex.sets.map((s, j) => {
                    if (j !== setIdx) return s;
                    return { ...s, memo : value, synced: false }
                })
            }
        })
    )
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
                            synced: false,
                            memo: ""
                        },
                    ],
                };
            }),
        );
    }

    function clearDoneStatus() {
        if (confirm("모든 데이터를 초기 상태로 되돌리시겠습니까?")) {
            setExercises(exerciseTemplate[selectedPart]);
        }
    }
    function onSelectPart(part: Part) {
        setSelectedPart(part);
        setExercises(exerciseTemplate[part].map(ex => ({ ...ex, sets: ex.sets.map(s => ({ ...s, done: false })) })));
    }

    function onSavedHistory(){
        setHistoryVersion(v=>v + 1);
    }

    const [date, setDate] = useState<string>(() => {
        const today = new Date();
        return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    });

    return (
        <div className="flex flex-col h-100vh min-h-screen">
            <HeaderControls onSavedHistory={onSavedHistory} date={date} selectedPart={selectedPart} onSelectPart={onSelectPart} clearDoneStatus={clearDoneStatus} exercises={exercises} setExercises={setExercises} saving={saving} setSaving={setSaving} notionReady={notionReady} setNotionReady={setNotionReady} />
            <WorkoutSessionClient exercises={exercises} changeReps={changeReps} changeWeight={changeWeight} toggleDone={toggleDone} addSet={addSet} displayUnit={displayUnit} setDisplayUnit={setDisplayUnit} setShowHistory={setShowHistory} showHistory={showHistory} changeMemo={changeMemo}/>
            <div className="overflow-y-auto flex-grow pb-16">
            <WorkoutHistoryClient showHistory={showHistory} historyVersion={historyVersion} displayUnit={displayUnit}/>
            </div>
        </div>
    );
}