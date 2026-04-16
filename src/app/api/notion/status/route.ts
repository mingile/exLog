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
        const temp = db.collection('temp_info');
        const connection = await collection.findOne({ user_key });
        const temp_connection = await temp.findOne({ user_key });
        const accessToken = temp_connection?.access_token || connection?.access_token;
        const workoutSetsDbId = connection?.workout_sets_db_id;
        const workoutExerciseDbId = connection?.workout_exercise_db_id;
        let notionConnected : boolean = false;
        let dbConnected : boolean = false;

        if (!!accessToken) {
            notionConnected = true;
        }

        if (!!workoutSetsDbId && !!workoutExerciseDbId) {
            dbConnected = true;
        }

        console.log('notionConnected', notionConnected);
        console.log('dbConnected', dbConnected);

        return NextResponse.json({ notionConnected, dbConnected });


    }catch (e){
        console.error('Status read failed', e)
        return NextResponse.json({error:'Status read failed'}, {status:500});
    }

}