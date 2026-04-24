import type {
  BenchmarkCard,
  ExecutionContract,
  SampleRegistryContext,
  TaskPackage,
  TolerancePolicy,
} from "@ohbp/types";
import { objectDigestHex, sha256, BUNDLE_PATHS } from "@ohbp/canonical";
import { SCHEMA_CATALOG_VERSION } from "@ohbp/types";

const tolerancePolicy: TolerancePolicy = {
  tolerance_policy_id: "terminal-lite-default-v1",
  tolerance_policy_version: "0.1.0",
  applies_to_tiers: ["reproduced", "verified"],
  allowed_repeatability_classes: ["true_seeded", "pseudo_repeated"],
  comparison_unit: "run_group",
  statistical_protocol: "point_estimate_with_iqr",
  metric_rules: [
    {
      metric_id: "success_rate",
      level: "run_group",
      comparison_method: "abs_delta",
      threshold_abs: 0.03,
      threshold_rel: 0.05,
      directionality: "higher_is_better",
      hard_fail: true,
    },
    {
      metric_id: "median_cost_usd",
      level: "run_group",
      comparison_method: "relative_delta",
      threshold_abs: 0.05,
      threshold_rel: 0.15,
      directionality: "lower_is_better",
      hard_fail: false,
    },
  ],
  missingness_rule: "fail_on_missing_required_tasks",
  replay_rule: "requires_replayable_bundle",
  reproduce_rule: "requires_registered_complete_run_group",
  promotion_gate: "all_hard_fail_rules_pass",
};

export const publicBenchmarkCard: BenchmarkCard = {
  schema_version: SCHEMA_CATALOG_VERSION,
  object_type: "benchmark-card",
  benchmark: {
    id: "terminal-lite-v1",
    version: "0.1.0",
    lane_id: "terminal-lite-v1",
    split: "public",
    title: "Terminal Lite v1 (Public)",
  },
  description: "Synthetic terminal benchmark registry card used by the schema/core MVP.",
  comparison_mode: "fixed_model_compare_harness",
  default_submission_profile: "community_light",
  registry_refs: {
    task_package: "registry/sample/task-packages/terminal-lite-v1-public.json",
    execution_contract: "registry/sample/execution-contracts/terminal-lite-v1-default.json",
  },
};

export const hiddenBenchmarkCard: BenchmarkCard = {
  ...publicBenchmarkCard,
  benchmark: {
    ...publicBenchmarkCard.benchmark,
    split: "hidden",
    title: "Terminal Lite v1 (Hidden)",
  },
  registry_refs: {
    ...publicBenchmarkCard.registry_refs,
    task_package: "registry/sample/task-packages/terminal-lite-v1-hidden.json",
  },
};

export const publicTaskPackage: TaskPackage = {
  schema_version: SCHEMA_CATALOG_VERSION,
  object_type: "task-package",
  task_package_id: "terminal-lite-v1-public",
  benchmark_id: "terminal-lite-v1",
  benchmark_version: "0.1.0",
  lane_id: "terminal-lite-v1",
  split: "public",
  tasks: [
    {
      task_id: "terminal-lite-001",
      prompt_id: "fix-ci",
      title: "Repair a failing CI command",
      difficulty: "core",
      tags: ["terminal", "debugging"],
    },
    {
      task_id: "terminal-lite-002",
      prompt_id: "capture-log",
      title: "Capture and package a failing log",
      difficulty: "core",
      tags: ["terminal", "artifacts"],
    },
    {
      task_id: "terminal-lite-003",
      prompt_id: "summarize-run",
      title: "Summarize a previous run with evidence links",
      difficulty: "stretch",
      tags: ["workflow", "reporting"],
    },
  ],
};

export const hiddenTaskPackage: TaskPackage = {
  ...publicTaskPackage,
  task_package_id: "terminal-lite-v1-hidden",
  split: "hidden",
};

export const sharedExecutionContract: ExecutionContract = {
  schema_version: SCHEMA_CATALOG_VERSION,
  object_type: "execution-contract",
  execution_contract_id: "terminal-lite-v1-default",
  benchmark_id: "terminal-lite-v1",
  benchmark_version: "0.1.0",
  runtime: {
    adapter_id: "sample-terminal-adapter",
    adapter_version: "0.1.0",
    launcher: "hb-cli",
    model_ref: "gpt-5.1-mini",
    container_digest: sha256("registry:terminal-lite:container"),
  },
  resource_limits: {
    max_steps: 32,
    timeout_seconds: 600,
    budget_usd: 5,
  },
  verification_policy: {
    required_bundle_members: [
      BUNDLE_PATHS.manifest,
      BUNDLE_PATHS.aggregate,
      BUNDLE_PATHS.payloads.task_results,
      BUNDLE_PATHS.reports.evaluator_report,
      BUNDLE_PATHS.checksums,
    ],
    tolerance_policy: tolerancePolicy,
  },
};

export const benchmarkHealth = {
  benchmark_id: "terminal-lite-v1",
  benchmark_version: "0.1.0",
  lane_id: "terminal-lite-v1",
  split: "public" as const,
  freshness_tier: "fresh" as const,
  contamination_tier: "low" as const,
  reporting_completeness: "complete" as const,
  last_audit_at: "2026-04-20T00:00:00.000Z",
};

export const sampleRegistryContexts = {
  public: {
    benchmarkCard: publicBenchmarkCard,
    taskPackage: publicTaskPackage,
    executionContract: sharedExecutionContract,
    benchmarkHealth,
  } satisfies SampleRegistryContext,
  hidden: {
    benchmarkCard: hiddenBenchmarkCard,
    taskPackage: hiddenTaskPackage,
    executionContract: sharedExecutionContract,
    benchmarkHealth: {
      ...benchmarkHealth,
      split: "hidden",
    },
  } satisfies SampleRegistryContext,
};

export const sampleRegistryDigests = {
  benchmark_card_public: objectDigestHex(publicBenchmarkCard),
  benchmark_card_hidden: objectDigestHex(hiddenBenchmarkCard),
  task_package_public: objectDigestHex(publicTaskPackage),
  task_package_hidden: objectDigestHex(hiddenTaskPackage),
  execution_contract: objectDigestHex(sharedExecutionContract),
  tolerance_policy: objectDigestHex(sharedExecutionContract.verification_policy.tolerance_policy),
};

export const sampleRegistryFileContext = {
  contexts: {
    public: {
      benchmark_card: "registry/sample/benchmarks/terminal-lite-v1-public.json",
      task_package: publicBenchmarkCard.registry_refs.task_package,
      execution_contract: publicBenchmarkCard.registry_refs.execution_contract,
      benchmark_health: "registry/sample/benchmark-health/terminal-lite-v1.json",
    },
    hidden: {
      benchmark_card: "registry/sample/benchmarks/terminal-lite-v1-hidden.json",
      task_package: hiddenBenchmarkCard.registry_refs.task_package,
      execution_contract: hiddenBenchmarkCard.registry_refs.execution_contract,
      benchmark_health: "registry/sample/benchmark-health/terminal-lite-v1-hidden.json",
    },
  },
};
