export type UiLanguage = "zh-CN" | "en";

export const DEFAULT_UI_LANGUAGE: UiLanguage = "zh-CN";

export function resolveUiLanguage(value: string | null | undefined): UiLanguage {
  return value === "en" ? "en" : DEFAULT_UI_LANGUAGE;
}

export function isEnglish(lang: UiLanguage): boolean {
  return lang === "en";
}

export function t(lang: UiLanguage, zhCN: string, en: string): string {
  return isEnglish(lang) ? en : zhCN;
}
