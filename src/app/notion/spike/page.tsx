"use client";

/**
 * [SPIKE — spike/ul-js-nav] iOS Universal Link 가로채기 가설 검증 페이지.
 *
 * 가설: UL 은 "사용자 탭으로 시작된 내비게이션"에서만 발동한다.
 *       현재 흐름은 탭 → /api/notion/auth → 302 → Notion 이라 체인 전체가
 *       탭으로 시작된 것으로 평가되어 Notion 앱이 열린다.
 *       마지막 홉을 JS 가 시작하면 체인이 끊겨 UL 이 발동하지 않는다.
 *
 * 확인 방법: iOS 홈 화면에 이 페이지를 추가해 standalone 으로 실행한 뒤
 *           두 버튼을 차례로 눌러 무엇이 열리는지 비교한다.
 *
 * 판정
 *   대조군 ❌앱 / A안 ✅승인화면 → 가설 확정
 *   대조군 ❌앱 / A안 ❌앱       → 가설 사망
 *   대조군 ✅승인화면            → 문제가 이미 사라짐 (AASA 캐시 갱신)
 */

import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/base-path";

export default function UlSpikePage() {
  const [standalone, setStandalone] = useState<boolean | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const mql = window.matchMedia("(display-mode: standalone)");
    const iosStandalone = (
      window.navigator as Navigator & { standalone?: boolean }
    ).standalone;
    setStandalone(mql.matches || iosStandalone === true);
  }, []);

  function append(line: string) {
    setLog((prev) => [...prev, `${new Date().toLocaleTimeString()}  ${line}`]);
  }

  // A안 — authUrl 을 JSON 으로 받아 JS 가 이동한다 (탭 체인 없음)
  async function runJsNavigation() {
    append("A안: /api/notion/auth?mode=json 요청");
    try {
      const res = await fetch(withBasePath("/api/notion/auth?mode=json"), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        append(`A안: 응답 실패 status=${res.status}`);
        return;
      }

      const data = (await res.json()) as { authUrl?: string };
      if (!data.authUrl) {
        append("A안: authUrl 이 비어 있음 (환경변수 확인 필요)");
        return;
      }

      const parsed = new URL(data.authUrl);
      append(`A안: authUrl 수신 → ${parsed.origin}${parsed.pathname}`);
      append("A안: 2초 뒤 location.replace 로 이동합니다");

      // 로그를 읽을 시간을 준다
      setTimeout(() => {
        window.location.replace(data.authUrl as string);
      }, 2000);
    } catch (error) {
      append(
        `A안: 예외 — ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // 대조군 — 현재 방식. 우리 API 로 이동하면 서버가 302 로 Notion 까지 보낸다
  function runControl() {
    append("대조군: /api/notion/auth 로 이동 (302 체인)");
    window.location.href = withBasePath("/api/notion/auth");
  }

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "1.5rem",
        lineHeight: 1.6,
        maxWidth: 560,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
        UL 가로채기 스파이크
      </h1>
      <p style={{ color: "#666", fontSize: "0.875rem", marginTop: 0 }}>
        실행 모드:{" "}
        <strong>
          {standalone === null
            ? "확인 중"
            : standalone
              ? "standalone (홈 화면 PWA) ✅"
              : "브라우저 탭 — 홈 화면에 추가 후 실행하세요 ⚠️"}
        </strong>
      </p>

      <div style={{ display: "grid", gap: "0.75rem", margin: "1.5rem 0" }}>
        <button
          onClick={runJsNavigation}
          style={{
            padding: "0.9rem",
            fontSize: "1rem",
            borderRadius: 8,
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
          }}
        >
          A안 — JS 내비게이션 (location.replace)
        </button>

        <button
          onClick={runControl}
          style={{
            padding: "0.9rem",
            fontSize: "1rem",
            borderRadius: 8,
            border: "1px solid #999",
            background: "#fff",
            color: "#111",
          }}
        >
          대조군 — 현재 방식 (302 체인)
        </button>
      </div>

      <p style={{ fontSize: "0.8125rem", color: "#666" }}>
        각 버튼을 누른 뒤 <strong>Notion 앱이 열리는지</strong>,{" "}
        <strong>승인 화면이 뜨는지</strong>만 보면 됩니다. 승인 이후 흐름은 이
        실험의 관심사가 아닙니다. 돌아올 때는 홈 화면 아이콘으로 다시 들어오세요.
      </p>

      <pre
        style={{
          marginTop: "1.5rem",
          padding: "0.75rem",
          background: "#f4f4f5",
          borderRadius: 8,
          fontSize: "0.75rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          minHeight: "6rem",
        }}
      >
        {log.length === 0 ? "로그 없음" : log.join("\n")}
      </pre>
    </main>
  );
}
