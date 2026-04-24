import type { MockSubmissionPayload, MockUploadInput, NormalizedSubmission } from "./types.js";
export declare function loadUploadPayload(input: MockUploadInput): Promise<{
    payload: MockSubmissionPayload;
    bundlePath?: string;
}>;
export declare function normalizeIncomingSubmission(input: MockUploadInput): Promise<{
    normalized: NormalizedSubmission;
    bundlePath?: string;
}>;
export declare function previewNormalizedPayload(payload: MockSubmissionPayload): Omit<NormalizedSubmission, "submission_id" | "study_id" | "run_group_id" | "attempt_id" | "bundle_id" | "entry_id"> & {
    preview_identity_hash: string;
};
//# sourceMappingURL=normalize.d.ts.map