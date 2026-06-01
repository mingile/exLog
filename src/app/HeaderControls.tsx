"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Session, SessionMetadata, DateInfo } from "./types";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Settings, History } from "lucide-react";
import { WorkoutHistoryClient } from "./WorkoutHistoryClient";
import { toast } from "sonner";

export function HeaderControls({
  notionReady,
  setNotionReady,
  sessionMetadata,
  changeSessionName,
  selectedDate,
  setSelectedDate,
  showHistory,
  setShowHistory,
  historyVersion,
}: {
  notionReady: boolean;
  setNotionReady: (notionReady: boolean) => void;
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
                      window.location.href = "/settings/notion";
                      setIsMenuOpen(false);
                    }}
                  >
                    Notion 연동 설정
                  </Button>
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
}
