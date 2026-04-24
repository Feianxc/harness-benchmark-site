import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { parse as parseQueryString } from "node:querystring";
import { pathToFileURL } from "node:url";
import {
  isHostId,
  resolveUiLanguage,
  type BoardId,
  type HostId,
} from "@ohbp/view-models";
import {
  loadConsumerHomeView,
  loadHarnessCompareView,
  loadHostLeaderboardView,
} from "./consumer-data.js";
import {
  loadAllBoardViews,
  loadBoardSliceList,
  loadBoardView,
  loadEntryView,
  loadProtocolField,
  loadProtocolIndex,
  loadProtocolObject,
  loadProtocolView,
  loadValidatorSampleCases,
  runValidatorPreview,
  sampleValidatorPayload,
} from "./data.js";
import {
  renderBoardPage,
  renderComparePage,
  renderConsumerHomePage,
  renderEntryPage,
  renderHostLeaderboardPage,
  renderNotFound,
  renderProtocolPage,
  renderSubmitPage,
  renderValidatorPage,
} from "./render.js";
import {
  blockedSpamGuardReceipt,
  createPublicSubmission,
  isBlockedBySpamGuard,
  listPublicSubmissionReceipts,
  PUBLIC_SUBMISSION_MAX_BYTES,
  preflightPublicSubmissionInput,
  readPublicSubmissionReceipt,
  type PublicSubmissionInput,
  type PublicSubmissionReceipt,
} from "./public-submissions.js";

const BOARD_IDS = [
  "official-verified",
  "reproducibility-frontier",
  "community-lab",
] as const satisfies BoardId[];

function isBoardId(value: string): value is BoardId {
  return (BOARD_IDS as readonly string[]).includes(value);
}

function normalizeValidatorMode(
  value: string | null | undefined,
): "schema_only" | "bundle_integrity" | "admission_readiness" {
  if (value === "schema_only" || value === "bundle_integrity") {
    return value;
  }

  return "admission_readiness";
}

function validatorPathWithState(options: {
  lang: ReturnType<typeof resolveUiLanguage>;
  mode: ReturnType<typeof normalizeValidatorMode>;
  sampleId?: string;
}): string {
  const params = new URLSearchParams();
  params.set("lang", options.lang);
  params.set("mode", options.mode);
  if (options.sampleId) {
    params.set("sample", options.sampleId);
  }
  return `/playground/validator?${params.toString()}`;
}

async function readBody(
  request: IncomingMessage,
  maxBytes = 1024 * 1024,
): Promise<string> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.byteLength;
    if (total > maxBytes) {
      throw new Error("request_body_too_large");
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function sendHtml(response: ServerResponse, html: string, statusCode = 200): void {
  response.writeHead(statusCode, {
    "content-type": "text/html; charset=utf-8",
    ...securityHeaders(),
  });
  response.end(html);
}

function sendJson(response: ServerResponse, payload: unknown, statusCode = 200): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...securityHeaders(),
  });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(
  response: ServerResponse,
  payload: string,
  contentType = "text/plain; charset=utf-8",
  statusCode = 200,
): void {
  response.writeHead(statusCode, {
    "content-type": contentType,
    "cache-control": "public, max-age=300",
    ...securityHeaders(),
  });
  response.end(payload);
}

function securityHeaders(): Record<string, string> {
  return {
    "content-security-policy":
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    "x-content-type-options": "nosniff",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
  };
}

function publicOrigin(request: IncomingMessage, port: number): string {
  const configuredOrigin = process.env.PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const forwardedProtoHeader = request.headers["x-forwarded-proto"];
  const forwardedProto =
    typeof forwardedProtoHeader === "string"
      ? forwardedProtoHeader.split(",")[0]?.trim()
      : undefined;
  const proto = forwardedProto === "https" || forwardedProto === "http" ? forwardedProto : "http";
  const rawHost = request.headers.host ?? `127.0.0.1:${port}`;
  const host = rawHost.replace(/[^A-Za-z0-9.:[\]-]/g, "");
  return `${proto}://${host}`;
}

