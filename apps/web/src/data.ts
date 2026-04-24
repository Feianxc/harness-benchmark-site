import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { PublicationRecord } from "@ohbp/verifier-core";
import {
  buildBoardPageView,
  buildHomePageView,
  buildProtocolFieldEntry,
  buildProtocolIndexView,
  buildProtocolObjectEntry,
  buildProtocolPageView,
  buildValidatorRunViewWithMode,
  listBoardSlices,
  type BoardId,
  type BoardPageView,
  type DataProvenanceNote,
  type EntryDetailView,
  type HomePageView,
  type ProtocolFieldGlossaryEntry,
  type ProtocolIndexView,
  type ProtocolObjectEntry,
  type ProtocolPageView,
  type SuccessRateUncertaintyView,
  type UiLanguage,
  type ValidatorMode,
  type ValidatorRunView,
} from "@ohbp/view-models";
import { buildEntryDetailView } from "@ohbp/view-models";
import {
  getValidatorSampleCase,
  listValidatorSampleCases,
} from "./fixtures.js";

function appRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

function workerDataDir(): string {
  if (process.env.OHBP_WORKER_DATA_DIR) {
    return resolve(process.env.OHBP_WORKER_DATA_DIR);
  }

  return resolve(appRoot(), "..", "verifier-worker", "data");
}

function t(lang: UiLanguage, zhCN: string, en: string): string {
  return lang === "en" ? en : zhCN;
}

