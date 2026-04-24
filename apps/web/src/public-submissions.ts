import { createHash, randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { ValidatorRunView } from "@ohbp/view-models";

export const PUBLIC_SUBMISSION_MAX_BYTES = 512 * 1024;

export type PublicSubmissionState =
  | "received_untrusted"
  | "needs_payload_fix"
  | "blocked_spam_guard";

export interface PublicSubmissionInput {
  payload: string;
  submitter_label?: string;
  contact?: string;
  artifact_url?: string;
  notes?: string;
  consent_to_store: boolean;
  website?: string;
  source_ip?: string;
  user_agent?: string;
}

export interface PublicSubmissionReceipt {
  receipt_id: string;
  state: PublicSubmissionState;
  candidate_pool: "public_untrusted";
  board_eligible: false;
  requires_verifier: true;
  requires_operator_review: true;
  publication_state: "not_published";
  ranking_effect: "none";
  payload_digest: string;
  validator_status: ValidatorRunView["status"];
  issue_count: number;
  stored_at: string;
  public_note: string;
}

export interface PublicSubmissionRecord {
  receipt: PublicSubmissionReceipt;
  payload_json: string;
  submitter_label?: string;
  contact?: string;
  artifact_url?: string;
  notes?: string;
  source_ip_hash?: string;
  user_agent?: string;
  validator: ValidatorRunView;
}

export function publicSubmissionRoot(customRoot?: string): string {
  return resolve(
    customRoot ??
      process.env.PUBLIC_INTAKE_DATA_DIR ??
      join(process.cwd(), ".data", "public-submissions"),
  );
}

function receiptId(): string {
  return `psub_${randomBytes(16).toString("hex")}`;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value, "utf8").digest("hex")}`;
}

function hashIp(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const salt = process.env.PUBLIC_INTAKE_IP_HASH_SALT ?? "ohbp-local-intake";
  return sha256(`${salt}:${value}`);
}

function clampText(value: string | undefined, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}

function validateArtifactUrl(value: string | undefined): string | undefined {
  const trimmed = clampText(value, 500);
  if (!trimmed) {
    return undefined;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("artifact_url must be http(s)");
    }

    return url.toString();
  } catch {
    throw new Error("artifact_url must be a valid http(s) URL");
  }
}

function parseJsonOrThrow(payload: string): void {
  JSON.parse(payload);
}

function publicReceipt(options: {
  state: PublicSubmissionState;
  payload_digest: string;
  validator_status: ValidatorRunView["status"];
  issue_count: number;
  public_note: string;
}): PublicSubmissionReceipt {
  return {
    receipt_id: receiptId(),
    state: options.state,
    candidate_pool: "public_untrusted",
    board_eligible: false,
    requires_verifier: true,
    requires_operator_review: true,
    publication_state: "not_published",
    ranking_effect: "none",
    payload_digest: options.payload_digest,
    validator_status: options.validator_status,
    issue_count: options.issue_count,
    stored_at: new Date().toISOString(),
    public_note: options.public_note,
  };
}

export function isBlockedBySpamGuard(input: PublicSubmissionInput): boolean {
  return Boolean(input.website?.trim());
}

export function blockedSpamGuardReceipt(): PublicSubmissionReceipt {
  return publicReceipt({
    state: "blocked_spam_guard",
    payload_digest: sha256("blocked"),
    validator_status: "fail",
    issue_count: 0,
    public_note: "blocked_spam_guard",
  });
}

export function preflightPublicSubmissionInput(
  input: PublicSubmissionInput,
): PublicSubmissionInput {
  if (isBlockedBySpamGuard(input)) {
    throw new Error("blocked_spam_guard");
  }

  if (!input.consent_to_store) {
    throw new Error("consent_to_store is required");
  }

  const payload = input.payload.trim();
  if (!payload) {
    throw new Error("payload is required");
  }

  if (Buffer.byteLength(payload, "utf8") > PUBLIC_SUBMISSION_MAX_BYTES) {
    throw new Error("payload exceeds public intake limit");
  }

  parseJsonOrThrow(payload);

  return {
    payload,
    submitter_label: clampText(input.submitter_label, 120),
    contact: clampText(input.contact, 180),
    artifact_url: validateArtifactUrl(input.artifact_url),
    notes: clampText(input.notes, 1000),
    consent_to_store: true,
    source_ip: input.source_ip,
    user_agent: clampText(input.user_agent, 300),
  };
}

function numericEnv(name: string, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(minimum, Math.min(maximum, Math.floor(parsed)));
}

async function assertPublicSubmissionCapacity(root: string): Promise<void> {
  const maxFiles = numericEnv("PUBLIC_INTAKE_MAX_FILES", 5000, 1, 100000);
  const maxBytes = numericEnv("PUBLIC_INTAKE_MAX_BYTES", 256 * 1024 * 1024, PUBLIC_SUBMISSION_MAX_BYTES, 10 * 1024 * 1024 * 1024);
  const receiptFilePattern = /^psub_[a-f0-9]{32}\.json$/;
  const files = (await readdir(root)).filter((file) => receiptFilePattern.test(file));

  if (files.length >= maxFiles) {
    throw new Error("public_intake_capacity_files_exceeded");
  }

  let totalBytes = 0;
  for (const file of files) {
    try {
      const item = await stat(join(root, file));
      if (item.isFile()) {
        totalBytes += item.size;
      }
    } catch {
      // Ignore files that disappeared during the check.
    }
  }

  if (totalBytes >= maxBytes) {
    throw new Error("public_intake_capacity_bytes_exceeded");
  }
}

export async function createPublicSubmission(
  input: PublicSubmissionInput,
  validator: ValidatorRunView,
  customRoot?: string,
): Promise<PublicSubmissionReceipt> {
  const root = publicSubmissionRoot(customRoot);
  await mkdir(root, { recursive: true });

  if (isBlockedBySpamGuard(input)) {
    return blockedSpamGuardReceipt();
  }

  const prepared = preflightPublicSubmissionInput(input);
  await assertPublicSubmissionCapacity(root);

  const state: PublicSubmissionState =
    validator.status === "fail" ? "needs_payload_fix" : "received_untrusted";
  const receipt = publicReceipt({
    state,
    payload_digest: sha256(prepared.payload),
    validator_status: validator.status,
    issue_count: validator.issues.length,
    public_note:
      state === "received_untrusted"
        ? "received; not ranked"
        : "received with blocking validator issues; not ranked",
  });

  const record: PublicSubmissionRecord = {
    receipt,
    payload_json: prepared.payload,
    submitter_label: prepared.submitter_label,
    contact: prepared.contact,
    artifact_url: prepared.artifact_url,
    notes: prepared.notes,
    source_ip_hash: hashIp(prepared.source_ip),
    user_agent: prepared.user_agent,
    validator,
  };

  await writeFile(
    join(root, `${receipt.receipt_id}.json`),
    JSON.stringify(record, null, 2),
    { encoding: "utf8", flag: "wx" },
  );

  return receipt;
}

export async function readPublicSubmissionReceipt(
  id: string,
  customRoot?: string,
): Promise<PublicSubmissionReceipt | undefined> {
  if (!/^psub_[a-f0-9]{32}$/.test(id)) {
    return undefined;
  }

  try {
    const content = await readFile(join(publicSubmissionRoot(customRoot), `${id}.json`), "utf8");
    return (JSON.parse(content) as PublicSubmissionRecord).receipt;
  } catch {
    return undefined;
  }
}

export async function listPublicSubmissionReceipts(
  customRoot?: string,
): Promise<PublicSubmissionReceipt[]> {
  await mkdir(publicSubmissionRoot(customRoot), { recursive: true });
  const files = await readdir(publicSubmissionRoot(customRoot));
  const parsedLimit = Number(process.env.PUBLIC_INTAKE_ADMIN_LIST_LIMIT ?? 200);
  const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(1000, Math.floor(parsedLimit))) : 200;
  const receiptFilePattern = /^psub_[a-f0-9]{32}\.json$/;
  const records = await Promise.all(
    files
      .filter((file) => receiptFilePattern.test(file))
      .map(async (file) => {
        try {
          const content = await readFile(join(publicSubmissionRoot(customRoot), file), "utf8");
          return (JSON.parse(content) as PublicSubmissionRecord).receipt;
        } catch {
          return undefined;
        }
      }),
  );

  return records
    .filter((record): record is PublicSubmissionReceipt => Boolean(record))
    .sort((left, right) => right.stored_at.localeCompare(left.stored_at))
    .slice(0, limit);
}
