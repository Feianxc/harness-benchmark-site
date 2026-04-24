import { BUNDLE_PROTOCOL_VERSION } from "@ohbp/types";
import { createDeterministicId, sha256Digest } from "./stable.js";
import type {
  AutonomyMode,
  BoardDisposition,
  BenchmarkHealthSnapshot,
  BoardAdmissionDecision,
  InteractionTelemetry,
  CompletenessProof,
  NormalizedSubmission,
  PublicationGovernanceDirective,
  PublicationState,
  PublicationStateEvent,
  ReleasePolicy,
  TrustTier,
  VerificationRecord,
  VisibilityClass,
} from "./types.js";

const SEALED_REQUIRED_SPLITS = new Set(["hidden", "holdout", "rotating"]);
const FRESHNESS_RESTRICTED_TIERS = new Set<BenchmarkHealthSnapshot["freshness_tier"]>([
  "fresh",
  "active",
]);
const HIDDEN_ALLOWED_VISIBILITY = new Set<VisibilityClass>([
  "public_redacted",
  "public_summary",
]);
const PUBLIC_ALLOWED_VISIBILITY = new Set<VisibilityClass>([
  "public_full",
  "public_redacted",
]);
const HIDDEN_ALLOWED_RELEASE_POLICIES = new Set<ReleasePolicy>([
  "delayed_until_date",
  "delayed_until_legacy",
  "summary_only_permanent",
]);
const ACTIVE_BOARD_PUBLICATION_STATES = new Set<PublicationState>([
  "submitted",
  "provisional",
  "published",
]);

const PUBLICATION_STATE_TRANSITIONS: Record<PublicationState, PublicationState[]> = {
  submitted: ["provisional", "published", "rejected"],
  provisional: ["published", "rejected"],
  published: ["disputed", "archived"],
  disputed: ["published", "corrected", "invalidated"],
  corrected: ["published", "invalidated", "archived"],
  invalidated: ["archived"],
  rejected: ["archived"],
  archived: [],
};

export function deriveAutonomyMode(submission: NormalizedSubmission): AutonomyMode {
  const telemetry = submission.telemetry;

  if (!telemetry || !telemetry.interaction_log_complete) {
    return "interactive";
  }

  if (
    telemetry.tty_freeform_input_detected ||
    telemetry.interactive_event_count > 0 ||
    telemetry.manual_command_detected ||
    telemetry.manual_file_write_detected ||
    telemetry.editor_interaction_detected ||
    !telemetry.approval_target_linkage_complete
  ) {
    return "interactive";
  }

  if (
    telemetry.approval_event_count > 0 &&
    telemetry.interactive_event_count === 0 &&
    !telemetry.tty_freeform_input_detected &&
    !telemetry.manual_command_detected &&
    !telemetry.manual_file_write_detected &&
    !telemetry.editor_interaction_detected &&
    telemetry.approval_target_linkage_complete
  ) {
    return "approval_only";
  }

  if (
    telemetry.human_event_count === 0 &&
    telemetry.approval_event_count === 0 &&
    telemetry.interactive_event_count === 0 &&
    !telemetry.tty_freeform_input_detected &&
    !telemetry.manual_command_detected &&
    !telemetry.manual_file_write_detected &&
    !telemetry.editor_interaction_detected &&
    telemetry.tty_input_digest === "ZERO_INPUT_V1"
  ) {
    return "autonomous";
  }

  return "interactive";
}

function isSealedRequired(submission: NormalizedSubmission): boolean {
  return SEALED_REQUIRED_SPLITS.has(submission.benchmark.split);
}

function hasSealedEvidence(submission: NormalizedSubmission): boolean {
  return Boolean(submission.sealed_audit_bundle_digest);
}

function requiresSealedEvidence(submission: NormalizedSubmission): boolean {
  return isSealedRequired(submission) || submission.evidence_channel_mode === "public_plus_sealed";
}

