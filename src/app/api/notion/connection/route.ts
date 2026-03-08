// 이 브라우저 사용자를 식별할 수 있는 키를 찾기
// MongoDB에서 연결문서 1개를 조회
// 있으면 {connected: true}, 없으면 {connected: false} 응답

import { MongoClient } from "mongodb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

let cachedClient : MongoClient | null = null;

export async function GET(req : Request){
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error("Missing MONGODB_URI");
        return NextResponse.json({ connected: false }, { status: 500 });
    }
    try{

        if(!cachedClient){
            cachedClient = new MongoClient(mongoUri);
            await cachedClient.connect();
        }
        const db = cachedClient.db('notion');
        const collection = db.collection("connections_info");
        const cookieStore = await cookies();
        const user_key = cookieStore.get("user_key")?.value;
        if(!user_key){
            return NextResponse.json({connected: false}, {status: 401});
        }
        const result = await collection.findOne({
            user_key: user_key
        });
        return NextResponse.json({connected: !!result});

    }catch(error){
        console.error("Notion 연결 정보 조회 중 예외", error);
        return NextResponse.json({connected: false}, {status: 500});
    }
}