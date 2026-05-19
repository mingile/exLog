"use client";

import { WorkoutSessionClient } from "./WorkoutSessionClient";
import { HeaderControls } from "./HeaderControls";
import { useEffect, useState, useRef } from "react";
import {
  Exercises,
  Part,
  SessionDraft,
  SessionMetadata,
  Session,
  SavedExercise,
} from "./types";
import { WorkoutHistoryClient } from "./WorkoutHistoryClient";
import NotionSettingsPage from "./settings/notion/NotionSettingsClient";
import { LibraryClient } from "./LibraryClient";
import { kgToLb, lbToKg, nextWeight } from "@/lib/weightUnit";
import { toast } from "sonner";

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
              return "cable-machine";
          }
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
    } {
      if (!isObject(v)) return false;
      return (
        isNumber(v.weight) &&
        isNumber(v.reps) &&
        typeof v.done === "boolean" &&
        typeof v.synced === "boolean" &&
        typeof v.equipment === "string" &&
        typeof v.memo === "string" &&
        (v.unit === undefined || v.unit === "kg" || v.unit === "lb")
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
      displayWeight = Math.round(weight * 10) / 10;
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
            return { ...s, reps: Math.max(0, s.reps + delta), synced: false };
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
            },
          ],
        };
      }),
    );
  }

  function addExercisesToSession(newExercises: Exercises) {
    setExercises((prev) => {
      const existingPageIds = new Set(
        prev.map((ex) => ex.exercisePageId).filter(Boolean),
      );

      const uniqueNewExercises = newExercises.filter(
        (ex) => !existingPageIds.has(ex.exercisePageId),
      );

      return [...prev, ...uniqueNewExercises];
    });
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

  function handleStartNewSession() {
    const hasUnsavedChanges = exercises.some((ex) =>
      ex.sets.some((set) => set.done && !set.synced),
    );

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "저장되지 않은 변경사항이 있습니다.\n새 세션을 시작하시겠습니까?\n(현재 세션이 종료됩니다)",
      );
      if (!confirmed) return;
    }

    startNewSession();
    toast.success("새 세션을 시작합니다", {
      duration: 1000,
    });
  }

  async function saveSession() {
    console.log("1. saveSession 시작, saving:", saving);
    if (saving) return;
    setSaving(true);
    const savedAt = new Date().toISOString();

    // done === true인 세트만 추출 (Notion 저장용)
    const notionExercises: (SavedExercise & {
      part: string;
      exercisePageId?: string;
    })[] = exercises
      .map((ex) => {
        const doneSets = ex.sets
          .map((set, i) => {
            return {
              set,
              setNo: i + 1,
            };
          })
          .filter(({ set }) => {
            const pass = set.done && !set.synced;
            return pass;
          });
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
          part: ex.part || "기타",
          exercisePageId: ex.exercisePageId,
          sets: ex.sets.map(({ set, setNo }) => {
            return {
              setNo,
              weight: set.weight,
              reps: set.reps,
              memo: set.memo,
              equipment: set.equipment,
            };
          }),
        };
      });

    // exercisePageId 없는 운동 체크
    const hasInvalidExercise = notionExercises.some((ex) => !ex.exercisePageId);
    if (hasInvalidExercise && dbConnected) {
      toast.error("일부 운동에 Exercise 정보가 없습니다.", {
        description: "라이브러리에서 운동을 다시 선택해주세요.",
        duration: 3000,
      });
      setSaving(false);
      return;
    }

    const localExercises: (SavedExercise & { part: string })[] = exercises
      .map((ex) => {
        const doneSets = ex.sets
          .map((set, i) => {
            return {
              set,
              setNo: i + 1,
            };
          })
          .filter(({ set }) => {
            const pass = set.done;
            return pass;
          });
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
          part: ex.part || "기타",
          exercisePageId: ex.exercisePageId,
          sets: ex.sets.map(({ set, setNo }) => {
            return {
              setNo,
              weight: set.weight,
              reps: set.reps,
              memo: set.memo,
              equipment: set.equipment,
            };
          }),
        };
      });

    const notionPayload = {
      saved_at: savedAt,
      exercises: notionExercises,
    };
    const sessionId = sessionMetadata?.sessionId || new Date().toISOString();
    const sessionName = sessionMetadata?.sessionName || "세션";
    const localPayload = {
      id: sessionId,
      savedAt: savedAt,
      sessionName: sessionName,
      exercises: localExercises,
    };

    try {
      if (localExercises.length > 0) {
        const sessionKey = "workout.sessions.v1";
        const session = localStorage.getItem(sessionKey);
        let sessionData: Session[] = [];
        try {
          if (session) {
            console.log(session);
            sessionData = JSON.parse(session);
            // session이 깨졌거나 객체인 경우 배열로 변환
            if (!Array.isArray(sessionData)) {
              sessionData = [];
            }
          }
        } catch (e) {
          console.error("올바르지 않은 JSON 데이터", e);
          localStorage.setItem(sessionKey, JSON.stringify([localPayload]));
          return;
        }

        const filtered = sessionData.filter((s) => s.id !== localPayload.id);
        const nextSessions = [localPayload, ...filtered];

        if (dbConnected && notionExercises.length > 0) {
          // 1. Session row 확보
          if (!sessionMetadata) {
            toast.error("세션 정보가 없습니다.", {
              duration: 2000,
            });
            return;
          }

          const finalSessionName =
            sessionMetadata.sessionName.trim() ||
            (() => {
              const now = new Date(sessionMetadata.startedAt);
              const year = now.getFullYear();
              const month = String(now.getMonth() + 1).padStart(2, "0");
              const day = String(now.getDate()).padStart(2, "0");
              const hours = String(now.getHours()).padStart(2, "0");
              const minutes = String(now.getMinutes()).padStart(2, "0");
              return `${year}-${month}-${day} ${hours}:${minutes} 세션`;
            })();

          let sessionPageId: string;
          try {
            const sessionResponse = await fetch("/api/notion/session-ensure", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sessionId: sessionMetadata.sessionId,
                sessionName: sessionMetadata.sessionName,
                startedAt: sessionMetadata.startedAt,
              }),
            });

            if (!sessionResponse.ok) {
              const errorData = await sessionResponse.json();
              toast.error("Session 생성 실패: " + errorData.error, {
                description: "Sets 저장이 중단되었습니다.",
                duration: 3000,
              });
              return;
            }

            const sessionData = await sessionResponse.json();
            sessionPageId = sessionData.pageId;
            console.log(
              `Session ${sessionData.created ? "생성" : "조회"} 완료:`,
              sessionPageId,
            );
          } catch (error) {
            console.error("Session 확보 중 오류:", error);
            toast.error("Session 확보 중 오류가 발생했습니다.", {
              description: "Sets 저장이 중단되었습니다.",
              duration: 3000,
            });
            return;
          }

          // 2. Sets 저장 (Session relation 포함)
          try {
            const writeResponse = await fetch("/api/notion/write", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...notionPayload,
                sessionPageId,
              }),
            });

            if (writeResponse.ok) {
              const data = await writeResponse.json();
              setExercises((prev) =>
                prev.map((ex) => ({
                  ...ex,
                  sets: ex.sets.map((set) =>
                    set.done && !set.synced ? { ...set, synced: true } : set,
                  ),
                })),
              );
              localStorage.setItem(sessionKey, JSON.stringify(nextSessions));
              onSavedHistory();
              toast.success(
                `노션에 ${data.created_count}개 세트 저장되었습니다`,
                {
                  duration: 2000,
                },
              );
            } else {
              const errorData = await writeResponse.json();
              toast.error("노션에 세트 저장 실패: " + errorData.error, {
                description: "Session은 생성되었으나 Sets 저장 실패",
                duration: 3000,
              });
              return;
            }
          } catch (error) {
            console.error("Sets 저장 중 오류:", error);
            toast.error("Sets 저장 중 오류가 발생했습니다.", {
              description: "Session은 생성되었으나 Sets 저장 실패",
              duration: 3000,
            });
            return;
          }
        } else if (dbConnected && notionExercises.length === 0) {
          toast.info("새로 저장할 세트가 없습니다.", {
            description: "모든 세트가 이미 저장되었습니다.",
            duration: 2000,
          });
          localStorage.setItem(sessionKey, JSON.stringify(nextSessions));
          onSavedHistory();
        } else {
          toast.success(`로컬에 저장 완료!`, {
            description: "노션에 저장하려면 연결을 해주세요.",
            duration: 2000,
          });
          localStorage.setItem(sessionKey, JSON.stringify(nextSessions));
          onSavedHistory();
        }
      } else {
        toast.error("새로 저장할 내용이 없습니다.", {
          duration: 1000,
        });
        return;
      }
    } finally {
      setSaving(false);
    }
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
        <div className="pb-2">
          <HeaderControls
            notionReady={dbConnected}
            setNotionReady={setDbConnected}
            sessionMetadata={sessionMetadata}
            changeSessionName={changeSessionName}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            historyVersion={historyVersion}
          />
        </div>
        {!showHistory && (
          <WorkoutSessionClient
            exercises={exercises}
            changeReps={changeReps}
            changeWeight={changeWeight}
            toggleDone={toggleDone}
            addSet={addSet}
            changeMemo={changeMemo}
            deleteSet={deleteSet}
            displayWeightUnit={displayWeightUnit}
            nextWeight={nextWeight}
            changeEquipment={changeEquipment}
            changeUnit={changeUnit}
            sessionMetadata={sessionMetadata}
            addExercisesToSession={addExercisesToSession}
            onSave={saveSession}
            onStartNewSession={handleStartNewSession}
            saving={saving}
          />
        )}
        {showHistory && (
          <div className="overflow-y-auto flex-grow pb-16">
            <WorkoutHistoryClient
              showHistory={showHistory}
              historyVersion={historyVersion}
              selectedDate={selectedDate}
            />
          </div>
        )}
      </div>
    );
  }
}
