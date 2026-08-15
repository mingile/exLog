import { describe, expect, it } from "vitest";
import {
  getNotionConnectUiCopy,
  resolveNotionConnectUiStatus,
} from "./notion-connect-ui-status";

describe("notion-connect-ui-status", () => {
  it("handoff 없으면 failed", () => {
    expect(
      resolveNotionConnectUiStatus({
        handoffId: null,
        handoffLaunched: false,
        handoffExpired: false,
        statusFetchFailed: false,
        status: null,
      }),
    ).toBe("failed");
  });

  it("dbConnected이면 connected", () => {
    expect(
      resolveNotionConnectUiStatus({
        handoffId: "h1",
        handoffLaunched: true,
        handoffExpired: false,
        statusFetchFailed: false,
        status: { notionConnected: true, dbConnected: true },
      }),
    ).toBe("connected");
  });

  it("notionConnected만 true이면 notion_authorized", () => {
    expect(
      resolveNotionConnectUiStatus({
        handoffId: "h1",
        handoffLaunched: true,
        handoffExpired: false,
        statusFetchFailed: false,
        status: { notionConnected: true, dbConnected: false },
      }),
    ).toBe("notion_authorized");
  });

  it("handoff 만료이면 expired", () => {
    expect(
      resolveNotionConnectUiStatus({
        handoffId: "h1",
        handoffLaunched: true,
        handoffExpired: true,
        statusFetchFailed: false,
        status: null,
      }),
    ).toBe("expired");
  });

  it("각 상태에 title/description이 있다", () => {
    const statuses = [
      "starting",
      "handoff_started",
      "notion_authorized",
      "connected",
      "expired",
      "failed",
    ] as const;

    for (const status of statuses) {
      const copy = getNotionConnectUiCopy(status);
      expect(copy.title.length).toBeGreaterThan(0);
      expect(copy.description.length).toBeGreaterThan(0);
    }
  });
});