function hasRepeatabilityControls(submission: NormalizedSubmission): boolean {
  if (submission.repeatability_class === "true_seeded") {
    return true;
  }

  return Boolean(
    submission.provider_release_window?.not_before &&
      submission.provider_release_window?.not_after,
  );
}

function deriveGrantedTrustTier(
  submission: NormalizedSubmission,
  proof: CompletenessProof,
): TrustTier {
  if (proof.completeness_verdict !== "complete") {
    return "community";
  }

  if (!hasRepeatabilityControls(submission) && submission.requested_trust_tier !== "community") {
    return "community";
  }

  if (submission.requested_trust_tier === "community") {
    return "community";
  }

  if (submission.requested_trust_tier === "reproduced") {
    return submission.n_runs >= 3 ? "reproduced" : "community";
  }

  const minimumVerifiedRuns = submission.repeatability_class === "pseudo_repeated" ? 7 : 5;
  const sealedSatisfied = !requiresSealedEvidence(submission) || hasSealedEvidence(submission);

  if (submission.n_runs >= minimumVerifiedRuns && sealedSatisfied) {
    return "verified";
  }

  if (submission.n_runs >= 3) {
    return "reproduced";
  }

  return "community";
}

function derivePublicationState(
  submission: NormalizedSubmission,
  trustTier: TrustTier,
  proof: CompletenessProof,
): PublicationState {
  if (trustTier === "verified") {
    return "published";
  }

  if (trustTier === "reproduced") {
    return submission.requested_trust_tier === "verified" ? "provisional" : "published";
  }

  if (proof.completeness_verdict === "complete" && submission.requested_trust_tier !== "community") {
    return "provisional";
  }

  return "submitted";
}

function boardDispositionFor(
  publicationState: PublicationState,
): BoardDisposition {
  if (
    publicationState === "published" ||
    publicationState === "provisional" ||
    publicationState === "submitted"
  ) {
    return "active";
  }

  if (publicationState === "disputed" || publicationState === "corrected") {
    return "suspended";
  }

  if (publicationState === "invalidated" || publicationState === "archived") {
    return "historical_only";
  }

  return "hidden";
}

function systemStateSummary(
  publicationState: PublicationState,
): string {
  if (publicationState === "published") {
    return "系统判定：当前结果满足公开发布条件。";
  }

  if (publicationState === "provisional") {
    return "系统判定：当前结果可公开显示，但仍缺高信任发布条件。";
  }

  if (publicationState === "submitted") {
    return "系统判定：当前结果尚未进入公开发布。";
  }

  if (publicationState === "rejected") {
    return "系统判定：当前结果未通过公开发布门槛。";
  }

  return `系统判定：publication_state = ${publicationState}。`;
}

function validateGovernanceTransition(
  fromState: PublicationState,
  toState: PublicationState,
): void {
  if (fromState === toState) {
    return;
  }

  if (!PUBLICATION_STATE_TRANSITIONS[fromState]?.includes(toState)) {
    throw new Error(`invalid publication_state transition: ${fromState} -> ${toState}`);
  }
}

function selectRelevantGovernanceDirectives(
  submission: NormalizedSubmission,
  directives: PublicationGovernanceDirective[] | undefined,
): PublicationGovernanceDirective[] {
  return (directives ?? []).filter((directive) => {
    if (directive.submission_id && directive.submission_id === submission.submission_id) {
      return true;
    }

    if (directive.entry_id && directive.entry_id === submission.entry_id) {
      return true;
    }

    if (
      directive.public_bundle_digest &&
      directive.public_bundle_digest === submission.public_bundle_digest
    ) {
      return true;
    }

    return false;
  });
}

