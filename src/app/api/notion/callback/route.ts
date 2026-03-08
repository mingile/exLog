import { MongoClient } from "mongodb";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

let cachedClient : MongoClient | null = null;

export async function GET(request: Request){

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    if(!code || !state){
        return NextResponse.redirect(new URL("/api/notion/auth", process.env.APP_BASE_URL));
    }
    
    const cookieStore = await cookies();
    const savedState = cookieStore.get("notion_oauth_state")?.value;
    let user_key = cookieStore.get("user_key")?.value;
    if(!user_key){
        return NextResponse.redirect(new URL("/api/notion/auth", process.env.APP_BASE_URL));
    }

    if(!savedState || savedState !== state){
        return NextResponse.redirect(new URL("/api/notion/auth", process.env.APP_BASE_URL));
    } else {
        cookieStore.set("notion_oauth_state", "", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 0,
            path: "/",
        })
    }
    
    const tokenUrl = process.env.NOTION_TOKEN_URL;
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;
    const redirectUri = process.env.NOTION_REDIRECT_URI;
    
    if (!tokenUrl || !clientId || !clientSecret || !redirectUri) {
        console.error("Missing Notion env vars", {
            hasTokenUrl: !!tokenUrl,
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
            hasRedirectUri: !!redirectUri,
        });
        return NextResponse.redirect(new URL("/api/notion/auth", process.env.APP_BASE_URL));
    }
    
        const credentials = Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString("base64");
        const authHeader = `Basic ${credentials}`

        const form = new URLSearchParams();
        form.set("grant_type", "authorization_code");
        form.set("code", code);
        form.set("redirect_uri", redirectUri);
    
        let tokenData: any = null;
    
        try {
            const tokenResponse = await fetch(tokenUrl, {
                method: "POST",
                headers: {
                    Authorization: authHeader,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: form.toString(),
            });
    
            const raw = await tokenResponse.text();
            try {
                tokenData = raw ? JSON.parse(raw) : null;
            } catch {
                tokenData = { raw };
            }
            if (!tokenResponse.ok) {
                console.error("Notion token 교환 실패", {
                    status: tokenResponse.status,
                    tokenData,
                });
                return NextResponse.redirect(new URL("/api/notion/auth", process.env.APP_BASE_URL));
            }
    
            console.log("Notion token 교환 성공", {
                hasAccessToken: !!tokenData?.access_token,
                botId: tokenData?.bot_id,
                workspaceId: tokenData?.workspace_id,
            });
    
            // TODO: 4-4 MongoDB upsert 저장
            if(!cachedClient){
                 cachedClient = new MongoClient(process.env.MONGODB_URI ?? '');
                 await cachedClient.connect();
            }
                const db = cachedClient.db('notion');
                const collection = db.collection("connections_info");

            try{
                await collection.findOneAndUpdate({
                    bot_id: tokenData?.bot_id,
                },{
                    $set:{
                        bot_id: tokenData?.bot_id,
                        access_token: tokenData?.access_token,
                        workspace_id: tokenData?.workspace_id,
                        user_key: user_key,
                        updated_at: new Date(),
                    },
                    $setOnInsert:{
                        created_at: new Date(),
                    }
                },
                {
                    upsert: true,
                    returnDocument: "after"
                }
            );
                console.log('db생성')
                // const redirectUrl = new URL("/settings/notion", process.env.APP_BASE_URL);
                // redirectUrl.searchParams.set("connected", "1");
                return NextResponse.redirect(new URL('/', process.env.APP_BASE_URL));
            }catch(error){
                console.error("Notion 연결 정보 저장 중 예외", error);
                return NextResponse.redirect(new URL("/api/notion/auth", process.env.APP_BASE_URL));
            }
    }catch(error){
        console.error("Notion token 교환 중 예외", error);
        return NextResponse.redirect(new URL("/api/notion/auth", process.env.APP_BASE_URL));
    }
}
// notion token endpoint로 code 교환
// 응답에서 아래 값들 뽑기
    // access_token
    // refresh_token
    // bot_id
    // workspace_id
// MongoDB에 "연결정보" upsert 저장
    // 기준키 : bot_id unique
// 이후 앱 화면으로 redirect
    // 예 : /settings/notion 또는 ?connected=1