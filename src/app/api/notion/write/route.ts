import { MongoClient } from "mongodb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

let cachedClient : MongoClient | null = null;

export async function POST(req: Request){
 
  const cookieStore = await cookies();
  const user_key = cookieStore.get('user_key')?.value;
  const body = await req.json();
  
  const mongoUri = process.env.MONGODB_URI;
  if(!mongoUri){
    return NextResponse.json({error: "Missing MONGODB_URI"}, {status: 500});
}
  
  if(!user_key){
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  const saved_at = body.saved_at;
  const part = body.part;
  const exercises = body.exercises;
  //return NextResponse.json({exercise_name, weight, reps});
  
  try{
 
    if(!cachedClient){
      cachedClient = new MongoClient(mongoUri);
      await cachedClient.connect();
    }
    const db = cachedClient?.db("notion");
    const collection = db?.collection("connections_info");
    const connection = await collection?.findOne({ user_key });
    const accessToken = connection?.access_token;
    const databaseId = connection?.database_id;

    if(!accessToken){
      return NextResponse.json({error:"No connection found"}, {status: 404});
    }
    if(!databaseId){
      return NextResponse.json({error:"No databaseId found"}, {status: 404}); 
    }

    let created_count = 0;

    for(const exercise of exercises){
      for(const set of exercise.sets){
        const notion_payload = {
          parent: {
            database_id: databaseId,
          },
          properties: {
            "Name": {
              "title": [
                {
                  "text": {
                    "content": exercise.name + " - #" + set.setNo,
                  },
                },
              ],
            },
            "Set No": {
              "number": set.setNo,
            },
            "Weight": {
              "number": set.weight,
            },
            "Reps": {
              "number": set.reps
            },
            "Date":{
              "date": {
                "start": saved_at
              }
            },
            "Part": {
              "select": { // notion Part 속성은 select임
                "name": part
              }
            },
            "Exercise": {
              "rich_text": [
                {
                  "text": {
                    "content": exercise.name
                  }
                }
              ]
            },
            "Memo":{
              "rich_text":[
                {
                  "text":{
                    "content":set.memo
                  }
                }
              ]
            }
          }
        }
        const response = await fetch('https://api.notion.com/v1/pages', {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          },
          body: JSON.stringify(notion_payload),
        })
    
    
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Notion API error:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
        });
        return NextResponse.json({error: "Failed to create database record"}, {status: response.status});
    }
    await response.json();
    created_count++;
      }
    }

  return NextResponse.json({ok: true, created_count: created_count});
  }
  catch(e){
    console.error('Notion write failed', e)
    return NextResponse.json({error:'Notion write failed'}, {status:500});
  }







}