import type { AutonomyMode, CompletenessProof, NormalizedSubmission, PublicationGovernanceDirective, VerificationRecord } from "./types.js";
export declare function deriveAutonomyMode(submission: NormalizedSubmission): AutonomyMode;
export declare function createVerificationRecord(submission: NormalizedSubmission, proof: CompletenessProof, options?: {
    governanceDirectives?: PublicationGovernanceDirective[];
}): VerificationRecord;
//# sourceMappingURL=verification.d.ts.map