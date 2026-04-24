import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { PublicationRecord } from "@ohbp/verifier-core";
import { afterEach, describe, expect, it } from "vitest";
import { loadAllBoardViews, loadBoardView, loadEntryView } from "./data.js";

const REAL_PUBLICATIONS_PATH =
  resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "verifier-worker",
    "data",
    "publications.json",
  );

describe("evidence data loading", () => {
  const originalWorkerDataDir = process.env.OHBP_WORKER_DATA_DIR;
  let tempWorkerDataDir: string | undefined;

  afterEach(async () => {
    if (originalWorkerDataDir === undefined) {
      delete process.env.OHBP_WORKER_DATA_DIR;
    } else {
      process.env.OHBP_WORKER_DATA_DIR = originalWorkerDataDir;
    }

    if (tempWorkerDataDir) {
      await rm(tempWorkerDataDir, { recursive: true, force: true });
      tempWorkerDataDir = undefined;
    }
  });

  it("does not synthesize missing evidence boards when runtime publications are incomplete", async () => {
    const publications = JSON.parse(
      await readFile(REAL_PUBLICATIONS_PATH, "utf8"),
    ) as PublicationRecord[];
    const officialOnly = publications.filter(
      (publication) =>
        publication.verification_record.board_admission.official_verified.eligible,
    );
    const hiddenCommunityEntryId = publications.find(
      (publication) =>
        publication.verification_record.board_admission.community_lab.eligible,
    )?.entry_id;

    expect(officialOnly.length).toBeGreaterThan(0);
    expect(hiddenCommunityEntryId).toBeDefined();
    const officialSeed = officialOnly[0];
    expect(officialSeed).toBeDefined();

    tempWorkerDataDir = await mkdtemp(join(tmpdir(), "ohbp-web-data-"));
    await mkdir(join(tempWorkerDataDir, "boards"), { recursive: true });
    await mkdir(join(tempWorkerDataDir, "entries"), { recursive: true });
    await writeFile(
      join(tempWorkerDataDir, "publications.json"),
      JSON.stringify([officialSeed], null, 2),
      "utf8",
    );
    process.env.OHBP_WORKER_DATA_DIR = tempWorkerDataDir;

    const boards = await loadAllBoardViews("en");
    const officialBoard = boards.find((board) => board.board_id === "official-verified");
    const frontierBoard = boards.find((board) => board.board_id === "reproducibility-frontier");
    const communityBoard = boards.find((board) => board.board_id === "community-lab");

    expect(boards).toHaveLength(3);
    expect(officialBoard?.entries).toHaveLength(1);
    expect(frontierBoard?.entries).toHaveLength(0);
    expect(frontierBoard?.board_state).toBe("verification_in_progress");
    expect(communityBoard?.entries).toHaveLength(0);
    expect(communityBoard?.board_state).toBe("warming_up");
    expect(
      boards.every((board) => board.data_provenance?.mode === "runtime_public_only"),
    ).toBe(true);

    const directCommunityView = await loadBoardView("community-lab", undefined, "en");
    expect(directCommunityView.entries).toHaveLength(0);
    expect(directCommunityView.data_provenance?.mode).toBe("runtime_public_only");

    const missingEntry = await loadEntryView(hiddenCommunityEntryId ?? "", "en");
    expect(missingEntry).toBeUndefined();

    const officialEntry = await loadEntryView(officialSeed!.entry_id, "en");
    expect(officialEntry?.entry_id).toBe(officialSeed!.entry_id);
    expect(officialEntry?.data_provenance?.mode).toBe("runtime_public_only");
  });
});
