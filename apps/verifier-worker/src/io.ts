import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { BoardPageView, EntryDetailView, UiLanguage } from "@ohbp/view-models";
import type {
  PublicationGovernanceDirective,
  PublicationRecord,
  StoredSubmissionRecord,
} from "@ohbp/verifier-core";

function appRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}

export function defaultIntakeDataDir(): string {
  return resolve(appRoot(), "..", "mock-intake", "data");
}

export function defaultWorkerDataDir(): string {
  return join(appRoot(), "data");
}

function governancePath(intakeDir: string): string {
  return join(intakeDir, "publication-governance.json");
}

function boardsDir(dataDir: string): string {
  return join(dataDir, "boards");
}

function entriesDir(dataDir: string): string {
  return join(dataDir, "entries");
}

export async function ensureWorkerDataDir(dataDir = defaultWorkerDataDir()): Promise<void> {
  await mkdir(boardsDir(dataDir), { recursive: true });
  await mkdir(entriesDir(dataDir), { recursive: true });
}

export async function clearWorkerOutputs(dataDir = defaultWorkerDataDir()): Promise<void> {
  await rm(dataDir, { recursive: true, force: true });
  await ensureWorkerDataDir(dataDir);
}

export async function readStoredSubmissions(
  intakeDir = defaultIntakeDataDir(),
): Promise<StoredSubmissionRecord[]> {
  const directory = join(intakeDir, "submissions");
  await mkdir(directory, { recursive: true });
  const files = await readdir(directory);
  const items = await Promise.all(
    files
      .filter((file) => file.endsWith(".json"))
      .map(async (file) => {
        const content = await readFile(join(directory, file), "utf8");
        return JSON.parse(content) as StoredSubmissionRecord;
      }),
  );

  return items.sort((left, right) => left.uploaded_at.localeCompare(right.uploaded_at));
}

export async function readPublicationGovernanceDirectives(
  intakeDir = defaultIntakeDataDir(),
): Promise<PublicationGovernanceDirective[]> {
  try {
    const content = await readFile(governancePath(intakeDir), "utf8");
    return JSON.parse(content) as PublicationGovernanceDirective[];
  } catch {
    return [];
  }
}

export async function writePublicationBundle(
  publications: PublicationRecord[],
  localizedViews: Record<
    UiLanguage,
    {
      boardViews: BoardPageView[];
      entryViews: EntryDetailView[];
    }
  >,
  dataDir = defaultWorkerDataDir(),
): Promise<void> {
  await ensureWorkerDataDir(dataDir);
  await writeFile(join(dataDir, "publications.json"), JSON.stringify(publications, null, 2), "utf8");

  await Promise.all(
    Object.entries(localizedViews).flatMap(([lang, views]) =>
      views.boardViews.flatMap((view) => [
        writeFile(
          join(boardsDir(dataDir), `${view.board_id}.${lang}.json`),
          JSON.stringify(view, null, 2),
          "utf8",
        ),
        ...(lang === "zh-CN"
          ? [
              writeFile(
                join(boardsDir(dataDir), `${view.board_id}.json`),
                JSON.stringify(view, null, 2),
                "utf8",
              ),
            ]
          : []),
      ]),
    ),
  );

  await Promise.all(
    Object.entries(localizedViews).flatMap(([lang, views]) =>
      views.entryViews.flatMap((view) => [
        writeFile(
          join(entriesDir(dataDir), `${view.entry_id}.${lang}.json`),
          JSON.stringify(view, null, 2),
          "utf8",
        ),
        ...(lang === "zh-CN"
          ? [
              writeFile(
                join(entriesDir(dataDir), `${view.entry_id}.json`),
                JSON.stringify(view, null, 2),
                "utf8",
              ),
            ]
          : []),
      ]),
    ),
  );
}
