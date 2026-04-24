import { createDeterministicId, } from "@ohbp/verifier-core";
import { localizeAdmissionReasons } from "./admission-i18n.js";
import { DEFAULT_UI_LANGUAGE, t } from "./i18n.js";
const WILSON_Z_95 = 1.96;
const MIN_EFFECTIVE_N_FOR_ORDINAL = 30;
const HIGH_CONFIDENCE_MARGIN_PCT = 8;
const MEDIUM_CONFIDENCE_MARGIN_PCT = 15;
function boardMeta(boardId, lang) {
    if (boardId === "official-verified") {
        return {
            title: t(lang, "官方验证榜", "Official Verified Board"),
            subtitle: t(lang, "默认公开结论层；仅展示 verified + published + board-eligible 结果。", "Default public conclusion layer; only shows verified + published + board-eligible results."),
            presentation_mode: "ranking",
            rules: [
                t(lang, "只收 verified + published", "Only accept verified + published entries"),
                t(lang, "health / visibility / release policy 必须与 benchmark health 兼容", "health, visibility, and release policy must stay compatible with benchmark health"),
                t(lang, "每次只显示单一 slice；不同 slice 通过切换器切换", "Show one slice at a time; switch slices explicitly instead of mixing them"),
            ],
        };
    }
    if (boardId === "reproducibility-frontier") {
        return {
            title: t(lang, "可复现实验前沿", "Reproducibility Frontier"),
            subtitle: t(lang, "最接近官方可信结论的候选面；强调缺口与升级路径。", "Closest candidate surface to official conclusions; emphasizes gaps and upgrade paths."),
            presentation_mode: "queue",
            rules: [
                t(lang, "优先显示 reproduced 或 verified-pending 结果", "Prefer reproduced or verified-pending results"),
                t(lang, "明确列出未进入 Official Board 的阻塞原因", "List the blockers that keep an entry out of the Official Board"),
                t(lang, "每次只显示单一 slice；不把不同 comparison mode 混成一张表", "Show one slice at a time; do not mix different comparison modes in one table"),
            ],
        };
    }
    return {
        title: t(lang, "社区实验场", "Community Lab"),
        subtitle: t(lang, "低门槛实验面；默认按最近活动展示，不伪装成官方结论。", "Low-friction experimental surface; shows recent activity without pretending to be official ranking truth."),
        presentation_mode: "feed",
        rules: [
            t(lang, "允许 community / provisional 公开样本", "Allow community / provisional public samples"),
            t(lang, "强调 submission_profile 与升级路径", "Emphasize submission profile and upgrade path"),
            t(lang, "默认展示 digest / metadata，而不是 sealed 原文", "Default to digest / metadata instead of sealed raw artifacts"),
        ],
    };
}
function observedSuccesses(record) {
    const n = Math.max(1, record.submission.n_tasks);
    return Math.min(n, Math.max(0, Math.round(record.submission.metrics.success_rate * n)));
}
function wilsonInterval(successes, total) {
    const n = Math.max(1, total);
    const boundedSuccesses = Math.min(n, Math.max(0, successes));
    const p = boundedSuccesses / n;
    const z2 = WILSON_Z_95 * WILSON_Z_95;
    const denominator = 1 + z2 / n;
    const center = (p + z2 / (2 * n)) / denominator;
    const halfWidth = (WILSON_Z_95 *
        Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) /
        denominator;
    return {
        low: Math.max(0, center - halfWidth),
        high: Math.min(1, center + halfWidth),
        margin: halfWidth,
    };
}
function rankConfidenceLevel(effectiveN, marginPct) {
    if (effectiveN >= MIN_EFFECTIVE_N_FOR_ORDINAL && marginPct <= HIGH_CONFIDENCE_MARGIN_PCT) {
        return "high";
    }
    if (effectiveN >= 10 && marginPct <= MEDIUM_CONFIDENCE_MARGIN_PCT) {
        return "medium";
    }
    return "low";
}
function confidenceInterpretation(confidence, lang) {
    if (confidence === "high") {
        return t(lang, "样本量与区间宽度足以支持较强排序判断。", "Sample size and interval width support a stronger ranking interpretation.");
    }
    if (confidence === "medium") {
        return t(lang, "可以比较方向，但仍建议把相邻条目看成同一档候选。", "The direction is comparable, but adjacent entries should still be treated as a tier.");
    }
    return t(lang, "样本仍少或区间较宽，先看 tier，不要硬读名次。", "The sample is still small or the interval is wide; read the tier first, not a hard rank.");
}
function successUncertainty(record, rankBand, lang) {
    const effectiveN = Math.max(1, record.submission.n_tasks);
    const successes = observedSuccesses(record);
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
function rankingSortKey(record) {
    return wilsonInterval(observedSuccesses(record), Math.max(1, record.submission.n_tasks)).low;
}
function sortRecords(records) {
    return [...records].sort((left, right) => {
        const rightLowerBound = rankingSortKey(right);
        const leftLowerBound = rankingSortKey(left);
        if (rightLowerBound !== leftLowerBound) {
            return rightLowerBound - leftLowerBound;
        }
        if (right.submission.metrics.success_rate !== left.submission.metrics.success_rate) {
            return right.submission.metrics.success_rate - left.submission.metrics.success_rate;
        }
        if (left.submission.metrics.median_cost_usd !== right.submission.metrics.median_cost_usd) {
            return left.submission.metrics.median_cost_usd - right.submission.metrics.median_cost_usd;
        }
        return left.submission.metrics.p95_latency_ms - right.submission.metrics.p95_latency_ms;
    });
}
function rankBandLabel(index, lang) {
    const letter = String.fromCharCode("A".charCodeAt(0) + Math.min(index, 25));
    return t(lang, `置信档 ${letter}`, `Confidence band ${letter}`);
}
function buildRankBandMap(records, lang) {
    const bands = new Map();
    let bandIndex = 0;
    let previousLow = Number.NEGATIVE_INFINITY;
    for (const [index, record] of records.entries()) {
        const interval = wilsonInterval(observedSuccesses(record), Math.max(1, record.submission.n_tasks));
        if (index === 0) {
            previousLow = interval.low;
        }
        else if (previousLow > interval.high) {
            bandIndex += 1;
        }
        bands.set(record.entry_id, rankBandLabel(bandIndex, lang));
        previousLow = interval.low;
    }
    return bands;
}
function ordinalRankAllowed(records) {
    if (records.length < 3) {
        return false;
    }
    if (records.some((record) => record.submission.n_tasks < MIN_EFFECTIVE_N_FOR_ORDINAL)) {
        return false;
    }
    return records.every((record, index) => {
        if (index >= records.length - 1) {
            return true;
        }
        const current = wilsonInterval(observedSuccesses(record), Math.max(1, record.submission.n_tasks));
        const nextRecord = records[index + 1];
        if (!nextRecord) {
            return true;
        }
        const next = wilsonInterval(observedSuccesses(nextRecord), Math.max(1, nextRecord.submission.n_tasks));
        return current.low > next.high;
    });
}
function rankingPolicy(records, rankState, lang) {
    const ordinalAllowed = ordinalRankAllowed(records) && rankState === "ranked_ordinal";
    return {
        method: "wilson_lower_bound_success_rate_v0_3",
        confidence_level: 0.95,
        minimum_effective_n_for_ordinal: MIN_EFFECTIVE_N_FOR_ORDINAL,
        ordinal_rank_allowed: ordinalAllowed,
        separation_rule: t(lang, "只有当相邻条目的 95% Wilson 区间完全分离，且每条有效样本数达到门槛时，才允许硬名次。", "Ordinal ranks are allowed only when adjacent 95% Wilson intervals are fully separated and every entry meets the minimum effective sample threshold."),
        note: t(lang, "排序显示先按 Wilson 下界保守排序；区间重叠时公开成同一置信档，不强行宣称谁更强。", "Display order uses the Wilson lower bound conservatively; overlapping intervals are published as the same confidence band instead of forcing a stronger claim."),
    };
}
function boardEligible(boardId, record) {
    if (boardId === "official-verified") {
        return record.verification_record.board_admission.official_verified.eligible;
    }
    if (boardId === "reproducibility-frontier") {
        return record.verification_record.board_admission.reproducibility_frontier.eligible;
    }
    return record.verification_record.board_admission.community_lab.eligible;
}
function boardAffinity(boardId, record) {
    if (boardId === "official-verified") {
        return record.verification_record.trust_tier === "verified";
    }
    if (boardId === "reproducibility-frontier") {
        return (record.verification_record.trust_tier === "verified" ||
            record.verification_record.trust_tier === "reproduced");
    }
    return (record.verification_record.trust_tier === "community" ||
        record.submission.requested_trust_tier === "community" ||
        record.verification_record.publication_state === "submitted");
}
function pickRecords(boardId, records) {
    return records.filter((record) => boardEligible(boardId, record));
}
function zeroBreakdown() {
    return {
        active_eligible_entries: 0,
        active_blocked_entries: 0,
        suspended_entries: 0,
        historical_entries: 0,
        hidden_entries: 0,
    };
}
function buildStatusBreakdown(boardId, records) {
    return records.reduce((summary, record) => {
        const disposition = record.verification_record.board_disposition ?? "active";
        if (boardEligible(boardId, record)) {
            summary.active_eligible_entries += 1;
            return summary;
        }
        if (disposition === "active") {
            summary.active_blocked_entries += 1;
            return summary;
        }
        if (disposition === "suspended") {
            summary.suspended_entries += 1;
            return summary;
        }
        if (disposition === "historical_only") {
            summary.historical_entries += 1;
            return summary;
        }
        summary.hidden_entries += 1;
        return summary;
    }, zeroBreakdown());
}
function breakdownNote(breakdown, lang) {
    const notes = [];
    if (breakdown.active_blocked_entries > 0) {
        notes.push(t(lang, `${breakdown.active_blocked_entries} 条记录仍在 admission gate 外，说明样本存在但还没达到本板发布门槛。`, `${breakdown.active_blocked_entries} records still sit behind admission gates, so evidence exists but has not yet met this board's publication bar.`));
    }
    if (breakdown.suspended_entries > 0) {
        notes.push(t(lang, `${breakdown.suspended_entries} 条记录因 dispute/correction 被暂停，不会出现在活跃榜单。`, `${breakdown.suspended_entries} records are suspended by dispute/correction governance and stay off active boards.`));
    }
    if (breakdown.historical_entries > 0) {
        notes.push(t(lang, `${breakdown.historical_entries} 条记录只保留历史说明，不再参与当前比较。`, `${breakdown.historical_entries} records remain as historical-only evidence and no longer participate in current comparison.`));
    }
    if (breakdown.hidden_entries > 0) {
        notes.push(t(lang, `${breakdown.hidden_entries} 条记录尚未进入公开发布面。`, `${breakdown.hidden_entries} records have not entered the public release surface yet.`));
    }
    return notes.join(" ");
}
function boardStateFor(boardId, breakdown, lang, activeRecords = []) {
    const activeEligibleCount = breakdown.active_eligible_entries;
    const trackedCount = breakdown.active_eligible_entries +
        breakdown.active_blocked_entries +
        breakdown.suspended_entries +
        breakdown.historical_entries +
        breakdown.hidden_entries;
    const notes = breakdownNote(breakdown, lang);
    if (trackedCount === 0) {
        return {
            state: "warming_up",
            reason: t(lang, "当前 slice 仍在冷启动，还没有形成任何候选记录。", "This slice is still warming up and has not formed any candidate records yet."),
        };
    }
    if (activeEligibleCount === 0) {
        return {
            state: "verification_in_progress",
            reason: t(lang, `当前 slice 有候选记录，但还没有活跃可展示条目。${notes}`, `This slice has candidate records, but no active public entries yet. ${notes}`).trim(),
        };
    }
    if (activeEligibleCount < 2) {
        return {
            state: "insufficient_evidence",
            reason: t(lang, `公开比较至少需要 2 个 eligible entries；当前只展示条目卡与证据摘要。${notes}`, `Public comparison requires at least two eligible entries, so the page currently shows cards and evidence summaries only. ${notes}`),
        };
    }
    if (activeEligibleCount === 2) {
        return {
            state: "comparison_only",
            reason: t(lang, `当前仅支持 head-to-head 比较，不给出虚假的 ordinal rank。${notes}`, `Only head-to-head comparison is supported right now, so no fake ordinal ranking is shown. ${notes}`),
        };
    }
    if (boardId === "official-verified") {
        if (ordinalRankAllowed(activeRecords)) {
            return {
                state: "ranked_ordinal",
                reason: t(lang, `当前 slice 的 active entries 已达到样本门槛，且相邻 95% Wilson 区间完全分离，因此允许展示硬名次。${notes}`, `This slice meets the effective sample threshold and adjacent 95% Wilson intervals are fully separated, so ordinal ranks are allowed. ${notes}`),
            };
        }
        return {
            state: "ranked_tiered",
            reason: t(lang, `在显式 separation evidence 落地前，Official Board 先 fail-closed 到 ranked_tiered。${notes}`, `Until explicit separation evidence exists, the Official Board fail-closes to ranked_tiered. ${notes}`),
        };
    }
    if (boardId === "reproducibility-frontier") {
        return {
            state: "ranked_tiered",
            reason: t(lang, `Frontier 面用于看升级梯度与证据缺口，默认只做 tier/cluster 呈现。${notes}`, `The Frontier surface is for upgrade gradients and evidence gaps, so it defaults to tier/cluster presentation. ${notes}`),
        };
    }
    return {
        state: "ranked_tiered",
        reason: t(lang, `Community 面默认强调趋势与分层，不作为官方权威排名。${notes}`, `The Community surface emphasizes trend and tiering rather than authoritative ranking. ${notes}`),
    };
}
function healthWarning(record, lang) {
    const health = record.submission.benchmark.health;
    if (health.freshness_tier === "fresh" || health.freshness_tier === "active") {
        return t(lang, `${health.freshness_tier} benchmark；公开层需遵守 release/visibility gate。`, `${health.freshness_tier} benchmark; the public surface must obey release and visibility gates.`);
    }
    if (health.contamination_tier === "high") {
        return t(lang, "contamination 风险高，建议优先查看 research view。", "High contamination risk; inspect the research view first.");
    }
    return t(lang, `health snapshot ${health.health_snapshot_version}`, `health snapshot ${health.health_snapshot_version}`);
}
function chooseBaseline(records) {
    return (records.find((record) => record.submission.harness.id.includes("baseline")) ??
        sortRecords(records).at(-1));
}
function clusterLabel(record, lang) {
    if (record.verification_record.trust_tier === "verified") {
        return t(lang, "已验证", "verified");
    }
    if (record.verification_record.trust_tier === "reproduced") {
        return record.verification_record.publication_state === "published"
            ? t(lang, "已复现", "reproduced")
            : t(lang, "接近验证", "near-verified");
    }
    return t(lang, "社区层", "community");
}
function sliceAnchor(record) {
    const mode = record.submission.comparison_mode;
    if (mode === "fixed_model_compare_harness") {
        return `fixed-model:${record.submission.model.id}`;
    }
    if (mode === "fixed_harness_compare_model") {
        return `fixed-harness:${record.submission.harness.id}`;
    }
    return `system:${record.submission.benchmark.id}`;
}
function comparisonModeLabel(mode, lang) {
    if (mode === "fixed_model_compare_harness") {
        return t(lang, "比较 harness", "compare harness");
    }
    if (mode === "fixed_harness_compare_model") {
        return t(lang, "比较模型", "compare model");
    }
    return t(lang, "系统组合", "system combination");
}
function sliceLabel(record, lang) {
    const mode = record.submission.comparison_mode;
    const taskDigest = record.submission.task_package_digest.slice(7, 13);
    const execDigest = record.submission.execution_contract_digest.slice(7, 13);
    const tolDigest = record.submission.tolerance_policy_digest.slice(7, 13);
    if (mode === "fixed_model_compare_harness") {
        return `${record.submission.benchmark.id}@${record.submission.benchmark.version} · ${record.submission.model.label} · ${comparisonModeLabel(mode, lang)} · task ${taskDigest} · exec ${execDigest} · tol ${tolDigest}`;
    }
    if (mode === "fixed_harness_compare_model") {
        return `${record.submission.benchmark.id}@${record.submission.benchmark.version} · ${record.submission.harness.label} · ${comparisonModeLabel(mode, lang)} · task ${taskDigest} · exec ${execDigest} · tol ${tolDigest}`;
    }
    return `${record.submission.benchmark.id}@${record.submission.benchmark.version} · ${sliceAnchor(record)} · ${comparisonModeLabel(mode, lang)} · task ${taskDigest} · exec ${execDigest} · tol ${tolDigest}`;
}
function sliceContextKey(record) {
    return createDeterministicId("slice", {
        benchmark_id: record.submission.benchmark.id,
        benchmark_version: record.submission.benchmark.version,
        lane_id: record.submission.benchmark.lane_id,
        comparison_mode: record.submission.comparison_mode,
        repeatability_class: record.submission.repeatability_class,
        autonomy_mode: record.verification_record.autonomy_mode,
        budget_class: record.submission.budget_class,
        benchmark_tuned_flag: record.submission.benchmark_tuned_flag,
        anchor_ref: sliceAnchor(record),
        task_package_digest: record.submission.task_package_digest,
        execution_contract_digest: record.submission.execution_contract_digest,
        tolerance_policy_digest: record.submission.tolerance_policy_digest,
    });
}
function singleValueOrUndefined(values) {
    if (values.length === 0) {
        return undefined;
    }
    const [first, ...rest] = values;
    return rest.every((value) => value === first) ? first : undefined;
}
function buildSliceGroups(boardId, publications, lang) {
    const grouped = new Map();
    for (const record of sortRecords(publications.filter((item) => boardAffinity(boardId, item)))) {
        const key = sliceContextKey(record);
        const bucket = grouped.get(key) ?? [];
        bucket.push(record);
        grouped.set(key, bucket);
    }
    return [...grouped.entries()]
        .map(([sliceId, records]) => {
        const first = records[0];
        const activeRecords = sortRecords(pickRecords(boardId, records));
        const statusBreakdown = buildStatusBreakdown(boardId, records);
        const state = boardStateFor(boardId, statusBreakdown, lang, activeRecords);
        const summary = {
            slice_id: sliceId,
            label: first ? sliceLabel(first, lang) : sliceId,
            state: state.state,
            state_reason: state.reason,
            entry_count: records.length,
            status_breakdown: statusBreakdown,
            filters: first
                ? {
                    benchmark_id: first.submission.benchmark.id,
                    benchmark_version: first.submission.benchmark.version,
                    lane_id: first.submission.benchmark.lane_id,
                    comparison_mode: first.submission.comparison_mode,
                    repeatability_class: first.submission.repeatability_class,
                    trust_tier: singleValueOrUndefined(records.map((record) => record.verification_record.trust_tier)),
                    autonomy_mode: first.verification_record.autonomy_mode,
                    budget_class: first.submission.budget_class,
                    benchmark_tuned_flag: first.submission.benchmark_tuned_flag,
                    anchor_ref: sliceAnchor(first),
                    task_package_digest: first.submission.task_package_digest,
                    execution_contract_digest: first.submission.execution_contract_digest,
                    tolerance_policy_digest: first.submission.tolerance_policy_digest,
                }
                : {},
        };
        return {
            summary,
            activeRecords,
            records: sortRecords(records),
        };
    })
        .sort((left, right) => {
        if (right.summary.status_breakdown.active_eligible_entries !==
            left.summary.status_breakdown.active_eligible_entries) {
            return (right.summary.status_breakdown.active_eligible_entries -
                left.summary.status_breakdown.active_eligible_entries);
        }
        if (right.records.length !== left.records.length) {
            return right.records.length - left.records.length;
        }
        const leftTop = left.activeRecords[0]?.submission.metrics.success_rate ??
            left.records[0]?.submission.metrics.success_rate ??
            0;
        const rightTop = right.activeRecords[0]?.submission.metrics.success_rate ??
            right.records[0]?.submission.metrics.success_rate ??
            0;
        return rightTop - leftTop;
    });
}
function pickSliceGroup(groups, requestedSliceId) {
    if (requestedSliceId) {
        return groups.find((group) => group.summary.slice_id === requestedSliceId) ?? groups[0];
    }
    return groups[0];
}
function toEntrySummary(record, baseline, rankState, rank, rankBand, boardId, lang) {
    const metrics = record.submission.metrics;
    const baselineMetrics = baseline?.submission.metrics;
    const admission = boardId === "official-verified"
        ? record.verification_record.board_admission.official_verified
        : boardId === "reproducibility-frontier"
            ? record.verification_record.board_admission.reproducibility_frontier
            : record.verification_record.board_admission.community_lab;
    return {
        entry_id: record.entry_id,
        display_name: `${record.submission.harness.label} × ${record.submission.model.label}`,
        slice_label: sliceLabel(record, lang),
        rank: rankState === "ranked_ordinal" ? rank : undefined,
        cluster: rankState !== "ranked_ordinal" ? clusterLabel(record, lang) : undefined,
        model_label: record.submission.model.label,
        harness_label: record.submission.harness.label,
        benchmark_label: `${record.submission.benchmark.id}@${record.submission.benchmark.version}`,
        success_rate_pct: Number((metrics.success_rate * 100).toFixed(1)),
        median_cost_usd: Number(metrics.median_cost_usd.toFixed(2)),
        p95_latency_ms: Math.round(metrics.p95_latency_ms),
        stability_score: Number(metrics.stability_score.toFixed(2)),
        reproducibility_score: Number(metrics.reproducibility_score.toFixed(2)),
        delta_success_vs_baseline_pct: baselineMetrics
            ? Number(((metrics.success_rate - baselineMetrics.success_rate) * 100).toFixed(1))
            : undefined,
        delta_latency_vs_baseline_ms: baselineMetrics
            ? Math.round(metrics.p95_latency_ms - baselineMetrics.p95_latency_ms)
            : undefined,
        n_runs: record.submission.n_runs,
        n_tasks: record.submission.n_tasks,
        support_count: record.submission.support_count,
        rank_uncertainty: successUncertainty(record, rankBand, lang),
        trust_tier: record.verification_record.trust_tier,
        publication_state: record.verification_record.publication_state,
        autonomy_mode: record.verification_record.autonomy_mode,
        evidence_channel_mode: record.verification_record.evidence_channel_mode,
        visibility_class: record.verification_record.visibility_class,
        health_warning: healthWarning(record, lang),
        digests: {
            public_bundle_digest: record.verification_record.public_bundle_digest,
            sealed_audit_bundle_digest: record.verification_record.sealed_audit_bundle_digest,
        },
        admission: {
            ...admission,
            satisfied_reasons: localizeAdmissionReasons(admission.satisfied_reasons, lang),
            blocked_reasons: localizeAdmissionReasons(admission.blocked_reasons, lang),
            next_actions: localizeAdmissionReasons(admission.next_actions, lang),
        },
    };
}
export function listBoardSlices(boardId, publications, lang = DEFAULT_UI_LANGUAGE) {
    return buildSliceGroups(boardId, publications, lang).map((group) => group.summary);
}
export function buildBoardPageView(boardId, publications, requestedSliceId, lang = DEFAULT_UI_LANGUAGE) {
    const meta = boardMeta(boardId, lang);
    const groups = buildSliceGroups(boardId, publications, lang);
    const selected = pickSliceGroup(groups, requestedSliceId);
    const picked = selected?.activeRecords ?? [];
    const tracked = selected?.records ?? [];
    const statusBreakdown = selected?.summary.status_breakdown ?? zeroBreakdown();
    const boardState = selected
        ? {
            state: selected.summary.state,
            reason: selected.summary.state_reason,
        }
        : boardStateFor(boardId, statusBreakdown, lang);
    const baseline = chooseBaseline(picked);
    const first = picked[0] ?? tracked[0];
    const metricRecords = picked.length > 0 ? picked : tracked;
    const rankBands = buildRankBandMap(picked, lang);
    return {
        lang,
        board_id: boardId,
        title: meta.title,
        subtitle: meta.subtitle,
        presentation_mode: meta.presentation_mode,
        board_state: boardState.state,
        state_reason: boardState.reason,
        generated_at: picked[0]?.verification_record.last_audited_at ??
            tracked[0]?.verification_record.last_audited_at ??
            publications[0]?.verification_record.last_audited_at ??
            "2026-04-21T00:00:00.000Z",
        slice: {
            slice_id: selected?.summary.slice_id ??
                createDeterministicId("slice", { boardId, empty: true }),
            label: selected?.summary.label,
            benchmark_id: first?.submission.benchmark.id,
            benchmark_version: first?.submission.benchmark.version,
            lane_id: first?.submission.benchmark.lane_id,
            comparison_mode: first?.submission.comparison_mode,
            repeatability_class: first?.submission.repeatability_class,
            trust_tier: first?.verification_record.trust_tier,
            autonomy_mode: first?.verification_record.autonomy_mode,
            budget_class: first?.submission.budget_class,
            benchmark_tuned_flag: first?.submission.benchmark_tuned_flag,
            anchor_ref: first ? sliceAnchor(first) : undefined,
            task_package_digest: first?.submission.task_package_digest,
            execution_contract_digest: first?.submission.execution_contract_digest,
            tolerance_policy_digest: first?.submission.tolerance_policy_digest,
        },
        available_slices: groups.map((group) => group.summary),
        status_breakdown: statusBreakdown,
        ranking_policy: rankingPolicy(picked, boardState.state, lang),
        stats: {
            total_entries: tracked.length,
            eligible_entries: statusBreakdown.active_eligible_entries,
            average_success_rate_pct: metricRecords.length === 0
                ? 0
                : Number(((metricRecords.reduce((sum, record) => sum + record.submission.metrics.success_rate, 0) /
                    metricRecords.length) *
                    100).toFixed(1)),
            last_audited_at: first?.verification_record.last_audited_at,
        },
        rules: meta.rules,
        entries: picked.map((record, index) => toEntrySummary(record, baseline, boardState.state, index + 1, rankBands.get(record.entry_id) ?? rankBandLabel(0, lang), boardId, lang)),
    };
}
export function buildAllBoardViews(publications, lang = DEFAULT_UI_LANGUAGE) {
    return ["official-verified", "reproducibility-frontier", "community-lab"].map((boardId) => buildBoardPageView(boardId, publications, undefined, lang));
}
export function buildHomePageView(boardViews, lang = DEFAULT_UI_LANGUAGE) {
    return {
        lang,
        hero_title: t(lang, "证据先于宣传，协议先于产品。", "Evidence over claims. Protocol over product."),
        hero_body: t(lang, "OHBP 网站 MVP 只显示 public evidence surface：榜单先给结论，但所有结论都必须一跳追到 verification_record、completeness-proof 与 digest metadata。", "The OHBP web MVP only shows the public evidence surface: boards present conclusions first, but every conclusion must trace back to verification_record, completeness-proof, and digest metadata in one hop."),
        boards: boardViews.map((board) => ({
            board_id: board.board_id,
            title: board.title,
            summary: board.subtitle,
            count: board.entries.length,
            state: board.board_state,
        })),
        lanes: [
            {
                lane_id: "core-lite-v1",
                label: t(lang, "入门赛道", "Onboarding lane"),
                why_it_exists: t(lang, "低门槛跑通协议、upload receipt 与 public evidence surface。", "Low-friction path for exercising the protocol, upload receipt, and public evidence surface end to end."),
            },
            {
                lane_id: "terminal-lite-v1",
                label: t(lang, "标杆赛道", "Prestige lane"),
                why_it_exists: t(lang, "默认承载 Official Verified Board 的高信任比较切片。", "Default home for high-trust comparison slices that can graduate to the Official Verified Board."),
            },
            {
                lane_id: "workflow-clean-v1",
                label: t(lang, "专家赛道", "Expert lane"),
                why_it_exists: t(lang, "保留给更复杂的 workflow / policy 研究，不打散首页叙事。", "Reserved for more complex workflow and policy studies without breaking the homepage story."),
            },
        ],
        protocol_objects: [
            "manifest.json",
            "run-group-registration.json",
            "completeness-proof.json",
            "verification-record.json",
            "board_slice",
        ],
    };
}
//# sourceMappingURL=boards.js.map