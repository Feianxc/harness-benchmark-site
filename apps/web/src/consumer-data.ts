import {
  buildConsumerHomePageView,
  buildHarnessComparePageView,
  buildHostLeaderboardPageView,
  type ConsumerHomePageView,
  type HarnessComparePageView,
  type HostId,
  type HostLeaderboardPageView,
  type UiLanguage,
} from "@ohbp/view-models";

export async function loadConsumerHomeView(
  lang: UiLanguage,
): Promise<ConsumerHomePageView> {
  return buildConsumerHomePageView(lang);
}

export async function loadHostLeaderboardView(
  hostId: HostId,
  lang: UiLanguage,
): Promise<HostLeaderboardPageView> {
  return buildHostLeaderboardPageView(hostId, lang);
}

export async function loadHarnessCompareView(
  lang: UiLanguage,
): Promise<HarnessComparePageView> {
  return buildHarnessComparePageView(lang);
}
