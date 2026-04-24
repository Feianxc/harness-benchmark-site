import { t, type UiLanguage, type ValidatorMode } from "@ohbp/view-models";

export interface ValidatorSampleCase {
  id: string;
  title: string;
  description: string;
  recommended_mode: ValidatorMode;
  payload: string;
}

const SAMPLE_CASES: Array<
  Omit<ValidatorSampleCase, "title" | "description"> & {
    title_zh: string;
    title_en: string;
    description_zh: string;
    description_en: string;
  }
> = [
  {
    id: "admission-fail",
    title_zh: "带策略缺口的 Verified 候选",
    title_en: "Verified candidate with policy gaps",
    description_zh: "演示 hidden benchmark + verified 申请时，visibility / release / sealed evidence 的阻塞项。",
    description_en: "Shows the blockers around visibility / release / sealed evidence for a hidden benchmark + verified request.",
    recommended_mode: "admission_readiness",
    payload: JSON.stringify(
      {
        requested_trust_tier: "verified",
        benchmark: {
          id: "terminal-lite",
          version: "v1",
          lane_id: "terminal-lite-v1",
          split: "hidden",
          health: {
            freshness_tier: "active",
            contamination_tier: "low",
            reporting_completeness: "high",
            last_audit_at: "2026-04-20T00:00:00.000Z",
            health_snapshot_version: "terminal-health-v1",
          },
        },
        model: { id: "gpt-5.1", label: "GPT-5.1" },
        harness: { id: "orbit-agent", label: "Orbit Agent" },
        n_runs: 4,
        n_tasks: 42,
        evidence_channel_mode: "public_plus_sealed",
        visibility_class: "public_full",
        release_policy: "public_immediate",
        declared_autonomy_mode: "autonomous",
      },
      null,
      2,
    ),
  },
  {
    id: "integrity-warn",
    title_zh: "Bundle integrity 警告样例",
    title_en: "Bundle integrity warning",
    description_zh: "演示 registration_digest / public_bundle_digest 未规范化时的 binding 风险。",
    description_en: "Shows binding risk when registration_digest / public_bundle_digest are not normalized.",
    recommended_mode: "bundle_integrity",
    payload: JSON.stringify(
      {
        requested_trust_tier: "reproduced",
        benchmark: {
          id: "terminal-lite",
          version: "v1",
          lane_id: "terminal-lite-v1",
        },
        model: { id: "gpt-5.1-mini", label: "GPT-5.1 mini" },
        harness: { id: "baseline-agent", label: "Baseline Agent" },
        public_bundle_digest: "abc123",
        n_runs: 3,
        n_tasks: 18,
      },
      null,
      2,
    ),
  },
  {
    id: "ready-pass",
    title_zh: "Admission-ready 样例",
    title_en: "Admission-ready sample",
    description_zh: "演示一个较完整的 high-trust payload，便于快速看到 PASS 页面形态。",
    description_en: "Shows a relatively complete high-trust payload so you can reach the PASS state quickly.",
    recommended_mode: "admission_readiness",
    payload: JSON.stringify(
      {
        requested_trust_tier: "verified",
        registration_digest: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
        benchmark: {
          id: "terminal-lite",
          version: "v1",
          lane_id: "terminal-lite-v1",
          split: "hidden",
          health: {
            freshness_tier: "legacy",
            contamination_tier: "low",
            reporting_completeness: "high",
            last_audit_at: "2026-04-01T00:00:00.000Z",
            health_snapshot_version: "terminal-health-v2",
          },
        },
        model: { id: "gpt-5.2", label: "GPT-5.2" },
        harness: { id: "orbit-agent-pro", label: "Orbit Agent Pro" },
        n_runs: 5,
        n_tasks: 64,
        evidence_channel_mode: "public_plus_sealed",
        visibility_class: "public_summary",
        release_policy: "summary_only_permanent",
        declared_autonomy_mode: "autonomous",
        telemetry: {
          zero_input_sentinel: "ZERO_INPUT_V1",
          classification_verdict: "autonomous",
          approval_target_linkage_complete: true,
          tty_freeform_input_detected: false,
          interaction_log_complete: true,
          tty_input_digest: "sha256:2222222222222222222222222222222222222222222222222222222222222222",
        },
        public_bundle_digest: "sha256:3333333333333333333333333333333333333333333333333333333333333333",
        sealed_audit_bundle_digest: "sha256:4444444444444444444444444444444444444444444444444444444444444444",
      },
      null,
      2,
    ),
  },
];

export const STATIC_VALIDATOR_SAMPLE_PAYLOAD = SAMPLE_CASES[0]?.payload ?? "{}";

function localizeSampleCase(
  lang: UiLanguage,
  sample: (typeof SAMPLE_CASES)[number],
): ValidatorSampleCase {
  return {
    id: sample.id,
    title: t(lang, sample.title_zh, sample.title_en),
    description: t(lang, sample.description_zh, sample.description_en),
    recommended_mode: sample.recommended_mode,
    payload: sample.payload,
  };
}

export function listValidatorSampleCases(
  lang: UiLanguage,
): ValidatorSampleCase[] {
  return SAMPLE_CASES.map((item) => localizeSampleCase(lang, item));
}

export function getValidatorSampleCase(
  lang: UiLanguage,
  sampleId?: string,
): ValidatorSampleCase {
  return localizeSampleCase(
    lang,
    SAMPLE_CASES.find((item) => item.id === sampleId) ?? SAMPLE_CASES[0]!,
  );
}
