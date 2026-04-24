import { createCompletenessProof } from "./proof.js";
import { createVerificationRecord } from "./verification.js";
export function createUploadReceipt(submission, bundlePath) {
    const warnings = [];
    if (bundlePath) {
        warnings.push("bundle_path 已接受为 mock source；当前仅存储 public projection 与 digest");
    }
    if (submission.evidence_channel_mode === "public_plus_sealed" && !submission.sealed_audit_bundle_digest) {
        warnings.push("high-trust hidden split 缺 sealed digest，后续无法升入 Verified");
    }
    return {
        receipt_id: `receipt_${submission.submission_id}`,
        submission_id: submission.submission_id,
        received_at: submission.submitted_at,
        requested_trust_tier: submission.requested_trust_tier,
        submission_profile: submission.submission_profile,
        intake_status: warnings.length > 0 ? "accepted_with_warnings" : "accepted",
        storage_refs: {
            submission_store_key: submission.submission_id,
            public_bundle_digest: submission.public_bundle_digest,
        },
        warnings,
        next_actions: [
            "运行 verifier-worker 生成 completeness-proof / verification-record",
            "将 board / entry view-models 提供给 web BFF",
        ],
    };
}
export function createPublicationRecord(submission, uploadReceipt, options) {
    const completenessProof = createCompletenessProof(submission);
    const verificationRecord = createVerificationRecord(submission, completenessProof, {
        governanceDirectives: options?.governanceDirectives,
    });
    const stateHistory = verificationRecord.state_history ?? [];
    return {
        entry_id: submission.entry_id,
        submission,
        upload_receipt: uploadReceipt,
        intake_validation: options?.intakeValidation,
        completeness_proof: completenessProof,
        verification_record: verificationRecord,
        history: [
            {
                at: uploadReceipt.received_at,
                label: "upload_receipt",
                detail: `${uploadReceipt.intake_status} / ${uploadReceipt.submission_profile}`,
            },
            ...(options?.history ?? []),
            ...stateHistory.map((event) => ({
                at: event.at,
                label: `publication_state:${event.to_state}`,
                detail: `${event.actor} / ${event.reason_code} / ${event.summary}`,
            })),
            {
                at: verificationRecord.last_audited_at,
                label: "verification_record",
                detail: verificationRecord.decision_reason_codes.join(", "),
            },
        ],
    };
}
//# sourceMappingURL=publication.js.map