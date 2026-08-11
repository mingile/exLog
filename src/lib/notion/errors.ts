export type NotionSyncError = Error & {
  name: "NotionSyncError";
  statusCode: number;
};

export function notionSyncError(
  message: string,
  statusCode: number,
): NotionSyncError {
  return Object.assign(new Error(message), {
    name: "NotionSyncError",
    statusCode,
  }) as NotionSyncError;
}

export function getNotionSyncErrorStatusCode(
  error: unknown,
): number | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return typeof statusCode === "number" && Number.isFinite(statusCode)
    ? statusCode
    : undefined;
}
