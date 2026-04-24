import { promises as fs } from "node:fs";
import path from "node:path";

import { canonicalStringify, sha256Hex } from "@ohbp/validator-core";

import type { RawTaskResult, RunMetadata, StudyConfig } from "./types.js";

function deterministicNumber(seed: string, modulo: number): number {
  const hash = sha256Hex(seed);
  const raw = Number.parseInt(hash.slice(0, 8), 16);
  return raw % modulo;
}

function deterministicTimestamp(studyId: string, offsetMinutes: number): string {
  const base = Date.parse("2026-01-01T00:00:00.000Z");
  const studyOffsetMinutes = deterministicNumber(studyId, 1440);
  return new Date(
    base + (studyOffsetMinutes + offsetMinutes) * 60 * 1000,
  ).toISOString();
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${canonicalStringify(value)}\n`, "utf8");
}

async function writeText(filePath: string, contents: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf8");
}

function createTaskResult(
  study: StudyConfig,
  attemptId: string,
  taskId: string,
): RawTaskResult {
  const scoreBase = deterministicNumber(`${study.study_id}:${attemptId}:${taskId}`, 18);
  const durationBase = deterministicNumber(`duration:${attemptId}:${taskId}`, 500);
  const costBase = deterministicNumber(`cost:${attemptId}:${taskId}`, 9);

  return {
    protocol_version: study.protocol_version,
    task_id: taskId,
    status: "success",
    score: Number((0.72 + scoreBase / 100).toFixed(2)),
    duration_ms: 800 + durationBase,
    cost_usd: Number((0.02 + costBase / 100).toFixed(3)),
    summary: `Sample adapter completed ${taskId} for ${attemptId}.`,
  };
}

function createTraceLines(
  study: StudyConfig,
  attemptId: string,
  task: RawTaskResult,
  taskIndex: number,
): string[] {
  const startedAt = deterministicTimestamp(
    study.study_id,
    taskIndex * 3 + 1,
  );
  const finishedAt = deterministicTimestamp(
    study.study_id,
    taskIndex * 3 + 2,
  );

  return [
    canonicalStringify({
      event: "task_started",
      study_id: study.study_id,
      attempt_id: attemptId,
      task_id: task.task_id,
      ts: startedAt,
    }),
    canonicalStringify({
      event: "task_completed",
      study_id: study.study_id,
      attempt_id: attemptId,
      task_id: task.task_id,
      ts: finishedAt,
      score: task.score,
      duration_ms: task.duration_ms,
      cost_usd: task.cost_usd,
    }),
  ];
}

export async function runSampleAdapter(
  workspaceRoot: string,
  study: StudyConfig,
  attemptId: string,
): Promise<string> {
  const runRoot = path.join(workspaceRoot, ".hb", "runs", `run_${attemptId}`);
  await fs.mkdir(path.join(runRoot, "tasks"), { recursive: true });

  const startedAt = deterministicTimestamp(study.study_id, 0);
  const completedAt = deterministicTimestamp(study.study_id, study.task_ids.length * 3 + 3);
  const seed = sha256Hex(`${study.study_id}:${study.run_group_id}:${attemptId}`);

  const metadata: RunMetadata = {
    protocol_version: study.protocol_version,
    study_id: study.study_id,
    run_group_id: study.run_group_id,
    attempt_id: attemptId,
    adapter_id: study.adapter.id,
    seed,
    task_ids: study.task_ids,
    started_at: startedAt,
    completed_at: completedAt,
  };

  await writeJson(path.join(runRoot, "run-metadata.json"), metadata);
  await writeJson(path.join(runRoot, "adapter-resolution.json"), {
    adapter_id: study.adapter.id,
    preset_id: study.adapter.preset_id,
    deterministic: true,
  });

  const interactionLines: string[] = [];

  for (const [taskIndex, taskId] of study.task_ids.entries()) {
    const taskRoot = path.join(runRoot, "tasks", taskId);
    const taskResult = createTaskResult(study, attemptId, taskId);
    const traceLines = createTraceLines(study, attemptId, taskResult, taskIndex);

    interactionLines.push(
      canonicalStringify({
        event: "system_task_dispatch",
        study_id: study.study_id,
        attempt_id: attemptId,
        task_id: taskId,
        ts: deterministicTimestamp(study.study_id, taskIndex * 3),
        target_ref: `tasks/${taskId}`,
      }),
    );

    await writeJson(path.join(taskRoot, "result.json"), taskResult);
    await writeText(path.join(taskRoot, "trace.jsonl"), `${traceLines.join("\n")}\n`);
    await writeText(
      path.join(taskRoot, "stdout.log"),
      `stdout for ${taskId} (${attemptId})\n`,
    );
    await writeText(path.join(taskRoot, "stderr.log"), "");
  }

  await writeText(
    path.join(runRoot, "interaction-log.jsonl"),
    `${interactionLines.join("\n")}\n`,
  );
  await writeJson(path.join(runRoot, "interaction-summary.json"), {
    protocol_version: study.protocol_version,
    human_event_count: 0,
    approval_event_count: 0,
    interactive_event_count: 0,
    tty_freeform_input_detected: false,
    manual_command_detected: false,
    manual_file_write_detected: false,
    editor_interaction_detected: false,
    tty_input_digest: "ZERO_INPUT_V1",
    approval_target_linkage_complete: true,
  });

  return runRoot;
}
