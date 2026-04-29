"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DatabaseOption = {
  id: string;
  title: string;
};

type NotionSettingsPageProps = {
  notionConnected: boolean;
  dbConnected: boolean;
  onConnectionComplete: () => void | Promise<void>;
};

export default function NotionSettingsPage({ notionConnected, dbConnected, onConnectionComplete }: NotionSettingsPageProps) {
  const [databases, setDatabases] = useState<DatabaseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedSetsDbId, setSelectedSetsDbId] = useState("");
  const [selectedExerciseDbId, setSelectedExerciseDbId] = useState("");
  const [selectedSessionDbId, setSelectedSessionDbId] = useState("");

  const handleCompleteConnection = async () => {
    if (!selectedSetsDbId || !selectedExerciseDbId || !selectedSessionDbId) return;
    const ids = [selectedSetsDbId, selectedExerciseDbId, selectedSessionDbId];
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) return;
  
    try {
      setSubmitting(true);
      setSubmitError(null);
  
      const res = await fetch("/api/notion/connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workout_sets_db_id: selectedSetsDbId,
          workout_exercise_db_id: selectedExerciseDbId,
          workout_session_db_id: selectedSessionDbId,
        }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data?.error || "연결 저장 실패");
      }
      
      await onConnectionComplete();
      window.location.href = "/";
  
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchDatabaseOptions = async (mode: "initial" | "refresh" = "initial") => {
    try {
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      const res = await fetch("/api/notion/database-options", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "DB 목록 조회 실패");
      }

      setDatabases(data.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setError(message);
    } finally {
      if (mode === "initial") {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!notionConnected || dbConnected) {
      setLoading(false);
      return;
    }
  
    fetchDatabaseOptions("initial");
  }, [notionConnected, dbConnected]);


  const setsOptions =  databases.filter((db) => db.id !== selectedExerciseDbId && db.id !== selectedSessionDbId);
  const exerciseOptions =  databases.filter((db) => db.id !== selectedSetsDbId && db.id !== selectedSessionDbId);

  const sessionOptions =  databases.filter((db) => db.id !== selectedSetsDbId && db.id !== selectedExerciseDbId);

  const selectedSetsDb = databases.find((db) => db.id === selectedSetsDbId) ?? null;
  const selectedExerciseDb = databases.find((db) => db.id === selectedExerciseDbId) ?? null;
  const selectedSessionDb = databases.find((db) => db.id === selectedSessionDbId) ?? null;

  const isCompleteEnabled =
    !!selectedSetsDbId &&
    !!selectedExerciseDbId &&
    !!selectedSessionDbId &&
    new Set([selectedSetsDbId, selectedExerciseDbId, selectedSessionDbId]).size === 3;

    if (!notionConnected) {
      return (
        <div className="mx-auto max-w-3xl p-6">
          <div className="space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold">Notion 연결</h1>
                  <p className="mt-2 text-sm text-gray-600">
                    먼저 Notion OAuth 연결을 완료해야 데이터베이스를 선택할 수 있습니다.
                  </p>
                </div>
    
                <Link
                  href="/"
                  className="rounded-md border px-4 py-2 text-sm font-medium"
                >
                  홈으로
                </Link>
              </div>
            </div>
    
            <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-semibold">1단계. Notion 계정 연결</h2>
                <p className="mt-2 text-sm text-gray-600">
                  아래 버튼을 눌러 Notion 계정을 연결한 뒤 다시 돌아오세요.
                </p>
              </div>
    
              <div>
                <a
                  href="/api/notion/auth"
                  className="inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
                >
                  Notion 연동하기
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Notion DB 연결</h1>
          <p className="mt-2 text-sm text-gray-600">
            Notion 데이터베이스 목록을 불러오는 중입니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Notion DB 연결</h1>
              <p className="mt-2 text-sm text-gray-600">
                운동 기록용 DB, 운동 목록 DB, 세션 DB를 각각 선택하세요.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fetchDatabaseOptions("refresh")}
                disabled={refreshing}
                className="rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              >
                {refreshing ? "새로고침 중..." : "목록 새로고침"}
              </button>

              <Link
                href="/"
                className="rounded-md border px-4 py-2 text-sm font-medium"
              >
                홈으로
              </Link>
            </div>
          </div>
        </div>

        {error && (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 space-y-3">
    <div>에러: {error}</div>

    <div className="flex gap-2">
      <a
        href="/api/notion/auth"
        className="inline-flex rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700"
      >
        Notion 연동 다시 하기
      </a>

      <Link
        href="/"
        className="inline-flex rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700"
      >
        홈으로
      </Link>
    </div>
  </div>
)}

        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-5">

          <div className="space-y-2">
            <label htmlFor="exercise-db" className="block text-sm font-medium">
              Workout Exercise DB
            </label>
            <select
              id="exercise-db"
              value={selectedExerciseDbId}
              onChange={(e) => setSelectedExerciseDbId(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">선택하세요</option>
              {exerciseOptions.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              운동 목록과 카테고리 정보를 읽어올 데이터베이스를 선택합니다.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="session-db" className="block text-sm font-medium">
              Workout Session DB
            </label>
            <select
              id="session-db"
              value={selectedSessionDbId}
              onChange={(e) => setSelectedSessionDbId(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">선택하세요</option>
              {sessionOptions.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              세션 정보가 저장될 데이터베이스를 선택합니다. (Sets를 묶는 상위 레코드)
            </p>
          </div>

        <div className="space-y-2">
            <label htmlFor="sets-db" className="block text-sm font-medium">
              Workout Set DB
            </label>
            <select
              id="sets-db"
              value={selectedSetsDbId}
              onChange={(e) => setSelectedSetsDbId(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="">선택하세요</option>
              {setsOptions.map((db) => (
                <option key={db.id} value={db.id}>
                  {db.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              세트 기록이 저장될 데이터베이스를 선택합니다.
            </p>
          </div>
        </div>


        <div className="rounded-xl border bg-gray-50 p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold">선택 요약</h2>
            <p className="mt-1 text-sm text-gray-600">
              아래 내용이 맞는지 확인한 뒤 연결 완료 버튼을 누르세요.
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="rounded-md border bg-white p-4">
              <div className="font-medium">Worktout Set DB</div>
              <div className="mt-1 text-gray-700">
                {selectedSetsDb ? selectedSetsDb.title : "아직 선택 안 됨"}
              </div>
              {selectedSetsDb && (
                <div className="mt-1 break-all text-xs text-gray-500">
                  {selectedSetsDb.id}
                </div>
              )}
            </div>

            <div className="rounded-md border bg-white p-4">
              <div className="font-medium">Workout Exercise DB</div>
              <div className="mt-1 text-gray-700">
                {selectedExerciseDb ? selectedExerciseDb.title : "아직 선택 안 됨"}
              </div>
              {selectedExerciseDb && (
                <div className="mt-1 break-all text-xs text-gray-500">
                  {selectedExerciseDb.id}
                </div>
              )}
            </div>

            <div className="rounded-md border bg-white p-4">
              <div className="font-medium">Workout Session DB</div>
              <div className="mt-1 text-gray-700">
                {selectedSessionDb ? selectedSessionDb.title : "아직 선택 안 됨"}
              </div>
              {selectedSessionDb && (
                <div className="mt-1 break-all text-xs text-gray-500">
                  {selectedSessionDb.id}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              같은 데이터베이스는 여러 역할에 중복 선택할 수 없습니다.
            </p>

            <button
              type="button"
              onClick={handleCompleteConnection}
              disabled={!isCompleteEnabled || submitting}
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submitting ? "저장 중..." : "연결 완료"}
            </button> 
          </div>
        </div>

        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            에러: {submitError}
          </div>
        )}
      </div>
    </div>
  );
}