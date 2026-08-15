"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { withBasePath } from "@/lib/base-path";
import {
  buildHandoffAuthUrl,
  clearNotionConnectSession,
  createHandoffAndNavigate,
  getSafariHandoffAuthUrl,
  getSafariSettingsUrl,
  getStoredHandoffId,
  isHandoffLaunched,
  isHandoffSessionExpired,
  markHandoffLaunch,
  SAFARI_FALLBACK_DELAY_MS,
  storeHandoffId,
} from "@/lib/notion-connect-session";
import {
  getNotionConnectUiCopy,
  resolveNotionConnectUiStatus,
  type NotionConnectStatusSnapshot,
} from "@/lib/notion-connect-ui-status";

export default function NotionConnectPage() {
  const [handoffId, setHandoffId] = useState<string | null>(null);
  const [handoffLaunched, setHandoffLaunched] = useState(false);
  const [handoffExpired, setHandoffExpired] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [status, setStatus] = useState<NotionConnectStatusSnapshot | null>(
    null,
  );
  const [statusFetchFailed, setStatusFetchFailed] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const uiStatus = useMemo(
    () =>
      resolveNotionConnectUiStatus({
        handoffId,
        handoffLaunched,
        handoffExpired,
        statusFetchFailed,
        status,
      }),
    [handoffExpired, handoffId, handoffLaunched, status, statusFetchFailed],
  );

  const copy = getNotionConnectUiCopy(uiStatus);

  const safariAuthUrl = handoffId ? getSafariHandoffAuthUrl(handoffId) : null;
  const httpsAuthUrl = handoffId ? buildHandoffAuthUrl(handoffId) : null;

  const refreshStatus = useCallback(async () => {
    try {
      setStatusFetchFailed(false);
      const res = await fetch(withBasePath("/api/notion/status"), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        setStatusFetchFailed(true);
        return;
      }

      const data = (await res.json()) as NotionConnectStatusSnapshot;
      setStatus({
        notionConnected: !!data.notionConnected,
        dbConnected: !!data.dbConnected,
      });

      if (data.dbConnected) {
        clearNotionConnectSession();
      }
    } catch {
      setStatusFetchFailed(true);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryHandoff = params.get("handoff");

    if (queryHandoff) {
      storeHandoffId(queryHandoff);
      const cleanUrl = withBasePath("/notion/connect");
      window.history.replaceState({}, "", cleanUrl);
      setHandoffId(queryHandoff);
    } else {
      setHandoffId(getStoredHandoffId());
    }

    setHandoffLaunched(isHandoffLaunched());
    setHandoffExpired(isHandoffSessionExpired());
  }, []);

  useEffect(() => {
    if (!handoffId || handoffExpired) {
      return;
    }

    if (isHandoffLaunched()) {
      setHandoffLaunched(true);
      void refreshStatus();
      return;
    }

    markHandoffLaunch(handoffId);
    setHandoffLaunched(true);

    const fallbackTimer = window.setTimeout(() => {
      setShowFallback(true);
    }, SAFARI_FALLBACK_DELAY_MS);

    window.location.replace(getSafariHandoffAuthUrl(handoffId));

    return () => {
      window.clearTimeout(fallbackTimer);
    };
  }, [handoffExpired, handoffId, refreshStatus]);

  useEffect(() => {
    if (!handoffLaunched || handoffExpired || uiStatus === "connected") {
      return;
    }

    void refreshStatus();

    const handleResume = () => {
      void refreshStatus();
    };

    document.addEventListener("visibilitychange", handleResume);
    window.addEventListener("focus", handleResume);
    window.addEventListener("pageshow", handleResume);

    return () => {
      document.removeEventListener("visibilitychange", handleResume);
      window.removeEventListener("focus", handleResume);
      window.removeEventListener("pageshow", handleResume);
    };
  }, [handoffExpired, handoffLaunched, refreshStatus, uiStatus]);

  useEffect(() => {
    if (handoffLaunched && isHandoffSessionExpired()) {
      setHandoffExpired(true);
    }
  }, [handoffLaunched, status]);

  const handleRetry = async () => {
    try {
      setRetryLoading(true);
      clearNotionConnectSession();
      await createHandoffAndNavigate();
    } catch {
      setRetryLoading(false);
    }
  };

  const handleCopyAuthUrl = async () => {
    if (!httpsAuthUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(httpsAuthUrl);
      setCopyMessage("연결 주소를 복사했어요. Safari 주소창에 붙여넣어 주세요.");
    } catch {
      setCopyMessage("주소 복사에 실패했어요. 아래 링크를 길게 눌러 복사해 주세요.");
    }
  };

  const showSafariFallback =
    showFallback &&
    handoffId &&
    (uiStatus === "starting" || uiStatus === "handoff_started");

  return (
    <div className="mx-auto max-w-lg p-6">
      <div className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">{copy.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{copy.description}</p>
        </div>

        {uiStatus === "notion_authorized" && (
          <div className="space-y-3">
            <a
              href={getSafariSettingsUrl()}
              className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Safari에서 DB 선택하기
            </a>
            <p className="text-xs text-muted-foreground">
              Safari에서 운동 DB 3개를 모두 선택해야 연결이 완료됩니다.
            </p>
          </div>
        )}

        {(uiStatus === "handoff_started" || showSafariFallback) &&
          safariAuthUrl && (
          <div className="space-y-3 rounded-lg border border-muted bg-muted/30 p-4 text-sm">
            <p className="font-medium text-foreground">
              {uiStatus === "handoff_started"
                ? "Safari에서 연결을 이어가세요"
                : "Safari가 자동으로 열리지 않나요?"}
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={safariAuthUrl}
                className="inline-flex rounded-md border bg-background px-4 py-2 text-sm font-medium"
              >
                Safari에서 다시 열기
              </a>
              <button
                type="button"
                onClick={handleCopyAuthUrl}
                className="inline-flex rounded-md border bg-background px-4 py-2 text-sm font-medium"
              >
                연결 주소 복사
              </button>
            </div>
            {copyMessage && (
              <p className="text-xs text-muted-foreground">{copyMessage}</p>
            )}
            {httpsAuthUrl && (
              <p className="break-all text-xs text-muted-foreground">
                {httpsAuthUrl}
              </p>
            )}
          </div>
        )}

        {(uiStatus === "expired" || uiStatus === "failed") && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {uiStatus === "expired" && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={retryLoading}
                className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {retryLoading ? "다시 준비 중..." : "처음부터 다시 연결"}
              </button>
            )}
            <Link
              href={withBasePath("/settings/notion")}
              className="inline-flex rounded-md border px-4 py-2 text-sm font-medium"
            >
              Notion 설정으로
            </Link>
          </div>
        )}

        {uiStatus === "connected" && (
          <Link
            href={withBasePath("/app")}
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Dailyset 홈으로
          </Link>
        )}

        {uiStatus === "handoff_started" && (
          <p className="text-xs text-muted-foreground">
            Safari에서 작업을 마친 뒤 홈 화면의 Dailyset 아이콘을 눌러 이 화면으로
            돌아오세요.
          </p>
        )}
      </div>
    </div>
  );
}
