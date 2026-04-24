import { DEFAULT_UI_LANGUAGE, t } from "./i18n.js";
function protocolObjects(lang) {
    return [
        {
            id: "manifest",
            title: "manifest.json",
            summary: t(lang, "bundle 侧唯一 join surface；v0.2 的“文件真”先从这里核对 manifest、digest 与公开投影是否一致。", "The only bundle-side join surface; in v0.2, the first \"file truth\" check starts here by matching the manifest, digest, and public projection."),
            used_for: ["validator", "verifier", "boards", "entry detail"],
        },
        {
            id: "run-group-registration",
            title: "run-group-registration.json",
            summary: t(lang, "冻结 run-group 比较边界、attempt 计划与 requested_trust_tier；也是低成本 solo-operator flow 的上传前起点。", "Freezes the run-group comparison boundary, attempt plan, and requested_trust_tier; it is also the preregistration starting point for the low-cost solo-operator flow."),
            used_for: ["intake", "completeness proof", "promotion gap"],
        },
        {
            id: "completeness-proof",
            title: "completeness-proof.json",
            summary: t(lang, "平台生成；证明声明过的 run-group 是否完整披露，主要对应六道闸门里的“次数真”。", "Platform-generated proof showing whether the declared run-group is fully disclosed, primarily covering the \"run-count truth\" gate in the six-gate model."),
            used_for: ["frontier", "research view", "board admission"],
        },
        {
            id: "governance-directive",
            title: "governance_directive",
            summary: t(lang, "带 actor / at / reason_code / summary 的治理动作；用于把条目从自动状态推进到 disputed、corrected、invalidated 等可追溯状态。", "A governance action carrying actor / at / reason_code / summary; it moves an entry from the auto-derived state into traceable states such as disputed, corrected, or invalidated."),
            used_for: ["state history", "board suspension", "appeal review"],
        },
        {
            id: "verification-record",
            title: "verification-record.json",
            summary: t(lang, "trust_tier / publication_state / board_disposition / autonomy_mode 的平台真源；state_history 也从这里读。", "The platform source of truth for trust_tier, publication_state, board_disposition, and autonomy_mode; state_history is read from here as well."),
            used_for: ["official board", "entry detail", "research view", "state history"],
        },
        {
            id: "board-slice",
            title: "board_slice",
            summary: t(lang, "排名成立的最小上下文；v0.2/v0.3 只允许在 fixed slice 内比较，不同任务包、不同 slice 或不同榜单处置状态不得混排。", "The minimum context in which ranking is meaningful; v0.2/v0.3 only compares entries inside a fixed slice, and entries from different task packages, slices, or board-disposition states must not be blended together."),
            used_for: ["board page", "slice selector", "ranking state"],
        },
    ];
}
const OBJECT_DEPENDENCIES = {
    manifest: [],
    "run-group-registration": ["manifest"],
    "completeness-proof": ["run-group-registration", "manifest"],
    "governance-directive": ["manifest"],
    "verification-record": ["manifest", "completeness-proof", "governance-directive"],
    "board-slice": ["verification-record", "completeness-proof"],
};
function fieldGlossary(lang) {
    return [
        {
            field: "trust_tier",
            value_domain: "community | reproduced | verified",
            owner: t(lang, "平台 verifier", "platform verifier"),
            used_by: ["boards", "entry detail", "scorecard view"],
            common_misuse: t(lang, "把 publication_state 或 self-reported label 当作 trust_tier。", "Treating publication_state or a self-reported label as trust_tier."),
        },
        {
            field: "requested_trust_tier",
            value_domain: "community | reproduced | verified",
            owner: t(lang, "上传者 / intake", "uploader / intake"),
            used_by: ["upload receipt", "promotion gap"],
            common_misuse: t(lang, "把 uploader 请求值直接显示成官方已授予层级。", "Displaying the uploader's requested tier as if it were already granted by the platform."),
        },
        {
            field: "publication_state",
            value_domain: "submitted | provisional | published | disputed | corrected | invalidated | rejected | archived",
            owner: t(lang, "平台 verifier", "platform verifier"),
            used_by: ["boards", "entry detail history", "governance review"],
            common_misuse: t(lang, "把 published 误当成 verified，或把 disputed / corrected 误读成“分数变化”。", "Treating published as if it meant verified, or misreading disputed / corrected as \"score changes.\""),
        },
        {
            field: "board_disposition",
            value_domain: "active | suspended | historical_only | hidden",
            owner: t(lang, "平台 verifier", "platform verifier"),
            used_by: ["boards", "entry badges", "board routing"],
            common_misuse: t(lang, "把它当成 publication_state 的同义词；其实它只回答“当前榜单怎么处理这条记录”。", "Treating it as a synonym for publication_state; it only answers \"how the current boards should handle this record.\""),
        },
        {
            field: "governance_directives",
            value_domain: "array<{publication_state, reason_code, summary, at, actor?}>",
            owner: t(lang, "运营者 / 治理层", "operator / governance layer"),
            used_by: ["state history", "appeal review", "board suspension"],
            common_misuse: t(lang, "直接覆写最终状态却不保留 actor / at / reason_code，导致下架、修正、恢复都不可追溯。", "Overwriting the final state without retaining actor / at / reason_code, making suspensions, corrections, and reinstatements impossible to audit."),
        },
        {
            field: "autonomy_mode",
            value_domain: "autonomous | approval_only | interactive",
            owner: "verification_record",
            used_by: ["slice admission", "entry badges"],
            common_misuse: t(lang, "把 declared_autonomy_mode 直接当榜单标签。", "Using declared_autonomy_mode directly as a board label."),
        },
        {
            field: "evidence_channel_mode",
            value_domain: "public_only | public_plus_sealed",
            owner: t(lang, "manifest / verifier", "manifest / verifier"),
            used_by: ["entry detail", "validator"],
            common_misuse: t(lang, "在 public_plus_sealed 情况下把 sealed 原文暴露到公共网页。", "Exposing sealed raw content on a public web page while the mode is public_plus_sealed."),
        },
        {
            field: "visibility_class",
            value_domain: "public_full | public_redacted | public_summary | sealed_pending_publication",
            owner: t(lang, "平台策略", "platform policy"),
            used_by: ["entry detail", "health / release policy banners"],
            common_misuse: t(lang, "published 结果仍使用 sealed_pending_publication 作为公开形态。", "Leaving published results in sealed_pending_publication as their public shape."),
        },
        {
            field: "release_policy",
            value_domain: "public_immediate | delayed_until_date | delayed_until_legacy | summary_only_permanent",
            owner: t(lang, "benchmark health + 平台策略", "benchmark health + platform policy"),
            used_by: ["entry detail", "public digest disclosures"],
            common_misuse: t(lang, "忽略 hidden benchmark 的 delayed / summary-only 约束。", "Ignoring delayed / summary-only constraints for hidden benchmarks."),
        },
        {
            field: "comparison_mode",
            value_domain: "fixed_model_compare_harness | fixed_harness_compare_model | system_combination",
            owner: t(lang, "排名策略", "ranking policy"),
            used_by: ["boards", "slice metadata"],
            common_misuse: t(lang, "不同 comparison_mode 的结果混成同一个榜。", "Mixing results from different comparison_mode values into the same board."),
        },
        {
            field: "task_package_digest",
            value_domain: "sha256:<digest>",
            owner: t(lang, "任务包 / completeness-proof", "task package / completeness-proof"),
            used_by: ["board_slice", "ranking policy", "entry research"],
            common_misuse: t(lang, "只看 benchmark id/version 却混排不同任务包的结果。", "Mixing results from different task packages because only benchmark id/version was checked."),
        },
    ];
}
export function buildProtocolIndexView(lang = DEFAULT_UI_LANGUAGE) {
    return {
        lang,
        version: "OHBP v0.2",
        objects: protocolObjects(lang),
        fields: fieldGlossary(lang),
    };
}
export function buildProtocolObjectEntry(objectId, lang = DEFAULT_UI_LANGUAGE) {
    return protocolObjects(lang).find((entry) => entry.id === objectId);
}
export function buildProtocolFieldEntry(fieldId, lang = DEFAULT_UI_LANGUAGE) {
    return fieldGlossary(lang).find((entry) => entry.field === fieldId);
}
function searchMatches(query, parts) {
    if (!query) {
        return true;
    }
    const haystack = parts
        .flatMap((part) => (Array.isArray(part) ? part : [part]))
        .filter((part) => Boolean(part))
        .join(" ")
        .toLowerCase();
    return haystack.includes(query);
}
export function buildProtocolPageView(rawQuery, lang = DEFAULT_UI_LANGUAGE) {
    const query = rawQuery?.trim().toLowerCase() || undefined;
    const objects = protocolObjects(lang);
    const glossaryEntries = fieldGlossary(lang);
    const sections = [
        {
            id: "overview",
            title: t(lang, "总览", "Overview"),
            summary: t(lang, "v0.2 的 protocol browser 先回答“这条结果现在能不能公开、能上哪层榜、还差什么”，而不是先讲谁最强。", "The v0.2 protocol browser first answers \"can this result be public now, which board can it enter, and what is still missing?\" rather than leading with who is strongest."),
            bullets: [
                t(lang, "先分对象，再谈排名：manifest / completeness-proof / verification-record / board_slice 各自回答不同边界问题。", "Separate the objects before talking about ranking: manifest / completeness-proof / verification-record / board_slice each answer a different boundary question."),
                t(lang, "看到 published 只代表“可公开发布”，不等于“已进入 Official Verified”。", "Seeing published only means \"eligible for public release\"; it does not mean \"already on Official Verified.\""),
                t(lang, "单人低预算场景下，v0.2 追求的是低成本守真，不是堆一个更花哨的神秘总分。", "For solo, low-budget operation, v0.2 optimizes for low-cost truthfulness instead of inventing a fancier mystery score."),
            ],
        },
        {
            id: "object-model",
            title: t(lang, "对象模型", "Object model"),
            summary: t(lang, "MVP 页面只消费平台派生对象，用对象链解释状态，不直接重拼 raw bundle。", "The MVP page consumes platform-derived objects, using the object chain to explain state rather than reconstructing raw bundles directly."),
            bullets: [
                t(lang, "manifest.json 是 bundle 侧唯一 join surface。", "manifest.json is the only bundle-side join surface."),
                t(lang, "governance_directive 负责把“人为裁决”写成带时间与原因的可审计事件。", "governance_directive turns a human ruling into an auditable event with time and reason."),
                t(lang, "verification_record 是 trust/publication/board disposition/autonomy 的平台真源。", "verification_record is the platform source of truth for trust/publication/board disposition/autonomy."),
                t(lang, "scorecard_view 必须完全可追溯到 research_view。", "scorecard_view must remain fully traceable back to research_view."),
            ],
        },
        {
            id: "trust-and-publication",
            title: t(lang, "发布状态、榜单处置与准入", "Publication state, board disposition, and admission"),
            summary: t(lang, "v0.2 把“现在是什么状态”“榜单怎么处理”“能进哪层榜”拆成三个问题来回答。", "v0.2 answers three separate questions: \"what state is it in now,\" \"how should boards treat it,\" and \"which board can admit it.\""),
            bullets: [
                t(lang, "requested_trust_tier 是上传意图，不是最终授予层级。", "requested_trust_tier is upload intent, not the final granted tier."),
                t(lang, "publication_state 用 submitted → provisional → published，再加 disputed / corrected / invalidated / archived 解释生命周期，不表达可信度高低。", "publication_state uses submitted → provisional → published plus disputed / corrected / invalidated / archived to explain lifecycle; it does not express trust strength."),
                t(lang, "board_disposition 只回答榜单动作：active / suspended / historical_only / hidden。", "board_disposition only answers the board action: active / suspended / historical_only / hidden."),
                t(lang, "Official / Frontier / Community 的准入必须同时看 trust_tier + publication_state + board policy。", "Admission to Official / Frontier / Community must jointly consider trust_tier + publication_state + board policy."),
            ],
        },
        {
            id: "state-machine",
            title: t(lang, "v0.2 状态机与治理指令", "v0.2 state machine and governance directives"),
            summary: t(lang, "governance directive 不是随手改标签；它是带 actor / time / reason_code 的正式状态迁移。", "A governance directive is not a casual relabel; it is a formal state transition with actor / time / reason_code."),
            bullets: [
                t(lang, "系统会先给一个 auto_state，治理指令只能沿合法迁移图推进，例如 published → disputed → corrected / invalidated。", "The system assigns an auto_state first, and governance directives may only move along the legal transition graph, for example published → disputed → corrected / invalidated."),
                t(lang, "disputed 会把结果从活跃榜单暂停；corrected 表示等修正版复核；invalidated 表示结果失效但保留历史页。", "disputed pauses the result from active boards; corrected means waiting for the corrected result to be reviewed; invalidated means the result is no longer valid but its history page remains."),
                t(lang, "治理指令的价值不是“拍脑袋改榜”，而是让每次下架、恢复、修正都有可追溯原因。", "The value of a governance directive is not \"editing the board by fiat,\" but making every suspension, reinstatement, and correction traceable."),
            ],
        },
        {
            id: "six-gates",
            title: t(lang, "六道闸门", "Six gates"),
            summary: t(lang, "v0.2/v0.3 不做真实性总分，而是用六道闸门回答“这条记录为什么值得看、还差什么”。", "v0.2/v0.3 does not produce a single trust score; it uses six gates to answer \"why is this record worth looking at, and what is still missing?\""),
            bullets: [
                t(lang, "文件真：bundle / digest / manifest 对得上。", "File truth: the bundle / digest / manifest line up."),
                t(lang, "次数真：run-group 完整，不能只上传最好一次。", "Run-count truth: the run-group is complete; you cannot upload only the best attempt."),
                t(lang, "人工真：autonomy / approval / interactive 与 trace 一致。", "Human-operation truth: autonomy / approval / interactive claims match the trace."),
                t(lang, "环境真：execution contract 固定，比较边界清楚。", "Environment truth: the execution contract is fixed, so the comparison boundary is clear."),
                t(lang, "泛化真：benchmark-tuned、hidden split、sealed evidence 声明清楚。", "Generalization truth: benchmark-tuned, hidden-split, and sealed-evidence conditions are declared clearly."),
                t(lang, "稳定真：runs 足够，uncertainty 能展示。", "Stability truth: there are enough runs and the uncertainty can be shown."),
            ],
        },
        {
            id: "uncertainty-aware-ranking",
            title: t(lang, "v0.3 不确定性感知排序", "v0.3 uncertainty-aware ranking"),
            summary: t(lang, "v0.3 不直接按成功率硬排名，而是按 95% Wilson 下界保守排序，并把相邻区间重叠链放进同一置信档。", "v0.3 does not hard-rank by raw success rate; it sorts conservatively by the 95% Wilson lower bound and places adjacent-overlap chains into the same confidence band."),
            bullets: [
                t(lang, "比较前先固定 task_package_digest / execution_contract_digest / tolerance_policy_digest，不同任务包绝不混排。", "Before comparison, task_package_digest / execution_contract_digest / tolerance_policy_digest are fixed; different task packages are never mixed."),
                t(lang, "主指标仍是 objective_success_rate，但公开排序分使用 Wilson 95% 下界，避免小样本虚高。", "The primary metric remains objective_success_rate, but public ordering uses the Wilson 95% lower bound to avoid over-crediting small samples."),
                t(lang, "每条 entry 展示成功率、95% CI、effective_n、observed_successes、rank band 和 rank_confidence；其中 rank_confidence 当前表示单条区间精度，不是硬名次保证。", "Each entry shows success rate, 95% CI, effective_n, observed_successes, rank band, and rank_confidence; rank_confidence currently means single-entry interval precision, not a hard-rank guarantee."),
                t(lang, "只有当相邻条目的 95% 区间完全分离且样本数过门槛时，才允许 ranked_ordinal；否则保持 ranked_tiered。", "Only when adjacent 95% intervals are fully separated and sample counts meet the threshold may the board become ranked_ordinal; otherwise it remains ranked_tiered."),
                t(lang, "cost / latency 只作为显示顺序稳定器，不压过成功率证据。", "cost / latency are only display-order stabilizers; they do not override success evidence."),
            ],
        },
        {
            id: "solo-operator-flow",
            title: t(lang, "低成本 solo-operator flow", "Low-cost solo-operator flow"),
            summary: t(lang, "这是给单人运营者的最小闭环：先守住最值钱的真实性，再把昂贵复跑打到关键条目上。", "This is the minimum loop for a solo operator: protect the highest-value truth guarantees first, then spend expensive reruns only where they matter most."),
            bullets: [
                t(lang, "上传前先登记 study_id / run_group / 计划次数 / requested_trust_tier / slice digests。", "Before upload, preregister study_id / run_group / planned attempts / requested_trust_tier / slice digests."),
                t(lang, "上传时平台只信 bundle truth：manifest + public bundle digest + task 结果 + trace 摘要。", "At upload time, the platform trusts bundle truth only: manifest + public bundle digest + task results + trace summary."),
                t(lang, "上传后先自动复算与分层，再决定 Community / Frontier / Official 准入。", "After upload, the platform recalculates and stratifies first, then decides Community / Frontier / Official admission."),
                t(lang, "抽样复跑优先打冲榜条目、Top 条目、被举报或异常条目，不追求全量复跑。", "Sample reruns should focus on board-chasing entries, top entries, and reported or anomalous entries rather than rerunning everything."),
                t(lang, "条件不够时，宁可显示 warming_up / insufficient evidence，也不要用 demo fallback 假装真榜。", "When the conditions are insufficient, show warming_up / insufficient evidence instead of faking a real board with demo fallback."),
            ],
        },
        {
            id: "evidence-and-validator",
            title: t(lang, "证据与校验器", "Evidence & validator"),
            summary: t(lang, "公开层只显示 digest / metadata，不浏览 sealed 原文。", "The public layer only shows digests and metadata; it never browses sealed raw content."),
            bullets: [
                t(lang, "hidden/holdout/rotating split 的高信任结果默认要求 public_plus_sealed。", "High-trust results from hidden/holdout/rotating splits default to requiring public_plus_sealed."),
                t(lang, "validator playground 先给 machine-readable issue，再给修复建议。", "The validator playground reports machine-readable issues first and repair suggestions second."),
                t(lang, "网站只展示 sealed_audit_bundle_digest，不暴露 sealed 内容。", "The site only shows sealed_audit_bundle_digest and never exposes sealed content."),
            ],
        },
        {
            id: "benchmark-health",
            title: t(lang, "基准健康度", "Benchmark health"),
            summary: t(lang, "benchmark health 不是注脚，而是 release policy 的输入。", "Benchmark health is not a footnote; it is an input to release policy."),
            bullets: [
                t(lang, "fresh/active + hidden split 默认不能 public_full + public_immediate。", "fresh/active + hidden split cannot default to public_full + public_immediate."),
                t(lang, "health snapshot 必须版本化并保留历史。", "Health snapshots must be versioned and retained historically."),
                t(lang, "Official Board 默认优先接纳与 benchmark health 兼容的公开形态。", "The Official Board defaults to public shapes that remain compatible with benchmark health."),
            ],
        },
    ].filter((section) => searchMatches(query, [section.id, section.title, section.summary, section.bullets]));
    const object_map = objects
        .filter((entry) => searchMatches(query, [entry.id, entry.title, entry.summary, entry.used_for]))
        .map((entry) => ({
        ...entry,
        depends_on: OBJECT_DEPENDENCIES[entry.id] ?? [],
        links: [
            {
                label: "JSON API",
                href: `/api/protocol/objects/${entry.id}`,
            },
            {
                label: t(lang, "校验器", "Validator"),
                href: "/playground/validator",
            },
        ],
    }));
    const glossary = glossaryEntries.filter((entry) => searchMatches(query, [entry.field, entry.value_domain, entry.owner, entry.used_by, entry.common_misuse]));
    const implementation_links = [
        {
            label: t(lang, "协议索引 JSON", "Protocol index JSON"),
            href: "/api/protocol/index",
            description: t(lang, "供 BFF / Web / 外部工具直接消费的协议索引。", "Protocol index that BFFs, the web app, and external tools can consume directly."),
        },
        {
            label: "publication_state field JSON",
            href: "/api/protocol/fields/publication_state",
            description: t(lang, "查看八态状态机的 canonical 值域，并区分“可公开”与“可上榜”。", "Inspect the canonical eight-state machine and distinguish \"publicly releasable\" from \"board-admissible.\""),
        },
        {
            label: "board_disposition field JSON",
            href: "/api/protocol/fields/board_disposition",
            description: t(lang, "查看 active / suspended / historical_only / hidden 四种榜单处置语义。", "Inspect the four board-disposition meanings: active / suspended / historical_only / hidden."),
        },
        {
            label: "governance_directives field JSON",
            href: "/api/protocol/fields/governance_directives",
            description: t(lang, "查看治理指令的最小字段形状，以及为什么每次人工裁决都必须留痕。", "Inspect the minimum governance-directive shape and why every manual ruling must leave an audit trail."),
        },
        {
            label: "verification-record object JSON",
            href: "/api/protocol/objects/verification-record",
            description: t(lang, "查看 trust / publication / board disposition / autonomy 的平台真源对象。", "Inspect the platform source-of-truth object for trust / publication / board disposition / autonomy."),
        },
        {
            label: "governance-directive object JSON",
            href: "/api/protocol/objects/governance-directive",
            description: t(lang, "查看治理动作如何进入 state_history，并驱动 disputed / corrected / invalidated。", "Inspect how governance actions enter state_history and drive disputed / corrected / invalidated."),
        },
        {
            label: t(lang, "校验器演练场", "Validator Playground"),
            href: "/playground/validator",
            description: t(lang, "从协议规则直接跳到 bundle / manifest 自助校验工作台。", "Jump straight from protocol rules into the bundle / manifest self-check workspace."),
        },
    ].filter((link) => searchMatches(query, [link.label, link.description, link.href]));
    const search_summary = query
        ? t(lang, `搜索 "${query}"：匹配 ${sections.length} 个规则分区、${object_map.length} 个对象、${glossary.length} 个字段。`, `Search "${query}": matched ${sections.length} rule sections, ${object_map.length} objects, and ${glossary.length} fields.`)
        : undefined;
    return {
        lang,
        version: "OHBP v0.2",
        intro: t(lang, "协议优先于产品：v0.2 页面不是榜单营销文案，而是 manifest / completeness-proof / governance_directive / verification-record / board_slice 的公开投影层，用来解释为什么能上榜、为何暂停、以及还差哪道闸门。", "Protocol comes before product: the v0.2 page is not leaderboard marketing copy, but the public projection layer for manifest / completeness-proof / governance_directive / verification-record / board_slice, explaining why an entry can rank, why it was paused, and which gate is still missing."),
        query: rawQuery?.trim() || undefined,
        search_summary,
        sections,
        object_map,
        implementation_links,
        glossary,
    };
}
//# sourceMappingURL=protocol.js.map