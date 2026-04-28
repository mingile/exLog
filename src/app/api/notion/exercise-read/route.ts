import { MongoClient } from "mongodb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

let cachedClient: MongoClient | null = null;

async function getMongoClient() {
    const mongouri = process.env.MONGODB_URI;

    if(!mongouri){
        throw new Error("Missing MONGODB_URI");
    }

    if (!cachedClient) {
        cachedClient = new MongoClient(mongouri);
        await cachedClient.connect();
    }

    return cachedClient;
}

export async function GET(req: Request) {
    try {
        const cookieStore = await cookies();
        const user_key = cookieStore.get("user_key")?.value;

        if(!user_key){
            return NextResponse.json({error: "Unauthorized"}, {status: 401});
        }

        const client = await getMongoClient();
        const db = client.db("notion");
        const collection = db.collection("connections_info");
        const connection = await collection.findOne({ user_key });
        const accessToken = connection?.access_token;
        const exerciseDbId = connection?.workout_exercise_db_id;

        if(!accessToken){
            return NextResponse.json({error: "No access token found"}, {status: 404});
        }

        if(!exerciseDbId){
            return NextResponse.json({error: "Exercise database not connected"}, {status: 404});
        }

        const notionResponse = await fetch(
            `https://api.notion.com/v1/databases/${exerciseDbId}/query`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Notion-Version": "2022-06-28",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({}),
            }
        );

        const notionData = await notionResponse.json();

        if(!notionResponse.ok){
            console.error("Notion exercise read failed:", notionData);
            return NextResponse.json({error: "Notion exercise read failed"}, {status: notionResponse.status});
        }

        return NextResponse.json({ data: notionData.results ?? [] });
        
    } catch (error) {
        console.error("Exercise read failed", error);
        return NextResponse.json({error: "Exercise read failed"}, {status: 500});
    }
}