export class NotionSyncError extends Error {
  statusCode: number;

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
    name?: unknown;
    statusCode?: unknown;
  };

  if (candidate.name !== "NotionSyncError") {
    return undefined;
  }

  const statusCode = candidate.statusCode;
  return typeof statusCode === "number" && Number.isFinite(statusCode)
    ? statusCode
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
