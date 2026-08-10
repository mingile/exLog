import { getNotionConnection } from "@/lib/notion/connection";
import { NotionSyncError } from "@/lib/notion/errors";

const sessionPageIdCache = new Map<string, string>();

export type SessionEnsureParams = {
  userKey: string;
  sessionId: string;
  sessionName: string;
  startedAt: string;
};

export type SessionEnsureResult = {
  pageId: string;
  cached?: boolean;
  found?: boolean;
  created?: boolean;
};

export async function ensureNotionSession(
  params: SessionEnsureParams,
): Promise<SessionEnsureResult> {
  const { userKey, sessionId, sessionName, startedAt } = params;
  const connection = await getNotionConnection(userKey);
  const accessToken = connection.accessToken;
  const sessionDatabaseId = connection.workoutSessionDbId;

  if (!sessionDatabaseId) {
    throw new NotionSyncError("No Session database configured", 404);
  }

  const cacheKey = `${userKey}:${sessionId}`;
  const cachedPageId = sessionPageIdCache.get(cacheKey);
  if (cachedPageId) {
    return {
      pageId: cachedPageId,
      cached: true,
    };
  }

  const queryResponse = await fetch(
    `https://api.notion.com/v1/databases/${sessionDatabaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        filter: {
          property: "Session ID",
          rich_text: {
            equals: sessionId,
          },
        },
      }),
    },
  );

  if (!queryResponse.ok) {
    const errorData = await queryResponse.json();
    console.error("Notion query error:", errorData);
    throw new NotionSyncError(
      "Failed to query Session DB",
      queryResponse.status,
    );
  }

  const queryData = await queryResponse.json();

  if (queryData.results && queryData.results.length > 0) {
    const pageId = queryData.results[0].id;
    sessionPageIdCache.set(cacheKey, pageId);
    return {
      pageId,
      found: true,
    };
  }

  const createPayload = {
    parent: {
      database_id: sessionDatabaseId,
    },
    properties: {
      이름: {
        title: [
          {
            text: {
              content: sessionName,
            },
          },
        ],
      },
      "Session ID": {
        rich_text: [
          {
            text: {
              content: sessionId,
            },
          },
        ],
      },
      시작시간: {
        date: {
          start: startedAt,
        },
      },
    },
  };

  const createResponse = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify(createPayload),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json();
    console.error("Notion Session create error:", errorData);
    throw new NotionSyncError(
      "Failed to create Session row",
      createResponse.status,
    );
  }

  const createData = await createResponse.json();
  const pageId = createData.id;
  sessionPageIdCache.set(cacheKey, pageId);

  return {
    pageId,
    created: true,
  };
}