const publicSubmissionRateLimits = new Map<string, { count: number; resetAt: number }>();

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.split(",")[0]?.trim();
  }
  return value?.split(",")[0]?.trim();
}

function publicSubmissionLimit(): number {
  const parsed = Number(process.env.PUBLIC_INTAKE_RATE_LIMIT ?? 6);
  if (!Number.isFinite(parsed)) {
    return 6;
  }

  return Math.max(1, Math.min(60, Math.floor(parsed)));
}

function prunePublicSubmissionRateLimits(now: number): void {
  if (publicSubmissionRateLimits.size <= 1000) {
    return;
  }

  for (const [key, value] of publicSubmissionRateLimits) {
    if (value.resetAt <= now) {
      publicSubmissionRateLimits.delete(key);
    }
  }
}

function clientKey(request: IncomingMessage): string {
  const socketAddress = request.socket.remoteAddress || "unknown";
  if (process.env.PUBLIC_INTAKE_TRUST_PROXY !== "true") {
    return socketAddress;
  }

  return (
    firstHeaderValue(request.headers["cf-connecting-ip"]) ||
    firstHeaderValue(request.headers["x-forwarded-for"]) ||
    socketAddress
  );
}

function publicSubmissionAllowed(key: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const limit = publicSubmissionLimit();
  prunePublicSubmissionRateLimits(now);
  const current = publicSubmissionRateLimits.get(key);

  if (!current || current.resetAt <= now) {
    publicSubmissionRateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count += 1;
  return true;
}

export function publicSubmissionEnabled(): boolean {
  if (process.env.PUBLIC_INTAKE_ENABLED) {
    return process.env.PUBLIC_INTAKE_ENABLED !== "false";
  }

  // Vercel serverless functions do not provide a durable project-local disk.
  // Keep public intake closed there unless the operator explicitly wires a
  // storage backend or points PUBLIC_INTAKE_DATA_DIR at an intentional path.
  if (process.env.VERCEL === "1" && !process.env.PUBLIC_INTAKE_DATA_DIR) {
    return false;
  }

  return true;
}

function valueFromParsed(
  parsed: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = parsed[key];
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return undefined;
}

function consentFromParsed(parsed: Record<string, unknown>): boolean {
  const value = parsed.consent_to_store ?? parsed.consent;
  return value === true || value === "true" || value === "on" || value === "1";
}

function submissionInputFromParsed(
  parsed: Record<string, unknown>,
  request: IncomingMessage,
): PublicSubmissionInput {
  return {
    payload: valueFromParsed(parsed, "payload") ?? "",
    submitter_label: valueFromParsed(parsed, "submitter_label"),
    contact: valueFromParsed(parsed, "contact"),
    artifact_url: valueFromParsed(parsed, "artifact_url"),
    notes: valueFromParsed(parsed, "notes"),
    consent_to_store: consentFromParsed(parsed),
    website: valueFromParsed(parsed, "website"),
    source_ip: clientKey(request),
    user_agent: request.headers["user-agent"],
  };
}

async function readSubmissionInput(request: IncomingMessage): Promise<PublicSubmissionInput> {
  const rawBody = await readBody(request, PUBLIC_SUBMISSION_MAX_BYTES + 16 * 1024);
  if (request.headers["content-type"]?.includes("application/json")) {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;
    return submissionInputFromParsed(parsed, request);
  }

  const parsed = parseQueryString(rawBody) as Record<string, unknown>;
  return submissionInputFromParsed(parsed, request);
}

async function acceptPublicSubmission(
  request: IncomingMessage,
  lang: ReturnType<typeof resolveUiLanguage>,
): Promise<PublicSubmissionReceipt> {
  if (!publicSubmissionEnabled()) {
    throw new Error("public_intake_disabled");
  }

  const key = clientKey(request);
  if (!publicSubmissionAllowed(key)) {
    throw new Error("public_intake_rate_limited");
  }

  const input = await readSubmissionInput(request);
  if (isBlockedBySpamGuard(input)) {
    return blockedSpamGuardReceipt();
  }

  const preflightedInput = preflightPublicSubmissionInput(input);
  const preview = runValidatorPreview(preflightedInput.payload, "admission_readiness", lang);
  return createPublicSubmission(preflightedInput, preview);
}

function publicSubmissionErrorStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "public_intake_rate_limited") {
    return 429;
  }
  if (message === "request_body_too_large" || message === "payload exceeds public intake limit") {
    return 413;
  }
  if (message === "public_intake_disabled") {
    return 503;
  }
  if (message.startsWith("public_intake_capacity_")) {
    return 503;
  }
  return 400;
}

