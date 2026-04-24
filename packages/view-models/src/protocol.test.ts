import { describe, expect, it } from "vitest";
import {
  buildProtocolFieldEntry,
  buildProtocolIndexView,
  buildProtocolObjectEntry,
  buildProtocolPageView,
} from "./protocol.js";

describe("protocol view-model v0.2/v0.3", () => {
  it("exposes the governance lifecycle, six gates, solo-operator flow, and uncertainty-aware ranking", () => {
    const view = buildProtocolPageView(undefined, "en");

    expect(view.version).toBe("OHBP v0.2");
    expect(view.sections.some((section) => section.id === "state-machine")).toBe(true);
    expect(view.sections.some((section) => section.id === "six-gates")).toBe(true);
    expect(view.sections.some((section) => section.id === "uncertainty-aware-ranking")).toBe(true);
    expect(view.sections.some((section) => section.id === "solo-operator-flow")).toBe(true);
    expect(
      view.implementation_links.some(
        (link) => link.href === "/api/protocol/fields/publication_state",
      ),
    ).toBe(true);
    expect(
      view.implementation_links.some(
        (link) => link.href === "/api/protocol/fields/board_disposition",
      ),
    ).toBe(true);
    expect(
      view.implementation_links.some(
        (link) => link.href === "/api/protocol/fields/governance_directives",
      ),
    ).toBe(true);
    expect(
      view.implementation_links.some(
        (link) => link.href === "/api/protocol/objects/governance-directive",
      ),
    ).toBe(true);
  });

  it("indexes governance-related fields and objects for protocol browsing", () => {
    const index = buildProtocolIndexView("zh-CN");
    const boardDisposition = buildProtocolFieldEntry("board_disposition", "zh-CN");
    const governanceDirectives = buildProtocolFieldEntry("governance_directives", "zh-CN");
    const governanceDirectiveObject = buildProtocolObjectEntry("governance-directive", "zh-CN");

    expect(index.version).toBe("OHBP v0.2");
    expect(index.fields.some((field) => field.field === "publication_state")).toBe(true);
    expect(index.fields.some((field) => field.field === "board_disposition")).toBe(true);
    expect(index.fields.some((field) => field.field === "governance_directives")).toBe(true);
    expect(boardDisposition?.value_domain).toBe("active | suspended | historical_only | hidden");
    expect(governanceDirectives?.used_by).toContain("state history");
    expect(governanceDirectiveObject?.used_for).toContain("board suspension");
  });

  it("supports governance search paths with human-readable summaries", () => {
    const searchView = buildProtocolPageView("governance", "en");

    expect(searchView.query).toBe("governance");
    expect(searchView.search_summary).toContain('Search "governance"');
    expect(searchView.sections.some((section) => section.id === "state-machine")).toBe(true);
    expect(searchView.object_map.some((object) => object.id === "governance-directive")).toBe(true);
    expect(searchView.glossary.some((field) => field.field === "governance_directives")).toBe(
      true,
    );
  });
});
