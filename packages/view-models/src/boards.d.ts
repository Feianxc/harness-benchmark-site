import { type BoardId, type PublicationRecord } from "@ohbp/verifier-core";
import { type UiLanguage } from "./i18n.js";
import type { BoardPageView, BoardSliceSummaryView, HomePageView } from "./types.js";
export declare function listBoardSlices(boardId: BoardId, publications: PublicationRecord[], lang?: UiLanguage): BoardSliceSummaryView[];
export declare function buildBoardPageView(boardId: BoardId, publications: PublicationRecord[], requestedSliceId?: string, lang?: UiLanguage): BoardPageView;
export declare function buildAllBoardViews(publications: PublicationRecord[], lang?: UiLanguage): BoardPageView[];
export declare function buildHomePageView(boardViews: BoardPageView[], lang?: UiLanguage): HomePageView;
//# sourceMappingURL=boards.d.ts.map