export async function handleWebRequest(
  request: IncomingMessage,
  response: ServerResponse,
  port = Number(process.env.PORT ?? 3000),
): Promise<void> {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? `127.0.0.1:${port}`}`);
    const pathname = url.pathname;
    const lang = resolveUiLanguage(url.searchParams.get("lang"));
    const context = {
      currentPath: `${pathname}${url.search}`,
    };

    if (request.method === "GET" && pathname === "/healthz") {
      return sendJson(response, {
        ok: true,
        service: "ohbp-web",
        version: "0.1.0",
      });
    }

    if (request.method === "GET" && pathname === "/robots.txt") {
      return sendText(
        response,
        [
          "User-agent: *",
          "Allow: /",
          "Disallow: /api/",
          `Sitemap: ${publicOrigin(request, port)}/sitemap.xml`,
          "",
        ].join("\n"),
      );
    }

    if (request.method === "GET" && pathname === "/sitemap.xml") {
      const origin = publicOrigin(request, port);
      const pages = [
        "/",
        "/leaderboards/general",
        "/leaderboards/claude-code",
        "/leaderboards/codex",
        "/leaderboards/opencode",
        "/compare",
        "/boards/official-verified",
        "/boards/reproducibility-frontier",
        "/boards/community-lab",
        "/protocol",
        "/playground/validator",
        "/submit",
      ];
      return sendText(
        response,
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
          .map((page) => `  <url><loc>${origin}${page}</loc></url>`)
          .join("\n")}\n</urlset>\n`,
        "application/xml; charset=utf-8",
      );
    }

    if (request.method === "GET" && pathname === "/") {
      return sendHtml(response, renderConsumerHomePage(await loadConsumerHomeView(lang), context));
    }

    if (request.method === "GET" && pathname === "/leaderboards") {
      return sendHtml(
        response,
        renderHostLeaderboardPage(await loadHostLeaderboardView("general", lang), context),
      );
    }

    if (request.method === "GET" && pathname.startsWith("/leaderboards/")) {
      const hostId = pathname.replace("/leaderboards/", "");
      if (isHostId(hostId)) {
        return sendHtml(
          response,
          renderHostLeaderboardPage(
            await loadHostLeaderboardView(hostId as HostId, lang),
            context,
          ),
        );
      }
    }

    if (request.method === "GET" && pathname === "/compare") {
      return sendHtml(response, renderComparePage(await loadHarnessCompareView(lang), context));
    }

    if (request.method === "GET" && pathname.startsWith("/boards/")) {
      const boardId = pathname.replace("/boards/", "") as BoardId;
      if (isBoardId(boardId)) {
        return sendHtml(response, renderBoardPage(await loadBoardView(boardId, url.searchParams.get("slice") ?? undefined, lang), context));
      }
    }

    if (request.method === "GET" && pathname.startsWith("/entries/")) {
      const entryId = pathname.replace("/entries/", "");
      const entry = await loadEntryView(entryId, lang);
      if (!entry) {
        return sendHtml(response, renderNotFound(pathname, lang, context), 404);
      }

      const view = url.searchParams.get("view") === "research" ? "research" : "scorecard";
      return sendHtml(response, renderEntryPage(entry, view, context));
    }

    if (request.method === "GET" && pathname === "/protocol") {
      return sendHtml(
        response,
        renderProtocolPage(await loadProtocolView(url.searchParams.get("q") ?? undefined, lang), context),
      );
    }

    if (request.method === "GET" && pathname === "/playground/validator") {
      const sampleId = url.searchParams.get("sample") ?? undefined;
      const mode = normalizeValidatorMode(url.searchParams.get("mode"));
      return sendHtml(
        response,
        renderValidatorPage(
          await sampleValidatorPayload(sampleId, lang),
          undefined,
          {
            lang,
            mode,
            activeSampleId: sampleId,
            samples: await loadValidatorSampleCases(lang),
          },
          context,
        ),
      );
    }

    if (request.method === "GET" && pathname === "/submit") {
      return sendHtml(response, renderSubmitPage({ lang, intakeEnabled: publicSubmissionEnabled() }, context));
    }

    if (request.method === "POST" && pathname === "/submit") {
      try {
        const receipt = await acceptPublicSubmission(request, lang);
        return sendHtml(
          response,
          renderSubmitPage({ lang, receipt }, context),
          receipt.state === "blocked_spam_guard" ? 202 : 201,
        );
      } catch (error) {
        return sendHtml(
          response,
          renderSubmitPage({
            lang,
            error: error instanceof Error ? error.message : String(error),
            intakeEnabled: publicSubmissionEnabled(),
          }, context),
          publicSubmissionErrorStatus(error),
        );
      }
    }

    if (request.method === "POST" && pathname === "/playground/validator") {
      const rawBody = await readBody(request);
      const parsed = parseQueryString(rawBody);
      const sampleId = typeof parsed.sample === "string" ? parsed.sample : undefined;
      const mode = normalizeValidatorMode(typeof parsed.mode === "string" ? parsed.mode : undefined);
      const bodyLang = typeof parsed.lang === "string" ? resolveUiLanguage(parsed.lang) : lang;
      const payload =
        typeof parsed.payload === "string" && parsed.payload.length > 0
          ? parsed.payload
          : await sampleValidatorPayload(sampleId, bodyLang);
      return sendHtml(
        response,
        renderValidatorPage(payload, runValidatorPreview(payload, mode, bodyLang), {
          lang: bodyLang,
          mode,
          activeSampleId: sampleId,
          samples: await loadValidatorSampleCases(bodyLang),
        }, {
          currentPath: validatorPathWithState({
            lang: bodyLang,
            mode,
            sampleId,
          }),
        }),
      );
    }

    if (request.method === "GET" && pathname === "/api/home") {
      return sendJson(response, await loadConsumerHomeView(lang));
    }

    if (request.method === "GET" && pathname === "/api/leaderboards") {
      return sendJson(response, await loadHostLeaderboardView("general", lang));
    }

    if (request.method === "GET" && pathname.startsWith("/api/leaderboards/")) {
      const hostId = pathname.replace("/api/leaderboards/", "");
      if (!isHostId(hostId)) {
        return sendJson(response, { error: "leaderboard_not_found", host_id: hostId }, 404);
      }
      return sendJson(response, await loadHostLeaderboardView(hostId as HostId, lang));
    }

    if (request.method === "GET" && pathname === "/api/compare") {
      return sendJson(response, await loadHarnessCompareView(lang));
    }

    if (request.method === "GET" && pathname.startsWith("/api/boards/")) {
      const suffix = pathname.replace("/api/boards/", "");
      if (suffix.endsWith("/slices")) {
        const boardId = suffix.replace("/slices", "") as BoardId;
        if (!isBoardId(boardId)) {
          return sendJson(response, { error: "board_not_found", board_id: boardId }, 404);
        }
        return sendJson(response, await loadBoardSliceList(boardId, lang));
      }

      const boardId = suffix as BoardId;
      if (!isBoardId(boardId)) {
        return sendJson(response, { error: "board_not_found", board_id: boardId }, 404);
      }
      return sendJson(response, await loadBoardView(boardId, url.searchParams.get("slice") ?? undefined, lang));
    }

    if (request.method === "GET" && pathname.startsWith("/api/entries/")) {
      const entryId = pathname.replace("/api/entries/", "");
      const entry = await loadEntryView(entryId, lang);
      return entry
        ? sendJson(response, entry)
        : sendJson(response, { error: "entry_not_found", entry_id: entryId }, 404);
    }

    if (request.method === "GET" && pathname === "/api/protocol") {
      return sendJson(response, await loadProtocolView(url.searchParams.get("q") ?? undefined, lang));
    }

    if (request.method === "GET" && pathname === "/api/protocol/index") {
      return sendJson(response, await loadProtocolIndex(lang));
    }

    if (request.method === "GET" && pathname.startsWith("/api/protocol/objects/")) {
      const objectId = pathname.replace("/api/protocol/objects/", "");
      const entry = await loadProtocolObject(objectId, lang);
      return entry
        ? sendJson(response, entry)
        : sendJson(response, { error: "protocol_object_not_found", object_id: objectId }, 404);
    }

    if (request.method === "GET" && pathname.startsWith("/api/protocol/fields/")) {
      const fieldId = pathname.replace("/api/protocol/fields/", "");
      const entry = await loadProtocolField(fieldId, lang);
      return entry
        ? sendJson(response, entry)
        : sendJson(response, { error: "protocol_field_not_found", field: fieldId }, 404);
    }

    if (request.method === "POST" && pathname === "/api/validator") {
      const rawBody = await readBody(request);
      const mode = normalizeValidatorMode(url.searchParams.get("mode"));
      if (request.headers["content-type"]?.includes("application/json")) {
        try {
          const parsed = JSON.parse(rawBody) as Record<string, unknown>;
          if (
            typeof parsed.payload === "string" &&
            parsed.payload.length > 0
          ) {
            return sendJson(
              response,
              runValidatorPreview(parsed.payload, normalizeValidatorMode(typeof parsed.mode === "string" ? parsed.mode : mode), lang),
            );
          }

          const payload = JSON.stringify(parsed, null, 2);
          return sendJson(response, runValidatorPreview(payload, mode, lang));
        } catch {
          return sendJson(
            response,
            {
              error: "invalid_json",
              ...runValidatorPreview(rawBody, mode, lang),
            },
            400,
          );
        }
      }

      return sendJson(response, runValidatorPreview(rawBody, mode, lang));
    }

    if (request.method === "POST" && pathname === "/api/public-submissions") {
      try {
        const receipt = await acceptPublicSubmission(request, lang);
        return sendJson(response, {
          upload_receipt: receipt,
        }, receipt.state === "blocked_spam_guard" ? 202 : 201);
      } catch (error) {
        return sendJson(response, {
          error: "public_submission_rejected",
          detail: error instanceof Error ? error.message : String(error),
        }, publicSubmissionErrorStatus(error));
      }
    }

    if (request.method === "GET" && pathname.startsWith("/api/public-submissions/")) {
      if (!publicSubmissionAllowed(`lookup:${clientKey(request)}`)) {
        return sendJson(response, { error: "public_submission_lookup_rate_limited" }, 429);
      }
      const receiptId = pathname.replace("/api/public-submissions/", "");
      const receipt = await readPublicSubmissionReceipt(receiptId);
      return receipt
        ? sendJson(response, receipt)
        : sendJson(response, { error: "public_submission_not_found", receipt_id: receiptId }, 404);
    }

    if (request.method === "GET" && pathname === "/api/public-submissions") {
      const adminToken = process.env.PUBLIC_INTAKE_ADMIN_TOKEN;
      const auth = request.headers.authorization;
      if (!adminToken || auth !== `Bearer ${adminToken}`) {
        return sendJson(response, { error: "not_found" }, 404);
      }
      return sendJson(response, await listPublicSubmissionReceipts());
    }

    if (request.method === "GET" && pathname === "/api/boards") {
      return sendJson(response, await loadAllBoardViews(lang));
    }

    return sendHtml(response, renderNotFound(pathname, lang, context), 404);
}

export function createWebServer(port = Number(process.env.PORT ?? 3000)) {
  const server = createServer((request, response) => {
    handleWebRequest(request, response, port).catch((error) => {
      console.error(error);
      if (!response.headersSent) {
        sendJson(response, {
          error: "internal_server_error",
        }, 500);
        return;
      }
      response.end();
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
  const app = createWebServer();
  await app.start();
  console.log(`web listening on http://127.0.0.1:${app.port}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
