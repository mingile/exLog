import { MongoClient } from "mongodb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

let cachedClient: MongoClient | null = null;

async function getMongoClient() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI");
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(mongoUri);
    await cachedClient.connect();
  }

  return cachedClient;
}

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const user_key = cookieStore.get("user_key")?.value;

    if (!user_key) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const client = await getMongoClient();
    const db = client.db("notion");
    const collection = db.collection("connections_info");

    const connection = await collection.findOne({ user_key });

    const accessToken = connection?.access_token;
    const databaseId = connection?.database_id;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token found" },
        { status: 404 }
      );
    }

    if (!databaseId) {
      return NextResponse.json(
        { error: "No database connected" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const pageSizeParam = Number(searchParams.get("limit") ?? "100");
    const page_size = Number.isFinite(pageSizeParam)
      ? Math.max(1, Math.min(pageSizeParam, 100))
      : 100;

    const notionResponse = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          page_size,
          sorts: [
            {
              timestamp: "last_edited_time",
              direction: "descending",
            },
          ],
        }),
      }
    );

    const data = await notionResponse.json();

    if (!notionResponse.ok) {
      console.error("Notion query failed:", data);
      return NextResponse.json(
        { error: "Failed to fetch notion records", detail: data },
        { status: notionResponse.status }
      );
    }

    return NextResponse.json(
      {
        results: data.results ?? [],
        has_more: data.has_more ?? false,
        next_cursor: data.next_cursor ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Workout records fetch failed", error);
    return NextResponse.json(
      { error: "Workout records fetch failed" },
      { status: 500 }
    );
  }
}