import { mkdtemp, rm, writeFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PublicationGovernanceDirective } from "@ohbp/verifier-core";
import { seedDemoSubmissionStore, runVerificationPipeline } from "../../verifier-worker/src/pipeline.js";
import { readStoredSubmissions } from "../../verifier-worker/src/io.js";
import { createWebServer } from "./server.js";

type GovernanceCandidate = {
  submissionId: string;
  entryId: string;
};

type LifecycleGovernanceCase = {
  name: string;
  buildGovernance: (candidate: GovernanceCandidate) => PublicationGovernanceDirective[];
  expectedState: "corrected" | "invalidated" | "archived";
  expectedDisposition: "suspended" | "historical_only";
  expectedVerdictSnippet: string;
  expectedReasonCode: string;
  expectedFinalSummary: string;
  expectedStatePath: string[];
};

const lifecycleGovernanceCases: LifecycleGovernanceCase[] = [
  {
    name: "corrected",
    buildGovernance: (candidate) => [
      {
        submission_id: candidate.submissionId,
        entry_id: candidate.entryId,
        publication_state: "disputed",
        reason_code: "operator_dispute_opened",
        summary: "Operator opened a dispute after a suspicious claim review.",
        at: "2026-04-22T08:00:00.000Z",
        actor: "operator:solo-admin",
      },
      {
        submission_id: candidate.submissionId,
        entry_id: candidate.entryId,
        publication_state: "corrected",
        reason_code: "operator_result_corrected",
        summary: "Operator confirmed the issue and queued a corrected rerun for republication.",
        at: "2026-04-22T12:00:00.000Z",
        actor: "operator:solo-admin",
      },
    ],
    expectedState: "corrected",
    expectedDisposition: "suspended",
    expectedVerdictSnippet: "reconsidered for active boards after re-review",
    expectedReasonCode: "operator_result_corrected",
    expectedFinalSummary:
      "Operator confirmed the issue and queued a corrected rerun for republication.",
    expectedStatePath: ["published", "disputed", "corrected"],
  },
  {
    name: "invalidated",
    buildGovernance: (candidate) => [
      {
        submission_id: candidate.submissionId,
        entry_id: candidate.entryId,
        publication_state: "disputed",
        reason_code: "operator_dispute_opened",
        summary: "Operator opened a dispute after a suspicious claim review.",
        at: "2026-04-22T08:00:00.000Z",
        actor: "operator:solo-admin",
      },
      {
        submission_id: candidate.submissionId,
        entry_id: candidate.entryId,
        publication_state: "invalidated",
        reason_code: "operator_result_invalidated",
        summary: "Operator invalidated the published result after the dispute was upheld.",
        at: "2026-04-22T12:00:00.000Z",
        actor: "operator:solo-admin",
      },
    ],
    expectedState: "invalidated",
    expectedDisposition: "historical_only",
    expectedVerdictSnippet: "not for active comparison",
    expectedReasonCode: "operator_result_invalidated",
    expectedFinalSummary:
      "Operator invalidated the published result after the dispute was upheld.",
    expectedStatePath: ["published", "disputed", "invalidated"],
  },
  {
    name: "archived",
    buildGovernance: (candidate) => [
      {
        submission_id: candidate.submissionId,
        entry_id: candidate.entryId,
        publication_state: "archived",
        reason_code: "operator_result_archived",
        summary: "Operator archived the superseded result after rotating it off current boards.",
        at: "2026-04-22T08:00:00.000Z",
        actor: "operator:solo-admin",
      },
    ],
    expectedState: "archived",
    expectedDisposition: "historical_only",
    expectedVerdictSnippet: "historical page, not as part of the current boards",
    expectedReasonCode: "operator_result_archived",
    expectedFinalSummary:
      "Operator archived the superseded result after rotating it off current boards.",
    expectedStatePath: ["published", "archived"],
  },
];

