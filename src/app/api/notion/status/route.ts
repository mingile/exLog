import { MongoClient } from "mongodb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

let cachedClient : MongoClient | null = null;

export async function GET(req:Request){
    const cookieStore = await cookies();
    const user_key = cookieStore.get("user_key")?.value;
    if(!user_key){
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
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

        const db = cachedClient.db('notion');
        const collection = db.collection('connections_info');
        const connection = await collection.findOne({ user_key });
        const accessToken = connection?.access_token;
        const databaseId = connection?.database_id;
        let notionConnected : boolean = false;
        let dbConnected : boolean = false;
        if(accessToken){
            notionConnected = true;
        }
        if(databaseId){
            dbConnected = true;
        }

        return NextResponse.json({ notionConnected, dbConnected });


    }catch (e){
        console.error('Status read failed', e)
        return NextResponse.json({error:'Status read failed'}, {status:500});
    }

}