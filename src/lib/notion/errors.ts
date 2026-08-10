export class NotionSyncError extends Error {
  statusCode: number;
  readonly __notionSyncError = true;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "NotionSyncError";
    this.statusCode = statusCode;
  }
}

export function getNotionSyncErrorStatusCode(
  error: unknown,
): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const candidate = error as {
    __notionSyncError?: boolean;
    statusCode?: unknown;
  };

  if (candidate.__notionSyncError !== true) {
    return undefined;
  }

  return typeof candidate.statusCode === "number"
    ? candidate.statusCode
    : undefined;
}

export function isPermanentNotionSyncFailure(error: unknown): boolean {
  const statusCode = getNotionSyncErrorStatusCode(error);
  if (statusCode === undefined) {
    return false;
  }

  if (statusCode === 429) {
    return false;
  }

  return statusCode < 500;
}
