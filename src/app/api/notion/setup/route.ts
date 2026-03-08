// 쿠키에서 user_key 조회
// body에서 database url 받기
// url에서 32자리 database id 추출
// mongoDB 업데이트

import { MongoClient } from "mongodb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

let cachedClient : MongoClient | null = null;

export async function POST(req: Request){
    const cookieStore = await cookies();
    const user_key = cookieStore.get("user_key")?.value;
    if(!user_key){
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }
    const body = await req.json();
    const databaseUrl = body.databaseUrl;
    if(!databaseUrl){
        return NextResponse.json({error: "Missing database url"}, {status: 400});
    }
    const match = databaseUrl.match(/[0-9a-f]{32}/);
    const databaseId = match ? match[0] : null;
    if(!databaseId){
        return NextResponse.json({error: "Invalid database url"}, {status: 400});
    }
    const mongoUri = process.env.MONGODB_URI;
    if(!mongoUri){
        return NextResponse.json({error: "Missing MONGODB_URI"}, {status: 500});
    }
    try{
        if(!cachedClient){
            cachedClient = new MongoClient(mongoUri);
            await cachedClient.connect();
        }
        const db = cachedClient.db("notion");
        const collection = db.collection("connections_info");
        const connection = await collection.findOne({ user_key: user_key });
        const accessToken = connection?.access_token;
        if (!accessToken) {
            return NextResponse.json({error: "No connection found"}, {status: 404});
        }

        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
            method: "GET",
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Notion-Version': "2022-06-28",
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Notion API error:", {
                status: response.status,
                statusText: response.statusText,
                error: errorData,
            });
            return NextResponse.json({error: "Failed to fetch database properties"}, {status: response.status});
        }

        await response.json();
        await collection.updateOne({user_key: user_key, access_token: accessToken}, {$set: {database_id: databaseId}});
        return NextResponse.json({message: "Database setup completed"}, {status: 200});
    }catch(error){
        console.error("Database setup failed", error);
        return NextResponse.json({error: "Database setup failed"}, {status: 500});
    }
}