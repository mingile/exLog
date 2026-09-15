import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const USER_KEY_MAX_AGE = 60 * 60 * 24 * 30;
const OAUTH_STATE_MAX_AGE = 60 * 10;

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function resolveUserKey(): Promise<string> {
  const cookieStore = await cookies();
  let userKey = cookieStore.get("user_key")?.value;

  if (!userKey) {
    userKey = crypto.randomUUID();
    cookieStore.set("user_key", userKey, {
      ...cookieBase,
      maxAge: USER_KEY_MAX_AGE,
    });
  }

  return userKey;
}

export function prepareNotionOAuthRedirect(userKey: string): NextResponse {
  const randomState = crypto.randomUUID();
  const authUrl = new URL(process.env.NOTION_AUTHORIZE_URL ?? "");
  authUrl.searchParams.set("client_id", process.env.NOTION_CLIENT_ID ?? "");
  authUrl.searchParams.set(
    "redirect_uri",
    process.env.NOTION_REDIRECT_URI ?? "",
  );
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", randomState);
  authUrl.searchParams.set("owner", "user");

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("user_key", userKey, {
    ...cookieBase,
    maxAge: USER_KEY_MAX_AGE,
  });
  response.cookies.set("notion_oauth_state", randomState, {
    ...cookieBase,
    maxAge: OAUTH_STATE_MAX_AGE,
  });
  response.headers.set("Referrer-Policy", "no-referrer");

  return response;
}

/**
 * [SPIKE — spike/ul-js-nav] prepareNotionOAuthRedirect 의 JSON 쌍둥이.
 *
 * 302 대신 authUrl 을 JSON 으로 돌려준다. 클라이언트가 location.replace(authUrl)
 * 로 이동하면 "탭으로 시작된 리다이렉트 체인"이 끊기므로, iOS Universal Link 가
 * 발동하지 않는다는 가설을 실기기에서 확인하기 위한 것.
 *
 * 쿠키는 기존 경로와 동일하게 심는다. 검증 후 제거하거나 정식 경로로 승격한다.
 */
export function prepareNotionOAuthJson(userKey: string): NextResponse {
  const randomState = crypto.randomUUID();
  const authUrl = new URL(process.env.NOTION_AUTHORIZE_URL ?? "");
  authUrl.searchParams.set("client_id", process.env.NOTION_CLIENT_ID ?? "");
  authUrl.searchParams.set(
    "redirect_uri",
    process.env.NOTION_REDIRECT_URI ?? "",
  );
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", randomState);
  authUrl.searchParams.set("owner", "user");

  const response = NextResponse.json(
    { authUrl: authUrl.toString() },
    { headers: { "Cache-Control": "no-store" } },
  );
  response.cookies.set("user_key", userKey, {
    ...cookieBase,
    maxAge: USER_KEY_MAX_AGE,
  });
  response.cookies.set("notion_oauth_state", randomState, {
    ...cookieBase,
    maxAge: OAUTH_STATE_MAX_AGE,
  });
  response.headers.set("Referrer-Policy", "no-referrer");

  return response;
}

export function buildHandoffErrorResponse(
  title: string,
  message: string,
): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; color: #111; }
    h1 { font-size: 1.25rem; margin-bottom: 0.75rem; }
    p { margin: 0; color: #444; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p>${message}</p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 400,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
    },
  });
}
