import { type UiLanguage } from "./i18n.js";
import type { ConsumerHomePageView, HarnessComparePageView, HostId, HostLeaderboardPageView } from "./types.js";
export declare const HOST_IDS: ["general", "claude-code", "codex", "opencode"];
export declare function isHostId(value: string): value is HostId;
export declare function buildConsumerHomePageView(lang?: UiLanguage): ConsumerHomePageView;
export declare function buildHostLeaderboardPageView(hostId: HostId, lang?: UiLanguage): HostLeaderboardPageView;
export declare function buildHarnessComparePageView(lang?: UiLanguage): HarnessComparePageView;
//# sourceMappingURL=consumer-leaderboards.d.ts.map