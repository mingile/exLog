"use client";

import { WorkoutSessionClient } from "./WorkoutSessionClient";
import { HeaderControls } from "./HeaderControls";
import { useEffect, useState } from "react";
import { Exercises, Part, SessionDraft, SessionMetadata } from "./types";
import { WorkoutHistoryClient } from "./WorkoutHistoryClient";
import NotionSettingsPage from "./settings/notion/NotionSettingsClient";
import { LibraryClient } from "./LibraryClient";
import { kgToLb, lbToKg, nextWeight } from "@/lib/weightUnit";

export function RootClient() {
  const [exercises, setExercises] = useState<Exercises>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyVersion, setHistoryVersion] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [entryMode, setEntryMode] = useState<"loading" | "session" | "library">(
    "loading",
  );
  const [sessionMetadata, setSessionMetadata] =
    useState<SessionMetadata | null>(null);

  const [notionStatusLoading, setNotionStatusLoading] = useState<boolean>(true);
  const [notionConnected, setNotionConnected] = useState<boolean>(false);
  const [dbConnected, setDbConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!dbConnected) return;
    if (entryMode !== "session") return;
    if (!sessionMetadata) return;
    if (!exercises.length) return;

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
          const title = properties.Name.title
            .map((t: any) => t.plain_text)
            .join("");
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
        function getMemo(properties: any) {
          if (!properties) return null;
          if (!properties.Memo) return null;
          if (!Array.isArray(properties.Memo.rich_text)) return null;
          if (properties.Memo.rich_text.length === 0) return null;
          const memo = properties.Memo.rich_text
            .map((t: any) => t.plain_text)
            .join("");
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

        function getRpe(properties: any) {
          if (!properties) return null;
          return properties.RPE?.number ?? null;
        }

        function getExerciseRelation(properties: any) {
          if (!properties) return null;
          if (!properties.Exercise) return null;
          if (!Array.isArray(properties.Exercise.relation)) return null;
          if (properties.Exercise.relation.length === 0) return null;
          return properties.Exercise.relation[0]?.id ?? null;
        }

        const rawRow = data.results.map((result: any) => {
          return {
            title: getTitle(result.properties),
            setNo: getSetNo(result.properties),
            weight: getWeight(result.properties),
            reps: getReps(result.properties),
            date: getDate(result.properties),
            part: getPart(result.properties),
            exercisePageId: getExerciseRelation(result.properties),
            memo: getMemo(result.properties),
            equipment: getEquipment(result.properties),
            rpe: getRpe(result.properties),
          };
        });

        setExercises((prev) => {
          // Exercise pageId로 필터링
          const filteredRow = rawRow.filter(
            (row: any) =>
              row.exercisePageId &&
              prev.some((ex: any) => ex.exercisePageId === row.exercisePageId),
          );

          // Exercise pageId 기준으로 그룹핑
          const groupedRow = filteredRow.reduce((acc: any, row: any) => {
            const key = row.exercisePageId;
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(row);
            return acc;
          }, {});

          // 각 그룹에서 최신 row 1개 선택 (날짜 최신, 같은 날짜면 setNo 큰 것)
          const filteredRowbyExercise = Object.values(groupedRow).map(
            (group: any) => {
              return group.sort((a: any, b: any) => {
                if (new Date(b.date).getTime() === new Date(a.date).getTime()) {
                  return (b.setNo ?? 0) - (a.setNo ?? 0);
                }
                return new Date(b.date).getTime() - new Date(a.date).getTime();
              })[0];
            },
          );

          // Exercise pageId를 key로 맵 생성
          const latestMap = filteredRowbyExercise.reduce(
            (acc: any, row: any) => {
              acc[row.exercisePageId] = row;
              return acc;
            },
            {},
          );

          return prev.map((ex: any) => {
            // Exercise pageId로 최신 기록 조회
            const latest = latestMap[ex.exercisePageId];

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
                rpe: latest.rpe ?? set.rpe,
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
  }, [hydrated, dbConnected, entryMode, sessionMetadata?.sessionId]);

  useEffect(() => {
    const storedDraft = localStorage.getItem("workout.currentSession.v1");
    const oldStoredEx = localStorage.getItem("workout.session.v1");

    function isObject(v: unknown): v is Record<string, unknown> {
      return typeof v === "object" && v !== null;
    }
    function isNumber(v: unknown): v is number {
      return typeof v === "number" && Number.isFinite(v);
    }
    function isSetItem(v: unknown): v is {
      weight: number;
      reps: number;
      done: boolean;
      synced: boolean;
      equipment: string;
      memo: string;
      unit?: "kg" | "lb";
      rpe: number | null;
    } {
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
      sets: {
        weight: number;
        reps: number;
        done: boolean;
        synced: boolean;
        equipment: string;
        memo: string;
        unit?: "kg" | "lb";
        rpe: number | null;
      }[];
    }[] {
      if (!Array.isArray(v)) return false;
      if (v.length === 0) return false;
      return v.every(isExercise);
    }
    function isPart(v: unknown): v is Part {
      return (
        typeof v === "string" &&
        ["back", "chest", "legs", "shoulders"].includes(v)
      );
    }

    function isSessionMetadata(v: unknown): v is SessionMetadata {
      if (!isObject(v)) return false;
      return (
        typeof v.sessionId === "string" &&
        typeof v.sessionName === "string" &&
        typeof v.startedAt === "string"
      );
    }

    function isSessionDraft(v: unknown): v is SessionDraft {
      if (!isObject(v)) return false;
      return isSessionMetadata(v.session) && isExerciseArray(v.exercises);
    }

    function isLegacySession(
      v: unknown,
    ): v is { selectedPart: Part; exercises: Exercises } {
      if (!isObject(v)) return false;
      return isPart(v.selectedPart) && isExerciseArray(v.exercises);
    }

    try {
      if (storedDraft) {
        const parsedDraft = JSON.parse(storedDraft);
        if (isSessionDraft(parsedDraft)) {
          const migratedExercises = parsedDraft.exercises.map((ex) => ({
            ...ex,
            sets: ex.sets.map((set) => ({
              ...set,
              unit:
                set.unit ?? (set.equipment === "cable-machine" ? "lb" : "kg"),
              rpe: set.rpe ?? null,
            })),
          }));
          setExercises(migratedExercises);
          setSessionMetadata(parsedDraft.session);
        } else {
          localStorage.removeItem("workout.currentSession.v1");
        }
      } else if (oldStoredEx) {
        const parsedEx = JSON.parse(oldStoredEx);
        if (isLegacySession(parsedEx)) {
          const migratedExercises = parsedEx.exercises.map((ex) => ({
            ...ex,
            sets: ex.sets.map((set) => ({
              ...set,
              unit:
                set.unit ?? (set.equipment === "cable-machine" ? "lb" : "kg"),
              rpe: set.rpe ?? null,
            })),
            part: parsedEx.selectedPart,
          }));
          setExercises(migratedExercises);
        }
        localStorage.removeItem("workout.session.v1");
      }
    } catch (e) {
      console.error("올바르지 않은 JSON 데이터", e);
      localStorage.removeItem("workout.currentSession.v1");
      localStorage.removeItem("workout.session.v1");
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    refreshNotionStatus();
  }, [hydrated]);

  useEffect(() => {
    if (hydrated === false) return;

    const storedDraft = localStorage.getItem("workout.currentSession.v1");

    if (storedDraft) {
      setEntryMode("session");
    } else {
      setEntryMode("library");
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (entryMode !== "session") return;
    if (!exercises.length) return;
    if (!sessionMetadata) return;

    const draftData: SessionDraft = {
      session: sessionMetadata,
      exercises,
    };

    localStorage.setItem(
      "workout.currentSession.v1",
      JSON.stringify(draftData),
    );
  }, [exercises, sessionMetadata, hydrated, entryMode]);

  function displayWeightUnit(
    weight: number,
    unit: "kg" | "lb",
  ): { displayWeight: number; displayUnit: "kg" | "lb" } {
    let displayWeight = weight;
    let displayUnit: "kg" | "lb" = unit;

    if (unit === "lb") {
      displayWeight = Math.round(kgToLb(weight));
    } else {
      displayWeight = Math.round(lbToKg(weight));
    }

    return { displayWeight, displayUnit };
  }

  function deleteSet(exId: string, setIdx: number) {
    setExercises((prev) => {
      return prev.map((ex) => {
        if (ex.id !== exId) return ex;
        if (ex.sets.length === 1) return ex;
        return {
          ...ex,
          sets: ex.sets.filter((set, idx) => idx !== setIdx),
        };
      });
    });
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

  function changeMemo(exIdx: number, setIdx: number, value: string) {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, j) => {
            if (j !== setIdx) return s;
            return { ...s, memo: value, synced: false };
          }),
        };
      }),
    );
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

  function changeRpe(exIdx: number, setIdx: number, rpe: null | number) {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, j) => {
            if (j !== setIdx) return s;
            return { ...s, rpe, synced: false };
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

  function onSavedHistory() {
    setHistoryVersion((v) => v + 1);
  }

  function startNewSession() {
    localStorage.removeItem("workout.currentSession.v1");
    setSessionMetadata(null);
    setEntryMode("library");
  }

  function changeSessionName(newName: string) {
    setSessionMetadata((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sessionName: newName,
      };
    });
  }

  async function refreshNotionStatus() {
    try {
      setNotionStatusLoading(true);

      const res = await fetch("/api/notion/status", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      setNotionConnected(!!data.notionConnected);
      setDbConnected(!!data.dbConnected);
      console.log(notionConnected, dbConnected);
    } catch (err) {
      console.error("Notion 상태 조회 중 오류", err);
      setNotionConnected(false);
      setDbConnected(false);
    } finally {
      setNotionStatusLoading(false);
    }
  }

  const [date, setDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  });

  if (notionStatusLoading) {
    return (
      <div className="flex flex-col h-100vh min-h-screen text-center items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!dbConnected) {
    return (
      <NotionSettingsPage
        notionConnected={notionConnected}
        dbConnected={dbConnected}
        onConnectionComplete={refreshNotionStatus}
      />
    );
  }

  if (entryMode === "loading") {
    return (
      <div className="flex flex-col h-100vh min-h-screen text-center items-center justify-center">
        Loading...
      </div>
    );
  }

  if (entryMode === "library") {
    return (
      <LibraryClient
        onConfirmSelection={(draft) => {
          setExercises(draft.exercises);
          setSessionMetadata(draft.session);
          setEntryMode("session");
        }}
      />
    );
  }

  if (entryMode === "session") {
    return (
      <div className="flex flex-col h-100vh min-h-screen">
        <HeaderControls
          onSavedHistory={onSavedHistory}
          date={date}
          clearDoneStatus={clearDoneStatus}
          exercises={exercises}
          setExercises={setExercises}
          saving={saving}
          setSaving={setSaving}
          notionReady={dbConnected}
          setNotionReady={setDbConnected}
          onStartNewSession={startNewSession}
          sessionMetadata={sessionMetadata}
        />
        <WorkoutSessionClient
          exercises={exercises}
          changeReps={changeReps}
          changeWeight={changeWeight}
          toggleDone={toggleDone}
          addSet={addSet}
          setShowHistory={setShowHistory}
          showHistory={showHistory}
          changeMemo={changeMemo}
          deleteSet={deleteSet}
          displayWeightUnit={displayWeightUnit}
          nextWeight={nextWeight}
          changeEquipment={changeEquipment}
          changeUnit={changeUnit}
          changeRpe={changeRpe}
          sessionMetadata={sessionMetadata}
          changeSessionName={changeSessionName}
        />
        <div className="overflow-y-auto f1lex-grow pb-16">
          <WorkoutHistoryClient
            showHistory={showHistory}
            historyVersion={historyVersion}
          />
        </div>
      </div>
    );
  }
}
