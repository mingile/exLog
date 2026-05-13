"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  Exercises,
  Session,
  SavedExercise,
  SessionMetadata,
  DateInfo,
} from "./types";
import { toast } from "sonner";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Settings, History } from "lucide-react";
import { WorkoutHistoryClient } from "./WorkoutHistoryClient";

export function HeaderControls({
  onSavedHistory,
  exercises,
  date,
  setExercises,
  saving,
  setSaving,
  notionReady,
  setNotionReady,
  onStartNewSession,
  sessionMetadata,
  changeSessionName,
  selectedDate,
  setSelectedDate,
  showHistory,
  setShowHistory,
  historyVersion,
}: {
  onSavedHistory: () => void;
  clearDoneStatus: () => void;
  exercises: Exercises;
  date: string;
  setExercises: React.Dispatch<React.SetStateAction<Exercises>>;
  saving: boolean;
  setSaving: (saving: boolean) => void;
  notionReady: boolean;
  setNotionReady: (notionReady: boolean) => void;
  onStartNewSession: () => void;
  sessionMetadata: SessionMetadata | null;
  changeSessionName: (newName: string) => void;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  historyVersion: number;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [sessionNameInput, setSessionNameInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    if (sessionMetadata) {
      setSessionNameInput(sessionMetadata.sessionName);
    }
  }, [sessionMetadata]);

  // 세션 날짜 맵 로드
  const sessionsMap = useMemo(() => {
    const sessionKey = "workout.sessions.v1";
    const sessionsJson = localStorage.getItem(sessionKey);

    if (!sessionsJson) return new Map<string, boolean>();

    try {
      const sessions: Session[] = JSON.parse(sessionsJson);
      const map = new Map<string, boolean>();

      sessions.forEach((session) => {
        const date = new Date(session.savedAt);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        map.set(dateStr, true);
      });

      return map;
    } catch (e) {
      return new Map<string, boolean>();
    }
  }, [historyVersion]);

  // 날짜 범위 생성
  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const PAST_DAYS = 14;
    const FUTURE_DAYS = 7;
    const dates: DateInfo[] = [];

    for (let i = -PAST_DAYS; i <= FUTURE_DAYS; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);

      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      dates.push({
        date: date,
        dayOfMonth: date.getDate(),
        dayOfWeek: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][
          date.getDay()
        ],
        hasSession: sessionsMap.has(dateStr),
        isToday: i === 0,
        isFuture: i > 0,
      });
    }

    return dates;
  }, [sessionsMap]);

  // 오늘 날짜로 자동 스크롤
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const todayIndex = dateRange.findIndex((d) => d.isToday);
    if (todayIndex === -1) return;

    const cardWidth = 50;
    const gap = 4;
    const scrollPosition =
      (cardWidth + gap) * todayIndex -
      scrollContainer.offsetWidth / 2 +
      cardWidth / 2;

    setTimeout(() => {
      scrollContainer.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: "smooth",
      });
    }, 100);
  }, [dateRange]);

  function getDefaultSessionName(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes} 세션`;
  }

  function handleSessionNameBlur() {
    const trimmed = sessionNameInput.trim();
    if (trimmed === "") {
      const defaultName = getDefaultSessionName();
      setSessionNameInput(defaultName);
      changeSessionName(defaultName);
    } else {
      changeSessionName(trimmed);
    }
  }

  function handleDateClick(dateInfo: DateInfo) {
    if (dateInfo.isFuture) return;

    const dateStr = `${dateInfo.date.getFullYear()}-${String(dateInfo.date.getMonth() + 1).padStart(2, "0")}-${String(dateInfo.date.getDate()).padStart(2, "0")}`;

    if (dateInfo.isToday) {
      // 오늘: 히스토리 닫기 (세션 화면으로)
      setSelectedDate(null);
      setShowHistory(false);
    } else {
      // 과거 날짜: 히스토리 보기
      setSelectedDate(dateStr);
      setShowHistory(true);
    }
  }

  function formatDateString(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 py-2 space-y-2">
        {/* 첫 번째 행: 세션 이름 입력 */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={sessionNameInput}
            onChange={(e) => setSessionNameInput(e.target.value)}
            onBlur={handleSessionNameBlur}
            placeholder="세션 이름을 입력하세요"
            className="flex-1 px-3 py-1.5 text-2xl font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* 세 번째 행: 버튼들 */}
          <div className="flex justify-end items-center gap-0.5">
            <Button onClick={saveSession} disabled={saving}>
              {saving ? "저장중..." : "저장"}
            </Button>
            <Button onClick={handleStartNewSession}>새 세션</Button>

            {/* 설정 메뉴 */}
            <div
              className="relative hover:bg-accent rounded-full p-1"
              ref={menuRef}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="relative "
              >
                <Settings className="size-6" />
                {/* 연결 상태 인디케이터 */}
                <div
                  className={`absolute top-1 right-1.25 w-2 h-2 rounded-full ${
                    notionReady ? "bg-green-500" : "bg-red-500"
                  }`}
                />
              </Button>

              {/* 드롭다운 메뉴 */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          notionReady ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span className="text-sm font-medium">
                        Notion {notionReady ? "연결됨" : "연결 안됨"}
                      </span>
                    </div>
                  </div>
                  <div className="px-2 py-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm h-auto py-2"
                      onClick={() => {
                        fetch("/api/notion/disconnect", {
                          method: "POST",
                        })
                          .then((data) => {
                            if (data.ok) {
                              toast.success("Notion 연결 해제 완료", {
                                duration: 1000,
                              });
                              checkNotionStatus();
                              setIsMenuOpen(false);
                            }
                          })
                          .catch((err) => {
                            toast.error(
                              "Notion 연결 해제 중 오류가 발생했습니다.",
                              {
                                duration: 1000,
                              },
                            );
                          });
                      }}
                    >
                      연결 해제
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 두 번째 행: 날짜 네비게이션 */}
        <div className="flex items-center gap-2">
          {/* 더 보기 버튼 */}
          <Sheet open={showAllHistory} onOpenChange={setShowAllHistory}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0">
                <History className="size-4 mr-1" />
                더보기
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh]">
              <SheetHeader>
                <SheetTitle>전체 운동 기록</SheetTitle>
              </SheetHeader>
              <div className="mt-4 overflow-y-auto h-full pb-20">
                <WorkoutHistoryClient
                  showHistory={true}
                  historyVersion={historyVersion}
                  selectedDate={null}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* 날짜 스크롤 */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex gap-1 min-w-min">
              {dateRange.map((dateInfo) => {
                const dateStr = formatDateString(dateInfo.date);
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    disabled={dateInfo.isFuture}
                    onClick={() => handleDateClick(dateInfo)}
                    className={`
                      flex flex-col items-center justify-center
                      min-w-[50px] h-[60px] rounded-lg border
                      transition-all shrink-0
                      ${
                        dateInfo.isFuture
                          ? "cursor-not-allowed"
                          : dateInfo.isToday
                            ? "bg-blue-500 text-white border-blue-600"
                            : isSelected
                              ? "bg-blue-100 border-blue-400"
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }
                    `}
                  >
                    <div
                      className={`
                        text-xs font-medium px-2 py-0.5 rounded
                        ${
                          dateInfo.hasSession &&
                          !dateInfo.isToday &&
                          !dateInfo.isFuture
                            ? "bg-green-100 text-green-700"
                            : ""
                        }
                      `}
                    >
                      {dateInfo.dayOfWeek}
                    </div>
                    <div className="text-sm font-bold mt-1">
                      {dateInfo.dayOfMonth}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  async function checkNotionStatus() {
    const response = await fetch("/api/notion/status");
    const data = await response.json();
    setNotionReady(data.notionConnected && data.dbConnected);
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

    onStartNewSession();
    toast.success("새 세션을 시작합니다", {
      duration: 1000,
    });
  }

  async function saveSession() {
    console.log("1. saveSession 시작, saving:", saving);
    if (saving) return;
    setSaving(true);
    const savedAt = new Date().toISOString();
    const dayKey = new Date()
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .slice(2, 12);

    // done === true인 세트만 추출 (Notion 저장용)
    const notionExercises: (SavedExercise & {
      part: string;
      exercisePageId?: string;
    })[] = exercises
      .map((ex) => {
        const doneSets = ex.sets
          .map((set, i) => {
            console.log(`세트 ${i}:`, {
              weight: set.weight,
              reps: set.reps,
              done: set.done,
              synced: set.synced,
              memo: set.memo,
              rpe: set.rpe,
            });
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
              rpe: set.rpe,
            };
          }),
        };
      });

    // exercisePageId 없는 운동 체크
    const hasInvalidExercise = notionExercises.some((ex) => !ex.exercisePageId);
    if (hasInvalidExercise && notionReady) {
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
            console.log(`세트 ${i}:`, {
              weight: set.weight,
              reps: set.reps,
              done: set.done,
              synced: set.synced,
              memo: set.memo,
              rpe: set.rpe,
            });
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
              rpe: set.rpe,
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
        console.log("5. savedExercises.length > 0");
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
        // 병합이 아닌 전체 스냅샷 교체 방식
        // 왜? 이게 더 구현하기 쉽기 떄문
        // 나중에 문제가 생기면 mergedSession 방식도 고려해보자.
        const nextSessions = [localPayload, ...filtered];

        if (notionReady && notionExercises.length > 0) {
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
        } else if (notionReady && notionExercises.length === 0) {
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
}
