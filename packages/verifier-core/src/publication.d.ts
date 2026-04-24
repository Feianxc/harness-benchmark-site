import type { NormalizedSubmission, PublicationRecord, StoredSubmissionRecord, UploadReceipt } from "./types.js";
export declare function createUploadReceipt(submission: NormalizedSubmission, bundlePath?: string): UploadReceipt;
export declare function createPublicationRecord(submission: NormalizedSubmission, uploadReceipt: UploadReceipt, options?: {
    intakeValidation?: StoredSubmissionRecord["validation_summary"];
    history?: PublicationRecord["history"];
    governanceDirectives?: StoredSubmissionRecord["governance_directives"];
}): PublicationRecord;
//# sourceMappingURL=publication.d.ts.map