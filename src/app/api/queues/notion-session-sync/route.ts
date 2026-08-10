import { handleCallback } from "@vercel/queue";
import { ensureNotionSession } from "@/lib/notion/sessionEnsure";
import { parseNotionSessionSyncMessage } from "@/lib/notion/syncMessage";
import { writeNotionSets } from "@/lib/notion/writeSets";

function getErrorStatusCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return typeof statusCode === "number" && Number.isFinite(statusCode)
    ? statusCode
    : undefined;
}

function isPermanentSyncFailure(error: unknown): boolean {
  const statusCode = getErrorStatusCode(error);
  if (statusCode === undefined) {
    return false;
  }

  if (statusCode === 429) {
    return false;
  }

  return statusCode < 500;
}

export const POST = handleCallback(
  async (message, metadata) => {
    const parsed = parseNotionSessionSyncMessage(message);

    if (!parsed) {
      console.error("Invalid Notion session sync message", {
        messageId: metadata.messageId,
        message,
      });
      return;
    }

    console.log("Processing Notion session sync job", {
      messageId: metadata.messageId,
      sessionId: parsed.sessionId,
      userKey: parsed.userKey,
    });

    if (parsed.sessionId === "queue-test-session-001") {
      console.log("Skipping test session sync job", {
        messageId: metadata.messageId,
        sessionId: parsed.sessionId,
      });
      return;
    }

    try {
      const { pageId } = await ensureNotionSession({
        userKey: parsed.userKey,
        sessionId: parsed.sessionId,
        sessionName: parsed.sessionName,
        startedAt: parsed.startedAt,
      });

      const result = await writeNotionSets({
        userKey: parsed.userKey,
        savedAt: parsed.savedAt,
        exercises: parsed.exercises,
        sessionPageId: pageId,
      });

      console.log("Notion session sync job completed", {
        messageId: metadata.messageId,
        sessionId: parsed.sessionId,
        sessionPageId: pageId,
        created_count: result.created_count,
      });
    } catch (error) {
      const statusCode = getErrorStatusCode(error);

      if (isPermanentSyncFailure(error)) {
        console.error("Permanent Notion sync failure; skipping retry", {
          messageId: metadata.messageId,
          sessionId: parsed.sessionId,
          userKey: parsed.userKey,
          statusCode,
          error: error instanceof Error ? error.message : error,
        });
        return;
      }

      console.error("Retryable Notion sync failure", {
        messageId: metadata.messageId,
        sessionId: parsed.sessionId,
        userKey: parsed.userKey,
        statusCode,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  },
  {
    visibilityTimeoutSeconds: 600,
  },
);