function applyGovernanceDirectives(
  submission: NormalizedSubmission,
  baseState: PublicationState,
  directives: PublicationGovernanceDirective[] | undefined,
): {
  publicationState: PublicationState;
  boardDisposition: BoardDisposition;
  stateSummary: string;
  stateHistory: PublicationStateEvent[];
  appliedReasonCodes: string[];
} {
  const stateHistory: PublicationStateEvent[] = [
    {
      at: submission.submitted_at,
      to_state: baseState,
      actor: "system",
      reason_code: `auto_state_${baseState}`,
      summary: systemStateSummary(baseState),
    },
  ];
  const applicable = selectRelevantGovernanceDirectives(submission, directives)
    .slice()
    .sort((left, right) => left.at.localeCompare(right.at));
  let publicationState = baseState;
  const appliedReasonCodes: string[] = [];

  for (const directive of applicable) {
    validateGovernanceTransition(publicationState, directive.publication_state);
    stateHistory.push({
      at: directive.at,
      from_state: publicationState,
      to_state: directive.publication_state,
      actor: directive.actor ?? "operator",
      reason_code: directive.reason_code,
      summary: directive.summary,
    });
    publicationState = directive.publication_state;
    appliedReasonCodes.push(`governance_${directive.reason_code}`);
  }

  return {
    publicationState,
    boardDisposition: boardDispositionFor(publicationState),
    stateSummary: stateHistory.at(-1)?.summary ?? systemStateSummary(publicationState),
    stateHistory,
    appliedReasonCodes,
  };
}

function governancePublicationBlocks(
  publicationState: PublicationState,
): string[] {
  if (publicationState === "disputed") {
    return ["publication_state = disputed，活跃榜单已暂停"];
  }

  if (publicationState === "corrected") {
    return ["publication_state = corrected，等待修正结果重新发布"];
  }

  if (publicationState === "invalidated") {
    return ["publication_state = invalidated，结果已失效"];
  }

  if (publicationState === "archived") {
    return ["publication_state = archived，结果仅保留历史页"];
  }

  if (publicationState === "rejected") {
    return ["publication_state = rejected，结果未进入公开发布"];
  }

  return [];
}

function evaluateOfficialPolicyCompatibility(
  submission: NormalizedSubmission,
): { satisfied: string[]; blocked: string[] } {
  const satisfied: string[] = [];
  const blocked: string[] = [];
  const freshness = submission.benchmark.health.freshness_tier;
  const restrictedFreshness = FRESHNESS_RESTRICTED_TIERS.has(freshness);
  const hiddenLikeSplit = isSealedRequired(submission);

  if (submission.visibility_class === "sealed_pending_publication") {
    blocked.push("published 公开结果不能使用 visibility_class = sealed_pending_publication");
  } else {
    satisfied.push(`visibility_class = ${submission.visibility_class}`);
  }

  if (requiresSealedEvidence(submission)) {
    if (hasSealedEvidence(submission)) {
      satisfied.push("sealed digest 已显式提供");
    } else {
      blocked.push("声明 public_plus_sealed 或 hidden split，但缺 sealed_audit_bundle_digest");
    }
  }

  if (!restrictedFreshness) {
    satisfied.push(`benchmark freshness = ${freshness}，不触发最严格的 public surface gate`);
    return { satisfied, blocked };
  }

  if (hiddenLikeSplit) {
    if (submission.evidence_channel_mode === "public_plus_sealed") {
      satisfied.push("hidden/holdout/rotating split 使用 public_plus_sealed");
    } else {
      blocked.push("fresh/active hidden split 必须使用 evidence_channel_mode = public_plus_sealed");
    }

    if (HIDDEN_ALLOWED_VISIBILITY.has(submission.visibility_class)) {
      satisfied.push("visibility_class 与 hidden split 健康策略兼容");
    } else {
      blocked.push("fresh/active hidden split 只允许 public_redacted 或 public_summary");
    }

    if (HIDDEN_ALLOWED_RELEASE_POLICIES.has(submission.release_policy)) {
      satisfied.push("release_policy 与 hidden split 健康策略兼容");
    } else {
      blocked.push("fresh/active hidden split 不允许 public_immediate；需 delayed 或 summary-only");
    }
  } else {
    if (PUBLIC_ALLOWED_VISIBILITY.has(submission.visibility_class)) {
      satisfied.push("public split 的 visibility_class 兼容官方 public surface");
    } else {
      blocked.push("fresh/active public split 只允许 public_full 或 public_redacted");
    }
  }

  return { satisfied, blocked };
}

