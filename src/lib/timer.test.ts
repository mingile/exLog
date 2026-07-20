import { describe, expect, it } from "vitest";
import {
  computeElapsedMs,
  computeRemainingMs,
  elapsedSecondsFromStartedAt,
  pauseTimer,
  reconcileTimerState,
  resumeTimer,
  startTimer,
} from "./timer";

const T0 = 1_700_000_000_000;

describe("computeElapsedMs", () => {
  it("running 상태에서는 누적 시간과 현재 구간을 합산한다", () => {
    const state = {
      status: "running" as const,
      accumulatedElapsedMs: 30_000,
      segmentStartedAtMs: T0,
    };

    expect(computeElapsedMs(state, T0 + 10_000)).toBe(40_000);
  });

  it("paused 상태에서는 누적 시간만 반환한다", () => {
    const state = {
      status: "paused" as const,
      accumulatedElapsedMs: 45_000,
      segmentStartedAtMs: null,
    };

    expect(computeElapsedMs(state, T0 + 120_000)).toBe(45_000);
  });
});

describe("pauseTimer / resumeTimer", () => {
  it("일시정지 시 현재까지 경과 시간을 누적한다", () => {
    const running = startTimer(undefined, T0);
    const paused = pauseTimer(running, T0 + 15_000);

    expect(paused.status).toBe("paused");
    expect(paused.accumulatedElapsedMs).toBe(15_000);
    expect(paused.segmentStartedAtMs).toBeNull();
  });

  it("재개 후에는 재개 시각부터 경과 시간을 계산한다", () => {
    const paused = {
      status: "paused" as const,
      accumulatedElapsedMs: 20_000,
      segmentStartedAtMs: null,
    };
    const resumed = resumeTimer(paused, T0 + 60_000);

    expect(resumed.status).toBe("running");
    expect(resumed.segmentStartedAtMs).toBe(T0 + 60_000);
    expect(computeElapsedMs(resumed, T0 + 75_000)).toBe(35_000);
  });
});

describe("reconcileTimerState", () => {
  it("목표 시간을 초과하면 completed 상태로 전환한다", () => {
    const running = startTimer(60_000, T0);
    const completed = reconcileTimerState(running, T0 + 90_000);

    expect(completed.status).toBe("completed");
    expect(completed.accumulatedElapsedMs).toBe(60_000);
    expect(computeRemainingMs(completed)).toBe(0);
  });
});

describe("elapsedSecondsFromStartedAt", () => {
  it("시작 시각 기준 경과 초를 계산한다", () => {
    const startedAt = new Date(T0).toISOString();
    expect(elapsedSecondsFromStartedAt(startedAt, T0 + 125_000)).toBe(125);
  });
});
