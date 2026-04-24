import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL, pathToFileURL } from "node:url";
import type { MockUploadInput } from "@ohbp/verifier-core";
import { listStoredSubmissions, persistUpload, readUploadReceipt } from "./store.js";

async function readJsonBody(request: IncomingMessage): Promise<MockUploadInput> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const body = Buffer.concat(chunks).toString("utf8");
  if (!body.trim()) {
    return {};
  }

  return JSON.parse(body) as MockUploadInput;
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload, null, 2));
}

export function createMockIntakeServer(port = Number(process.env.PORT ?? 4010)) {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `127.0.0.1:${port}`}`);

    if (request.method === "GET" && url.pathname === "/healthz") {
      return sendJson(response, 200, {
        ok: true,
        service: "@ohbp/mock-intake",
      });
    }

    if (request.method === "GET" && url.pathname === "/api/uploads") {
      const items = await listStoredSubmissions();
      return sendJson(
        response,
        200,
        items.map((item) => ({
          submission_id: item.normalized_payload.submission_id,
          requested_trust_tier: item.normalized_payload.requested_trust_tier,
          submission_profile: item.normalized_payload.submission_profile,
          public_bundle_digest: item.normalized_payload.public_bundle_digest,
          uploaded_at: item.uploaded_at,
        })),
      );
    }

    if (request.method === "GET" && url.pathname.startsWith("/api/receipts/")) {
      const receiptId = url.pathname.split("/").pop() ?? "";
      const receipt = await readUploadReceipt(receiptId);
      return receipt
        ? sendJson(response, 200, receipt)
        : sendJson(response, 404, { error: "receipt_not_found", receipt_id: receiptId });
    }

    if (request.method === "POST" && url.pathname === "/api/uploads") {
      try {
        const payload = await readJsonBody(request);
        const stored = await persistUpload({
          ...payload,
          source: payload.source ?? "api",
          received_at: payload.received_at ?? new Date().toISOString(),
        });

        return sendJson(response, 201, {
          upload_receipt: stored.upload_receipt,
          stored_submission: {
            submission_id: stored.normalized_payload.submission_id,
            public_bundle_digest: stored.normalized_payload.public_bundle_digest,
            stored_at: stored.uploaded_at,
          },
        });
      } catch (error) {
        return sendJson(response, 400, {
          error: "invalid_upload_payload",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return sendJson(response, 404, {
      error: "not_found",
      path: url.pathname,
    });
  });

  return {
    port,
    server,
    start() {
      return new Promise<void>((resolvePromise) => {
        server.listen(port, () => resolvePromise());
      });
    },
  };
}

async function main(): Promise<void> {
  const app = createMockIntakeServer();
  await app.start();
  console.log(`mock-intake listening on http://127.0.0.1:${app.port}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
