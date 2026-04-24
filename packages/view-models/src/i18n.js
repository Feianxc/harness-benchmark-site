export const DEFAULT_UI_LANGUAGE = "zh-CN";
export function resolveUiLanguage(value) {
    return value === "en" ? "en" : DEFAULT_UI_LANGUAGE;
}
export function isEnglish(lang) {
    return lang === "en";
}
export function t(lang, zhCN, en) {
    return isEnglish(lang) ? en : zhCN;
}
//# sourceMappingURL=i18n.js.map