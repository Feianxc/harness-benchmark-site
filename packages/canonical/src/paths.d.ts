export declare const BUNDLE_PATHS: {
    readonly manifest: "manifest.json";
    readonly checksums: "checksums.sha256";
    readonly aggregate: "aggregate.json";
    readonly artifact_manifest: "artifact-manifest.json";
    readonly run_group_registration: "run-group-registration.json";
    readonly reports: {
        readonly dir: "reports";
        readonly evaluator_report: "reports/evaluator-report.json";
        readonly completeness_proof: "reports/completeness-proof.json";
        readonly interaction_summary: "reports/interaction-summary.json";
        readonly environment_report: "reports/environment-report.json";
        readonly trace_integrity: "reports/trace-integrity.json";
        readonly verification_record: "reports/verification-record.json";
    };
    readonly traces: {
        readonly dir: "traces";
        readonly trace: "traces/trace.jsonl";
        readonly interaction_log: "traces/interaction-log.jsonl";
        readonly events_dir: "traces/events";
    };
    readonly payloads: {
        readonly dir: "payloads";
        readonly task_results: "payloads/task-results.ndjson";
        readonly root: "payloads";
    };
    readonly sealed: {
        readonly dir: "sealed";
        readonly manifest: "sealed/manifest.json";
        readonly checksums: "sealed/checksums.sha256";
        readonly aggregate: "sealed/aggregate.json";
        readonly artifact_manifest: "sealed/artifact-manifest.json";
        readonly run_group_registration: "sealed/run-group-registration.json";
        readonly reports: {
            readonly dir: "sealed/reports";
            readonly evaluator_report: "sealed/reports/evaluator-report.json";
            readonly completeness_proof: "sealed/reports/completeness-proof.json";
            readonly interaction_summary: "sealed/reports/interaction-summary.json";
            readonly environment_report: "sealed/reports/environment-report.json";
            readonly trace_integrity: "sealed/reports/trace-integrity.json";
            readonly verification_record: "sealed/reports/verification-record.json";
        };
        readonly traces: {
            readonly dir: "sealed/traces";
            readonly trace: "sealed/traces/trace.jsonl";
            readonly interaction_log: "sealed/traces/interaction-log.jsonl";
            readonly events_dir: "sealed/traces/events";
        };
        readonly payloads: {
            readonly dir: "sealed/payloads";
            readonly task_results: "sealed/payloads/task-results.ndjson";
            readonly root: "sealed/payloads";
        };
    };
};
export declare const PUBLIC_CHECKSUM_ORDER: readonly ["manifest.json", "aggregate.json", "artifact-manifest.json", "run-group-registration.json", "reports/completeness-proof.json", "reports/environment-report.json", "reports/evaluator-report.json", "reports/interaction-summary.json", "reports/trace-integrity.json", "traces/interaction-log.jsonl", "traces/trace.jsonl", "payloads/task-results.ndjson"];
export declare const SEALED_CHECKSUM_ORDER: readonly ["sealed/manifest.json", "sealed/aggregate.json", "sealed/artifact-manifest.json", "sealed/run-group-registration.json", "sealed/reports/completeness-proof.json", "sealed/reports/environment-report.json", "sealed/reports/evaluator-report.json", "sealed/reports/interaction-summary.json", "sealed/reports/trace-integrity.json", "sealed/traces/interaction-log.jsonl", "sealed/traces/trace.jsonl", "sealed/payloads/task-results.ndjson"];
export declare function toSealedPath(path: string): string;
//# sourceMappingURL=paths.d.ts.map