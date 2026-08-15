export type NotionConnectUiStatus =
  | "starting"
  | "handoff_started"
  | "notion_authorized"
  | "connected"
  | "expired"
  | "failed";

export type NotionConnectStatusSnapshot = {
  notionConnected: boolean;
  dbConnected: boolean;
};

export function resolveNotionConnectUiStatus(input: {
  handoffId: string | null;
  handoffLaunched: boolean;
  handoffExpired: boolean;
  statusFetchFailed: boolean;
  status: NotionConnectStatusSnapshot | null;
}): NotionConnectUiStatus {
  if (!input.handoffId) {
    return "failed";
  }

  if (input.handoffExpired) {
    return "expired";
  }

  if (input.status?.dbConnected) {
    return "connected";
  }

  if (input.status?.notionConnected) {
    return "notion_authorized";
  }

  if (input.statusFetchFailed && input.handoffLaunched) {
    return "handoff_started";
  }

  if (input.handoffLaunched) {
    return "handoff_started";
  }

  return "starting";
}

export function getNotionConnectUiCopy(status: NotionConnectUiStatus): {
  title: string;
  description: string;
} {
  switch (status) {
    case "starting":
      return {
        title: "Safari에서 Notion을 연결하고 있어요",
        description:
          "잠시만 기다려 주세요. Safari가 자동으로 열리지 않으면 아래 안내를 따라 주세요.",
      };
    case "handoff_started":
      return {
        title: "Safari에서 연결을 진행해 주세요",
        description:
          "Safari에서 Notion 계정 승인과 DB 선택을 완료한 뒤, 홈 화면 Dailyset 아이콘으로 돌아오세요.",
      };
    case "notion_authorized":
      return {
        title: "데이터베이스 선택이 남아 있어요",
        description:
          "Safari에서 Dailyset Notion 설정 페이지로 돌아가 운동 DB 3개를 선택해 주세요. 완료 후 홈 화면 앱 아이콘으로 돌아오세요.",
      };
    case "connected":
      return {
        title: "연결이 완료됐어요",
        description: "Notion 연동이 모두 끝났습니다. Dailyset으로 돌아가세요.",
      };
    case "expired":
      return {
        title: "연결 시간이 만료됐어요",
        description:
          "10분 안에 Safari에서 연결을 시작하지 못했습니다. 처음부터 다시 시도해 주세요.",
      };
    case "failed":
      return {
        title: "연결을 시작할 수 없어요",
        description:
          "handoff 정보가 없습니다. Notion 설정 화면에서 다시 연결을 시작해 주세요.",
      };
  }
}
