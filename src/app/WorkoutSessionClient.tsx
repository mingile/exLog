"use client";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export function WorkoutSessionClient() {
  const [exercises, setExercises] = useState<
    {
      id: string;
      name: string;
      sets: { weight: number; reps: number; done: boolean }[];
    }[]
  >([
    {
      id: "pullup",
      name: "Pull - Up",
      sets: [{ weight: 10, reps: 12, done: false }],
    },
    {
      id: "latpulldown",
      name: "Latpulldown",
      sets: [{ weight: 20, reps: 12, done: false }],
    },
    {
      id: "lateralrow",
      name: "Lateral-Row",
      sets: [{ weight: 30, reps: 12, done: false }],
    },
    {
      id: "barbellrow",
      name: "Barbell-Row",
      sets: [{ weight: 40, reps: 12, done: false }],
    },
  ]);
  const [hydrated, setHydrated] = useState(false);

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
    try {
      if (storedEx) {
        const parsedEx = JSON.parse(storedEx);
        if (isExerciseArray(parsedEx)) {
          setExercises(parsedEx);
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
    localStorage.setItem("workout.session.v1", JSON.stringify(exercises));
  }, [exercises, hydrated]);

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

  return (
    <>
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
      <div className="flex items-center justify-end w-full gap-2">
        <Button
          onClick={() => {
            const savedAt = new Date().toISOString();
            const savedExercises = exercises
              .map((ex) => {
                const doneSets = ex.sets
                  .map((set, i) => {
                    return {
                      set,
                      setNo: i + 1,
                    };
                  })
                  .filter(({ set }) => set.done);
                return {
                  ...ex,
                  sets: doneSets,
                };
              })
              .filter((ex) => ex.sets.length > 0)
              .map((ex) => {
                return {
                  id: ex.id,
                  name: ex.name,
                  sets: ex.sets.map(({ set, setNo }) => {
                    return {
                      setNo,
                      weight: set.weight,
                      reps: set.reps,
                    };
                  }),
                };
              });
            const payload = {
              savedAt,
              exercises: savedExercises,
            };
            if (savedExercises.length > 0) {
              const sessionKey = "workout.sessions.v1";
              const session = localStorage.getItem(sessionKey);
              try {
                if (session) {
                  const sessionData = JSON.parse(session);
                  sessionData.unshift(payload);
                  localStorage.setItem(sessionKey, JSON.stringify(sessionData));
                } else {
                  const sessionData = [];
                  sessionData.push(payload);
                  localStorage.setItem(sessionKey, JSON.stringify(sessionData));
                }
              } catch (e) {
                console.error("올바르지 않은 JSON 데이터", e);
                localStorage.removeItem("workout.sessions.v1");
              }
            } else {
              alert("완료된 세트가 없어요");
              return;
            }
          }}
        >
          저장
        </Button>
        <Button
          onClick={() => {
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
          }}
        >
          초기화
        </Button>
      </div>
    </>
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
