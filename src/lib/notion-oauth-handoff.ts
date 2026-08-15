import crypto from "crypto";
import { getMongoDb } from "@/lib/mongodb";

export const HANDOFF_TTL_MS = 10 * 60 * 1000;
const HANDOFF_COLLECTION = "oauth_handoffs";

export type OAuthHandoffDoc = {
  handoff_id: string;
  user_key: string;
  expires_at: Date;
};

export class HandoffNotFoundError extends Error {
  constructor() {
    super("Handoff not found");
    this.name = "HandoffNotFoundError";
  }
}

export class HandoffExpiredError extends Error {
  constructor() {
    super("Handoff expired");
    this.name = "HandoffExpiredError";
  }
}

export async function createOAuthHandoff(userKey: string): Promise<string> {
  const handoffId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + HANDOFF_TTL_MS);

  const db = await getMongoDb();
  await db.collection<OAuthHandoffDoc>(HANDOFF_COLLECTION).insertOne({
    handoff_id: handoffId,
    user_key: userKey,
    expires_at: expiresAt,
  });

  return handoffId;
}

export async function consumeOAuthHandoff(handoffId: string): Promise<string> {
  const db = await getMongoDb();
  const doc = await db
    .collection<OAuthHandoffDoc>(HANDOFF_COLLECTION)
    .findOneAndDelete({ handoff_id: handoffId });

  if (!doc) {
    throw new HandoffNotFoundError();
  }

  if (doc.expires_at.getTime() <= Date.now()) {
    throw new HandoffExpiredError();
  }

  return doc.user_key;
}
