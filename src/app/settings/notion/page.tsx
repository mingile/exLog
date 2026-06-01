"use client";

import { useState, useEffect } from "react";
import NotionSettingsClient from "./NotionSettingsClient";

export default function Page() {
  const [notionConnected, setNotionConnected] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const fetchNotionStatus = async () => {
    try {
      const res = await fetch("/api/notion/status");
      const data = await res.json();
      if (res.ok) {
        setNotionConnected(data.notionConnected || false);
        setDbConnected(data.dbConnected || false);
      }
    } catch (error) {
      console.error("Failed to fetch notion status", error);
    }
  };

  useEffect(() => {
    fetchNotionStatus();
  }, []);

  return (
    <NotionSettingsClient
      notionConnected={notionConnected}
      dbConnected={dbConnected}
      onConnectionComplete={fetchNotionStatus}
    />
  );
}