async function maybeReadJson<T>(path: string): Promise<T | undefined> {
  try {
    const content = await readFile(path, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return undefined;
  }
}

function boardSnapshotPath(boardId: BoardId, lang: UiLanguage): string {
  return join(workerDataDir(), "boards", `${boardId}.${lang}.json`);
}

function legacyBoardSnapshotPath(boardId: BoardId): string {
  return join(workerDataDir(), "boards", `${boardId}.json`);
}

function entrySnapshotPath(entryId: string, lang: UiLanguage): string {
  return join(workerDataDir(), "entries", `${entryId}.${lang}.json`);
}

function legacyEntrySnapshotPath(entryId: string): string {
  return join(workerDataDir(), "entries", `${entryId}.json`);
}

function zeroBoardBreakdown(eligibleEntries = 0) {
  return {
    active_eligible_entries: eligibleEntries,
    active_blocked_entries: 0,
    suspended_entries: 0,
    historical_entries: 0,
    hidden_entries: 0,
  };
}

const WILSON_Z_95 = 1.96;
const MIN_EFFECTIVE_N_FOR_ORDINAL = 30;
const HIGH_CONFIDENCE_MARGIN_PCT = 8;
const MEDIUM_CONFIDENCE_MARGIN_PCT = 15;

type SnapshotBoardEntry = BoardPageView["entries"][number];

function boundedObservedSuccesses(entry: SnapshotBoardEntry): number {
  const effectiveN = Math.max(1, Number(entry.n_tasks ?? 0));
  const successRate = Math.max(0, Math.min(100, Number(entry.success_rate_pct ?? 0))) / 100;
  return Math.min(effectiveN, Math.max(0, Math.round(successRate * effectiveN)));
}

function wilsonInterval(
  successes: number,
  total: number,
): { low: number; high: number; margin: number } {
  const n = Math.max(1, total);
  const boundedSuccesses = Math.min(n, Math.max(0, successes));
  const p = boundedSuccesses / n;
  const z2 = WILSON_Z_95 * WILSON_Z_95;
  const denominator = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / denominator;
  const halfWidth =
    (WILSON_Z_95 *
      Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) /
    denominator;

  return {
    low: Math.max(0, center - halfWidth),
    high: Math.min(1, center + halfWidth),
    margin: halfWidth,
  };
}

function rankConfidenceLevel(
  effectiveN: number,
  marginPct: number,
): SuccessRateUncertaintyView["rank_confidence"] {
  if (effectiveN >= MIN_EFFECTIVE_N_FOR_ORDINAL && marginPct <= HIGH_CONFIDENCE_MARGIN_PCT) {
    return "high";
  }

  if (effectiveN >= 10 && marginPct <= MEDIUM_CONFIDENCE_MARGIN_PCT) {
    return "medium";
  }

  return "low";
}

function confidenceInterpretation(
  confidence: SuccessRateUncertaintyView["rank_confidence"],
  lang: UiLanguage,
): string {
  if (confidence === "high") {
    return t(
      lang,
      "样本量与区间宽度足以支持较强排序判断。",
      "Sample size and interval width support a stronger ranking interpretation.",
    );
  }

  if (confidence === "medium") {
    return t(
      lang,
      "可以比较方向，但仍建议把相邻条目看成同一档候选。",
      "The direction is comparable, but adjacent entries should still be treated as a tier.",
    );
  }

  return t(
    lang,
    "样本仍少或区间较宽，先看 tier，不要硬读名次。",
    "The sample is still small or the interval is wide; read the tier first, not a hard rank.",
  );
}

function rankBandLabel(index: number, lang: UiLanguage): string {
  const letter = String.fromCharCode("A".charCodeAt(0) + Math.min(index, 25));
  return t(lang, `置信档 ${letter}`, `Confidence band ${letter}`);
}

function buildSnapshotRankBandMap(
  entries: SnapshotBoardEntry[],
  lang: UiLanguage,
): Map<string, string> {
  const bands = new Map<string, string>();
  let bandIndex = 0;
  let previousLow = Number.NEGATIVE_INFINITY;

  for (const [index, entry] of entries.entries()) {
    const effectiveN = Math.max(1, Number(entry.n_tasks ?? 0));
    const interval = wilsonInterval(boundedObservedSuccesses(entry), effectiveN);

    if (index === 0) {
      previousLow = interval.low;
    } else if (previousLow > interval.high) {
      bandIndex += 1;
    }

    bands.set(entry.entry_id, rankBandLabel(bandIndex, lang));
    previousLow = interval.low;
  }

  return bands;
}

function estimateRankUncertaintyFromSnapshotEntry(
  entry: SnapshotBoardEntry,
  rankBand: string,
  lang: UiLanguage,
): SuccessRateUncertaintyView {
  const effectiveN = Math.max(1, Number(entry.n_tasks ?? 0));
  const successes = boundedObservedSuccesses(entry);
  const interval = wilsonInterval(successes, effectiveN);
  const marginPct = Number((interval.margin * 100).toFixed(1));
  const rankConfidence = rankConfidenceLevel(effectiveN, marginPct);

  return {
    method: "wilson_score_95",
    confidence_level: 0.95,
    effective_n: effectiveN,
    observed_successes: successes,
    ci_low_pct: Number((interval.low * 100).toFixed(1)),
    ci_high_pct: Number((interval.high * 100).toFixed(1)),
    margin_pct: marginPct,
    rank_band: rankBand,
    rank_confidence: rankConfidence,
    interpretation: confidenceInterpretation(rankConfidence, lang),
  };
}

function normalizeBoardSnapshot(board: BoardPageView): BoardPageView {
  const normalizedStatusBreakdown =
    board.status_breakdown ?? zeroBoardBreakdown(board.stats?.eligible_entries ?? board.entries.length);
  const normalizedRankingPolicy = board.ranking_policy ?? {
    method: "wilson_lower_bound_success_rate_v0_3" as const,
    confidence_level: 0.95 as const,
    minimum_effective_n_for_ordinal: 30,
    ordinal_rank_allowed: board.board_state === "ranked_ordinal",
    separation_rule: t(
      board.lang,
      "旧快照未包含排序不确定性策略；运行时会在重新生成 board view 时补齐。",
      "This legacy snapshot does not include ranking uncertainty policy; runtime board generation fills it in.",
    ),
    note: t(
      board.lang,
      "旧快照兼容模式。",
      "Legacy snapshot compatibility mode.",
    ),
  };
  const normalizedRankBands = buildSnapshotRankBandMap(board.entries, board.lang);
  const normalizedEntries = board.entries.map((entry) => ({
    ...entry,
    rank_uncertainty:
      entry.rank_uncertainty ??
      estimateRankUncertaintyFromSnapshotEntry(
        entry,
        normalizedRankBands.get(entry.entry_id) ?? rankBandLabel(0, board.lang),
        board.lang,
      ),
  }));

  return {
    ...board,
    status_breakdown: normalizedStatusBreakdown,
    ranking_policy: normalizedRankingPolicy,
    entries: normalizedEntries,
    available_slices: board.available_slices.map((slice) => ({
      ...slice,
      state_reason: slice.state_reason ?? board.state_reason,
      status_breakdown: slice.status_breakdown ?? zeroBoardBreakdown(slice.entry_count),
    })),
  };
}

async function loadBoardSnapshot(
  boardId: BoardId,
  lang: UiLanguage,
): Promise<BoardPageView | undefined> {
  const board =
    (await maybeReadJson<BoardPageView>(boardSnapshotPath(boardId, lang))) ??
    (lang === "zh-CN"
      ? await maybeReadJson<BoardPageView>(legacyBoardSnapshotPath(boardId))
      : undefined);

  return board ? normalizeBoardSnapshot(board) : undefined;
}

async function loadEntrySnapshot(
  entryId: string,
  lang: UiLanguage,
): Promise<EntryDetailView | undefined> {
  return (
    (await maybeReadJson<EntryDetailView>(entrySnapshotPath(entryId, lang))) ??
    (lang === "zh-CN"
      ? await maybeReadJson<EntryDetailView>(legacyEntrySnapshotPath(entryId))
      : undefined)
  );
}

async function loadSnapshotBoardViews(
  lang: UiLanguage,
): Promise<BoardPageView[] | undefined> {
  const views = await Promise.all(
    (["official-verified", "reproducibility-frontier", "community-lab"] as BoardId[]).map((boardId) =>
      loadBoardSnapshot(boardId, lang),
    ),
  );

  return views.every(Boolean)
    ? (views as BoardPageView[])
    : undefined;
}

interface PublicationLoadResult {
  publications: PublicationRecord[];
  provenance?: DataProvenanceNote;
}

function runtimePublicOnlyProvenance(
  lang: UiLanguage,
  publicationCount: number,
): DataProvenanceNote {
  return {
    mode: "runtime_public_only",
    title: t(lang, "只显示真实公开 publication", "Only real public publications are shown"),
    body: t(
      lang,
      `当前页面直接基于当前 worker data 目录中的 publications.json 运行时生成，共读取 ${publicationCount} 条公开 publication；如果某个 board 或 slice 还没有 eligible entries，页面会显示空态 / warming_up，而不会再补 synthetic demo entries。`,
      `This page is generated directly from publications.json in the current worker data directory, with ${publicationCount} public publication(s) loaded; if a board or slice does not yet have eligible entries, the site now shows an empty / warming_up state instead of backfilling synthetic demo entries.`,
    ),
  };
}

async function loadPublications(
  lang: UiLanguage = "zh-CN",
): Promise<PublicationLoadResult> {
  const publications =
    (await maybeReadJson<PublicationRecord[]>(join(workerDataDir(), "publications.json"))) ?? [];

  return {
    publications,
    provenance: runtimePublicOnlyProvenance(lang, publications.length),
  };
}

function attachBoardProvenance(
  boardView: BoardPageView,
  provenance?: DataProvenanceNote,
): BoardPageView {
  if (!provenance) {
    return boardView;
  }

  return {
    ...boardView,
    data_provenance: provenance,
  };
}

export async function loadBoardView(
  boardId: BoardId,
  sliceId: string | undefined,
  lang: UiLanguage,
): Promise<BoardPageView> {
  const snapshot = await loadBoardSnapshot(boardId, lang);
  if (snapshot && (!sliceId || sliceId === snapshot.slice.slice_id)) {
    return snapshot;
  }

  const result = await loadPublications(lang);
  return attachBoardProvenance(
    buildBoardPageView(boardId, result.publications, sliceId, lang),
    result.provenance,
  );
}

export async function loadBoardSliceList(
  boardId: BoardId,
  lang: UiLanguage,
) {
  const snapshot = await loadBoardSnapshot(boardId, lang);
  if (snapshot) {
    return snapshot.available_slices;
  }

  const result = await loadPublications(lang);
  return listBoardSlices(boardId, result.publications, lang);
}

export async function loadAllBoardViews(lang: UiLanguage): Promise<BoardPageView[]> {
  const snapshotViews = await loadSnapshotBoardViews(lang);
  if (snapshotViews) {
    return snapshotViews;
  }

  const result = await loadPublications(lang);
  return ["official-verified", "reproducibility-frontier", "community-lab"].map((boardId) =>
    attachBoardProvenance(
      buildBoardPageView(boardId as BoardId, result.publications, undefined, lang),
      result.provenance,
    ),
  );
}

export async function loadHomeView(lang: UiLanguage): Promise<HomePageView> {
  const boardViews = await loadAllBoardViews(lang);
  const homeView = buildHomePageView(boardViews, lang);
  const provenance = boardViews.find((view) => view.data_provenance)?.data_provenance;

  return provenance
    ? {
        ...homeView,
        data_provenance: provenance,
      }
    : homeView;
}

export async function loadEntryView(
  entryId: string,
  lang: UiLanguage,
): Promise<EntryDetailView | undefined> {
  const snapshot = await loadEntrySnapshot(entryId, lang);
  if (snapshot) {
    return snapshot;
  }

  const result = await loadPublications(lang);
  const entry = buildEntryDetailView(entryId, result.publications, lang);
  if (!entry) {
    return undefined;
  }

  if (!result.provenance) {
    return entry;
  }

  return {
    ...entry,
    data_provenance: result.provenance,
  };
}

export async function loadProtocolView(
  query: string | undefined,
  lang: UiLanguage,
): Promise<ProtocolPageView> {
  return buildProtocolPageView(query, lang);
}

export async function loadProtocolIndex(
  lang: UiLanguage,
): Promise<ProtocolIndexView> {
  return buildProtocolIndexView(lang);
}

export async function loadProtocolObject(
  objectId: string,
  lang: UiLanguage,
): Promise<ProtocolObjectEntry | undefined> {
  return buildProtocolObjectEntry(objectId, lang);
}

export async function loadProtocolField(
  fieldId: string,
  lang: UiLanguage,
): Promise<ProtocolFieldGlossaryEntry | undefined> {
  return buildProtocolFieldEntry(fieldId, lang);
}

export function runValidatorPreview(
  payloadText: string,
  mode: ValidatorMode,
  lang: UiLanguage,
): ValidatorRunView {
  return buildValidatorRunViewWithMode(payloadText, mode, lang);
}

export async function sampleValidatorPayload(
  sampleId: string | undefined,
  lang: UiLanguage,
): Promise<string> {
  return getValidatorSampleCase(lang, sampleId).payload;
}

export async function loadValidatorSampleCases(lang: UiLanguage) {
  return listValidatorSampleCases(lang);
}
