import { NextResponse } from "next/server";
import {
  consumeOAuthHandoff,
  HandoffExpiredError,
  HandoffNotFoundError,
} from "@/lib/notion-oauth-handoff";
import {
  buildHandoffErrorResponse,
  prepareNotionOAuthRedirect,
  resolveUserKey,
} from "@/lib/notion-oauth-start";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const handoff = url.searchParams.get("handoff");

  if (handoff) {
    try {
      const userKey = await consumeOAuthHandoff(handoff);
      return prepareNotionOAuthRedirect(userKey);
    } catch (error) {
      if (error instanceof HandoffExpiredError) {
        return buildHandoffErrorResponse(
          "연결 링크가 만료됐어요",
          "Dailyset 앱으로 돌아가서 Notion 연결을 다시 시작해 주세요.",
        );
      }

      if (error instanceof HandoffNotFoundError) {
        return buildHandoffErrorResponse(
          "연결 링크가 유효하지 않아요",
          "Dailyset 앱으로 돌아가서 Notion 연결을 다시 시작해 주세요.",
        );
      }

      return buildHandoffErrorResponse(
        "연결을 시작할 수 없어요",
        "Dailyset 앱으로 돌아가서 Notion 연결을 다시 시작해 주세요.",
      );
    }
  }

  const userKey = await resolveUserKey();
  return prepareNotionOAuthRedirect(userKey);
}
