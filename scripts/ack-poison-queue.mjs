const MESSAGE_IDS = [
  "1k-1M1UwuG4vmKhDPnOIlFFZ7tc7zrsfPsI",
  "1A-1M1Uwtb1eWhEiOd35v6GHs7balLfTAlm",
  "1U-1M1Uwu7ESAw7QEU32RXNhsbFkvBPqvCc",
];

const TOPIC = "notion-session-sync";

const CONSUMERS = [
  "src_Sapp_Sapi_Squeues_Snotion-session-sync_Sroute_Dts",
  "src_Sapp_Sapi_Squeues_Snotion-session-sync_Sroute",
  "app_Sapi_Squeues_Snotion-session-sync_Sroute_Dts",
  "app_Sapi_Squeues_Snotion-session-sync_Sroute",
  "api_Squeues_Snotion-session-sync_Sroute",
  "api_Squeues_Snotion-session-sync_Sroute_Dts",
];

const REGIONS = ["iad1", "icn1", "hnd1", "sin1"];

const DEPLOYMENTS = [
  null,
  "dpl_GB8ZHBvSL2C9CVMXmthrsfvfERgF",
  "dpl_8gRCtsg3Jn9FU4isBmYWoRZuktnp",
  "dpl_FZU5qrQqHHrbs6hvQX9C55WeUowD",
  "dpl_HCraVMeGm4hBkWBBFhWqUkpRTaXU",
  "dpl_F19go1dVMAwGhWEikMw5xAcpk5Qq",
  "dpl_C8vixtfYeE74U219R5ohE6nyCqCJ",
];

const token = process.env.VERCEL_OIDC_TOKEN;
if (!token) {
  console.error("VERCEL_OIDC_TOKEN 없음.");
  process.exit(1);
}

function buildHeaders(deploymentId, extra = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/x-ndjson",
    ...extra,
  };

  if (deploymentId) {
    headers["Vqs-Deployment-Id"] = deploymentId;
  }

  return headers;
}

function deploymentLabel(deploymentId) {
  return deploymentId ?? "deploymentless";
}

function sanitizeConsumerName(functionPath) {
  let result = "";
  for (const char of functionPath) {
    if (char === "_") result += "__";
    else if (char === "/") result += "_S";
    else if (char === ".") result += "_D";
    else if (/[A-Za-z0-9-]/.test(char)) result += char;
    else {
      result += `_${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`;
    }
  }
  return result;
}

const dynamicConsumers = [
  "src/app/api/queues/notion-session-sync/route.ts",
  "src/app/api/queues/notion-session-sync/route",
  "app/api/queues/notion-session-sync/route.ts",
  "app/api/queues/notion-session-sync/route",
].map(sanitizeConsumerName);

for (const name of dynamicConsumers) {
  if (!CONSUMERS.includes(name)) {
    CONSUMERS.push(name);
  }
}

async function probeBatch(region, consumer, deploymentId) {
  const label = deploymentLabel(deploymentId);
  const url = `https://${region}.vercel-queue.com/api/v3/topic/${encodeURIComponent(TOPIC)}/consumer/${encodeURIComponent(consumer)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(deploymentId, {
      "Vqs-Max-Messages": "10",
      "Vqs-Visibility-Timeout-Seconds": "60",
    }),
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    return `${response.status} ${(await response.text()).slice(0, 80)}`;
  }

  const text = await response.text();
  const ids = [...text.matchAll(/"messageId":"([^"]+)"/g)].map((match) => match[1]);
  return `visible=${ids.length} ${ids.join(", ")}`;
}

async function ackOne(region, consumer, deploymentId, messageId) {
  const label = deploymentLabel(deploymentId);
  const receiveUrl = `https://${region}.vercel-queue.com/api/v3/topic/${encodeURIComponent(TOPIC)}/consumer/${encodeURIComponent(consumer)}/id/${encodeURIComponent(messageId)}`;
  const receive = await fetch(receiveUrl, {
    method: "POST",
    headers: buildHeaders(deploymentId, {
      "Vqs-Visibility-Timeout-Seconds": "60",
    }),
  });

  if (receive.status === 404 || receive.status === 410) {
    return `${label} not-found`;
  }

  if (receive.status === 409) {
    return `${label} locked-in-flight`;
  }

  if (!receive.ok) {
    return `${label} recv-${receive.status}`;
  }

  const line = (await receive.text()).trim().split("\n")[0];
  const { receiptHandle } = JSON.parse(line);
  const ackUrl = `https://${region}.vercel-queue.com/api/v3/topic/${encodeURIComponent(TOPIC)}/consumer/${encodeURIComponent(consumer)}/lease/${encodeURIComponent(receiptHandle)}`;
  const ack = await fetch(ackUrl, {
    method: "DELETE",
    headers: buildHeaders(deploymentId),
  });

  return ack.status === 204 ? `${label} acked` : `${label} ack-${ack.status}`;
}

console.log("=== probe (non-empty만 출력) ===");

const hits = [];

for (const region of REGIONS) {
  for (const consumer of CONSUMERS) {
    for (const deploymentId of DEPLOYMENTS) {
      const result = await probeBatch(region, consumer, deploymentId);
      if (result) {
        const line = `[hit] region=${region} consumer=${consumer} ${deploymentLabel(deploymentId)}: ${result}`;
        console.log(line);
        hits.push({ region, consumer, deploymentId });
      }
    }
  }
}

if (hits.length === 0) {
  console.log("poll API 기준 visible 메시지 없음 (전 partition empty)");
}

console.log("\n=== ack ===");

for (const messageId of MESSAGE_IDS) {
  let done = false;

  const targets =
    hits.length > 0
      ? hits
      : REGIONS.flatMap((region) =>
          CONSUMERS.flatMap((consumer) =>
            DEPLOYMENTS.map((deploymentId) => ({ region, consumer, deploymentId })),
          ),
        );

  for (const { region, consumer, deploymentId } of targets) {
    const result = await ackOne(region, consumer, deploymentId, messageId);
    if (
      result.endsWith("acked") ||
      result.endsWith("locked-in-flight") ||
      result.includes("recv-409")
    ) {
      console.log(`${messageId} region=${region} consumer=${consumer} ${result}`);
    }

    if (result.endsWith("acked")) {
      done = true;
      break;
    }
  }

  if (!done) {
    console.error("FAILED:", messageId);
  }
}
