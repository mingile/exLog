export class NotionSyncError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "NotionSyncError";
    this.statusCode = statusCode;
  }
}
