import { DEFAULT_UI_LANGUAGE, t } from "./i18n.js";
export const HOST_IDS = [
    "general",
    "claude-code",
    "codex",
    "opencode",
];
export function isHostId(value) {
    return HOST_IDS.includes(value);
}
const LAST_UPDATED = "2026-04-21";
const EVIDENCE_BOARD_HREF = "/boards/official-verified";
const DECISION_SCORES = {
    gsd: {
        newProject: 79,
        existingRepo: 62,
        longTask: 57,
        multiAgent: 40,
    },
    gstack: {
        newProject: 73,
        existingRepo: 82,
        longTask: 91,
        multiAgent: 92,
    },
    speckit: {
        newProject: 94,
        existingRepo: 69,
        longTask: 80,
        multiAgent: 68,
    },
    openspec: {
        newProject: 85,
        existingRepo: 95,
        longTask: 88,
        multiAgent: 72,
    },
    superpowers: {
        newProject: 74,
        existingRepo: 78,
        longTask: 86,
        multiAgent: 94,
    },
    "bmad-method": {
        newProject: 64,
        existingRepo: 75,
        longTask: 90,
        multiAgent: 96,
    },
};
const HOST_META = {
    general: {
        badgeZh: "通用",
        badgeEn: "General",
        titleZh: "通用总榜",
        titleEn: "General Leaderboard",
        summaryZh: "全局候选项。",
        summaryEn: "Broad candidate set.",
        recommendedForZh: "首次选型 / 还没锁定主工具",
        recommendedForEn: "First-time selection / no tool locked yet",
    },
    "claude-code": {
        badgeZh: "Claude Code",
        badgeEn: "Claude Code",
        titleZh: "Claude Code 榜",
        titleEn: "Claude Code Leaderboard",
        summaryZh: "Claude Code 候选项。",
        summaryEn: "Claude Code candidates.",
        recommendedForZh: "长任务 / 多轮实现 / 一人多角色",
        recommendedForEn: "Long tasks / multi-step builds / one-person multi-role work",
    },
    codex: {
        badgeZh: "Codex",
        badgeEn: "Codex",
        titleZh: "Codex 榜",
        titleEn: "Codex Leaderboard",
        summaryZh: "Codex 规范优先组合。",
        summaryEn: "Codex spec-first shortlist.",
        recommendedForZh: "新项目 / 规范优先 / 结构化执行",
        recommendedForEn: "Greenfield / spec-first / structured execution",
    },
    opencode: {
        badgeZh: "OpenCode",
        badgeEn: "OpenCode",
        titleZh: "OpenCode 榜",
        titleEn: "OpenCode Leaderboard",
        summaryZh: "开放宿主的技能化与并行组合。",
        summaryEn: "Skill-heavy and parallel picks for open hosts.",
        recommendedForZh: "开放环境 / 技能扩展 / 并行推进",
        recommendedForEn: "Open environments / skill extensions / parallel execution",
    },
};
const HARNESSES = [
    {
        harnessId: "gsd",
        label: "GSD",
        taglineZh: "轻量、直接、低心智负担。",
        taglineEn: "Lightweight, direct, and low-overhead.",
        specification: 60,
        planning: 66,
        execution: 62,
        context: 58,
        setup: 92,
        bestForZh: "个人开发、小项目、快速启动",
        bestForEn: "Solo work, smaller projects, and quick starts",
        watchOutsZh: "长任务和多角色协作会显得偏薄。",
        watchOutsEn: "Feels thin once the work turns into a long multi-role program.",
        evidenceLabelZh: "策展样本 · 待验证",
        evidenceLabelEn: "Curated sample · awaiting verification",
        scenarioTagsZh: ["小项目", "低成本", "快速启动"],
        scenarioTagsEn: ["Small projects", "Low overhead", "Quick start"],
        fitByHost: {
            general: 78,
            "claude-code": 76,
            codex: 74,
            opencode: 83,
        },
        compareValues: {
            specificationZh: "简单 QA / 对话生成",
            specificationEn: "Simple QA / conversational specification",
            planningZh: "轻规划，不加太多层",
            planningEn: "Light planning without heavy layering",
            executionZh: "轻量工作流执行",
            executionEn: "Lightweight workflow execution",
            contextZh: "简单隔离，适合短上下文",
            contextEn: "Simple isolation for short-context work",
            teamZh: "个人开发者",
            teamEn: "Solo developer",
            hostFitZh: "开放、轻装宿主适配较高",
            hostFitEn: "Higher fit in lighter and more open hosts",
        },
    },
    {
        harnessId: "gstack",
        label: "gstack",
        taglineZh: "多角色、强规划、Claude Code 高适配。",
        taglineEn: "Role-separated, planning-heavy, and high Claude Code alignment.",
        specification: 84,
        planning: 90,
        execution: 82,
        context: 80,
        setup: 58,
        bestForZh: "Claude Code、大项目、一人多角色",
        bestForEn: "Claude Code, larger repos, and one-person virtual teams",
        watchOutsZh: "小项目和临时试验会觉得偏重。",
        watchOutsEn: "Can feel too heavy for tiny projects or throwaway experiments.",
        evidenceLabelZh: "策展样本 · 待验证",
        evidenceLabelEn: "Curated sample · awaiting verification",
        scenarioTagsZh: ["Claude Code", "大仓库", "多角色"],
        scenarioTagsEn: ["Claude Code", "Large repos", "Multi-role"],
        fitByHost: {
            general: 88,
            "claude-code": 94,
            codex: 82,
            opencode: 79,
        },
        compareValues: {
            specificationZh: "多角色追问生成规范",
            specificationEn: "Multi-role questioning and spec refinement",
            planningZh: "规划与执行解耦",
            planningEn: "Decouples planning from execution",
            executionZh: "Pipeline 式角色接力",
            executionEn: "Pipeline-style role handoff",
            contextZh: "角色分离降低负担",
            contextEn: "Role separation keeps cognitive load under control",
            teamZh: "单人多角色",
            teamEn: "One-person virtual team",
            hostFitZh: "Claude Code 适配高",
            hostFitEn: "High Claude Code fit",
        },
    },
    {
        harnessId: "speckit",
        label: "SpecKit",
        taglineZh: "规范优先；greenfield 高适配。",
        taglineEn: "High spec-first fit for greenfield work.",
        specification: 92,
        planning: 88,
        execution: 74,
        context: 72,
        setup: 63,
        bestForZh: "Codex、新项目、结构化启动",
        bestForEn: "Codex, greenfield work, and structured starts",
        watchOutsZh: "连续增量迭代时会显得更硬。",
        watchOutsEn: "Can feel rigid once the work shifts to ongoing incremental delivery.",
        evidenceLabelZh: "策展样本 · 待验证",
        evidenceLabelEn: "Curated sample · awaiting verification",
        scenarioTagsZh: ["Codex", "新项目", "规范优先"],
        scenarioTagsEn: ["Codex", "Greenfield", "Spec-first"],
        fitByHost: {
            general: 86,
            "claude-code": 78,
            codex: 94,
            opencode: 73,
        },
        compareValues: {
            specificationZh: "宪法式规范定义",
            specificationEn: "Constitution-style structured specification",
            planningZh: "结构化任务拆解 / plan.md",
            planningEn: "Structured decomposition with explicit plan artifacts",
            executionZh: "Specify → Plan → Tasks",
            executionEn: "Specify → Plan → Tasks",
            contextZh: "重度结构化上下文引导",
            contextEn: "Heavy structured context guidance",
            teamZh: "规范驱动紧凑团队",
            teamEn: "Spec-driven compact team",
            hostFitZh: "结构化执行宿主适配高，如 Codex",
            hostFitEn: "High fit where structured execution is first-class, like Codex",
        },
    },
    {
        harnessId: "openspec",
        label: "OpenSpec",
        taglineZh: "均衡度高，现有仓库适配高。",
        taglineEn: "Balanced profile, especially for existing repos.",
        specification: 85,
        planning: 78,
        execution: 84,
        context: 86,
        setup: 76,
        bestForZh: "现有仓库、持续迭代、结构与轻量平衡",
        bestForEn: "Existing repos, continuous delivery, and balanced structure",
        watchOutsZh: "重型多 Agent 流水线覆盖较弱。",
        watchOutsEn: "Lower fit for heavy multi-agent pipelines.",
        evidenceLabelZh: "策展样本 · 待验证",
        evidenceLabelEn: "Curated sample · awaiting verification",
        scenarioTagsZh: ["增量迭代", "现有仓库", "均衡"],
        scenarioTagsEn: ["Incremental work", "Existing repos", "Balanced"],
        fitByHost: {
            general: 90,
            "claude-code": 86,
            codex: 88,
            opencode: 86,
        },
        compareValues: {
            specificationZh: "proposal first，关注具体变更",
            specificationEn: "Proposal-first and focused on the exact delta",
            planningZh: "避免过度全局规划",
            planningEn: "Avoids over-planning and keeps scope local",
            executionZh: "Proposal → Apply → Archive",
            executionEn: "Proposal → Apply → Archive",
            contextZh: "Diff based、目录边界清晰",
            contextEn: "Diff-based isolation with clear change boundaries",
            teamZh: "增量交付团队",
            teamEn: "Incremental delivery team",
            hostFitZh: "跨宿主适配较高",
            hostFitEn: "Travels well across most hosts",
        },
    },
    {
        harnessId: "superpowers",
        label: "Superpowers",
        taglineZh: "技能库 + 并行任务，开放宿主适配高。",
        taglineEn: "Skill libraries plus parallel tasking for open hosts.",
        specification: 72,
        planning: 83,
        execution: 88,
        context: 70,
        setup: 61,
        bestForZh: "技能扩展、并行推进、OpenCode 环境",
        bestForEn: "Skill-driven work, parallel execution, and OpenCode-style environments",
        watchOutsZh: "没有技能库时，前期磨合成本明显。",
        watchOutsEn: "Without a real skill library, the upfront coordination cost is noticeable.",
        evidenceLabelZh: "策展样本 · 待验证",
        evidenceLabelEn: "Curated sample · awaiting verification",
        scenarioTagsZh: ["并行任务", "技能化", "OpenCode"],
        scenarioTagsEn: ["Parallel work", "Skill-driven", "OpenCode"],
        fitByHost: {
            general: 84,
            "claude-code": 84,
            codex: 85,
            opencode: 98,
        },
        compareValues: {
            specificationZh: "系统化 skills 与引导式提示",
            specificationEn: "Systematic skills and guided prompting",
            planningZh: "并行任务拆分",
            planningEn: "Parallel task decomposition",
            executionZh: "Sub-agent + 强验证回路",
            executionEn: "Sub-agent heavy execution with strong verification loops",
            contextZh: "按需加载技能与上下文",
            contextEn: "Loads skills and context on demand",
            teamZh: "技能网络型团队",
            teamEn: "Skill-network team",
            hostFitZh: "开放宿主适配高",
            hostFitEn: "High fit in open and flexible hosts",
        },
    },
    {
        harnessId: "bmad-method",
        label: "BMAD Method",
        taglineZh: "模拟完整研发团队，适合重治理项目。",
        taglineEn: "Simulates a full delivery team for governance-heavy work.",
        specification: 78,
        planning: 86,
        execution: 79,
        context: 82,
        setup: 48,
        bestForZh: "企业级项目、重流程、多人协作风格",
        bestForEn: "Enterprise projects and governance-heavy delivery",
        watchOutsZh: "新手和小项目成本偏高。",
        watchOutsEn: "Higher overhead for beginners and small projects.",
        evidenceLabelZh: "策展样本 · 待验证",
        evidenceLabelEn: "Curated sample · awaiting verification",
        scenarioTagsZh: ["企业级", "多角色", "重流程"],
        scenarioTagsEn: ["Enterprise", "Multi-role", "Heavy process"],
        fitByHost: {
            general: 74,
            "claude-code": 70,
            codex: 72,
            opencode: 68,
        },
        compareValues: {
            specificationZh: "模拟完整研发团队的多职能规范",
            specificationEn: "Multi-functional specification process",
            planningZh: "流水线 + 架构评审",
            planningEn: "Pipeline plus architect review",
            executionZh: "多角色混合协作",
            executionEn: "Hybrid multi-expert execution",
            contextZh: "模块化记忆总线",
            contextEn: "Modular memory bus",
            teamZh: "完整虚拟团队",
            teamEn: "Full virtual organization",
            hostFitZh: "成熟组织高适配；轻量场景成本较高",
            hostFitEn: "Higher fit for mature organizations; heavier for lightweight starts",
        },
    },
];
const TOP_CARD_CONFIGS = {
    general: [
        {
            titleZh: "综合首位",
            titleEn: "Overall leader",
            id: "openspec",
            reasonZh: "均衡度高；现有仓库与持续迭代高适配。",
            reasonEn: "Balanced profile for existing repos and continuous delivery.",
        },
        {
            titleZh: "新项目",
            titleEn: "Greenfield fit",
            id: "speckit",
            reasonZh: "规范优先结构完整度高。",
            reasonEn: "High spec-first structure for greenfield starts.",
        },
        {
            titleZh: "低负担",
            titleEn: "Low overhead",
            id: "gsd",
            reasonZh: "小项目的低负担路径。",
            reasonEn: "The lowest-overhead path for smaller projects.",
        },
    ],
    "claude-code": [
        {
            titleZh: "Claude Code 首位",
            titleEn: "Claude Code leader",
            id: "gstack",
            reasonZh: "角色分离 + 强规划，Claude Code 适配分较高。",
            reasonEn: "High Claude Code fit with role separation and planning depth.",
        },
        {
            titleZh: "现有仓库",
            titleEn: "Existing repo fit",
            id: "openspec",
            reasonZh: "增量 delta 更容易长期维持。",
            reasonEn: "Delta-friendly delivery is easier to sustain in existing repos.",
        },
        {
            titleZh: "轻量入门",
            titleEn: "Lightweight entry",
            id: "gsd",
            reasonZh: "不需要完整编排层时的轻量路径。",
            reasonEn: "A lighter path when a full orchestration layer is unnecessary.",
        },
    ],
    codex: [
        {
            titleZh: "Codex 首位",
            titleEn: "Codex leader",
            id: "speckit",
            reasonZh: "规范优先与新项目维度略高。",
            reasonEn: "Higher on spec-first and greenfield Codex work.",
        },
        {
            titleZh: "现有仓库",
            titleEn: "Existing repo fit",
            id: "openspec",
            reasonZh: "proposal-first 的增量模式更适合连续改造。",
            reasonEn: "Proposal-first incremental work is easier to sustain in existing repos.",
        },
        {
            titleZh: "并行推进",
            titleEn: "Parallel execution",
            id: "superpowers",
            reasonZh: "技能化与并行维度较高。",
            reasonEn: "Higher when skills and parallel threads matter.",
        },
    ],
    opencode: [
        {
            titleZh: "OpenCode 首位",
            titleEn: "OpenCode leader",
            id: "superpowers",
            reasonZh: "技能库和并行拆分，开放宿主适配高。",
            reasonEn: "High fit for open hosts with skill libraries and parallel tasking.",
        },
        {
            titleZh: "低负担",
            titleEn: "Low-overhead option",
            id: "gsd",
            reasonZh: "快速试验场景下的低规范负担选项。",
            reasonEn: "Low-formality option for quick experiments.",
        },
        {
            titleZh: "增量交付",
            titleEn: "Incremental shipping",
            id: "openspec",
            reasonZh: "在开放宿主里也能保留 proposal/delta 节奏。",
            reasonEn: "Keeps proposal/delta discipline even inside more flexible hosts.",
        },
    ],
};
const COMPARE_DIMENSION_IDS_HOME = [
    "new_project",
    "existing_repo",
    "long_task",
    "setup_speed",
];
const COMPARE_DIMENSION_IDS_FULL = [
    "new_project",
    "existing_repo",
    "long_task",
    "setup_speed",
    "multi_agent",
    "context_control",
    "claude_fit",
    "codex_fit",
    "opencode_fit",
];
function primaryTopCardConfig(hostId) {
    const card = TOP_CARD_CONFIGS[hostId][0] ?? TOP_CARD_CONFIGS.general[0];
    if (!card) {
        throw new Error(`Missing top card config for host ${hostId}`);
    }
    return card;
}
function backupTopCardConfig(hostId) {
    const card = TOP_CARD_CONFIGS[hostId][1] ?? TOP_CARD_CONFIGS.general[1] ?? primaryTopCardConfig(hostId);
    if (!card) {
        throw new Error(`Missing backup top card config for host ${hostId}`);
    }
    return card;
}
const RANK_EXPLANATIONS = {
    general: {
        openspec: {
            zh: "结构、执行和上手成本均衡度高，位列总榜首位。",
            en: "Balanced structure, execution, and setup cost place it at the top overall.",
        },
        speckit: {
            zh: "规范与任务拆解得分较高，greenfield 启动适配高。",
            en: "High specification and decomposition scores for greenfield starts.",
        },
    },
    "claude-code": {
        gstack: {
            zh: "Claude Code 适配分高，角色分离和规划能力也较高。",
            en: "High Claude Code fit, with role separation and planning depth.",
        },
        openspec: {
            zh: "相比更重的流程型方案，存量仓库长期演进成本更低。",
            en: "Lower long-term overhead for existing repos than heavier process-first alternatives.",
        },
    },
    codex: {
        speckit: {
            zh: "Codex 适配和 spec-first 得分都较高，位列前位。",
            en: "High Codex fit and spec-first scores place it near the top.",
        },
        openspec: {
            zh: "持续改造场景下稳定性较高。",
            en: "Higher stability under continuous iteration.",
        },
    },
    opencode: {
        superpowers: {
            zh: "开放宿主下技能化与并行维度得分较高。",
            en: "High skill-composition and parallel-execution scores in open hosts.",
        },
        gsd: {
            zh: "快速试验场景下轻量路径成本较低。",
            en: "Lower overhead for quick experimentation.",
        },
    },
};
function consumerProvenance(lang) {
    return {
        mode: "curated_host_fit_demo",
        title: t(lang, "选型层，非 verifier-backed 真榜", "Selection layer, not a verifier-backed board"),
        body: t(lang, "当前层只缩小 shortlist；可验证结果、准入状态和 Wilson 区间在 Evidence Boards。", "This layer narrows the shortlist only; verified results, admission state, and Wilson intervals live in Evidence Boards."),
    };
}
function capabilityAverage(profile) {
    return (profile.specification +
        profile.planning +
        profile.execution +
        profile.context +
        profile.setup) / 5;
}
function overallScore(profile, hostId) {
    return Math.round(capabilityAverage(profile) * 0.55 + profile.fitByHost[hostId] * 0.45);
}
function decisionScores(profile) {
    return DECISION_SCORES[profile.harnessId];
}
function scoreLevel(score) {
    if (score >= 85) {
        return "very_high";
    }
    if (score >= 75) {
        return "high";
    }
    if (score >= 60) {
        return "medium";
    }
    return "low";
}
function scoreLevelLabel(score, lang) {
    switch (scoreLevel(score)) {
        case "very_high":
            return t(lang, "很强", "Very strong");
        case "high":
            return t(lang, "较强", "Strong");
        case "medium":
            return t(lang, "中等", "Moderate");
        case "low":
            return t(lang, "挑场景", "Selective");
    }
}
function compareDimensionScore(profile, id) {
    const scores = decisionScores(profile);
    switch (id) {
        case "new_project":
            return scores.newProject;
        case "existing_repo":
            return scores.existingRepo;
        case "long_task":
            return scores.longTask;
        case "setup_speed":
            return profile.setup;
        case "multi_agent":
            return scores.multiAgent;
        case "context_control":
            return profile.context;
        case "claude_fit":
            return profile.fitByHost["claude-code"];
        case "codex_fit":
            return profile.fitByHost.codex;
        case "opencode_fit":
            return profile.fitByHost.opencode;
    }
}
function compareDimensionValue(lang, id, score) {
    const level = scoreLevel(score);
    switch (id) {
        case "new_project":
            return level === "very_high"
                ? t(lang, "新项目高", "Greenfield high")
                : level === "high"
                    ? t(lang, "新项目较高", "Greenfield medium-high")
                    : level === "medium"
                        ? t(lang, "新项目中", "Greenfield medium")
                        : t(lang, "挑场景", "Selective");
        case "existing_repo":
            return level === "very_high"
                ? t(lang, "现有仓库高", "Existing repo high")
                : level === "high"
                    ? t(lang, "增量较高", "Iteration medium-high")
                    : level === "medium"
                        ? t(lang, "存量中", "Existing repo medium")
                        : t(lang, "新项目倾向", "Greenfield leaning");
        case "long_task":
            return level === "very_high"
                ? t(lang, "长任务高", "Long-task high")
                : level === "high"
                    ? t(lang, "长链路较高", "Long-chain medium-high")
                    : level === "medium"
                        ? t(lang, "中等长度", "Medium-run fit")
                        : t(lang, "短任务倾向", "Short-task leaning");
        case "setup_speed":
            return level === "very_high"
                ? t(lang, "低配置", "Low setup")
                : level === "high"
                    ? t(lang, "配置较低", "Lower setup")
                    : level === "medium"
                        ? t(lang, "配置中", "Medium setup")
                        : t(lang, "前置配置较多", "More upfront setup");
        case "multi_agent":
            return level === "very_high"
                ? t(lang, "多 Agent 高", "Multi-agent high")
                : level === "high"
                    ? t(lang, "并行较高", "Parallel medium-high")
                    : level === "medium"
                        ? t(lang, "轻量分工", "Light role split")
                        : t(lang, "单线程倾向", "Single-thread leaning");
        case "context_control":
            return level === "very_high"
                ? t(lang, "上下文高", "Context high")
                : level === "high"
                    ? t(lang, "上下文较高", "Context medium-high")
                    : level === "medium"
                        ? t(lang, "手动维护", "Manual hygiene")
                        : t(lang, "手动依赖高", "Manual-dependent");
        case "claude_fit":
            return level === "very_high"
                ? t(lang, "Claude Code 高适配", "High Claude Code fit")
                : level === "high"
                    ? t(lang, "Claude Code 较高", "Claude Code medium-high")
                    : level === "medium"
                        ? t(lang, "Claude Code 可用", "Usable in Claude Code")
                        : t(lang, "Claude Code 低适配", "Lower Claude fit");
        case "codex_fit":
            return level === "very_high"
                ? t(lang, "Codex 高适配", "High Codex fit")
                : level === "high"
                    ? t(lang, "Codex 较高", "Codex medium-high")
                    : level === "medium"
                        ? t(lang, "Codex 可用", "Usable in Codex")
                        : t(lang, "Codex 低适配", "Lower Codex fit");
        case "opencode_fit":
            return level === "very_high"
                ? t(lang, "OpenCode 高适配", "High OpenCode fit")
                : level === "high"
                    ? t(lang, "OpenCode 较高", "OpenCode medium-high")
                    : level === "medium"
                        ? t(lang, "OpenCode 可用", "Usable in OpenCode")
                        : t(lang, "OpenCode 低适配", "Lower OpenCode fit");
    }
}
function compareDimensionSummary(lang, id, profile, score) {
    switch (id) {
        case "new_project":
            return score >= 85
                ? t(lang, `${profile.label} 的规范与任务拆解完整度较高，greenfield 启动适配高。`, `${profile.label} has higher structure for greenfield setup.`)
                : score >= 70
                    ? t(lang, `${profile.label} 可覆盖新项目起步，范围收敛后更稳定。`, `${profile.label} can cover greenfield starts and stabilizes as scope narrows.`)
                    : t(lang, `${profile.label} 对已有边界的工作适配更高。`, `${profile.label} has higher fit when some structure already exists.`);
        case "existing_repo":
            return score >= 85
                ? t(lang, `${profile.label} 围绕具体改动推进的稳定性较高。`, `${profile.label} has higher stability around concrete deltas.`)
                : score >= 70
                    ? t(lang, `${profile.label} 能接住存量仓库，修改边界清晰时更稳定。`, `${profile.label} can work in an existing repo, especially once the change boundary is clear.`)
                    : t(lang, `${profile.label} 放在复杂存量仓库里呈现条件型适配。`, `${profile.label} is more selective once the repo already has a lot of history and complexity.`);
        case "long_task":
            return score >= 85
                ? t(lang, `${profile.label} 对长链路任务里的节奏、角色和上下文保持度较高。`, `${profile.label} has higher retention of pace, roles, and context across long task chains.`)
                : score >= 70
                    ? t(lang, `${profile.label} 可覆盖较长任务，重型持续编排维度较低。`, `${profile.label} can cover longer tasks, with lower fit for heavy continuous orchestration.`)
                    : t(lang, `${profile.label} 短回合推进适配更高。`, `${profile.label} has higher fit for shorter bursts than marathon-style delivery.`);
        case "setup_speed":
            return score >= 85
                ? t(lang, `${profile.label} 前置配置少，产出前等待成本较低。`, `${profile.label} has low upfront ceremony and lower waiting cost before production work.`)
                : score >= 70
                    ? t(lang, `${profile.label} 上手成本中低，但存在基本流程约束。`, `${profile.label} has medium-low setup cost with basic workflow constraints.`)
                    : t(lang, `${profile.label} 需要角色、流程或技能库的前置投入。`, `${profile.label} needs upfront investment in roles, process, or skills.`);
        case "multi_agent":
            return score >= 85
                ? t(lang, `${profile.label} 角色拆分、技能编排或并行推进维度较高。`, `${profile.label} scores high on role splitting, skill orchestration, and parallel execution.`)
                : score >= 70
                    ? t(lang, `${profile.label} 支持轻中度分工，多 Agent 不是唯一主轴。`, `${profile.label} supports light-to-medium role splitting, while multi-agent work is not the only axis.`)
                    : t(lang, `${profile.label} 单线推进适配更高，重型多 Agent 编排适配较低。`, `${profile.label} has higher single-thread fit and lower heavy multi-agent fit.`);
        case "context_control":
            return score >= 85
                ? t(lang, `${profile.label} 的上下文边界和加载方式较清晰，长会话保持度较高。`, `${profile.label} keeps clearer context boundaries and higher long-session retention.`)
                : score >= 70
                    ? t(lang, `${profile.label} 有一定上下文组织能力，但仍依赖使用习惯。`, `${profile.label} offers some context discipline, but still depends on operator habits.`)
                    : t(lang, `${profile.label} 更依赖手动上下文维护。`, `${profile.label} depends more on manual context hygiene.`);
        case "claude_fit":
            return score >= 85
                ? t(lang, `${profile.label} 在 Claude Code 里的适配分较高，组合特征更鲜明。`, `${profile.label} has high Claude Code fit and a clearer pairing profile there.`)
                : score >= 70
                    ? t(lang, `${profile.label} 在 Claude Code 里可用，但组合特征不算鲜明。`, `${profile.label} works in Claude Code, though the pairing profile is less distinct.`)
                    : t(lang, `${profile.label} 在 Claude Code 里的适配分较低。`, `${profile.label} has lower fit inside Claude Code.`);
        case "codex_fit":
            return score >= 85
                ? t(lang, `${profile.label} 在 Codex 里的结构化执行适配分较高。`, `${profile.label} has high structured-execution fit inside Codex.`)
                : score >= 70
                    ? t(lang, `${profile.label} 在 Codex 里可用，但更看具体任务类型。`, `${profile.label} is usable in Codex, but fit depends more on the task shape.`)
                    : t(lang, `${profile.label} 在 Codex 里的适配分较低。`, `${profile.label} has lower fit inside Codex.`);
        case "opencode_fit":
            return score >= 85
                ? t(lang, `${profile.label} 在 OpenCode 这类开放宿主里适配分较高。`, `${profile.label} has higher fit in open hosts like OpenCode.`)
                : score >= 70
                    ? t(lang, `${profile.label} 在 OpenCode 里可用，但开放宿主适配分不是最高档。`, `${profile.label} works in OpenCode, though open-host fit is not in the top band.`)
                    : t(lang, `${profile.label} 在 OpenCode 里的适配分较低。`, `${profile.label} has lower fit inside OpenCode.`);
    }
}
function findHarness(harnessId) {
    const harness = HARNESSES.find((item) => item.harnessId === harnessId);
    if (!harness) {
        throw new Error(`Unknown harness id: ${harnessId}`);
    }
    return harness;
}
function rankConfidence(hostFit, lang) {
    if (hostFit >= 90) {
        return t(lang, "编辑置信：中高", "Editorial confidence: medium-high");
    }
    if (hostFit >= 80) {
        return t(lang, "编辑置信：中等", "Editorial confidence: medium");
    }
    return t(lang, "编辑置信：观察中", "Editorial confidence: watchlist");
}
function rankWhy(profile, hostId, lang) {
    const mapped = RANK_EXPLANATIONS[hostId]?.[profile.harnessId];
    if (mapped) {
        return t(lang, mapped.zh, mapped.en);
    }
    return t(lang, `${profile.label} 在这个宿主里的主要优势是 ${profile.bestForZh}。`, `${profile.label} stands out here for ${profile.bestForEn.toLowerCase()}.`);
}
function basisMetrics(profile, hostId) {
    const metrics = [
        { id: "host_fit", value: profile.fitByHost[hostId] },
        { id: "specification", value: profile.specification },
        { id: "planning", value: profile.planning },
        { id: "execution", value: profile.execution },
        { id: "context", value: profile.context },
        { id: "setup", value: profile.setup },
    ];
    return metrics
        .sort((left, right) => right.value - left.value)
        .slice(0, 2)
        .map((item) => item.id);
}
function buildCompareFrameworks(lang) {
    return HARNESSES.map((item) => ({
        harness_id: item.harnessId,
        label: item.label,
        tagline: t(lang, item.taglineZh, item.taglineEn),
        best_for: t(lang, item.bestForZh, item.bestForEn),
    }));
}
function buildCompareDimensions(lang, ids) {
    const builders = {
        new_project: {
            id: "new_project",
            dimension: t(lang, "新项目适配", "New project fit"),
            short_label: t(lang, "新项目", "New project"),
            description: t(lang, "greenfield 启动适配", "Greenfield setup fit"),
        },
        existing_repo: {
            id: "existing_repo",
            dimension: t(lang, "现有仓库适配", "Existing repo fit"),
            short_label: t(lang, "现有仓库", "Existing repo"),
            description: t(lang, "增量改造稳定性", "Repo iteration stability"),
        },
        long_task: {
            id: "long_task",
            dimension: t(lang, "长任务稳定性", "Long-task stability"),
            short_label: t(lang, "长任务", "Long task"),
            description: t(lang, "长链路保持度", "Long-chain retention"),
        },
        setup_speed: {
            id: "setup_speed",
            dimension: t(lang, "上手速度", "Setup speed"),
            short_label: t(lang, "上手", "Setup"),
            description: t(lang, "前置配置成本", "Setup overhead"),
        },
        multi_agent: {
            id: "multi_agent",
            dimension: t(lang, "多 Agent / 编排", "Multi-agent / orchestration"),
            short_label: t(lang, "多 Agent", "Multi-agent"),
            description: t(lang, "角色分工与并行支持", "Role and parallel support"),
        },
        context_control: {
            id: "context_control",
            dimension: t(lang, "上下文控制", "Context control"),
            short_label: t(lang, "上下文", "Context"),
            description: t(lang, "上下文边界清晰度", "Context boundary clarity"),
        },
        claude_fit: {
            id: "claude_fit",
            dimension: t(lang, "Claude Code 适配", "Claude Code fit"),
            short_label: t(lang, "Claude", "Claude"),
            description: t(lang, "Claude Code 适配度", "Claude Code fit"),
        },
        codex_fit: {
            id: "codex_fit",
            dimension: t(lang, "Codex 适配", "Codex fit"),
            short_label: t(lang, "Codex", "Codex"),
            description: t(lang, "Codex 适配度", "Codex fit"),
        },
        opencode_fit: {
            id: "opencode_fit",
            dimension: t(lang, "OpenCode 适配", "OpenCode fit"),
            short_label: t(lang, "OpenCode", "OpenCode"),
            description: t(lang, "开放宿主适配度", "Open-host fit"),
        },
    };
    return ids.map((id) => ({
        id,
        dimension: builders[id].dimension,
        short_label: builders[id].short_label,
        description: builders[id].description,
        values: HARNESSES.map((profile) => {
            const score = compareDimensionScore(profile, id);
            return {
                harness_id: profile.harnessId,
                score,
                level: scoreLevel(score),
                level_label: scoreLevelLabel(score, lang),
                value: compareDimensionValue(lang, id, score),
                summary: compareDimensionSummary(lang, id, profile, score),
            };
        }),
    }));
}
function hostOptions(lang) {
    return HOST_IDS.map((hostId) => {
        const meta = HOST_META[hostId];
        const topCard = primaryTopCardConfig(hostId);
        const backupCard = backupTopCardConfig(hostId);
        const harness = findHarness(topCard.id);
        const backupHarness = findHarness(backupCard.id);
        const overall = overallScore(harness, hostId);
        const decision = decisionScores(harness);
        return {
            host_id: hostId,
            badge_label: t(lang, meta.badgeZh, meta.badgeEn),
            title: t(lang, meta.titleZh, meta.titleEn),
            summary: t(lang, meta.summaryZh, meta.summaryEn),
            recommended_for: t(lang, meta.recommendedForZh, meta.recommendedForEn),
            default_pick_harness_id: harness.harnessId,
            default_pick_label: harness.label,
            default_pick_reason: t(lang, topCard.reasonZh, topCard.reasonEn),
            backup_pick_harness_id: backupHarness.harnessId,
            backup_pick_label: backupHarness.label,
            backup_pick_reason: t(lang, backupCard.reasonZh, backupCard.reasonEn),
            backup_pick_href: `/leaderboards/${hostId}`,
            score: overall,
            level: scoreLevel(overall),
            level_label: scoreLevelLabel(overall, lang),
            default_pick_score: overall,
            host_fit_score: harness.fitByHost[hostId],
            new_project_score: decision.newProject,
            existing_repo_score: decision.existingRepo,
            long_task_score: decision.longTask,
            setup_score: harness.setup,
            multi_agent_score: decision.multiAgent,
            href: `/leaderboards/${hostId}`,
        };
    });
}
function leaderboardRows(hostId, lang) {
    return HARNESSES
        .map((profile) => ({
        profile,
        score: overallScore(profile, hostId),
        decision: decisionScores(profile),
    }))
        .sort((left, right) => right.score - left.score)
        .map(({ profile, score, decision }, index) => ({
        rank: index + 1,
        harness_id: profile.harnessId,
        harness_label: profile.label,
        tagline: t(lang, profile.taglineZh, profile.taglineEn),
        overall_score: score,
        host_fit_score: profile.fitByHost[hostId],
        specification_score: profile.specification,
        planning_score: profile.planning,
        execution_score: profile.execution,
        context_score: profile.context,
        setup_score: profile.setup,
        new_project_score: decision.newProject,
        existing_repo_score: decision.existingRepo,
        long_task_score: decision.longTask,
        multi_agent_score: decision.multiAgent,
        best_for: t(lang, profile.bestForZh, profile.bestForEn),
        watch_outs: t(lang, profile.watchOutsZh, profile.watchOutsEn),
        evidence_label: t(lang, profile.evidenceLabelZh, profile.evidenceLabelEn),
        scenario_tags: t(lang, profile.scenarioTagsZh.join(" • "), profile.scenarioTagsEn.join(" • ")).split(" • "),
        why_this_rank: rankWhy(profile, hostId, lang),
        confidence_label: rankConfidence(profile.fitByHost[hostId], lang),
        evidence_strength: t(lang, "证据层：策展归纳", "Evidence layer: curated synthesis"),
        updated_at: LAST_UPDATED,
        evidence_cta: t(lang, "证据层", "Evidence"),
        evidence_href: EVIDENCE_BOARD_HREF,
        basis_metric_ids: basisMetrics(profile, hostId),
    }));
}
function topCards(hostId, lang) {
    const rows = leaderboardRows(hostId, lang);
    const byId = new Map(rows.map((row) => [row.harness_id, row]));
    return TOP_CARD_CONFIGS[hostId]
        .map((card) => {
        const row = byId.get(card.id);
        if (!row) {
            return undefined;
        }
        return {
            title: t(lang, card.titleZh, card.titleEn),
            harness_id: row.harness_id,
            harness_label: row.harness_label,
            source_rank: row.rank,
            score: row.overall_score,
            level: scoreLevel(row.overall_score),
            level_label: scoreLevelLabel(row.overall_score, lang),
            summary: row.best_for,
            reason: t(lang, card.reasonZh, card.reasonEn),
            why_this_rank: row.why_this_rank,
            confidence_label: row.confidence_label,
            evidence_strength: row.evidence_strength,
            updated_at: row.updated_at,
            href: `#harness-${row.harness_id}`,
            evidence_href: row.evidence_href,
            evidence_cta: t(lang, "证据层", "Evidence"),
            basis_metric_ids: row.basis_metric_ids,
        };
    })
        .filter((value) => Boolean(value));
}
function quickPicks(lang) {
    return [
        {
            title: t(lang, "新项目", "Greenfield"),
            harness_label: "SpecKit",
            reason: t(lang, "结构化启动维度高。", "High fit for structured greenfield starts."),
            href: "/leaderboards/codex",
        },
        {
            title: t(lang, "长任务", "Long tasks"),
            harness_label: "gstack",
            reason: t(lang, "长任务、多轮实现和角色拆分维度高。", "High fit for long, multi-step work."),
            href: "/leaderboards/claude-code",
        },
        {
            title: t(lang, "现有仓库", "Existing repos"),
            harness_label: "OpenSpec",
            reason: t(lang, "proposal-first 增量交付稳定性较高。", "Higher stability for proposal-first iteration."),
            href: "/leaderboards/general",
        },
        {
            title: t(lang, "并行推进", "Parallel work"),
            harness_label: "Superpowers",
            reason: t(lang, "开放宿主下并行维度较高。", "High parallel-work fit in open hosts."),
            href: "/leaderboards/opencode",
        },
        {
            title: t(lang, "低负担", "Low overhead"),
            harness_label: "GSD",
            reason: t(lang, "小项目低负担启动。", "Low-overhead start for smaller projects."),
            href: "/leaderboards/general",
        },
        {
            title: t(lang, "企业治理型", "Governance-heavy"),
            harness_label: "BMAD Method",
            reason: t(lang, "多角色、重流程和企业治理维度高。", "High fit for multi-role governance-heavy delivery."),
            href: "/compare",
        },
    ];
}
export function buildConsumerHomePageView(lang = DEFAULT_UI_LANGUAGE) {
    return {
        lang,
        hero_title: t(lang, "宿主适配榜。", "Host-fit boards."),
        hero_body: t(lang, "宿主适配、替代项、证据边界。", "Host fit, alternatives, evidence boundary."),
        host_options: hostOptions(lang),
        quick_picks: quickPicks(lang),
        compare_preview: {
            title: t(lang, "横向对比快照", "Comparison snapshot"),
            summary: t(lang, "新项目、现有仓库、长任务和上手速度四个切口。", "Four cuts: greenfield, existing repo, long task, and setup speed."),
            frameworks: buildCompareFrameworks(lang),
            dimensions: buildCompareDimensions(lang, COMPARE_DIMENSION_IDS_HOME),
        },
        evidence_bridge: [
            {
                title: t(lang, "分榜", "Leaderboards"),
                description: t(lang, "宿主适配候选项。", "Host-fit candidates."),
                href: "/leaderboards/general",
                cta: t(lang, "总榜", "General board"),
            },
            {
                title: t(lang, "证据层", "Evidence"),
                description: t(lang, "准入状态、置信区间和证据摘要。", "Admission state, confidence intervals, and evidence summaries."),
                href: EVIDENCE_BOARD_HREF,
                cta: t(lang, "Evidence Boards", "Evidence Boards"),
            },
            {
                title: t(lang, "协议/校验", "Protocol & validator"),
                description: t(lang, "schema、bundle 和准入缺口。", "Schema, bundle shape, and admission gaps."),
                href: "/protocol",
                cta: t(lang, "Protocol", "Protocol"),
            },
        ],
        methodology_note: consumerProvenance(lang),
    };
}
export function buildHostLeaderboardPageView(hostId, lang = DEFAULT_UI_LANGUAGE) {
    const meta = HOST_META[hostId];
    const rows = leaderboardRows(hostId, lang);
    return {
        lang,
        host_id: hostId,
        title: t(lang, meta.titleZh, meta.titleEn),
        subtitle: t(lang, meta.summaryZh, meta.summaryEn),
        hero_title: t(lang, `${t(lang, meta.titleZh, meta.titleEn)} · 首位。`, `${t(lang, meta.titleZh, meta.titleEn)} · top pick.`),
        hero_body: t(lang, "策展排序；验证状态见 Evidence Boards。", "Curated ranking; verification status in Evidence Boards."),
        host_options: hostOptions(lang),
        top_cards: topCards(hostId, lang),
        table_intro: t(lang, "策展视图：宿主适配、关键能力、风险提示、证据入口。", "Curated view: host fit, key capabilities, trade-offs, and evidence path."),
        rows,
        scenario_pills: t(lang, "新项目 • 现有仓库 • 长任务 • 多 Agent", "New project • Existing repo • Long task • Multi-agent").split(" • "),
        explanation_blocks: [
            {
                title: t(lang, "宿主分榜", "Host-specific ranking"),
                body: t(lang, "宿主差异影响适配分；按工具分榜。", "Host differences affect fit scores; boards remain tool-specific."),
            },
            {
                title: t(lang, "证据边界", "Evidence boundary"),
                body: t(lang, "当前层是选型视图；verifier-backed 证据仍在 Evidence Boards。", "This layer is a selection view; verifier-backed evidence still lives in Evidence Boards."),
            },
        ],
        methodology_note: consumerProvenance(lang),
    };
}
export function buildHarnessComparePageView(lang = DEFAULT_UI_LANGUAGE) {
    return {
        lang,
        title: t(lang, "Harness 对比", "Harness comparison"),
        subtitle: t(lang, "Shortlist 矩阵。", "Shortlist matrix."),
        intro: t(lang, "维度：新项目、现有仓库、长任务、上手速度、多 Agent、上下文控制，以及 Claude Code / Codex / OpenCode 适配。", "Dimensions: greenfield work, existing repos, long tasks, setup speed, multi-agent support, context control, and fit for Claude Code / Codex / OpenCode."),
        host_options: hostOptions(lang),
        frameworks: buildCompareFrameworks(lang),
        dimensions: buildCompareDimensions(lang, COMPARE_DIMENSION_IDS_FULL),
        notes: [
            t(lang, "Claude Code / Codex / OpenCode 对应分榜保留宿主差异。", "Claude Code / Codex / OpenCode boards keep host-specific differences."),
            t(lang, "做现有仓库增量迭代时，OpenSpec 在该维度较高。", "For existing repos and incremental delivery, OpenSpec scores high on that dimension."),
            t(lang, "多 Agent、长任务、强编排集中在 gstack / BMAD / Superpowers。", "Multi-agent, long-task, and orchestration strength cluster around gstack / BMAD / Superpowers."),
        ],
        methodology_note: consumerProvenance(lang),
    };
}
//# sourceMappingURL=consumer-leaderboards.js.map