function boardDecision(
  eligible: boolean,
  satisfied: string[],
  blocked: string[],
  nextActions: string[],
): BoardAdmissionDecision {
  return {
    eligible,
    satisfied_reasons: satisfied,
    blocked_reasons: blocked,
    next_actions: nextActions,
  };
}

function buildBoardAdmission(
  submission: NormalizedSubmission,
  proof: CompletenessProof,
  trustTier: TrustTier,
  publicationState: PublicationState,
  autonomyMode: AutonomyMode,
) {
  const governanceBlocks = governancePublicationBlocks(publicationState);
  if (!ACTIVE_BOARD_PUBLICATION_STATES.has(publicationState)) {
    return {
      official_verified: boardDecision(false, [], governanceBlocks, governanceBlocks),
      reproducibility_frontier: boardDecision(false, [], governanceBlocks, governanceBlocks),
      community_lab: boardDecision(false, [], governanceBlocks, governanceBlocks),
    };
  }

  const officialSatisfied: string[] = [];
  const officialBlocked: string[] = [];
  const officialPolicy = evaluateOfficialPolicyCompatibility(submission);

  if (proof.completeness_verdict === "complete") {
    officialSatisfied.push("completeness-proof = complete");
  } else {
    officialBlocked.push("completeness-proof 未 complete");
  }

  if (trustTier === "verified") {
    officialSatisfied.push("trust_tier = verified");
  } else {
    officialBlocked.push("trust_tier 未达到 verified");
  }

  if (publicationState === "published") {
    officialSatisfied.push("publication_state = published");
  } else {
    officialBlocked.push("publication_state 未进入 published");
  }

  officialSatisfied.push(...officialPolicy.satisfied);
  officialBlocked.push(...officialPolicy.blocked);

  const officialEligible = officialBlocked.length === 0;

  const frontierSatisfied: string[] = [];
  const frontierBlocked: string[] = [];
  if (proof.completeness_verdict === "complete") {
    frontierSatisfied.push("run-group 完整披露");
  } else {
    frontierBlocked.push("run-group 尚未完整披露");
  }

  if (trustTier === "verified" || trustTier === "reproduced") {
    frontierSatisfied.push(`当前 trust_tier = ${trustTier}`);
  } else {
    frontierBlocked.push("trust_tier 仍停留在 community");
  }

  if (submission.requested_trust_tier === "verified" && trustTier !== "verified") {
    frontierBlocked.push("尚缺平台官方复跑或 Verified 最低 run 门槛");
  }

  if (requiresSealedEvidence(submission) && !hasSealedEvidence(submission)) {
    frontierBlocked.push("缺 sealed digest，无法继续推进 high-trust 审计队列");
  }

  if (autonomyMode === "interactive") {
    frontierBlocked.push("autonomy_mode 已降级为 interactive");
  } else {
    frontierSatisfied.push(`autonomy_mode = ${autonomyMode}`);
  }

  const frontierEligible =
    !officialEligible &&
    proof.completeness_verdict === "complete" &&
    (trustTier === "verified" || trustTier === "reproduced");

  const communitySatisfied: string[] = [
    "允许公开显示 digest / metadata",
    "不暴露 sealed 原始内容",
  ];
  const communityBlocked: string[] = [];

  if (trustTier === "community") {
    communitySatisfied.push("当前为 community 层");
  }

  const communityEligible =
    !officialEligible &&
    !frontierEligible &&
    (trustTier === "community" || publicationState === "submitted");

  return {
    official_verified: boardDecision(officialEligible, officialSatisfied, officialBlocked, officialBlocked),
    reproducibility_frontier: boardDecision(
      frontierEligible,
      frontierSatisfied,
      frontierBlocked,
      frontierBlocked.length > 0 ? frontierBlocked : ["等待平台队列推进"],
    ),
    community_lab: boardDecision(
      communityEligible && !officialEligible,
      communitySatisfied,
      communityBlocked,
      ["补 registration/completeness 后可升级到 reproducible_standard"],
    ),
  };
}

