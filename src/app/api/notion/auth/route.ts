import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
    // state 생성 (랜덤)
    const randomState = crypto.randomUUID();
    // state를 HttpOnly 쿠키로 저장 (콜백에서 검증용)
    const cookieStore = await cookies();
    
    let userKey = cookieStore.get("user_key")?.value;
    if(!userKey){
        userKey = crypto.randomUUID();
        cookieStore.set("user_key", userKey, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60*60*24*30, // 30일
            path: "/",
        });
    }

    cookieStore.set("notion_oauth_state", randomState, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60*10,
        path: "/",
    });

    console.log("AUTHORIZE:", process.env.NOTION_AUTHORIZE_URL);
    // Notion authorize URL 구성
    const authUrl = new URL('https://api.notion.com/v1/oauth/authorize?client_id=319d872b-594c-8114-bf2c-00379ce0d20e&response_type=code&owner=user&redirect_uri=https%3A%2F%2Fex-log-five.vercel.app%2Fapi%2Fnotion%2Fcallback');
    // client_id
    authUrl.searchParams.set("client_id", process.env.NOTION_CLIENT_ID ?? "");
    // redirect_uri
    authUrl.searchParams.set("redirect_uri", process.env.NOTION_REDIRECT_URI ?? "");
    // response_type=code
    authUrl.searchParams.set("response_type", "code");
    // state
    authUrl.searchParams.set("state", randomState);

    // 302 redirect 응답 
    return NextResponse.redirect(authUrl);
}