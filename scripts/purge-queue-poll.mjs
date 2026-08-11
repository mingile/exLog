/**
 * Push consumer group 이름을 몰라도, poll mode의 **새 consumer group**으로
 * deployment partition 안의 메시지를 receive → handler 성공(ack) 합니다.
 *
 * 주의: push group과 poll group은 별개입니다.
 * push group 메시지를 끊으려면 아래 PUSH_CONSUMER 후보로도 시도합니다.
 */
import { PollingQueueClient } from "@vercel/queue";

const MESSAGE_IDS = [
  "1k-1M1UwuG4vmKhDPnOIlFFZ7tc7zrsfPsI",
  "1A-1M1Uwtb1eWhEiOd35v6GHs7balLfTAlm",
  "1U-1M1Uwu7ESAw7QEU32RXNhsbFkvBPqvCc",
];

const TOPIC = "notion-session-sync";
const REGION = "iad1";

const DEPLOYMENTS = [
  "dpl_GB8ZHBvSL2C9CVMXmthrsfvfERgF",
  "dpl_8gRCtsg3Jn9FU4isBmYWoRZuktnp",
  "dpl_FZU5qrQqHHrbs6hvQX9C55WeUowD",
  "dpl_HCraVMeGm4hBkWBBFhWqUkpRTaXU",
  "dpl_F19go1dVMAwGhWEikMw5xAcpk5Qq",
  "dpl_C8vixtfYeE74U219R5ohE6nyCqCJ",
];

const PUSH_CONSUMERS = [
  "src_Sapp_Sapi_Squeues_Snotion-session-sync_Sroute_Dts",
  "src_Sapp_Sapi_Squeues_Snotion-session-sync_Sroute",
  "app_Sapi_Squeues_Snotion-session-sync_Sroute_Dts",
  "app_Sapi_Squeues_Snotion-session-sync_Sroute",
  "api_Squeues_Snotion-session-sync",
  "api_Squeues_Snotion-session-sync_Sroute",
];

const token = process.env.VERCEL_OIDC_TOKEN;
if (!token) {
  console.error("VERCEL_OIDC_TOKEN 없음");
  process.exit(1);
}

async function tryReceiveById(client, consumerGroup, messageId) {
  const result = await client.receive(
    TOPIC,
    consumerGroup,
    async (message, metadata) => {
      console.log("  received", {
        messageId: metadata.messageId,
        deliveryCount: metadata.deliveryCount,
        sessionId: message?.sessionId,
      });
    },
    { messageId },
  );
  return result;
}

async function drainBatch(client, consumerGroup, limit = 10) {
  const result = await client.receive(
    TOPIC,
    consumerGroup,
    async (message, metadata) => {
      console.log("  drained", metadata.messageId, message?.sessionId);
    },
    { limit },
  );
  return result;
}

console.log("=== push consumer group (by messageId) ===");

for (const deploymentId of DEPLOYMENTS) {
  const client = new PollingQueueClient({
    region: REGION,
    token,
    deploymentId,
  });

  for (const consumerGroup of PUSH_CONSUMERS) {
    for (const messageId of MESSAGE_IDS) {
      try {
        const result = await tryReceiveById(client, consumerGroup, messageId);
        if (result.ok) {
          console.log(`ACKED push group: dpl=${deploymentId} consumer=${consumerGroup} id=${messageId}`);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (!msg.includes("404") && !msg.includes("not found")) {
          console.log(`ERR dpl=${deploymentId} consumer=${consumerGroup} id=${messageId}: ${msg}`);
        }
      }
    }
  }
}

console.log("\n=== new poll consumer group (batch drain) ===");

for (const deploymentId of DEPLOYMENTS) {
  const pollGroup = `manual-purge-${deploymentId.slice(-8)}`;
  const client = new PollingQueueClient({
    region: REGION,
    token,
    deploymentId,
  });

  for (let i = 0; i < 5; i += 1) {
    try {
      const result = await drainBatch(client, pollGroup, 10);
      if (!result.ok) {
        console.log(`dpl=${deploymentId} pollGroup=${pollGroup}: empty (${result.reason})`);
        break;
      }
      console.log(`dpl=${deploymentId} pollGroup=${pollGroup}: batch acked`);
    } catch (error) {
      console.log(
        `dpl=${deploymentId} pollGroup=${pollGroup}: ${error instanceof Error ? error.message : error}`,
      );
      break;
    }
  }
}

console.log("\n완료. push group에서 ack된 줄이 없으면 Vercel Logs에서 VERCEL_DEPLOYMENT_ID 확인 필요.");