function buildInteractionSummaryDigest(
  telemetry: InteractionTelemetry | undefined,
  autonomyMode: AutonomyMode,
): string | undefined {
  if (!telemetry) {
    return undefined;
  }

  return sha256Digest({
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    human_event_count: telemetry.human_event_count,
    approval_event_count: telemetry.approval_event_count,
    interactive_event_count: telemetry.interactive_event_count,
    tty_freeform_input_detected: telemetry.tty_freeform_input_detected,
    manual_command_detected: telemetry.manual_command_detected,
    manual_file_write_detected: telemetry.manual_file_write_detected,
    editor_interaction_detected: telemetry.editor_interaction_detected,
    tty_input_digest: telemetry.tty_input_digest,
    approval_target_linkage_complete: telemetry.approval_target_linkage_complete,
    interaction_log_complete: telemetry.interaction_log_complete,
    classification_verdict: autonomyMode,
  });
}

export function createVerificationRecord(
  submission: NormalizedSubmission,
  proof: CompletenessProof,
  options?: {
    governanceDirectives?: PublicationGovernanceDirective[];
  },
): VerificationRecord {
  const trustTier = deriveGrantedTrustTier(submission, proof);
  const basePublicationState = derivePublicationState(submission, trustTier, proof);
  const autonomyMode = deriveAutonomyMode(submission);
  const governance = applyGovernanceDirectives(
    submission,
    basePublicationState,
    options?.governanceDirectives,
  );
  const boardAdmission = buildBoardAdmission(
    submission,
    proof,
    trustTier,
    governance.publicationState,
    autonomyMode,
  );

  const decisionReasonCodes = [
    `completeness_${proof.completeness_verdict}`,
    `trust_${trustTier}`,
    `publication_${governance.publicationState}`,
    `autonomy_${autonomyMode}`,
    `board_disposition_${governance.boardDisposition}`,
  ];

  if (submission.requested_trust_tier === "verified" && trustTier !== "verified") {
    decisionReasonCodes.push("verified_promotion_pending");
  }

  if (requiresSealedEvidence(submission)) {
    decisionReasonCodes.push("sealed_evidence_required_for_hidden_split");
  }

  const officialPolicy = evaluateOfficialPolicyCompatibility(submission);
  if (officialPolicy.blocked.length > 0) {
    decisionReasonCodes.push("official_policy_gate_blocked");
  }

  decisionReasonCodes.push(...governance.appliedReasonCodes);

  return {
    protocol_version: BUNDLE_PROTOCOL_VERSION,
    verification_record_id: createDeterministicId("verify", {
      submission: submission.submission_id,
      proof: proof.proof_id,
      trustTier,
      publicationState: governance.publicationState,
    }),
    subject_ref: {
      subject_type: "attempt_bundle",
      study_id: submission.study_id,
      run_group_id: submission.run_group_id,
      attempt_id: submission.attempt_id,
      bundle_id: submission.bundle_id,
    },
    subject_bundle_digest: submission.public_bundle_digest,
    requested_trust_tier: submission.requested_trust_tier,
    trust_tier: trustTier,
    publication_state: governance.publicationState,
    board_disposition: governance.boardDisposition,
    state_summary: governance.stateSummary,
    state_history: governance.stateHistory,
    autonomy_mode: autonomyMode,
    evidence_channel_mode: submission.evidence_channel_mode,
    visibility_class: submission.visibility_class,
    release_policy: submission.release_policy,
    comparison_mode: submission.comparison_mode,
    public_bundle_digest: submission.public_bundle_digest,
    sealed_audit_bundle_digest: submission.sealed_audit_bundle_digest,
    completeness_verdict: proof.completeness_verdict,
    interaction_summary_digest: buildInteractionSummaryDigest(
      submission.telemetry,
      autonomyMode,
    ),
    last_audited_at: submission.submitted_at,
    decision_reason_codes: decisionReasonCodes,
    board_admission: boardAdmission,
  };
}
