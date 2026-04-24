import { truncateDigest } from "@ohbp/verifier-core";
import { localizeAdmissionReasons } from "./admission-i18n.js";
import { DEFAULT_UI_LANGUAGE, t } from "./i18n.js";
function chooseBaseline(records, current) {
    const slicePeers = records.filter((record) => record.submission.benchmark.id === current.submission.benchmark.id &&
        record.submission.benchmark.lane_id === current.submission.benchmark.lane_id &&
        record.submission.model.id === current.submission.model.id);
    return (slicePeers.find((record) => record.submission.harness.id.includes("baseline")) ??
        slicePeers
            .slice()
            .sort((left, right) => left.submission.metrics.success_rate - right.submission.metrics.success_rate)[0]);
}
function localizedStateEventSummary(event, lang) {
    if (event.reason_code.startsWith("auto_state_")) {
        if (event.to_state === "published") {
            return t(lang, "系统判定：当前结果满足公开发布条件。", "System decision: this result currently satisfies public release requirements.");
        }
        if (event.to_state === "provisional") {
            return t(lang, "系统判定：当前结果可公开显示，但仍缺高信任发布条件。", "System decision: this result may be shown publicly but still lacks high-trust release conditions.");
        }
        if (event.to_state === "submitted") {
            return t(lang, "系统判定：当前结果尚未进入公开发布。", "System decision: this result has not entered public release yet.");
        }
        if (event.to_state === "rejected") {
            return t(lang, "系统判定：当前结果未通过公开发布门槛。", "System decision: this result did not pass the public release gate.");
        }
    }
    return event.summary;
}
function publicationVerdict(record, lang) {
    const publicationState = record.verification_record.publication_state;
    if (publicationState === "disputed") {
        return t(lang, "该结果目前处于 disputed 状态，已从活跃榜单暂时下架，等待平台裁决。", "This result is currently disputed and has been temporarily removed from active boards pending platform review.");
    }
    if (publicationState === "corrected") {
        return t(lang, "该结果已经被标记为 corrected；修正版本会在重新复核后决定是否回到活跃榜单。", "This result is marked corrected; the revised version will be reconsidered for active boards after re-review.");
    }
    if (publicationState === "invalidated") {
        return t(lang, "该结果已经被判定为 invalidated，只保留历史说明，不再作为有效比较依据。", "This result has been invalidated and is kept only for historical explanation, not for active comparison.");
    }
    if (publicationState === "archived") {
        return t(lang, "该结果已归档，仅保留历史页，不再参与当前榜单。", "This result has been archived and remains available only as a historical page, not as part of the current boards.");
    }
    if (publicationState === "rejected") {
        return t(lang, "该结果未进入公开发布状态，因此不会出现在活跃榜单中。", "This result never entered public release, so it does not appear on active boards.");
    }
    return record.verification_record.trust_tier === "verified"
        ? t(lang, "该结果已进入平台授予的 Verified 公开层。", "This result has entered the platform-granted Verified public layer.")
        : record.verification_record.trust_tier === "reproduced"
            ? t(lang, "该结果已具备 reproducible 级别证据，但仍未进入官方默认结论层。", "This result has reproducible-grade evidence but has not entered the default official conclusion layer.")
            : t(lang, "该结果目前仅作为 community/public surface 样本展示。", "This result is currently shown only as a community/public-surface sample.");
}
function buildScorecard(record, baseline, lang) {
    const metrics = record.submission.metrics;
    const baselineMetrics = baseline?.submission.metrics;
    const official = record.verification_record.board_admission.official_verified;
    return {
        verdict: publicationVerdict(record, lang),
        why_it_is_eligible: localizeAdmissionReasons(official.satisfied_reasons, lang),
        why_it_is_blocked: localizeAdmissionReasons(official.blocked_reasons, lang),
        metrics: [
            {
                label: t(lang, "成功率", "Success"),
                value: `${(metrics.success_rate * 100).toFixed(1)}%`,
                hint: t(lang, `${record.submission.n_runs} 次运行 / ${record.submission.n_tasks} 个任务`, `${record.submission.n_runs} runs / ${record.submission.n_tasks} tasks`),
            },
            {
                label: t(lang, "中位成本", "Median cost"),
                value: `$${metrics.median_cost_usd.toFixed(2)}`,
            },
            {
                label: t(lang, "P95 延迟", "P95 latency"),
                value: `${Math.round(metrics.p95_latency_ms)} ms`,
            },
            {
                label: t(lang, "稳定性", "Stability"),
                value: metrics.stability_score.toFixed(2),
            },
            {
                label: t(lang, "可复现性", "Reproducibility"),
                value: metrics.reproducibility_score.toFixed(2),
            },
        ],
        baseline_panel: [
            {
                label: t(lang, "基线", "Baseline"),
                value: baseline
                    ? `${baseline.submission.harness.label} (${(baseline.submission.metrics.success_rate * 100).toFixed(1)}%)`
                    : "N/A",
            },
            {
                label: t(lang, "相对基线成功率差值", "Δ success vs baseline"),
                value: baselineMetrics
                    ? `${((metrics.success_rate - baselineMetrics.success_rate) * 100).toFixed(1)} pts`
                    : "N/A",
            },
            {
                label: t(lang, "相对基线延迟差值", "Δ latency vs baseline"),
                value: baselineMetrics
                    ? `${Math.round(metrics.p95_latency_ms - baselineMetrics.p95_latency_ms)} ms`
                    : "N/A",
            },
        ],
        badges: [
            {
                label: `trust:${record.verification_record.trust_tier}`,
                tone: record.verification_record.trust_tier === "verified" ? "success" : "warning",
            },
            {
                label: `publication:${record.verification_record.publication_state}`,
                tone: record.verification_record.publication_state === "published" ? "success" : "warning",
            },
            {
                label: `boards:${record.verification_record.board_disposition ?? "active"}`,
                tone: record.verification_record.board_disposition === "active" ? "success" : "warning",
            },
            {
                label: `autonomy:${record.verification_record.autonomy_mode}`,
                tone: record.verification_record.autonomy_mode === "interactive" ? "warning" : "neutral",
            },
            {
                label: `evidence:${record.verification_record.evidence_channel_mode}`,
                tone: "neutral",
            },
        ],
    };
}
function localizedVerificationRecord(verificationRecord, lang) {
    return {
        ...verificationRecord,
        board_admission: {
            official_verified: {
                ...verificationRecord.board_admission.official_verified,
                satisfied_reasons: localizeAdmissionReasons(verificationRecord.board_admission.official_verified.satisfied_reasons, lang),
                blocked_reasons: localizeAdmissionReasons(verificationRecord.board_admission.official_verified.blocked_reasons, lang),
                next_actions: localizeAdmissionReasons(verificationRecord.board_admission.official_verified.next_actions, lang),
            },
            reproducibility_frontier: {
                ...verificationRecord.board_admission.reproducibility_frontier,
                satisfied_reasons: localizeAdmissionReasons(verificationRecord.board_admission.reproducibility_frontier.satisfied_reasons, lang),
                blocked_reasons: localizeAdmissionReasons(verificationRecord.board_admission.reproducibility_frontier.blocked_reasons, lang),
                next_actions: localizeAdmissionReasons(verificationRecord.board_admission.reproducibility_frontier.next_actions, lang),
            },
            community_lab: {
                ...verificationRecord.board_admission.community_lab,
                satisfied_reasons: localizeAdmissionReasons(verificationRecord.board_admission.community_lab.satisfied_reasons, lang),
                blocked_reasons: localizeAdmissionReasons(verificationRecord.board_admission.community_lab.blocked_reasons, lang),
                next_actions: localizeAdmissionReasons(verificationRecord.board_admission.community_lab.next_actions, lang),
            },
        },
        state_summary: verificationRecord.state_summary,
        state_history: verificationRecord.state_history?.map((event) => ({
            ...event,
            summary: localizedStateEventSummary(event, lang),
        })),
        board_disposition: verificationRecord.board_disposition,
    };
}
function publicationPanel(record, lang) {
    return [
        {
            label: t(lang, "publication_state", "publication_state"),
            value: record.verification_record.publication_state,
        },
        {
            label: t(lang, "board_disposition", "board_disposition"),
            value: record.verification_record.board_disposition ?? "active",
        },
        {
            label: t(lang, "state_summary", "state_summary"),
            value: record.verification_record.state_summary ?? t(lang, "暂无。", "N/A"),
        },
    ];
}
function buildResearch(record, lang) {
    const admission = record.verification_record.board_admission;
    const benchmarkHealth = record.submission.benchmark.health;
    const sealedMode = record.verification_record.evidence_channel_mode === "public_plus_sealed";
    const intakeValidation = record.intake_validation;
    const displayVerificationRecord = localizedVerificationRecord(record.verification_record, lang);
    return {
        subject_ref: record.verification_record.subject_ref,
        publication_panel: publicationPanel(record, lang),
        state_history: displayVerificationRecord.state_history?.map((event) => ({
            at: event.at,
            from_state: event.from_state,
            to_state: event.to_state,
            actor: event.actor,
            reason_code: event.reason_code,
            summary: event.summary,
        })) ?? [],
        bindings: [
            { label: "study_id", value: record.submission.study_id },
            { label: "run_group_id", value: record.submission.run_group_id },
            { label: "attempt_id", value: record.submission.attempt_id },
            { label: "bundle_id", value: record.submission.bundle_id },
            { label: "comparison_mode", value: record.submission.comparison_mode },
            { label: "repeatability_class", value: record.submission.repeatability_class },
            { label: "requested_trust_tier", value: record.submission.requested_trust_tier },
        ],
        digests: {
            public_bundle_digest: record.submission.public_bundle_digest,
            sealed_audit_bundle_digest: record.submission.sealed_audit_bundle_digest,
            task_package_digest: record.submission.task_package_digest,
            execution_contract_digest: record.submission.execution_contract_digest,
            tolerance_policy_digest: record.submission.tolerance_policy_digest,
            registration_digest: record.submission.registration_digest,
        },
        admission: [
            {
                board_id: "official-verified",
                title: t(lang, "官方验证榜", "Official Verified Board"),
                eligible: admission.official_verified.eligible,
                satisfied_reasons: localizeAdmissionReasons(admission.official_verified.satisfied_reasons, lang),
                blocked_reasons: localizeAdmissionReasons(admission.official_verified.blocked_reasons, lang),
                next_actions: localizeAdmissionReasons(admission.official_verified.next_actions, lang),
            },
            {
                board_id: "reproducibility-frontier",
                title: t(lang, "可复现实验前沿", "Reproducibility Frontier"),
                eligible: admission.reproducibility_frontier.eligible,
                satisfied_reasons: localizeAdmissionReasons(admission.reproducibility_frontier.satisfied_reasons, lang),
                blocked_reasons: localizeAdmissionReasons(admission.reproducibility_frontier.blocked_reasons, lang),
                next_actions: localizeAdmissionReasons(admission.reproducibility_frontier.next_actions, lang),
            },
            {
                board_id: "community-lab",
                title: t(lang, "社区实验场", "Community Lab"),
                eligible: admission.community_lab.eligible,
                satisfied_reasons: localizeAdmissionReasons(admission.community_lab.satisfied_reasons, lang),
                blocked_reasons: localizeAdmissionReasons(admission.community_lab.blocked_reasons, lang),
                next_actions: localizeAdmissionReasons(admission.community_lab.next_actions, lang),
            },
        ],
        health_panel: [
            { label: "freshness_tier", value: benchmarkHealth.freshness_tier },
            { label: "contamination_tier", value: benchmarkHealth.contamination_tier },
            {
                label: "reporting_completeness",
                value: benchmarkHealth.reporting_completeness,
            },
            {
                label: "health_snapshot_version",
                value: benchmarkHealth.health_snapshot_version,
            },
            {
                label: "last_audit_at",
                value: benchmarkHealth.last_audit_at,
            },
            { label: "visibility_class", value: record.verification_record.visibility_class },
            { label: "release_policy", value: record.verification_record.release_policy },
            {
                label: "evidence_channel_mode",
                value: record.verification_record.evidence_channel_mode,
            },
        ],
        intake_panel: intakeValidation
            ? [
                { label: "source_of_truth_mode", value: intakeValidation.source_of_truth_mode },
                { label: "overall_verdict", value: intakeValidation.overall_verdict },
                { label: "finding_count", value: String(intakeValidation.finding_count) },
                { label: "corrected_fields", value: String(intakeValidation.corrected_fields.length) },
                {
                    label: "validated_public_bundle_digest",
                    value: intakeValidation.validated_public_bundle_digest ?? "N/A",
                },
                {
                    label: "validated_sealed_audit_bundle_digest",
                    value: intakeValidation.validated_sealed_audit_bundle_digest ?? "N/A",
                },
            ]
            : [
                {
                    label: t(lang, "intake_integrity", "intake_integrity"),
                    value: t(lang, "当前条目没有 intake drift 记录。", "No intake drift record is attached to this entry."),
                },
            ],
        correction_log: intakeValidation?.corrections.map((correction) => ({
            field: correction.field,
            reason: correction.reason,
            declared: correction.declared === undefined ? undefined : String(correction.declared),
            corrected: correction.corrected === undefined ? undefined : String(correction.corrected),
        })) ?? [],
        redaction_notes: [
            sealedMode
                ? t(lang, "该结果属于 public_plus_sealed：网页仅展示 public digest / metadata，sealed 原始内容不会出现在公开站点。", "This result is public_plus_sealed: the website only shows public digests and metadata, never sealed raw artifacts.")
                : t(lang, "该结果为 public_only：公开站点仍只展示 protocol-safe 的 metadata 与摘要。", "This result is public_only: the public site still limits itself to protocol-safe metadata and summaries."),
            record.submission.sealed_audit_bundle_digest
                ? t(lang, `sealed_audit_bundle_digest 已登记：${truncateDigest(record.submission.sealed_audit_bundle_digest)}`, `sealed_audit_bundle_digest is registered: ${truncateDigest(record.submission.sealed_audit_bundle_digest)}`)
                : t(lang, "当前无 sealed companion digest；如 benchmark health 需要 sealed evidence，将无法升级到 high-trust。", "There is no sealed companion digest yet; if benchmark health requires sealed evidence, this entry cannot graduate to high trust."),
            t(lang, `release_policy=${record.verification_record.release_policy}，visibility_class=${record.verification_record.visibility_class}。`, `release_policy=${record.verification_record.release_policy}, visibility_class=${record.verification_record.visibility_class}.`),
        ],
        history: record.history,
        notes: [
            `public_bundle_digest: ${truncateDigest(record.submission.public_bundle_digest)}`,
            record.submission.sealed_audit_bundle_digest
                ? `sealed_audit_bundle_digest: ${truncateDigest(record.submission.sealed_audit_bundle_digest)}`
                : "sealed_audit_bundle_digest: N/A",
            `${t(lang, "当前发布状态", "Current publication state")}: ${record.verification_record.publication_state}`,
            `${t(lang, "当前榜单处置", "Current board disposition")}: ${record.verification_record.board_disposition ?? "active"}`,
            t(lang, "公开站点只显示 digest / metadata；sealed 原始内容不进入 Web surface。", "The public site only shows digests and metadata; sealed raw content never enters the web surface."),
        ],
        raw: {
            completeness: record.completeness_proof,
            verification: displayVerificationRecord,
            benchmark_health: benchmarkHealth,
        },
    };
}
export function buildEntryDetailView(entryId, records, lang = DEFAULT_UI_LANGUAGE) {
    const record = records.find((item) => item.entry_id === entryId);
    if (!record) {
        return undefined;
    }
    const baseline = chooseBaseline(records, record);
    return {
        lang,
        entry_id: record.entry_id,
        title: `${record.submission.harness.label} × ${record.submission.model.label}`,
        subtitle: t(lang, `${record.submission.benchmark.id}@${record.submission.benchmark.version} • 赛道 ${record.submission.benchmark.lane_id}`, `${record.submission.benchmark.id}@${record.submission.benchmark.version} • lane ${record.submission.benchmark.lane_id}`),
        summary: {
            trust_tier: record.verification_record.trust_tier,
            publication_state: record.verification_record.publication_state,
            board_disposition: record.verification_record.board_disposition,
            state_summary: record.verification_record.state_summary,
            autonomy_mode: record.verification_record.autonomy_mode,
            evidence_channel_mode: record.verification_record.evidence_channel_mode,
            visibility_class: record.verification_record.visibility_class,
            release_policy: record.verification_record.release_policy,
        },
        scorecard: buildScorecard(record, baseline, lang),
        research: buildResearch(record, lang),
    };
}
//# sourceMappingURL=entries.js.map