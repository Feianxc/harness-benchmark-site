import { type UiLanguage } from "./i18n.js";
import type { ProtocolFieldGlossaryEntry, ProtocolIndexView, ProtocolObjectEntry, ProtocolPageView } from "./types.js";
export declare function buildProtocolIndexView(lang?: UiLanguage): ProtocolIndexView;
export declare function buildProtocolObjectEntry(objectId: string, lang?: UiLanguage): ProtocolObjectEntry | undefined;
export declare function buildProtocolFieldEntry(fieldId: string, lang?: UiLanguage): ProtocolFieldGlossaryEntry | undefined;
export declare function buildProtocolPageView(rawQuery?: string, lang?: UiLanguage): ProtocolPageView;
//# sourceMappingURL=protocol.d.ts.map