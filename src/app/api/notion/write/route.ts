import { MongoClient } from "mongodb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

let cached_client: MongoClient | null = null;

type IncomingSet = {
  set_no?: number;
  setNo?: number;
  weight: number;
  reps: number;
  done?: boolean;
};

type IncomingExercise = {
  id?: string;
  name: string;
  sets: IncomingSet[];
};

type IncomingPayload = {
  saved_at?: string;
  savedAt?: string;
  part: string;
  display_unit?: "kg" | "lb";
  displayUnit?: "kg" | "lb";
  exercises: IncomingExercise[];
};

function pick_saved_at(payload: IncomingPayload): string {
  const v = payload.saved_at ?? payload.savedAt;
  // 없으면 서버에서 현재 시각으로 대체
  return typeof v === "string" && v.length > 0 ? v : new Date().toISOString();
}

function pick_unit(payload: IncomingPayload): "kg" | "lb" {
  const v = payload.display_unit ?? payload.displayUnit;
  return v === "lb" ? "lb" : "kg";
}

function normalize_set_no(s: IncomingSet, idx: number): number {
  const n = s.set_no ?? s.setNo;
  if (typeof n === "number" && Number.isFinite(n) && n > 0) return n;
  return idx + 1;
}

function is_number(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export async function POST(req: Request) {
  // 1) 쿠키에서 user_key 읽기
  // (사용자 환경에서 await 필요하다고 하셔서 그대로 둡니다)
  const cookie_store = await cookies();
  const user_key = cookie_store.get("user_key")?.value;

  if (!user_key) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) 바디 파싱/최소 검증
  let payload: IncomingPayload;
  try {
    payload = (await req.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!payload || typeof payload.part !== "string" || payload.part.trim() === "") {
    return NextResponse.json({ error: "Missing part" }, { status: 400 });
  }
  if (!Array.isArray(payload.exercises)) {
    return NextResponse.json({ error: "Missing exercises" }, { status: 400 });
  }

  const saved_at = pick_saved_at(payload);
  const unit = pick_unit(payload);

  // 3) MongoDB 연결정보 조회 (access_token, database_id)
  const mongo_uri = process.env.MONGODB_URI;
  if (!mongo_uri) {
    return NextResponse.json({ error: "Missing MONGODB_URI" }, { status: 500 });
  }

  try {
    if (!cached_client) {
      cached_client = new MongoClient(mongo_uri);
      await cached_client.connect();
    }

    const db = cached_client.db("notion");
    const collection = db.collection("connections_info");

    const connection = await collection.findOne({ user_key });

    const access_token = connection?.access_token as string | undefined;
    const database_id = connection?.database_id as string | undefined;

    if (!access_token) {
      return NextResponse.json({ error: "No access_token for this user_key" }, { status: 404 });
    }
    if (!database_id) {
      return NextResponse.json(
        { error: "No database_id set. Run /api/notion/setup first." },
        { status: 400 }
      );
    }

    // 4) Notion으로 보낼 rows 만들기 (1세트=1row)
    // - done 필터는 클라이언트에서 이미 걸러서 보내는 걸 권장하지만,
    //   혹시 done이 들어오면 done===true만 저장하도록 처리
    const rows: Array<{
      name: string;      // title
      date: string;      // saved_at
      part: string;
      exercise: string;
      set_no: number;
      weight: number;
      reps: number;
      unit: "kg" | "lb";
    }> = [];

    for (const ex of payload.exercises) {
      if (!ex || typeof ex.name !== "string" || !Array.isArray(ex.sets)) continue;

      ex.sets.forEach((s, idx) => {
        // done 키가 존재하면 done===true만 저장
        if (typeof s.done === "boolean" && s.done === false) return;

        const set_no = normalize_set_no(s, idx);
        if (!is_number(s.weight) || !is_number(s.reps)) return;

        rows.push({
          name: `${ex.name} #${set_no}`,
          date: saved_at,
          part: payload.part,
          exercise: ex.name,
          set_no,
          weight: s.weight,
          reps: s.reps,
          unit,
        });
      });
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No rows to write" }, { status: 400 });
    }

    // 5) Notion pages.create 반복 호출
    // ※ property 이름은 Notion DB에 만든 이름과 정확히 일치해야 합니다.
    // 기본값(권장):
    // - Name (title)
    // - Date (date)
    // - Part (rich_text)
    // - Exercise (rich_text)
    // - Set No (number)
    // - Weight (number)
    // - Reps (number)
    // - Unit (rich_text)
    //
    // 만약 너 DB에서 이름이 다르면, 아래 상수만 바꾸세요.
    const PROP = {
      name: "Name",
      date: "Date",
      part: "Part",
      exercise: "Exercise",
      set_no: "Set No",
      weight: "Weight",
      reps: "Reps",
      unit: "Unit",
    } as const;

    let created_count = 0;
    const failed: Array<{ index: number; status: number; message: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];

      const notion_body = {
        parent: { database_id },
        properties: {
          [PROP.name]: {
            title: [{ text: { content: r.name } }],
          },
          [PROP.date]: {
            date: { start: r.date },
          },
          [PROP.part]: {
            rich_text: [{ text: { content: r.part } }],
          },
          [PROP.exercise]: {
            rich_text: [{ text: { content: r.exercise } }],
          },
          [PROP.set_no]: {
            number: r.set_no,
          },
          [PROP.weight]: {
            number: r.weight,
          },
          [PROP.reps]: {
            number: r.reps,
          },
          [PROP.unit]: {
            rich_text: [{ text: { content: r.unit } }],
          },
        },
      };

      const res = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notion_body),
      });

      if (!res.ok) {
        let msg = res.statusText;
        try {
          const err = await res.json();
          msg = err?.message ?? JSON.stringify(err);
        } catch {
          // ignore
        }
        failed.push({ index: i, status: res.status, message: msg });
        continue;
      }

      created_count++;
    }

    return NextResponse.json(
      {
        ok: failed.length === 0,
        created_count,
        failed_count: failed.length,
        failed,
      },
      { status: failed.length === 0 ? 200 : 207 } // 207: Multi-Status 느낌으로 사용
    );
  } catch (e) {
    console.error("Notion write failed", e);
    return NextResponse.json({ error: "Notion write failed" }, { status: 500 });
  }
}