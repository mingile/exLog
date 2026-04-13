'use client';

import { WorkoutSessionClient } from "./WorkoutSessionClient";
import { HeaderControls } from "./HeaderControls";
import { useEffect, useState } from "react";
import { Exercises, Part } from "./types";
import { WorkoutHistoryClient } from "./WorkoutHistoryClient";

const exerciseTemplate: Record<Part, Exercises> = {
    back: [
        {
            id: "back-1",
            name: "Pull - Up",
            sets: [{ weight: 0, reps: 5, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        },
        {
            id: "back-2",
            name: "Latpulldown",
            sets: [{ weight: 55, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        },
        {
            id: "back-3",
            name: "Lateral-Row",
            sets: [{ weight: 80, reps: 12, done: false, synced: false, equipment: "plate-machine", memo: "", unit: "kg", rpe: null }],
        },
        {
            id: "back-4",
            name: "Barbell-Row",
            sets: [{ weight: 60, reps: 12, done: false, synced: false, equipment: "barbell", memo: "", unit: "kg", rpe: null }],
        },
        {
            id: "back-5",
            name: "Face-Pull",
            sets: [{ weight: 40, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit:"lb", rpe: null }]
        },
        {
            id: "back-6",
            name: "Seated-Cable-Row",
            sets: [{ weight: 30, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        },
        {
            id: "back-7",
            name: "Deadlift",
            sets: [{ weight: 80, reps: 5, done: false, synced: false, equipment: "barbell", memo: "", unit: "kg", rpe: null }]
        }
    ],
    chest: [
        {
            id: "chest-1",
            name: "Chest-Press",
            sets: [{ weight: 63, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        },
        {
            id: "chest-2",
            name: "Incline-Bench-Press",
            sets: [{ weight: 15, reps: 12, done: false, synced: false, equipment: "plate-machine", memo: "", unit: "kg", rpe: null }],
        },
        {
            id: "chest-3",
            name: "Cable-Cross",
            sets: [{ weight: 27, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        },
        {
            id: "chest-4",
            name: "Pec-Deck-Fly",
            sets: [{ weight: 27, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        },
        {
            id: "chest-5",
            name: "Dumbbell-Pullover",
            sets: [{ weight: 18, reps: 12, done: false, synced: false, equipment: "dumbbell", memo: "", unit: "kg", rpe: null }],
        },
    ],
    legs: [
        {
            id: "legs-1",
            name: "Leg-Press",
            sets: [{ weight: 112, reps: 12, done: false, synced: false, equipment: "plate-machine", memo: "", unit: "kg", rpe: null }],
        },
        {
            id: "legs-2",
            name: "Leg-Curl",
            sets: [{ weight: 30, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        },
        {
            id: "legs-3",
            name: "Calf-Rise",
            sets: [{ weight: 31, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        },
        {
            id: "legs-4",
            name: "Hip-Thrust",
            sets: [{ weight: 40, reps: 12, done: false, synced: false, equipment: "plate-machine", memo: "", unit: "kg", rpe: null }],
        },
        {
            id: "legs-5",
            name: "Hip-Abduction",
            sets: [{ weight: 40, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        },
        {
            id: "legs-6",
            name: "Hip-Adduction",
            sets: [{ weight: 40, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        },
        {
            id: "legs-7",
            name: "Bulgarian-Split-Squat",
            sets: [{ weight: 8, reps: 12, done: false, synced: false, equipment: "dumbbell", memo: "", unit: "kg", rpe: null }],
        },
        {
            id: "legs-8",
            name: "Glute-Kickback",
            sets: [{ weight: 20, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        }
    ],
    shoulders: [
        {
            id: "shoulders-1",
            name: "Overhead-Press",
            sets: [{ weight: 40, reps: 12, done: false, synced: false, equipment: "smith-machine", memo: "", unit: "kg", rpe: null }],
        },
        {
            id: "shoulders-2",
            name: "Shoulder-Press",
            sets: [{ weight: 50, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        },
        {
            id: "shoulders-3",
            name: "Lateral-Raise",
            sets: [{ weight: 60, reps: 12, done: false, synced: false, equipment: "cable-machine", memo: "", unit: "lb", rpe: null }],
        },
        {
            id: "shoulders-4",
            name: "Upright-Row",
            sets: [{ weight: 40, reps: 12, done: false, synced: false, equipment: "barbell", memo: "", unit: "kg", rpe: null }],
        }
    ],
};

const KG_TO_LB = 2.205;

export function RootClient() {

    const [exercises, setExercises] = useState<Exercises>(exerciseTemplate.back);
    const [hydrated, setHydrated] = useState(false);
    const [selectedPart, setSelectedPart] = useState<Part>("back");
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [historyVersion, setHistoryVersion] = useState<number>(0);
    const [saving, setSaving] = useState<boolean>(false);
    const [notionReady, setNotionReady] = useState<boolean>(false);

    useEffect(() => {
        if (!hydrated) return;
        if (!notionReady) return;

        const fetchWorkoutRecords = async () => {
          try {
            const res = await fetch("/api/notion/workout-records?limit=50", {
              method: "GET",
              credentials: "include",
            });

            const data = await res.json();

            function getTitle(properties: any) {
                if (!properties) return null;
                if (!properties.Name) return null;
                if (!Array.isArray(properties.Name.title)) return null;
                if (properties.Name.title.length === 0) return null;
                const title = properties.Name.title.map((t:any)=>t.plain_text).join("");
                if (title.trim() === "") return null;
                return title;
            }
            function getSetNo(properties: any) {
                if (!properties) return null;
                return properties["Set No"]?.number ?? null;
            }
            function getWeight(properties: any) {
                if (!properties) return null;
                return properties.Weight?.number ?? null;
            }
            function getReps(properties: any) {
                if (!properties) return null;
                return properties.Reps?.number ?? null;
            }
            function getDate(properties: any) {
                if (!properties) return null;
                if (!properties.Date) return null;
                if (!properties.Date.date) return null;
                if (!properties.Date.date.start) return null;
                return properties.Date.date.start;
            }
            function getPart(properties: any) {
                if (!properties) return null;
                if (!properties.Part) return null;
                if (!properties.Part.select) return null;
                if (!properties.Part.select.name) return null;
                return properties.Part.select.name;
            }
            function getExercise(properties: any) {
                if (!properties) return null;
                if (!properties.Exercise) return null;
                if (!Array.isArray(properties.Exercise.rich_text)) return null;
                if (properties.Exercise.rich_text.length === 0) return null;
                const exercise = properties.Exercise.rich_text.map((t:any)=>t.plain_text).join("");
                if (exercise.trim() === "") return null;
                return exercise;
            }
            function getMemo(properties: any) {
                if (!properties) return null;
                if (!properties.Memo) return null;
                if (!Array.isArray(properties.Memo.rich_text)) return null;
                if (properties.Memo.rich_text.length === 0) return null;
                const memo = properties.Memo.rich_text.map((t:any)=>t.plain_text).join("");
                if (memo.trim() === "") return null;
                return memo;
            }

            function getEquipment(properties: any) {
                if (!properties) return null;
                const name = properties.Equipment?.select?.name;
                if (typeof name !== "string" || name.trim() === "") return null;
                switch (name) {
                    case "케이블":
                        return "cable-machine";
                    case "스미스":
                        return "smith-machine";
                    case "원판":
                        return "plate-machine";
                    case "바벨":
                        return "barbell";
                    case "덤벨":
                        return "dumbbell";
                    default:
                        return null;
                }
            }

            const rawRow = data.results.map((result: any) => {
              return {
                title: getTitle(result.properties),
                setNo: getSetNo(result.properties),
                weight: getWeight(result.properties),
                reps: getReps(result.properties),
                date: getDate(result.properties),
                part: getPart(result.properties),
                exercise: getExercise(result.properties),
                memo: getMemo(result.properties),
                equipment: getEquipment(result.properties),
              };
            });

            setExercises((prev) => {
                const filteredRow = rawRow.filter(
                    (row: any) =>
                        row.part === selectedPart && prev.some((ex: any) => ex.name === row.exercise)
                );

                const groupedRow = filteredRow.reduce((acc: any, row: any) => {
                    if (!acc[row.exercise]) {
                        acc[row.exercise] = [];
                    }
                    acc[row.exercise].push(row);
                    return acc;
                }, {});

                const filteredRowbyExercise = Object.values(groupedRow).map((group: any) => {
                    return group.sort((a: any, b: any) => {
                        if (new Date(b.date).getTime() === new Date(a.date).getTime()) {
                            return (b.setNo ?? 0) - (a.setNo ?? 0);
                        }
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                    })[0];
                });

                const latestMap = filteredRowbyExercise.reduce((acc: any, row: any) => {
                    acc[row.exercise] = row;
                    return acc;
                }, {});

                return prev.map((ex: any) => {
                    const latest = latestMap[ex.name];

                    if (!latest) return ex;
                    if (ex.sets[0]?.done === true) return ex;

                    const newSets = ex.sets.map((set: any, index: number) => {
                        if (index !== 0) return set;

                        return {
                            ...set,
                            weight: latest.weight ?? set.weight,
                            reps: latest.reps ?? set.reps,
                            memo: latest.memo ?? set.memo,
                            equipment: latest.equipment ?? set.equipment,
                        };
                    });

                    return {
                        ...ex,
                        sets: newSets,
                    };
                });
            });
          } catch (error) {
            console.error("fetch 실패:", error);
          }
        };

        fetchWorkoutRecords();
    }, [selectedPart, hydrated, notionReady]);

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
        ): v is { weight: number; reps: number; done: boolean, synced: boolean, equipment: string, memo: string, unit?: "kg" | "lb", rpe: number | null } {
            if (!isObject(v)) return false;
            return (
                isNumber(v.weight) &&
                isNumber(v.reps) &&
                typeof v.done === "boolean" &&
                typeof v.synced === "boolean" &&
                typeof v.equipment === "string" &&
                typeof v.memo === "string" &&
                (v.unit === undefined || v.unit === "kg" || v.unit === "lb") &&
                (v.rpe === undefined || v.rpe === null || isNumber(v.rpe))
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
            sets: { weight: number; reps: number; done: boolean, synced: boolean, equipment: string, memo: string, unit?: "kg" | "lb", rpe: number | null }[];
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
                    const migratedExercises = parsedEx.exercises.map((ex) => ({
                        ...ex,
                        sets: ex.sets.map((set) => ({
                            ...set,
                            unit: set.unit ?? (set.equipment === "cable-machine" ? "lb" : "kg"),
                            rpe: set.rpe ?? null,
                        })),
                    }));
                    setExercises(migratedExercises);
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

    function ruleDecision(equipment: string): { unit: "kg" | "lb"; step: number; stepUnit: "kg" | "lb" } {
        let unit = 'kg';
        let step = 0;
        let stepUnit = 'kg';
        switch(equipment){
            case 'cable-machine':
                unit = 'lb';
                step = 10;
                stepUnit = 'lb';
                break;
            case 'plate-machine':
                unit = 'kg';
                step = 2.5;
                stepUnit = 'kg';
                break;
            case 'barbell':
                unit = 'kg';
                step = 2.5;
                stepUnit = 'kg';
                break;
            case 'dumbbell':
                unit = 'kg';
                step = 1;
                stepUnit = 'kg';
                break;
            case 'smith-machine':
                unit = 'kg';
                step = 2.5;
                stepUnit = 'kg';
                break;
            default:
                unit = 'kg';
                step = 5;
                stepUnit = 'kg';
                break;
        }
        return { unit: unit as "kg" | "lb", step, stepUnit: stepUnit as "kg" | "lb" };
    }

    function nextWeight(weight: number, equipment: string, direction: "increase"|"decrease") {
        const {unit, step, stepUnit} = ruleDecision(equipment);
        let delta = 0;
        if (stepUnit === 'kg') {
            delta = direction==='increase' ? step : -step;
        } else {
            delta = direction === 'increase' ? step / KG_TO_LB : -(step / KG_TO_LB);
        }
        if (weight + delta < 0) return 0;
        return weight + delta
    }

    function displayWeightUnit(weight: number, unit: "kg" | "lb"): { displayWeight: number, displayUnit: "kg" | "lb" } {
        let displayWeight = weight;
        let displayUnit: "kg" | "lb" = unit;

        if (unit === "lb") {
            displayWeight = Math.round(weight * KG_TO_LB);
        } else {
            displayWeight = Math.round(weight * 10) / 10;
        }

        return { displayWeight, displayUnit };
    }

    function deleteSet(exId: string, setIdx: number){
        setExercises(prev => {
            return prev.map(ex => {
                if(ex.id !== exId) return ex;
                if(ex.sets.length === 1) return ex;
                return {
                    ...ex,
                    sets: ex.sets.filter((set, idx) => idx !== setIdx)
                }
            });
        });
    }

    function changeName(exIdx: number, value: string){
        setExercises((prev) =>
            prev.map((ex,i) => {
                if(i !== exIdx) return ex;
                return{
                    ...ex,
                    name: value
                }
            })
        )
    }


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

    function changeWeight(exIdx: number, setIdx: number, nextWeight: number) {
        setExercises((prev) =>
            prev.map((ex, i) => {
                if (i !== exIdx) return ex;
                return {
                    ...ex,
                    sets: ex.sets.map((s, j) => {
                        if (j !== setIdx) return s;
                        return { ...s, weight: nextWeight, synced: false };
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

    function changeEquipment(exIdx: number, setIdx: number, equipment: string) {
        setExercises((prev) =>
            prev.map((ex, i) => {
                if (i !== exIdx) return ex;
                return {
                    ...ex,
                    sets: ex.sets.map((s, j) => {
                        if (j !== setIdx) return s;
                        return { ...s, equipment, synced: false };
                    }),
                };
            }),
        );
    }

    function changeUnit(exIdx: number, setIdx: number, unit: "kg" | "lb") {
        setExercises((prev) =>
            prev.map((ex, i) => {
                if (i !== exIdx) return ex;
                return {
                    ...ex,
                    sets: ex.sets.map((s, j) => {
                        if (j !== setIdx) return s;
                        return { ...s, unit, synced: false };
                    }),
                };
            }),
        );
    }

    function changeRpe(exIdx: number, setIdx: number, rpe: null | number){
        setExercises(prev => 
            prev.map((ex, i) => {
                if (i !== exIdx) return ex;
                return {
                    ...ex,
                    sets: ex.sets.map((s,j) => {
                        if (j !== setIdx) return s;
                        return { ...s, rpe, synced: false };
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
                            equipment: ex.sets[ex.sets.length - 1].equipment,
                            memo: "",
                            unit: ex.sets[ex.sets.length - 1].unit,
                            rpe: null,
                        },
                    ],
                };
            }),
        );
    }

    function clearDoneStatus() {
        if (confirm("체크 상태를 초기화하시겠습니까?")) {
            setExercises((prev) =>
                prev.map((ex) => ({
                    ...ex,
                    sets: ex.sets.map((set) => ({
                        ...set,
                        done: false,
                    })),
                })),
            );
        }
    }
    function onSelectPart(part: Part) {
        setSelectedPart(part);
        setExercises(
            exerciseTemplate[part].map((ex) => ({
                ...ex,
                sets: ex.sets.map((s) => ({ ...s, done: false })),
            })),
        );
    }

    function onSavedHistory(){
        setHistoryVersion(v=>v + 1);
    }

    const [date, setDate] = useState<string>(() => {
        const today = new Date();
        return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
    });

    // if (entryMode === "loading") {
    //     return <div className="flex flex-col h-100vh min-h-screen text-center items-center justify-center">Loading...</div>;
    //   }
      
    //   if (entryMode === "onboarding") {
    //     return <div className="flex flex-col h-100vh min-h-screen text-center items-center justify-center">Onboarding</div>;
    //   }
      
    //   if (entryMode === "library") {
    //     return <div className="flex flex-col h-100vh min-h-screen text-center items-center justify-center">Library</div>;
    //   }

    return (
                <div className="flex flex-col h-100vh min-h-screen">
                    <HeaderControls onSavedHistory={onSavedHistory} date={date} selectedPart={selectedPart} onSelectPart={onSelectPart} clearDoneStatus={clearDoneStatus} exercises={exercises} setExercises={setExercises} saving={saving} setSaving={setSaving} notionReady={notionReady} setNotionReady={setNotionReady} />
                    <WorkoutSessionClient exercises={exercises} changeReps={changeReps} changeWeight={changeWeight} toggleDone={toggleDone} addSet={addSet} setShowHistory={setShowHistory} showHistory={showHistory} changeMemo={changeMemo} changeName={changeName} deleteSet={deleteSet} displayWeightUnit={displayWeightUnit} nextWeight={nextWeight} changeEquipment={changeEquipment} changeUnit={changeUnit} changeRpe={changeRpe} />
                    <div className="overflow-y-auto f1lex-grow pb-16">
                        <WorkoutHistoryClient showHistory={showHistory} historyVersion={historyVersion} />
                </div>
            </div>
    );
}