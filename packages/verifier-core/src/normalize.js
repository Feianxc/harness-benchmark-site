import { readFile } from "node:fs/promises";
import { createDeterministicId, sha256Digest, stableStringify, } from "./stable.js";
const ZERO_INPUT_V1 = "ZERO_INPUT_V1";
const DEFAULT_HEALTH = {
    freshness_tier: "active",
    contamination_tier: "low",
    reporting_completeness: "high",
    last_audit_at: "2026-04-20T00:00:00.000Z",
    health_snapshot_version: "health-v0.1",
};
function inferProfile(requestedTrustTier) {
    if (requestedTrustTier === "verified") {
        return "verified_full";
    }
    if (requestedTrustTier === "reproduced") {
        return "reproducible_standard";
    }
    return "community_light";
}
const CONSERVATIVE_INTERACTIVE_TELEMETRY = {
    human_event_count: 1,
    approval_event_count: 0,
    interactive_event_count: 1,
    tty_freeform_input_detected: true,
    manual_command_detected: true,
    manual_file_write_detected: false,
    editor_interaction_detected: false,
    approval_target_linkage_complete: false,
    interaction_log_complete: false,
    tty_input_digest: "tty:unknown",
};
function normalizeTelemetry(telemetry) {
    if (!telemetry) {
        return undefined;
    }
    return {
        ...CONSERVATIVE_INTERACTIVE_TELEMETRY,
        ...telemetry,
        tty_input_digest: telemetry.tty_input_digest ?? ZERO_INPUT_V1,
    };
}
function normalizeBenchmark(benchmark, requestedTrustTier) {
    const split = benchmark?.split ?? (requestedTrustTier === "community" ? "public" : "hidden");
    return {
        id: benchmark?.id ?? "core-lite",
        version: benchmark?.version ?? "v1",
        lane_id: benchmark?.lane_id ?? "core-lite-v1",
        split,
        health: {
            ...DEFAULT_HEALTH,
            ...(benchmark?.health ?? {}),
        },
    };
}
function normalizeParticipant(value, fallback) {
    return {
        id: value?.id ?? fallback.id,
        label: value?.label ?? fallback.label,
        provider: value?.provider ?? fallback.provider,
        version: value?.version ?? fallback.version,
    };
}
function resolveVisibilityDefaults(split) {
    if (split === "hidden" || split === "holdout" || split === "rotating") {
        return {
            evidence_channel_mode: "public_plus_sealed",
            visibility_class: "public_summary",
            release_policy: "summary_only_permanent",
        };
    }
    return {
        evidence_channel_mode: "public_only",
        visibility_class: "public_full",
        release_policy: "public_immediate",
    };
}
async function payloadFromBundlePath(bundlePath) {
    const content = await readFile(bundlePath, "utf8");
    const parsed = JSON.parse(content);
    return "normalized_payload" in parsed && parsed.normalized_payload
        ? parsed.normalized_payload
        : parsed;
}
export async function loadUploadPayload(input) {
    if (input.normalized_payload) {
        return { payload: input.normalized_payload, bundlePath: input.bundle_path };
    }
    if (input.bundle_path) {
        return {
            payload: await payloadFromBundlePath(input.bundle_path),
            bundlePath: input.bundle_path,
        };
    }
    return {
        payload: {},
    };
}
export async function normalizeIncomingSubmission(input) {
    const { payload, bundlePath } = await loadUploadPayload(input);
    const requestedTrustTier = payload.requested_trust_tier ?? "community";
    const submissionProfile = payload.submission_profile ?? inferProfile(requestedTrustTier);
    const benchmark = normalizeBenchmark(payload.benchmark, requestedTrustTier);
    const declaredAutonomyMode = payload.declared_autonomy_mode ?? "autonomous";
    const visibilityDefaults = resolveVisibilityDefaults(benchmark.split);
    const model = normalizeParticipant(payload.model, {
        id: "gpt-5.1",
        label: "GPT-5.1",
        provider: "openai",
        version: "2026-04",
    });
    const harness = normalizeParticipant(payload.harness, {
        id: "baseline-shell",
        label: "Baseline Shell",
        version: "0.1.0",
    });
    const metrics = {
        success_rate: payload.metrics?.success_rate ?? 0.5,
        median_cost_usd: payload.metrics?.median_cost_usd ?? 1.25,
        p95_latency_ms: payload.metrics?.p95_latency_ms ?? 2_100,
        stability_score: payload.metrics?.stability_score ?? 0.7,
        reproducibility_score: payload.metrics?.reproducibility_score ?? 0.75,
    };
    const nRuns = payload.n_runs ?? 1;
    const nTasks = payload.n_tasks ?? 10;
    const declaredAttemptTotal = payload.declared_attempt_total ?? nRuns;
    const observedAttemptTotal = payload.observed_attempt_total ?? nRuns;
    const telemetry = normalizeTelemetry(payload.telemetry);
    const identitySeed = {
        requestedTrustTier,
        benchmark,
        model,
        harness,
        metrics,
        nRuns,
        nTasks,
        submitted_at: payload.submitted_at ?? input.received_at ?? "2026-04-21T00:00:00.000Z",
    };
    const submissionId = payload.submission_id ?? createDeterministicId("submission", identitySeed);
    const studyId = payload.study_id ??
        createDeterministicId("study", {
            benchmark: benchmark.id,
            lane: benchmark.lane_id,
            model: model.id,
        });
    const runGroupId = payload.run_group_id ??
        createDeterministicId("rungrp", {
            benchmark: benchmark.id,
            version: benchmark.version,
            lane: benchmark.lane_id,
            model: model.id,
            harness: harness.id,
        });
    const attemptId = payload.attempt_id ??
        createDeterministicId("attempt", {
            runGroupId,
            submissionId,
        });
    const bundleId = payload.bundle_id ??
        createDeterministicId("bundle", {
            submissionId,
            metrics,
            observedAttemptTotal,
        });
    const entryId = payload.entry_id ??
        createDeterministicId("entry", {
            benchmark: benchmark.id,
            lane: benchmark.lane_id,
            model: model.id,
            harness: harness.id,
        });
    const digestSeed = {
        studyId,
        runGroupId,
        attemptId,
        bundleId,
        benchmark,
        model,
        harness,
        metrics,
    };
    const taskPackageDigest = payload.task_package_digest ??
        sha256Digest({
            benchmark: benchmark.id,
            version: benchmark.version,
            lane: benchmark.lane_id,
            tasks: nTasks,
        });
    const executionContractDigest = payload.execution_contract_digest ??
        sha256Digest({
            benchmark: benchmark.id,
            model: model.id,
            harness: harness.id,
            comparison_mode: payload.comparison_mode ?? "fixed_model_compare_harness",
            budget_class: payload.budget_class ?? "standard",
        });
    const tolerancePolicyDigest = payload.tolerance_policy_digest ??
        sha256Digest({
            benchmark: benchmark.id,
            lane: benchmark.lane_id,
            requestedTrustTier,
            repeatability_class: payload.repeatability_class ?? "true_seeded",
        });
    const registrationDigest = payload.registration_digest ??
        sha256Digest({
            runGroupId,
            declaredAttemptTotal,
            requestedTrustTier,
            benchmark,
            executionContractDigest,
            taskPackageDigest,
            tolerancePolicyDigest,
        });
    const publicBundleDigest = payload.public_bundle_digest ??
        sha256Digest({
            ...digestSeed,
            public_surface: {
                benchmark: benchmark.id,
                lane: benchmark.lane_id,
                model: model.id,
                harness: harness.id,
                metrics,
            },
        });
    return {
        bundlePath,
        normalized: {
            submission_id: submissionId,
            study_id: studyId,
            run_group_id: runGroupId,
            attempt_id: attemptId,
            bundle_id: bundleId,
            entry_id: entryId,
            submission_profile: submissionProfile,
            requested_trust_tier: requestedTrustTier,
            benchmark,
            model,
            harness,
            metrics,
            n_runs: nRuns,
            n_tasks: nTasks,
            declared_attempt_total: declaredAttemptTotal,
            observed_attempt_total: observedAttemptTotal,
            benchmark_tuned_flag: payload.benchmark_tuned_flag ?? false,
            repeatability_class: payload.repeatability_class ?? "true_seeded",
            comparison_mode: payload.comparison_mode ?? "fixed_model_compare_harness",
            budget_class: payload.budget_class ?? "standard",
            evidence_channel_mode: payload.evidence_channel_mode ??
                visibilityDefaults.evidence_channel_mode,
            visibility_class: payload.visibility_class ?? visibilityDefaults.visibility_class,
            release_policy: payload.release_policy ?? visibilityDefaults.release_policy,
            declared_autonomy_mode: declaredAutonomyMode,
            telemetry,
            tolerance_policy_digest: tolerancePolicyDigest,
            execution_contract_digest: executionContractDigest,
            task_package_digest: taskPackageDigest,
            registration_digest: registrationDigest,
            public_bundle_digest: publicBundleDigest,
            sealed_audit_bundle_digest: payload.sealed_audit_bundle_digest,
            provider_release_window: payload.provider_release_window,
            support_count: payload.support_count ?? nRuns,
            notes: payload.notes ?? [],
            tags: payload.tags ?? [],
            submitted_at: payload.submitted_at ?? input.received_at ?? "2026-04-21T00:00:00.000Z",
        },
    };
}
export function previewNormalizedPayload(payload) {
    const requestedTrustTier = payload.requested_trust_tier ?? "community";
    const benchmark = normalizeBenchmark(payload.benchmark, requestedTrustTier);
    const defaults = resolveVisibilityDefaults(benchmark.split);
    return {
        preview_identity_hash: sha256Digest(stableStringify(payload)).slice(0, 20),
        submission_profile: payload.submission_profile ?? inferProfile(requestedTrustTier),
        requested_trust_tier: requestedTrustTier,
        benchmark,
        model: normalizeParticipant(payload.model, {
            id: "gpt-5.1",
            label: "GPT-5.1",
            provider: "openai",
            version: "2026-04",
        }),
        harness: normalizeParticipant(payload.harness, {
            id: "baseline-shell",
            label: "Baseline Shell",
            version: "0.1.0",
        }),
        metrics: {
            success_rate: payload.metrics?.success_rate ?? 0.5,
            median_cost_usd: payload.metrics?.median_cost_usd ?? 1.25,
            p95_latency_ms: payload.metrics?.p95_latency_ms ?? 2_100,
            stability_score: payload.metrics?.stability_score ?? 0.7,
            reproducibility_score: payload.metrics?.reproducibility_score ?? 0.75,
        },
        n_runs: payload.n_runs ?? 1,
        n_tasks: payload.n_tasks ?? 10,
        declared_attempt_total: payload.declared_attempt_total ?? payload.n_runs ?? 1,
        observed_attempt_total: payload.observed_attempt_total ?? payload.n_runs ?? 1,
        benchmark_tuned_flag: payload.benchmark_tuned_flag ?? false,
        repeatability_class: payload.repeatability_class ?? "true_seeded",
        comparison_mode: payload.comparison_mode ?? "fixed_model_compare_harness",
        budget_class: payload.budget_class ?? "standard",
        evidence_channel_mode: payload.evidence_channel_mode ?? defaults.evidence_channel_mode,
        visibility_class: payload.visibility_class ?? defaults.visibility_class,
        release_policy: payload.release_policy ?? defaults.release_policy,
        declared_autonomy_mode: payload.declared_autonomy_mode ?? "interactive",
        telemetry: normalizeTelemetry(payload.telemetry),
        tolerance_policy_digest: payload.tolerance_policy_digest ?? "sha256:<to-be-computed>",
        execution_contract_digest: payload.execution_contract_digest ?? "sha256:<to-be-computed>",
        task_package_digest: payload.task_package_digest ?? "sha256:<to-be-computed>",
        registration_digest: payload.registration_digest ?? "sha256:<to-be-computed>",
        public_bundle_digest: payload.public_bundle_digest ?? "sha256:<to-be-computed>",
        sealed_audit_bundle_digest: payload.sealed_audit_bundle_digest,
        provider_release_window: payload.provider_release_window,
        support_count: payload.support_count ?? payload.n_runs ?? 1,
        notes: payload.notes ?? [],
        tags: payload.tags ?? [],
        submitted_at: payload.submitted_at ?? "2026-04-21T00:00:00.000Z",
    };
}
//# sourceMappingURL=normalize.js.map