"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NotionSettingsClient() {
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [status, setStatus] = useState<null | { ok: boolean; msg: string }>(null);
  const [loading, setLoading] = useState(false);

  async function connectDb() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/notion/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ ok: false, msg: data?.error ?? `HTTP ${res.status}` });
        return;
      }
      setStatus({ ok: true, msg: "연결 완료 (database_id 저장됨)" });
    } catch (e) {
      setStatus({ ok: false, msg: "네트워크 오류" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 space-y-3">
      <div className="text-sm font-medium">Notion Database URL</div>
      <Input
        value={databaseUrl}
        onChange={(e) => setDatabaseUrl(e.target.value)}
        placeholder="https://www.notion.so/... (DB URL 붙여넣기)"
      />
      <Button onClick={connectDb} disabled={loading || !databaseUrl}>
        {loading ? "연결 중..." : "DB 연결"}
      </Button>

      {status && (
        <div className={`text-sm ${status.ok ? "text-green-600" : "text-red-600"}`}>
          {status.msg}
        </div>
      )}
    </div>
  );
}