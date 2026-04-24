export const BUNDLE_PATHS = {
    manifest: "manifest.json",
    checksums: "checksums.sha256",
    aggregate: "aggregate.json",
    artifact_manifest: "artifact-manifest.json",
    run_group_registration: "run-group-registration.json",
    reports: {
        dir: "reports",
        evaluator_report: "reports/evaluator-report.json",
        completeness_proof: "reports/completeness-proof.json",
        interaction_summary: "reports/interaction-summary.json",
        environment_report: "reports/environment-report.json",
        trace_integrity: "reports/trace-integrity.json",
        verification_record: "reports/verification-record.json",
    },
    traces: {
        dir: "traces",
        trace: "traces/trace.jsonl",
        interaction_log: "traces/interaction-log.jsonl",
        events_dir: "traces/events",
    },
    payloads: {
        dir: "payloads",
        task_results: "payloads/task-results.ndjson",
        root: "payloads",
    },
    sealed: {
        dir: "sealed",
        manifest: "sealed/manifest.json",
        checksums: "sealed/checksums.sha256",
        aggregate: "sealed/aggregate.json",
        artifact_manifest: "sealed/artifact-manifest.json",
        run_group_registration: "sealed/run-group-registration.json",
        reports: {
            dir: "sealed/reports",
            evaluator_report: "sealed/reports/evaluator-report.json",
            completeness_proof: "sealed/reports/completeness-proof.json",
            interaction_summary: "sealed/reports/interaction-summary.json",
            environment_report: "sealed/reports/environment-report.json",
            trace_integrity: "sealed/reports/trace-integrity.json",
            verification_record: "sealed/reports/verification-record.json",
        },
        traces: {
            dir: "sealed/traces",
            trace: "sealed/traces/trace.jsonl",
            interaction_log: "sealed/traces/interaction-log.jsonl",
            events_dir: "sealed/traces/events",
        },
        payloads: {
            dir: "sealed/payloads",
            task_results: "sealed/payloads/task-results.ndjson",
            root: "sealed/payloads",
        },
    },
};
export const PUBLIC_CHECKSUM_ORDER = [
    BUNDLE_PATHS.manifest,
    BUNDLE_PATHS.aggregate,
    BUNDLE_PATHS.artifact_manifest,
    BUNDLE_PATHS.run_group_registration,
    BUNDLE_PATHS.reports.completeness_proof,
    BUNDLE_PATHS.reports.environment_report,
    BUNDLE_PATHS.reports.evaluator_report,
    BUNDLE_PATHS.reports.interaction_summary,
    BUNDLE_PATHS.reports.trace_integrity,
    BUNDLE_PATHS.traces.interaction_log,
    BUNDLE_PATHS.traces.trace,
    BUNDLE_PATHS.payloads.task_results,
];
export const SEALED_CHECKSUM_ORDER = [
    BUNDLE_PATHS.sealed.manifest,
    BUNDLE_PATHS.sealed.aggregate,
    BUNDLE_PATHS.sealed.artifact_manifest,
    BUNDLE_PATHS.sealed.run_group_registration,
    BUNDLE_PATHS.sealed.reports.completeness_proof,
    BUNDLE_PATHS.sealed.reports.environment_report,
    BUNDLE_PATHS.sealed.reports.evaluator_report,
    BUNDLE_PATHS.sealed.reports.interaction_summary,
    BUNDLE_PATHS.sealed.reports.trace_integrity,
    BUNDLE_PATHS.sealed.traces.interaction_log,
    BUNDLE_PATHS.sealed.traces.trace,
    BUNDLE_PATHS.sealed.payloads.task_results,
];
export function toSealedPath(path) {
    return path.startsWith(`${BUNDLE_PATHS.sealed.dir}/`) ? path : `${BUNDLE_PATHS.sealed.dir}/${path}`;
}
//# sourceMappingURL=paths.js.map