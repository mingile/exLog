export class NotionSyncError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "NotionSyncError";
    this.statusCode = statusCode;
  }
}

export function isPermanentNotionSyncFailure(error: unknown): boolean {
  if (!(error instanceof NotionSyncError)) {
    return false;
  }

  if (error.statusCode === 429) {
    return false;
  }

  return error.statusCode < 500;
}