describe("web server bilingual surfaces", () => {
  let app: ReturnType<typeof createWebServer>;
  let baseUrl = "";
  let publicSubmissionDir = "";
  let originalPublicSubmissionDir: string | undefined;

  beforeAll(async () => {
    originalPublicSubmissionDir = process.env.PUBLIC_INTAKE_DATA_DIR;
    publicSubmissionDir = await mkdtemp(join(tmpdir(), "ohbp-web-public-intake-"));
    process.env.PUBLIC_INTAKE_DATA_DIR = publicSubmissionDir;
    app = createWebServer(0);
    await app.start();

    const address = app.server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to resolve ephemeral web server port.");
    }

    baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      app.server.close((error) => {
        if (error) {
          rejectPromise(error);
          return;
        }

        resolvePromise();
      });
    });
    if (originalPublicSubmissionDir === undefined) {
      delete process.env.PUBLIC_INTAKE_DATA_DIR;
    } else {
      process.env.PUBLIC_INTAKE_DATA_DIR = originalPublicSubmissionDir;
    }
    await rm(publicSubmissionDir, { recursive: true, force: true });
  });

  async function getEnglishBoards() {
    const boardsResponse = await fetch(`${baseUrl}/api/boards?lang=en`);
    const boards = (await boardsResponse.json()) as Array<{
      lang: string;
      board_id: string;
      title: string;
      entries?: Array<{
        entry_id: string;
      }>;
    }>;

    expect(boardsResponse.status).toBe(200);
    expect(boards).toHaveLength(3);
    return boards;
  }

  async function withGovernedWorkerData(
    buildGovernance: (candidate: GovernanceCandidate) => PublicationGovernanceDirective[],
    run: (context: { candidate: GovernanceCandidate }) => Promise<void>,
  ) {
    const originalWorkerDataDir = process.env.OHBP_WORKER_DATA_DIR;
    const tempRoot = await mkdtemp(join(tmpdir(), "ohbp-web-governed-"));
    const intakeDir = join(tempRoot, "mock-intake-data");
    const outputDir = join(tempRoot, "worker-data");

    try {
      await seedDemoSubmissionStore(intakeDir);
      const stored = await readStoredSubmissions(intakeDir);
      const publishedCandidate = stored.find(
        (item) => item.normalized_payload.requested_trust_tier === "verified",
      );
      expect(publishedCandidate).toBeDefined();

      const candidate: GovernanceCandidate = {
        submissionId: publishedCandidate!.normalized_payload.submission_id,
        entryId: publishedCandidate!.normalized_payload.entry_id,
      };
      const governance = buildGovernance(candidate);

      await writeFile(
        join(intakeDir, "publication-governance.json"),
        JSON.stringify(governance, null, 2),
        "utf8",
      );
      await runVerificationPipeline({
        intakeDataDir: intakeDir,
        outputDataDir: outputDir,
      });
      process.env.OHBP_WORKER_DATA_DIR = outputDir;

      await run({
        candidate,
      });
    } finally {
      if (originalWorkerDataDir === undefined) {
        delete process.env.OHBP_WORKER_DATA_DIR;
      } else {
        process.env.OHBP_WORKER_DATA_DIR = originalWorkerDataDir;
      }

      await rm(tempRoot, { recursive: true, force: true });
    }
  }

  it("renders the Chinese home page by default", async () => {
    const response = await fetch(`${baseUrl}/`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<html lang="zh-CN">');
    expect(html).toContain("宿主适配榜");
    expect(html).toContain("/leaderboards/claude-code?lang=zh-CN");
    expect(html).toContain("/leaderboards/opencode?lang=zh-CN");
    expect(html).toContain("策展导购");
  });

  it("renders the English home page and preserves lang in navigation links", async () => {
    const response = await fetch(`${baseUrl}/?lang=en`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("Host-fit boards.");
    expect(html).toContain("/leaderboards/general?lang=en");
    expect(html).toContain("/leaderboards/claude-code?lang=en");
    expect(html).toContain("/leaderboards/opencode?lang=en");
    expect(html).toContain("/compare?lang=en");
    expect(html).toContain("/boards/official-verified?lang=en");
    expect(html).toContain("/protocol?lang=en");
    expect(html).toContain("/playground/validator?lang=en");
    expect(html).toContain("Alternative");
    expect(html).toContain("Host-fit overview");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(response.headers.get("content-security-policy")).toContain("script-src 'self'");
  });

  it("serves launch shell endpoints", async () => {
    const healthResponse = await fetch(`${baseUrl}/healthz`);
    const health = (await healthResponse.json()) as {
      ok: boolean;
      service: string;
    };
    expect(healthResponse.status).toBe(200);
    expect(health.ok).toBe(true);
    expect(health.service).toBe("ohbp-web");
    expect(healthResponse.headers.get("cache-control")).toBe("no-store");

    const robotsResponse = await fetch(`${baseUrl}/robots.txt`);
    const robots = await robotsResponse.text();
    expect(robotsResponse.status).toBe(200);
    expect(robots).toContain("Disallow: /api/");
    expect(robots).toContain(`Sitemap: ${baseUrl}/sitemap.xml`);

    const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`);
    const sitemap = await sitemapResponse.text();
    expect(sitemapResponse.status).toBe(200);
    expect(sitemap).toContain("<urlset");
    expect(sitemap).toContain("/leaderboards/codex");
    expect(sitemap).toContain("/submit");
  });

  it("serves public intake page and stores external submissions as unranked receipts", async () => {
    const pageResponse = await fetch(`${baseUrl}/submit?lang=en`);
    const pageHtml = await pageResponse.text();
    expect(pageResponse.status).toBe(200);
    expect(pageHtml).toContain("Public intake");
    expect(pageHtml).toContain("not ranked");

    const beforeBoardsResponse = await fetch(`${baseUrl}/api/boards?lang=en`);
    const beforeBoards = await beforeBoardsResponse.text();
    const beforeLeaderboardResponse = await fetch(`${baseUrl}/api/leaderboards/codex?lang=en`);
    const beforeLeaderboard = await beforeLeaderboardResponse.text();

    const payload = {
      requested_trust_tier: "community",
      benchmark: {
        id: "terminal-lite",
        version: "v1",
        lane_id: "terminal-lite-v1",
        split: "public",
      },
      model: { id: "test-model", label: "Test Model" },
      harness: { id: "test-harness", label: "Test Harness" },
      n_runs: 1,
      n_tasks: 1,
    };

    const response = await fetch(`${baseUrl}/api/public-submissions?lang=en`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        payload: JSON.stringify(payload),
        submitter_label: "public test",
        consent_to_store: true,
      }),
    });
    const body = (await response.json()) as {
      upload_receipt: {
        receipt_id: string;
        state: string;
        payload_digest: string;
        validator_status: string;
        board_eligible: boolean;
        requires_verifier: boolean;
        requires_operator_review: boolean;
        publication_state: string;
        ranking_effect: string;
      };
    };

    expect(response.status).toBe(201);
    expect(body.upload_receipt.state).toBe("received_untrusted");
    expect(body.upload_receipt.payload_digest).toMatch(/^sha256:/);
    expect(body.upload_receipt.board_eligible).toBe(false);
    expect(body.upload_receipt.requires_verifier).toBe(true);
    expect(body.upload_receipt.requires_operator_review).toBe(true);
    expect(body.upload_receipt.publication_state).toBe("not_published");
    expect(body.upload_receipt.ranking_effect).toBe("none");

    const receiptResponse = await fetch(`${baseUrl}/api/public-submissions/${body.upload_receipt.receipt_id}`);
    const receipt = (await receiptResponse.json()) as {
      receipt_id: string;
      state: string;
      board_eligible: boolean;
      ranking_effect: string;
    };
    expect(receiptResponse.status).toBe(200);
    expect(receipt.receipt_id).toBe(body.upload_receipt.receipt_id);
    expect(receipt.state).toBe("received_untrusted");
    expect(receipt.board_eligible).toBe(false);
    expect(receipt.ranking_effect).toBe("none");

    const afterBoardsResponse = await fetch(`${baseUrl}/api/boards?lang=en`);
    const afterBoards = await afterBoardsResponse.text();
    const afterLeaderboardResponse = await fetch(`${baseUrl}/api/leaderboards/codex?lang=en`);
    const afterLeaderboard = await afterLeaderboardResponse.text();
    const entryResponse = await fetch(`${baseUrl}/api/entries/${body.upload_receipt.receipt_id}?lang=en`);

    expect(afterBoards).toBe(beforeBoards);
    expect(afterLeaderboard).toBe(beforeLeaderboard);
    expect(afterBoards).not.toContain(body.upload_receipt.receipt_id);
    expect(afterBoards).not.toContain("test-harness");
    expect(afterLeaderboard).not.toContain("test-harness");
    expect(entryResponse.status).toBe(404);
  });

  it("serves consumer leaderboard and compare pages with explicit curated disclaimers", async () => {
    const leaderboardResponse = await fetch(`${baseUrl}/leaderboards/claude-code?lang=en`);
    const leaderboardHtml = await leaderboardResponse.text();
    expect(leaderboardResponse.status).toBe(200);
    expect(leaderboardHtml).toContain("Claude Code leader");
    expect(leaderboardHtml).toContain("Selection layer, not a verifier-backed board");
    expect(leaderboardHtml).toContain("Board density");
    expect(leaderboardHtml).toContain("Evidence");
    expect(leaderboardHtml).toContain("benchmark-table");

    const compareResponse = await fetch(`${baseUrl}/compare?lang=en`);
    const compareHtml = await compareResponse.text();
    expect(compareResponse.status).toBe(200);
    expect(compareHtml).toContain("Harness comparison");
    expect(compareHtml).toContain("Selection layer, not a verifier-backed board");
    expect(compareHtml).toContain("comparison matrix");
    expect(compareHtml).toContain("/boards/official-verified?lang=en");
    expect(compareHtml).toContain("Claude Code preset");
    expect(compareHtml).toContain("Top overall");
    expect(compareHtml).toContain("Compact");
  });

  it("keeps compare preset and density state in shareable HTML routes", async () => {
    const response = await fetch(`${baseUrl}/compare?lang=en&preset=codex&density=detailed`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Codex preset");
    expect(html).toContain("Detailed");
    expect(html).toContain("Codex fit");
    expect(html).not.toContain("Claude Code fit");
    expect(html).not.toContain("OpenCode fit");
    expect(html).toContain("preset=codex");
    expect(html).toContain("density=compact");
    expect(html).toContain("lang=en");
  });

  it("switches leaderboard density through shareable HTML routes", async () => {
    const compactResponse = await fetch(`${baseUrl}/leaderboards/codex?lang=en&density=compact`);
    const compactHtml = await compactResponse.text();
    expect(compactResponse.status).toBe(200);
    expect(compactHtml).toContain('<div class="benchmark-table-wrap">');
    expect(compactHtml).toContain("density=detailed");
    expect(compactHtml).toContain("lang=en");

    const detailedResponse = await fetch(`${baseUrl}/leaderboards/codex?lang=en&density=detailed`);
    const detailedHtml = await detailedResponse.text();
    expect(detailedResponse.status).toBe(200);
    expect(detailedHtml).toContain('<article class="panel leaderboard-row');
    expect(detailedHtml).not.toContain('<div class="benchmark-table-wrap">');
  });

  it("serves board and entry API payloads in English", async () => {
    const boards = await getEnglishBoards();
    expect(boards.every((board) => board.lang === "en")).toBe(true);
    expect(boards.some((board) => board.title === "Official Verified Board")).toBe(true);

    const firstEntryId = boards
      .flatMap((board) => board.entries ?? [])
      .map((entry) => entry.entry_id)[0];
    expect(firstEntryId).toBeDefined();

    const entryResponse = await fetch(`${baseUrl}/api/entries/${firstEntryId}?lang=en`);
    const entry = (await entryResponse.json()) as {
      lang: string;
      title: string;
      scorecard: {
        verdict: string;
      };
    };

    expect(entryResponse.status).toBe(200);
    expect(entry.lang).toBe("en");
    expect(entry.title.length).toBeGreaterThan(0);
    expect(entry.scorecard.verdict).not.toMatch(/[\u4e00-\u9fff]/);
  });

  it("serves consumer APIs in English", async () => {
    const homeResponse = await fetch(`${baseUrl}/api/home?lang=en`);
    const home = (await homeResponse.json()) as {
      lang: string;
      hero_title: string;
      host_options: Array<{ host_id: string; default_pick_label: string; score: number; host_fit_score: number }>;
      methodology_note: { mode: string };
    };

    expect(homeResponse.status).toBe(200);
    expect(home.lang).toBe("en");
    expect(home.hero_title).toContain("Host-fit boards");
    expect(home.host_options).toHaveLength(4);
    expect(home.host_options.some((option) => option.default_pick_label === "gstack")).toBe(true);
    expect(home.host_options.every((option) => option.score > 0)).toBe(true);
    expect(home.host_options.every((option) => option.host_fit_score > 0)).toBe(true);
    expect(home.methodology_note.mode).toBe("curated_host_fit_demo");

    const leaderboardResponse = await fetch(`${baseUrl}/api/leaderboards/codex?lang=en`);
    const leaderboard = (await leaderboardResponse.json()) as {
      lang: string;
      host_id: string;
      top_cards: Array<{
        harness_id: string;
        harness_label: string;
        href: string;
        source_rank: number;
        basis_metric_ids: string[];
      }>;
      rows: Array<{
        basis_metric_ids: string[];
        why_this_rank: string;
        confidence_label: string;
        updated_at: string;
      }>;
      methodology_note: { mode: string };
    };

    expect(leaderboardResponse.status).toBe(200);
    expect(leaderboard.lang).toBe("en");
    expect(leaderboard.host_id).toBe("codex");
    expect(leaderboard.top_cards.length).toBeGreaterThan(0);
    expect(leaderboard.top_cards.every((card) => card.harness_id.length > 0)).toBe(true);
    expect(leaderboard.top_cards.every((card) => card.href.startsWith("#harness-"))).toBe(true);
    expect(leaderboard.top_cards.every((card) => card.source_rank >= 1)).toBe(true);
    expect(leaderboard.top_cards.every((card) => card.basis_metric_ids.length > 0)).toBe(true);
    expect(leaderboard.rows.every((row) => row.basis_metric_ids.length > 0)).toBe(true);
    expect(leaderboard.rows.every((row) => row.why_this_rank.length > 0)).toBe(true);
    expect(leaderboard.rows.every((row) => row.confidence_label.length > 0)).toBe(true);
    expect(leaderboard.rows.every((row) => row.updated_at === "2026-04-21")).toBe(true);
    expect("trust_tier" in (leaderboard.rows[0] as Record<string, unknown>)).toBe(false);
    expect(leaderboard.methodology_note.mode).toBe("curated_host_fit_demo");

    const compareResponse = await fetch(`${baseUrl}/api/compare?lang=en`);
    const compare = (await compareResponse.json()) as {
      lang: string;
      frameworks: Array<{ label: string; harness_id: string }>;
      dimensions: Array<{
        id: string;
        dimension: string;
        short_label: string;
        values: Array<{ harness_id: string; score: number; level_label: string }>;
      }>;
    };

    expect(compareResponse.status).toBe(200);
    expect(compare.lang).toBe("en");
    expect(compare.frameworks.some((framework) => framework.label === "SpecKit")).toBe(true);
    expect(compare.dimensions.some((dimension) => dimension.id === "new_project")).toBe(true);
    expect(compare.dimensions.some((dimension) => dimension.short_label === "Claude")).toBe(true);
    expect(compare.dimensions.every((dimension) => dimension.values.length > 0)).toBe(true);
    expect(compare.dimensions.every((dimension) => dimension.values.every((value) => value.score > 0))).toBe(true);
  });

  it("serves general leaderboard aliases for HTML and API", async () => {
    const generalHtmlResponse = await fetch(`${baseUrl}/leaderboards?lang=en`);
    const generalHtml = await generalHtmlResponse.text();
    expect(generalHtmlResponse.status).toBe(200);
    expect(generalHtml).toContain("General Leaderboard");

    const generalNamedHtmlResponse = await fetch(`${baseUrl}/leaderboards/general?lang=en`);
    const generalNamedHtml = await generalNamedHtmlResponse.text();
    expect(generalNamedHtmlResponse.status).toBe(200);
    expect(generalNamedHtml).toContain("General Leaderboard");

    const generalApiResponse = await fetch(`${baseUrl}/api/leaderboards?lang=en`);
    const generalApi = (await generalApiResponse.json()) as {
      host_id: string;
      title: string;
    };
    expect(generalApiResponse.status).toBe(200);
    expect(generalApi.host_id).toBe("general");
    expect(generalApi.title).toBe("General Leaderboard");
  });

  it("keeps protocol and validator API responses in English", async () => {
    const protocolResponse = await fetch(`${baseUrl}/api/protocol?lang=en&q=trust_tier`);
    const protocol = (await protocolResponse.json()) as {
      lang: string;
      query?: string;
      search_summary?: string;
    };

    expect(protocolResponse.status).toBe(200);
    expect(protocol.lang).toBe("en");
    expect(protocol.query).toBe("trust_tier");
    expect(protocol.search_summary).toBeDefined();
    expect(protocol.search_summary).not.toMatch(/[\u4e00-\u9fff]/);

    const validatorResponse = await fetch(
      `${baseUrl}/api/validator?lang=en&mode=bundle_integrity`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: "{not-valid-json}",
      },
    );
    const validator = (await validatorResponse.json()) as {
      error?: string;
      lang: string;
      status: string;
      summary: string;
    };

    expect(validatorResponse.status).toBe(400);
    expect(validator.error).toBe("invalid_json");
    expect(validator.lang).toBe("en");
    expect(validator.status).toBe("fail");
    expect(validator.summary).not.toMatch(/[\u4e00-\u9fff]/);
  });

  it("preserves validator sample/mode context when switching languages after POST", async () => {
    const response = await fetch(`${baseUrl}/playground/validator`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        lang: "en",
        mode: "admission_readiness",
        sample: "ready-pass",
        payload: "",
      }),
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('/playground/validator?lang=zh-CN&amp;mode=admission_readiness&amp;sample=ready-pass');
    expect(html).toContain('/playground/validator?lang=en&amp;mode=admission_readiness&amp;sample=ready-pass');
  });

  it("renders board-specific storytelling sections in English", async () => {
    const officialResponse = await fetch(`${baseUrl}/boards/official-verified?lang=en`);
    const officialHtml = await officialResponse.text();
    expect(officialResponse.status).toBe(200);
    expect(officialHtml).toContain("Uncertainty &amp; confidence strip");
    expect(officialHtml).toContain("Ranking uncertainty");
    expect(officialHtml).toContain("95% CI");
    expect(officialHtml).toContain("Comparison link");

    const officialApiResponse = await fetch(`${baseUrl}/api/boards/official-verified?lang=en`);
    const officialApi = (await officialApiResponse.json()) as {
      ranking_policy?: { method: string; confidence_level: number };
      entries: Array<{
        rank_uncertainty?: {
          method: string;
          confidence_level: number;
          ci_low_pct: number;
          ci_high_pct: number;
          rank_band: string;
        };
      }>;
    };
    expect(officialApiResponse.status).toBe(200);
    expect(officialApi.ranking_policy?.method).toBe("wilson_lower_bound_success_rate_v0_3");
    expect(officialApi.ranking_policy?.confidence_level).toBe(0.95);
    expect(officialApi.entries[0]?.rank_uncertainty?.method).toBe("wilson_score_95");
    expect(officialApi.entries[0]?.rank_uncertainty?.confidence_level).toBe(0.95);
    expect(officialApi.entries[0]?.rank_uncertainty?.rank_band.length).toBeGreaterThan(0);

    const frontierResponse = await fetch(`${baseUrl}/boards/reproducibility-frontier?lang=en`);
    const frontierHtml = await frontierResponse.text();
    expect(frontierResponse.status).toBe(200);
    expect(frontierHtml).toContain("Near-Verified candidates / missing evidence reasons");

    const communityResponse = await fetch(`${baseUrl}/boards/community-lab?lang=en`);
    const communityHtml = await communityResponse.text();
    expect(communityResponse.status).toBe(200);
    expect(communityHtml).toContain("Community feed");
  });

  it("returns 404 for unknown board APIs instead of falling back to another board", async () => {
    const boardResponse = await fetch(`${baseUrl}/api/boards/not-a-board?lang=en`);
    const boardPayload = (await boardResponse.json()) as {
      error?: string;
      board_id?: string;
    };

    expect(boardResponse.status).toBe(404);
    expect(boardPayload).toEqual({
      error: "board_not_found",
      board_id: "not-a-board",
    });

    const slicesResponse = await fetch(`${baseUrl}/api/boards/not-a-board/slices?lang=en`);
    const slicesPayload = (await slicesResponse.json()) as {
      error?: string;
      board_id?: string;
    };

    expect(slicesResponse.status).toBe(404);
    expect(slicesPayload).toEqual({
      error: "board_not_found",
      board_id: "not-a-board",
    });
  });

  it("returns 404 for unknown leaderboard APIs", async () => {
    const response = await fetch(`${baseUrl}/api/leaderboards/not-a-host?lang=en`);
    const payload = (await response.json()) as {
      error?: string;
      host_id?: string;
    };

    expect(response.status).toBe(404);
    expect(payload).toEqual({
      error: "leaderboard_not_found",
      host_id: "not-a-host",
    });
  });

  it("renders disputed entries as suspended historical evidence instead of active board results", async () => {
    await withGovernedWorkerData(
      (candidate) => [
        {
          submission_id: candidate.submissionId,
          entry_id: candidate.entryId,
          publication_state: "disputed",
          reason_code: "operator_dispute_opened",
          summary: "Operator opened a dispute after a suspicious claim review.",
          at: "2026-04-22T08:00:00.000Z",
          actor: "operator:solo-admin",
        },
      ],
      async ({ candidate }) => {
        const officialBoardResponse = await fetch(`${baseUrl}/api/boards/official-verified?lang=en`);
        const officialBoard = (await officialBoardResponse.json()) as {
          entries: Array<{ entry_id: string }>;
        };

        expect(officialBoardResponse.status).toBe(200);
        expect(officialBoard.entries.some((entry) => entry.entry_id === candidate.entryId)).toBe(
          false,
        );

        const officialBoardHtmlResponse = await fetch(`${baseUrl}/boards/official-verified?lang=en`);
        const officialBoardHtml = await officialBoardHtmlResponse.text();

        expect(officialBoardHtmlResponse.status).toBe(200);
        expect(officialBoardHtml).toContain("Slice status breakdown");
        expect(officialBoardHtml).toContain("Suspended");

        const entryResponse = await fetch(`${baseUrl}/entries/${candidate.entryId}?lang=en`);
        const entryHtml = await entryResponse.text();

        expect(entryResponse.status).toBe(200);
        expect(entryHtml).toContain("temporarily removed from active boards");
        expect(entryHtml).toContain("boards:suspended");
        expect(entryHtml).toContain("Publication state notice");
      },
    );
  });

  for (const scenario of lifecycleGovernanceCases) {
    it(`renders ${scenario.name} lifecycle governance as non-active evidence in web surfaces`, async () => {
      await withGovernedWorkerData(scenario.buildGovernance, async ({ candidate }) => {
        const boards = await getEnglishBoards();
        expect(
          boards.every((board) =>
            (board.entries ?? []).every((entry) => entry.entry_id !== candidate.entryId),
          ),
        ).toBe(true);

        const entryApiResponse = await fetch(`${baseUrl}/api/entries/${candidate.entryId}?lang=en`);
        const entryApi = (await entryApiResponse.json()) as {
          scorecard: {
            verdict: string;
          };
          summary: {
            publication_state: string;
            board_disposition?: string;
            state_summary?: string;
          };
          research: {
            admission: Array<{
              eligible: boolean;
            }>;
            state_history: Array<{
              to_state: string;
              reason_code: string;
            }>;
          };
        };
        const entryResponse = await fetch(`${baseUrl}/entries/${candidate.entryId}?lang=en`);
        const entryHtml = await entryResponse.text();

        expect(entryApiResponse.status).toBe(200);
        expect(entryApi.summary.publication_state).toBe(scenario.expectedState);
        expect(entryApi.summary.board_disposition).toBe(scenario.expectedDisposition);
        expect(entryApi.summary.state_summary).toBe(scenario.expectedFinalSummary);
        expect(entryApi.scorecard.verdict).toContain(scenario.expectedVerdictSnippet);
        expect(entryApi.research.admission.every((admission) => admission.eligible === false)).toBe(
          true,
        );
        expect(entryApi.research.state_history.map((event) => event.to_state)).toEqual(
          scenario.expectedStatePath,
        );
        expect(entryApi.research.state_history.at(-1)?.reason_code).toBe(
          scenario.expectedReasonCode,
        );

        expect(entryResponse.status).toBe(200);
        expect(entryHtml).toContain(scenario.expectedFinalSummary);
        expect(entryHtml).toContain(`publication:${scenario.expectedState}`);
        expect(entryHtml).toContain(`boards:${scenario.expectedDisposition}`);
        expect(entryHtml).toContain("Publication state notice");
        expect(entryHtml).toContain(scenario.expectedVerdictSnippet);
      });
    });
  }
});
