import { MongoClient } from "mongodb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

let cachedClient: MongoClient | null = null;
let sessionPageIdCache: Map<string, string> = new Map();

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const user_key = cookieStore.get('user_key')?.value;
  const body = await req.json();

  const { sessionId, sessionName, startedAt } = body;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    return NextResponse.json({ error: "Missing MONGODB_URI" }, { status: 500 });
  }

  if (!user_key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!sessionId || !sessionName || !startedAt) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    if (!cachedClient) {
      cachedClient = new MongoClient(mongoUri);
      await cachedClient.connect();
    }
    const db = cachedClient?.db("notion");
    const collection = db?.collection("connections_info");
    const connection = await collection?.findOne({ user_key });
    const accessToken = connection?.access_token;
    const sessionDatabaseId = connection?.workout_session_db_id;

    if (!accessToken) {
      return NextResponse.json({ error: "No connection found" }, { status: 404 });
    }
    if (!sessionDatabaseId) {
      return NextResponse.json({ error: "No Session database configured" }, { status: 404 });
    }

    // 1. 캐시 확인
    const cacheKey = `${user_key}:${sessionId}`;
    if (sessionPageIdCache.has(cacheKey)) {
      return NextResponse.json({ 
        pageId: sessionPageIdCache.get(cacheKey),
        cached: true 
      });
    }

    // 2. Notion DB에서 Session ID로 조회
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${sessionDatabaseId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        filter: {
          property: "Session ID",
          rich_text: {
            equals: sessionId
          }
        }
      })
    });

    if (!queryResponse.ok) {
      const errorData = await queryResponse.json();
      console.error("Notion query error:", errorData);
      return NextResponse.json({ error: "Failed to query Session DB" }, { status: queryResponse.status });
    }

    const queryData = await queryResponse.json();

    // 3. 기존 Session이 있으면 해당 pageId 반환
    if (queryData.results && queryData.results.length > 0) {
      const pageId = queryData.results[0].id;
      sessionPageIdCache.set(cacheKey, pageId);
      return NextResponse.json({ 
        pageId,
        found: true 
      });
    }

    // 4. 없으면 새 Session row 생성
    const createPayload = {
      parent: {
        database_id: sessionDatabaseId,
      },
      properties: {
        "이름": {
          "title": [
            {
              "text": {
                "content": sessionName,
              },
            },
          ],
        },
        "Session ID": {
          "rich_text": [
            {
              "text": {
                "content": sessionId,
              },
            },
          ],
        },
        "시작시간": {
          "date": {
            "start": startedAt,
          },
        },
      },
    };

    const createResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(createPayload),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error("Notion Session create error:", errorData);
      return NextResponse.json({ error: "Failed to create Session row" }, { status: createResponse.status });
    }

    const createData = await createResponse.json();
    const pageId = createData.id;

    // 5. 캐시에 저장
    sessionPageIdCache.set(cacheKey, pageId);

    return NextResponse.json({ 
      pageId,
      created: true 
    });

  } catch (e) {
    console.error("Session ensure failed", e);
    return NextResponse.json({ error: "Session ensure failed" }, { status: 500 });
  }
}
