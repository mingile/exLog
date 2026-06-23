"use client";

import { useEffect, useState } from "react";
import { Session, SavedExercise } from "./types";
import { TrashIcon } from "lucide-react";

const sessionKey = `workout.sessions.v1`;

function getLocalDateString(isoString: string): string {
  return new Date(isoString).toLocaleDateString("sv-SE");
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}시간 ${remainingMinutes}분`;
  }

  return `${minutes}분`;
}

export function WorkoutHistoryClient({
  showHistory,
  historyVersion,
  selectedDate,
}: {
  showHistory: boolean;
  historyVersion: number;
  selectedDate: string | null;
}) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [swipingSet, setSwipingSet] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);

  useEffect(() => {
    if (!showHistory) return;
    const history = localStorage.getItem(sessionKey);
    try {
      const parsedHistory: Session[] = history ? JSON.parse(history) : [];
      console.log(
        "Parsed history from localStorage:",
        parsedHistory.length,
        "sessions",
      );
      console.log("selectedDate prop:", selectedDate);

      if (history) {
        if (!Array.isArray(parsedHistory)) {
          return;
        }

        // selectedDate가 있으면 필터링
        let filteredSessions = parsedHistory;
        if (selectedDate) {
          filteredSessions = parsedHistory.filter((session) => {
            const dateStr = getLocalDateString(session.savedAt);
            console.log(
              `Session ${session.id}: dateStr=${dateStr}, selectedDate=${selectedDate}, match=${dateStr === selectedDate}`,
            );
            return dateStr === selectedDate;
          });
        }

        console.log("Filtered sessions:", filteredSessions.length);
        setSessions(filteredSessions);
      } else {
        setSessions([]);
      }
    } catch (e) {
      console.error("올바르지 않은 JSON 데이터", e);
      setSessions([]);
      localStorage.removeItem(sessionKey);
    }
  }, [showHistory, historyVersion, selectedDate]);

  function groupByDate(sessions: Session[]): Map<string, Session[]> {
    const grouped = new Map<string, Session[]>();
    sessions.forEach((session) => {
      const dateStr = getLocalDateString(session.savedAt);
      if (!grouped.has(dateStr)) {
        grouped.set(dateStr, []);
      }
      grouped.get(dateStr)!.push(session);
    });
    return grouped;
  }

  function formatDateHeader(dateStr: string): string {
    const [year, month, day] = dateStr.split("-");
    return `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  }

  function getSessionSummary(session: Session) {
    const exerciseCount = session.exercises.length;
    const totalSets = session.exercises.reduce(
      (sum, ex) => sum + ex.sets.length,
      0,
    );
    const parts = Array.from(
      new Set(session.exercises.map((ex) => ex.part || "기타")),
    );
    const partsStr = parts.join(" · ");
    const durationStr = session.durationSeconds ? formatDuration(session.durationSeconds) : null;
    return { exerciseCount, totalSets, partsStr, durationStr };
  }

  function groupExercisesByPart(
    exercises: (SavedExercise & { part?: string })[],
  ): Map<string, (SavedExercise & { part?: string })[]> {
    const grouped = new Map<string, (SavedExercise & { part?: string })[]>();
    exercises.forEach((ex) => {
      const part = ex.part || "기타";
      if (!grouped.has(part)) {
        grouped.set(part, []);
      }
      grouped.get(part)!.push(ex);
    });
    return grouped;
  }

  function deleteSession(sessionId: string) {
    const updatedSessions = sessions.filter(
      (session) => session.id !== sessionId,
    );
    localStorage.setItem(sessionKey, JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
  }

  function deleteSet(sessionId: string, exerciseId: string, setNo: number) {
    const updatedSessions = sessions
      .map((session) => {
        if (session.id !== sessionId) return session;

        const updatedExercises = session.exercises
          .map((exercise) => {
            if (exercise.id !== exerciseId) return exercise;

            const updatedSets = exercise.sets.filter(
              (set) => set.setNo !== setNo,
            );
            return { ...exercise, sets: updatedSets };
          })
          .filter((exercise) => exercise.sets.length > 0);

        return { ...session, exercises: updatedExercises };
      })
      .filter((session) => session.exercises.length > 0);

    localStorage.setItem(sessionKey, JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
  }

  function handleTouchStart(e: React.TouchEvent, setKey: string) {
    const touch = e.touches[0];
    setSwipingSet(setKey);
    setSwipeOffset(0);
    (e.currentTarget as HTMLElement).dataset.startX = String(touch.clientX);
  }

  function handleTouchMove(e: React.TouchEvent, setKey: string) {
    if (swipingSet !== setKey) return;

    const touch = e.touches[0];
    const startX = Number((e.currentTarget as HTMLElement).dataset.startX);
    const currentX = touch.clientX;
    const diff = currentX - startX;

    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -100));
    }
  }

  function handleTouchEnd(
    sessionId: string,
    exerciseId: string,
    setNo: number,
  ) {
    if (swipeOffset < -50) {
      deleteSet(sessionId, exerciseId, setNo);
    }
    setSwipingSet(null);
    setSwipeOffset(0);
  }

  function handleMouseDown(e: React.MouseEvent, setKey: string) {
    setSwipingSet(setKey);
    setSwipeOffset(0);
    (e.currentTarget as HTMLElement).dataset.startX = String(e.clientX);
  }

  function handleMouseMove(e: React.MouseEvent, setKey: string) {
    if (swipingSet !== setKey) return;

    const startX = Number((e.currentTarget as HTMLElement).dataset.startX);
    const currentX = e.clientX;
    const diff = currentX - startX;

    if (diff < 0) {
      setSwipeOffset(Math.max(diff, -100));
    }
  }

  function handleMouseUp(sessionId: string, exerciseId: string, setNo: number) {
    if (swipeOffset < -50) {
      deleteSet(sessionId, exerciseId, setNo);
    }
    setSwipingSet(null);
    setSwipeOffset(0);
  }

  function handleMouseLeave() {
    setSwipingSet(null);
    setSwipeOffset(0);
  }

  if (!showHistory) return null;

  if (sessions.length === 0) {
    return (
      <main className="p-4 text-center text-muted-foreground">
        저장된 운동 기록이 없습니다.
      </main>
    );
  }

  const dateGrouped = groupByDate(sessions);
  const dateEntries = Array.from(dateGrouped.entries()).sort((a, b) =>
    b[0].localeCompare(a[0]),
  );

  console.log("Total sessions:", sessions.length);
  console.log("Date grouped:", dateGrouped);
  console.log("Date entries:", dateEntries);

  return (
    <main className="p-4 space-y-6">
      {dateEntries.map(([dateStr, dateSessions]) => {
        const sortedSessions = dateSessions.sort(
          (a, b) =>
            new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
        );

        console.log(`Date ${dateStr}: ${sortedSessions.length} sessions`);

        return (
          <div key={dateStr} className="space-y-4">
            <h2 className="text-xl font-bold text-foreground sticky top-0 bg-background py-2">
              {formatDateHeader(dateStr)}
            </h2>

            {sortedSessions.map((session) => {
              const { exerciseCount, totalSets, partsStr, durationStr } =
                getSessionSummary(session);
              const partGrouped = groupExercisesByPart(session.exercises);
              const parts = Array.from(partGrouped.keys());

              return (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 bg-card shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {session.sessionName || "운동 세션"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {partsStr} · {exerciseCount} exercises · {totalSets} sets
                        {durationStr && ` · ${durationStr}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="text-destructive hover:text-destructive/80 p-2"
                      title="세션 삭제"
                    >
                      <TrashIcon className="size-5" />
                    </button>
                  </div>

                  <div className="space-y-4 mt-4">
                    {parts.map((part) => {
                      const partExercises = partGrouped.get(part) || [];
                      return (
                        <div
                          key={part}
                          className="border-l-4 border-primary pl-3"
                        >
                          <h4 className="text-md font-bold text-foreground mb-2">
                            {part}
                          </h4>

                          <div className="space-y-3">
                            {partExercises.map((ex) => (
                              <div key={ex.id} className="pl-2">
                                <p className="text-sm font-medium text-foreground mb-1">
                                  {ex.name}
                                </p>

                                <ul className="space-y-1">
                                  {ex.sets.map((set) => {
                                    const setKey = `${session.id}-${ex.id}-${set.setNo}`;
                                    const isActive = swipingSet === setKey;
                                    const offset = isActive ? swipeOffset : 0;

                                    return (
                                      <li
                                        key={set.setNo}
                                        className="relative overflow-hidden cursor-pointer"
                                        onTouchStart={(e) =>
                                          handleTouchStart(e, setKey)
                                        }
                                        onTouchMove={(e) =>
                                          handleTouchMove(e, setKey)
                                        }
                                        onTouchEnd={() =>
                                          handleTouchEnd(
                                            session.id,
                                            ex.id,
                                            set.setNo,
                                          )
                                        }
                                        onMouseDown={(e) =>
                                          handleMouseDown(e, setKey)
                                        }
                                        onMouseMove={(e) =>
                                          handleMouseMove(e, setKey)
                                        }
                                        onMouseUp={() =>
                                          handleMouseUp(
                                            session.id,
                                            ex.id,
                                            set.setNo,
                                          )
                                        }
                                        onMouseLeave={handleMouseLeave}
                                      >
                                        <div className="absolute inset-0 bg-destructive flex items-center justify-end pr-4">
                                          <TrashIcon className="size-4 text-white" />
                                        </div>
                                        <div
                                          className="bg-card text-sm text-foreground py-1 transition-transform"
                                          style={{
                                            transform: `translateX(${offset}px)`,
                                          }}
                                        >
                                          {set.setNo}세트
                                          <br />
                                          {set.weight}kg × {set.reps}회
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </main>
  );
}
