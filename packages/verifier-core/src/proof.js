import { BUNDLE_PROTOCOL_VERSION } from "@ohbp/types";
import { createDeterministicId } from "./stable.js";
function slotIds(prefix, count) {
    return Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`);
}
function resolveTierEligibilityEffect(submission, proof) {
    if (proof.completeness_verdict !== "complete") {
        return "blocked";
    }
    if (submission.repeatability_class === "pseudo_repeated" &&
        !submission.provider_release_window) {
        return "blocked";
    }
    if (submission.requested_trust_tier === "verified") {
        const minimumRuns = submission.repeatability_class === "pseudo_repeated" ? 7 : 5;
        if (submission.n_runs < minimumRuns) {
            return "blocked";
        }
    }
    if (submission.requested_trust_tier !== "community" && submission.n_runs < 3) {
        return "blocked";
    }
    return "eligible_for_requested_tier";
}
export function createCompletenessProof(submission) {
    const expected = submission.declared_attempt_total;
    const observed = submission.observed_attempt_total;
    const missingSlots = expected > observed ? slotIds("missing", expected - observed) : [];
    const unexpectedAttempts = observed > expected ? slotIds("unexpected", observed - expected) : [];
    const duplicateAttempts = submission.tags.includes("duplicate")
        ? [createDeterministicId("duplicate", submission.submission_id)]
        : [];
    const replacementAttempts = submission.tags.includes("replacement")
        ? [createDeterministicId("replacement", submission.submission_id)]
        : [];
    let completenessVerdict = "complete";
    if (duplicateAttempts.length > 0) {
        completenessVerdict = "duplicate_conflict";
    }
    else if (missingSlots.length > 0) {
        completenessVerdict = "incomplete";
    }
    else if (unexpectedAttempts.length > 0) {
        completenessVerdict = "overreported";
    }
    const proofBase = {
        protocol_version: BUNDLE_PROTOCOL_VERSION,
        proof_id: createDeterministicId("proof", {
            runGroupId: submission.run_group_id,
            registrationDigest: submission.registration_digest,
            expected,
            observed,
        }),
        run_group_id: submission.run_group_id,
        registration_digest: submission.registration_digest,
        expected_attempt_total: expected,
        observed_attempt_total: observed,
        slot_coverage_rate: expected === 0 ? 0 : observed / expected,
        missing_slots: missingSlots,
        unexpected_attempts: unexpectedAttempts,
        duplicate_attempts: duplicateAttempts,
        replacement_attempts: replacementAttempts,
        task_coverage_summary: {
            declared_task_denominator: submission.n_tasks,
            scorable_task_denominator: submission.n_tasks,
            coverage_rate: 1,
        },
        attempt_terminal_status_histogram: {
            succeeded: observed,
        },
        completeness_verdict: completenessVerdict,
    };
    return {
        ...proofBase,
        tier_eligibility_effect: resolveTierEligibilityEffect(submission, proofBase),
    };
}
//# sourceMappingURL=proof.js.map