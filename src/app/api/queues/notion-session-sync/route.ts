import { handleCallback } from "@vercel/queue";
import { isPermanentNotionSyncFailure } from "@/lib/notion/errors";
import { ensureNotionSession } from "@/lib/notion/sessionEnsure";
import { parseNotionSessionSyncMessage } from "@/lib/notion/syncMessage";
import { writeNotionSets } from "@/lib/notion/writeSets";

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
      if (isPermanentNotionSyncFailure(error)) {
        console.error("Permanent Notion sync failure; skipping retry", {
          messageId: metadata.messageId,
          sessionId: parsed.sessionId,
          userKey: parsed.userKey,
          error: error instanceof Error ? error.message : error,
        });
        return;
      }

      throw error;
    }
  },
  {
    visibilityTimeoutSeconds: 600,
  },
);
