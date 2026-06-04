"use client";

import { useState, useEffect } from "react";
import NotionSettingsClient from "./NotionSettingsClient";

export default function Page() {
  const [notionConnected, setNotionConnected] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [notionStatusLoading, setNotionStatusLoading] = useState(false);

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

  useEffect(() => {
    refreshNotionStatus();
  }, []);

  return (
    <NotionSettingsClient
      notionConnected={notionConnected}
      dbConnected={dbConnected}
      onConnectionComplete={refreshNotionStatus}
    />
  );
}
