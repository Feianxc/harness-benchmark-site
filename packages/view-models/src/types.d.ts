import type { AutonomyMode, BoardId, BudgetClass, ComparisonMode, EvidenceChannelMode, PublicationRecord, PublicationState, RepeatabilityClass, TrustTier, VisibilityClass } from "@ohbp/verifier-core";
import type { UiLanguage } from "./i18n.js";
export type RankState = "warming_up" | "verification_in_progress" | "insufficient_evidence" | "comparison_only" | "ranked_tiered" | "ranked_ordinal";
export type RankConfidenceLevel = "low" | "medium" | "high";
export interface SuccessRateUncertaintyView {
    method: "wilson_score_95";
    confidence_level: 0.95;
    effective_n: number;
    observed_successes: number;
    ci_low_pct: number;
    ci_high_pct: number;
    margin_pct: number;
    rank_band: string;
    rank_confidence: RankConfidenceLevel;
    interpretation: string;
}
export interface BoardEntrySummaryView {
    entry_id: string;
    display_name: string;
    slice_label: string;
    rank?: number;
    cluster?: string;
    model_label: string;
    harness_label: string;
    benchmark_label: string;
    success_rate_pct: number;
    median_cost_usd: number;
    p95_latency_ms: number;
    stability_score: number;
    reproducibility_score: number;
    delta_success_vs_baseline_pct?: number;
    delta_latency_vs_baseline_ms?: number;
    n_runs: number;
    n_tasks: number;
    support_count: number;
    rank_uncertainty?: SuccessRateUncertaintyView;
    trust_tier: TrustTier;
    publication_state: PublicationState;
    autonomy_mode: AutonomyMode;
    evidence_channel_mode: EvidenceChannelMode;
    visibility_class: VisibilityClass;
    health_warning: string;
    digests: {
        public_bundle_digest: string;
        sealed_audit_bundle_digest?: string;
    };
    admission: {
        eligible: boolean;
        satisfied_reasons: string[];
        blocked_reasons: string[];
        next_actions: string[];
    };
}
export interface DataProvenanceNote {
    mode: "runtime_public_only" | "runtime_public_plus_demo_fallback";
    title: string;
    body: string;
}
export interface BoardStatusBreakdownView {
    active_eligible_entries: number;
    active_blocked_entries: number;
    suspended_entries: number;
    historical_entries: number;
    hidden_entries: number;
}
export interface BoardRankingPolicyView {
    method: "wilson_lower_bound_success_rate_v0_3";
    confidence_level: 0.95;
    minimum_effective_n_for_ordinal: number;
    ordinal_rank_allowed: boolean;
    separation_rule: string;
    note: string;
}
export interface BoardSliceSummaryView {
    slice_id: string;
    label: string;
    state: RankState;
    state_reason: string;
    entry_count: number;
    status_breakdown: BoardStatusBreakdownView;
    filters: {
        benchmark_id?: string;
        benchmark_version?: string;
        lane_id?: string;
        comparison_mode?: ComparisonMode;
        repeatability_class?: RepeatabilityClass;
        trust_tier?: TrustTier;
        autonomy_mode?: AutonomyMode;
        budget_class?: BudgetClass;
        benchmark_tuned_flag?: boolean;
        anchor_ref?: string;
        task_package_digest?: string;
        execution_contract_digest?: string;
        tolerance_policy_digest?: string;
    };
}
export interface BoardPageView {
    lang: UiLanguage;
    board_id: BoardId;
    title: string;
    subtitle: string;
    presentation_mode: "ranking" | "queue" | "feed";
    board_state: RankState;
    state_reason: string;
    generated_at: string;
    slice: {
        slice_id: string;
        label?: string;
        benchmark_id?: string;
        benchmark_version?: string;
        lane_id?: string;
        comparison_mode?: ComparisonMode;
        repeatability_class?: RepeatabilityClass;
        trust_tier?: TrustTier;
        autonomy_mode?: AutonomyMode;
        budget_class?: BudgetClass;
        benchmark_tuned_flag?: boolean;
        anchor_ref?: string;
        task_package_digest?: string;
        execution_contract_digest?: string;
        tolerance_policy_digest?: string;
    };
    available_slices: BoardSliceSummaryView[];
    status_breakdown: BoardStatusBreakdownView;
    ranking_policy?: BoardRankingPolicyView;
    stats: {
        total_entries: number;
        eligible_entries: number;
        average_success_rate_pct: number;
        last_audited_at?: string;
    };
    rules: string[];
    entries: BoardEntrySummaryView[];
    data_provenance?: DataProvenanceNote;
}
export interface EntryScorecardView {
    verdict: string;
    why_it_is_eligible: string[];
    why_it_is_blocked: string[];
    metrics: Array<{
        label: string;
        value: string;
        hint?: string;
    }>;
    baseline_panel: Array<{
        label: string;
        value: string;
    }>;
    badges: Array<{
        label: string;
        tone: "neutral" | "success" | "warning";
    }>;
}
export interface EntryResearchView {
    subject_ref: PublicationRecord["verification_record"]["subject_ref"];
    publication_panel: Array<{
        label: string;
        value: string;
    }>;
    state_history: Array<{
        at: string;
        from_state?: PublicationRecord["verification_record"]["publication_state"];
        to_state: PublicationRecord["verification_record"]["publication_state"];
        actor: string;
        reason_code: string;
        summary: string;
    }>;
    bindings: Array<{
        label: string;
        value: string;
    }>;
    digests: {
        public_bundle_digest: string;
        sealed_audit_bundle_digest?: string;
        task_package_digest: string;
        execution_contract_digest: string;
        tolerance_policy_digest: string;
        registration_digest: string;
    };
    admission: Array<{
        board_id: BoardId;
        title: string;
        eligible: boolean;
        satisfied_reasons: string[];
        blocked_reasons: string[];
        next_actions: string[];
    }>;
    health_panel: Array<{
        label: string;
        value: string;
    }>;
    intake_panel: Array<{
        label: string;
        value: string;
    }>;
    correction_log: Array<{
        field: string;
        reason: string;
        declared?: string;
        corrected?: string;
    }>;
    redaction_notes: string[];
    history: PublicationRecord["history"];
    notes: string[];
    raw: {
        completeness: PublicationRecord["completeness_proof"];
        verification: PublicationRecord["verification_record"];
        benchmark_health: PublicationRecord["submission"]["benchmark"]["health"];
    };
}
export interface EntryDetailView {
    lang: UiLanguage;
    entry_id: string;
    title: string;
    subtitle: string;
    summary: {
        trust_tier: TrustTier;
        publication_state: PublicationState;
        board_disposition?: PublicationRecord["verification_record"]["board_disposition"];
        state_summary?: string;
        autonomy_mode: AutonomyMode;
        evidence_channel_mode: EvidenceChannelMode;
        visibility_class: VisibilityClass;
        release_policy: PublicationRecord["submission"]["release_policy"];
    };
    scorecard: EntryScorecardView;
    research: EntryResearchView;
    data_provenance?: DataProvenanceNote;
}
export interface ProtocolFieldGlossaryEntry {
    field: string;
    value_domain: string;
    owner: string;
    used_by: string[];
    common_misuse: string;
}
export interface ProtocolObjectEntry {
    id: string;
    title: string;
    summary: string;
    used_for: string[];
}
export interface ProtocolIndexView {
    lang: UiLanguage;
    version: string;
    objects: ProtocolObjectEntry[];
    fields: ProtocolFieldGlossaryEntry[];
}
export interface ProtocolPageView {
    lang: UiLanguage;
    version: string;
    intro: string;
    query?: string;
    search_summary?: string;
    sections: Array<{
        id: string;
        title: string;
        summary: string;
        bullets: string[];
    }>;
    object_map: Array<{
        id: string;
        title: string;
        summary: string;
        used_for: string[];
        depends_on: string[];
        links: Array<{
            label: string;
            href: string;
        }>;
    }>;
    implementation_links: Array<{
        label: string;
        href: string;
        description: string;
    }>;
    glossary: ProtocolFieldGlossaryEntry[];
}
export type ValidatorMode = "schema_only" | "bundle_integrity" | "admission_readiness";
export interface ValidatorIssueView {
    code: string;
    severity: "error" | "warning" | "info";
    path: string;
    message: string;
    suggestion: string;
}
export interface ValidatorRunView {
    lang: UiLanguage;
    mode: ValidatorMode;
    status: "pass" | "warn" | "fail";
    summary: string;
    issues: ValidatorIssueView[];
    category_breakdown: Array<{
        category: string;
        count: number;
    }>;
    next_steps: string[];
    normalized_preview?: Record<string, unknown>;
}
export interface HomePageView {
    lang: UiLanguage;
    hero_title: string;
    hero_body: string;
    boards: Array<{
        board_id: BoardId;
        title: string;
        summary: string;
        count: number;
        state: RankState;
    }>;
    lanes: Array<{
        lane_id: string;
        label: string;
        why_it_exists: string;
    }>;
    protocol_objects: string[];
    data_provenance?: DataProvenanceNote;
}
export type HostId = "general" | "claude-code" | "codex" | "opencode";
export type HarnessId = "gsd" | "gstack" | "speckit" | "openspec" | "superpowers" | "bmad-method";
export type CompareDimensionId = "new_project" | "existing_repo" | "long_task" | "setup_speed" | "multi_agent" | "context_control" | "claude_fit" | "codex_fit" | "opencode_fit";
export type LeaderboardMetricId = "overall" | "host_fit" | "specification" | "planning" | "execution" | "context" | "setup";
export interface ConsumerProvenanceNote {
    mode: "curated_host_fit_demo";
    title: string;
    body: string;
}
export type ConsumerScoreLevel = "very_high" | "high" | "medium" | "low";
export interface HostOptionView {
    host_id: HostId;
    badge_label: string;
    title: string;
    summary: string;
    recommended_for: string;
    default_pick_harness_id: HarnessId;
    default_pick_label: string;
    default_pick_reason: string;
    backup_pick_harness_id: HarnessId;
    backup_pick_label: string;
    backup_pick_reason: string;
    backup_pick_href: string;
    score: number;
    level: ConsumerScoreLevel;
    level_label: string;
    default_pick_score: number;
    host_fit_score: number;
    new_project_score: number;
    existing_repo_score: number;
    long_task_score: number;
    setup_score: number;
    multi_agent_score: number;
    href: string;
}
export interface QuickPickView {
    title: string;
    harness_label: string;
    reason: string;
    href: string;
}
export interface RankingEvidenceMetaView {
    why_this_rank: string;
    confidence_label: string;
    evidence_strength: string;
    updated_at: string;
}
export interface CompareFrameworkView {
    harness_id: HarnessId;
    label: string;
    tagline: string;
    best_for: string;
}
export interface CompareDimensionValueView {
    harness_id: HarnessId;
    score: number;
    level: ConsumerScoreLevel;
    level_label: string;
    value: string;
    summary: string;
}
export interface CompareDimensionView {
    id: CompareDimensionId;
    dimension: string;
    short_label: string;
    description: string;
    values: CompareDimensionValueView[];
}
export interface ConsumerHomePageView {
    lang: UiLanguage;
    hero_title: string;
    hero_body: string;
    host_options: HostOptionView[];
    quick_picks: QuickPickView[];
    compare_preview: {
        title: string;
        summary: string;
        frameworks: CompareFrameworkView[];
        dimensions: CompareDimensionView[];
    };
    evidence_bridge: Array<{
        title: string;
        description: string;
        href: string;
        cta: string;
    }>;
    methodology_note: ConsumerProvenanceNote;
}
export interface HostLeaderboardTopCardView extends RankingEvidenceMetaView {
    title: string;
    harness_id: HarnessId;
    harness_label: string;
    source_rank: number;
    score: number;
    level: ConsumerScoreLevel;
    level_label: string;
    summary: string;
    reason: string;
    href: string;
    evidence_href: string;
    evidence_cta: string;
    basis_metric_ids: LeaderboardMetricId[];
}
export interface HostLeaderboardRowView extends RankingEvidenceMetaView {
    rank: number;
    harness_id: HarnessId;
    harness_label: string;
    tagline: string;
    overall_score: number;
    host_fit_score: number;
    specification_score: number;
    planning_score: number;
    execution_score: number;
    context_score: number;
    setup_score: number;
    new_project_score: number;
    existing_repo_score: number;
    long_task_score: number;
    multi_agent_score: number;
    best_for: string;
    watch_outs: string;
    evidence_label: string;
    scenario_tags: string[];
    evidence_cta: string;
    evidence_href: string;
    basis_metric_ids: LeaderboardMetricId[];
}
export interface HostLeaderboardPageView {
    lang: UiLanguage;
    host_id: HostId;
    title: string;
    subtitle: string;
    hero_title: string;
    hero_body: string;
    host_options: HostOptionView[];
    top_cards: HostLeaderboardTopCardView[];
    table_intro: string;
    rows: HostLeaderboardRowView[];
    scenario_pills: string[];
    explanation_blocks: Array<{
        title: string;
        body: string;
    }>;
    methodology_note: ConsumerProvenanceNote;
}
export interface HarnessComparePageView {
    lang: UiLanguage;
    title: string;
    subtitle: string;
    intro: string;
    host_options: HostOptionView[];
    frameworks: CompareFrameworkView[];
    dimensions: CompareDimensionView[];
    notes: string[];
    methodology_note: ConsumerProvenanceNote;
}
//# sourceMappingURL=types.d.ts.map