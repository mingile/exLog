import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  consumeOAuthHandoff,
  createOAuthHandoff,
  HandoffExpiredError,
  HandoffNotFoundError,
} from "./notion-oauth-handoff";

const mockInsertOne = vi.fn();
const mockFindOneAndDelete = vi.fn();

vi.mock("@/lib/mongodb", () => ({
  getMongoDb: vi.fn(async () => ({
    collection: () => ({
      insertOne: mockInsertOne,
      findOneAndDelete: mockFindOneAndDelete,
    }),
  })),
}));

describe("notion-oauth-handoff", () => {
  beforeEach(() => {
    mockInsertOne.mockReset();
    mockFindOneAndDelete.mockReset();
  });

  it("createOAuthHandoff는 opaque handoffId를 반환한다", async () => {
    mockInsertOne.mockResolvedValue({ acknowledged: true });

    const handoffId = await createOAuthHandoff("user-key-123");

    expect(handoffId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(handoffId).not.toContain("user-key-123");
    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        handoff_id: handoffId,
        user_key: "user-key-123",
        expires_at: expect.any(Date),
      }),
    );
  });

  it("consumeOAuthHandoff는 user_key를 반환하고 1회만 소비한다", async () => {
    mockFindOneAndDelete.mockResolvedValueOnce({
      handoff_id: "handoff-1",
      user_key: "user-key-123",
      expires_at: new Date(Date.now() + 60_000),
    });
    mockFindOneAndDelete.mockResolvedValueOnce(null);

    await expect(consumeOAuthHandoff("handoff-1")).resolves.toBe("user-key-123");
    await expect(consumeOAuthHandoff("handoff-1")).rejects.toBeInstanceOf(
      HandoffNotFoundError,
    );
  });

  it("만료된 handoff는 HandoffExpiredError를 던진다", async () => {
    mockFindOneAndDelete.mockResolvedValue({
      handoff_id: "handoff-1",
      user_key: "user-key-123",
      expires_at: new Date(Date.now() - 1),
    });

    await expect(consumeOAuthHandoff("handoff-1")).rejects.toBeInstanceOf(
      HandoffExpiredError,
    );
  });

  it("존재하지 않는 handoff는 HandoffNotFoundError를 던진다", async () => {
    mockFindOneAndDelete.mockResolvedValue(null);

    await expect(consumeOAuthHandoff("missing")).rejects.toBeInstanceOf(
      HandoffNotFoundError,
    );
  });
});
