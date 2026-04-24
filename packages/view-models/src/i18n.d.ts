export type UiLanguage = "zh-CN" | "en";
export declare const DEFAULT_UI_LANGUAGE: UiLanguage;
export declare function resolveUiLanguage(value: string | null | undefined): UiLanguage;
export declare function isEnglish(lang: UiLanguage): boolean;
export declare function t(lang: UiLanguage, zhCN: string, en: string): string;
//# sourceMappingURL=i18n.d.ts.map