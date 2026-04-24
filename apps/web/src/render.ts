import type {
  BoardEntrySummaryView,
  BoardPageView,
  ConsumerHomePageView,
  EntryDetailView,
  HarnessComparePageView,
  HomePageView,
  HostLeaderboardPageView,
  HostLeaderboardRowView,
  ProtocolPageView,
  UiLanguage,
  ValidatorRunView,
} from "@ohbp/view-models";
import type { PublicSubmissionReceipt } from "./public-submissions.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function badge(label: string, tone: "neutral" | "success" | "warning" = "neutral"): string {
  return `<span class="badge badge-${tone}">${escapeHtml(label)}</span>`;
}

function t(lang: UiLanguage, zhCN: string, en: string): string {
  return lang === "en" ? en : zhCN;
}

function withLang(href: string, lang: UiLanguage): string {
  if (href.startsWith("#")) {
    return href;
  }

  const url = new URL(href, "http://ohbp.local");
  url.searchParams.set("lang", lang);
  return `${url.pathname}${url.search}${url.hash}`;
}

interface PageRenderContext {
  currentPath: string;
}

interface ValidatorPageOptions {
  lang: UiLanguage;
  mode: "schema_only" | "bundle_integrity" | "admission_readiness";
  activeSampleId?: string;
  samples: Array<{
    id: string;
    title: string;
    description: string;
    recommended_mode: "schema_only" | "bundle_integrity" | "admission_readiness";
  }>;
}

interface SubmitPageOptions {
  lang: UiLanguage;
  receipt?: PublicSubmissionReceipt;
  error?: string;
  intakeEnabled?: boolean;
}

function validatorModeLabel(
  lang: UiLanguage,
  mode: ValidatorPageOptions["mode"],
): string {
  if (mode === "schema_only") {
    return t(lang, "仅 Schema", "Schema only");
  }

  if (mode === "bundle_integrity") {
    return t(lang, "Bundle 完整性", "Bundle integrity");
  }

  return t(lang, "Admission 就绪度", "Admission readiness");
}

function renderSimpleMetaList(items: Array<{ label: string; value: string }>): string {
  return `
    <dl class="meta-grid">
      ${items
        .map(
          (item) => `
            <div>
              <dt>${escapeHtml(item.label)}</dt>
              <dd>${escapeHtml(item.value)}</dd>
            </div>
          `,
        )
        .join("")}
    </dl>
  `;
}

function renderBulletList(items: string[], emptyText: string): string {
  return items.length > 0
    ? `<ul class="bullet-list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : `<p class="muted">${escapeHtml(emptyText)}</p>`;
}

function renderProvenanceNotice(
  lang: UiLanguage,
  note:
    | HomePageView["data_provenance"]
    | BoardPageView["data_provenance"]
    | EntryDetailView["data_provenance"],
): string {
  if (!note) {
    return "";
  }

  return `
    <section class="section">
      <div class="panel stack">
        <div class="inline">
          ${badge(note.mode === "runtime_public_plus_demo_fallback" ? t(lang, "演示补层", "demo fallback") : t(lang, "运行时公开数据", "runtime public"), "warning")}
        </div>
        <h3>${escapeHtml(note.title)}</h3>
        <p class="muted">${escapeHtml(note.body)}</p>
      </div>
    </section>
  `;
}

function pageShell(
  title: string,
  body: string,
  options: { lang: UiLanguage; currentPath: string },
): string {
  const { lang, currentPath } = options;
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${escapeHtml(t(lang, "宿主榜、证据边界与候选池。", "Host boards, evidence boundaries, and public intake."))}" />
    <title>${escapeHtml(title)}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: oklch(0.965 0.006 245);
        --bg-soft: oklch(0.935 0.009 245);
        --panel: oklch(0.992 0.003 245);
        --panel-soft: oklch(0.972 0.006 245);
        --line: oklch(0.865 0.012 245);
        --line-strong: oklch(0.79 0.018 245);
        --text: oklch(0.22 0.028 250);
        --muted: oklch(0.49 0.018 250);
        --muted-strong: oklch(0.36 0.022 250);
        --accent: oklch(0.43 0.09 248);
        --accent-strong: oklch(0.31 0.075 248);
        --good: oklch(0.42 0.105 160);
        --warn: oklch(0.48 0.12 55);
        --good-soft: oklch(0.95 0.026 160);
        --warn-soft: oklch(0.955 0.028 70);
        --accent-soft: oklch(0.94 0.025 248);
        --shadow: 0 1px 0 rgba(22, 31, 46, 0.06);
        --tone-claude: oklch(0.43 0.09 280);
        --tone-claude-soft: oklch(0.94 0.022 280);
        --tone-claude-line: oklch(0.82 0.035 280);
        --tone-codex: oklch(0.42 0.075 185);
        --tone-codex-soft: oklch(0.94 0.02 185);
        --tone-codex-line: oklch(0.82 0.035 185);
        --tone-opencode: oklch(0.42 0.09 155);
        --tone-opencode-soft: oklch(0.94 0.022 155);
        --tone-opencode-line: oklch(0.82 0.04 155);
        --tone-general: oklch(0.47 0.09 75);
        --tone-general-soft: oklch(0.95 0.026 80);
        --tone-general-line: oklch(0.84 0.04 80);
        --tone-gstack: var(--tone-claude);
        --tone-gstack-soft: var(--tone-claude-soft);
        --tone-gstack-line: var(--tone-claude-line);
        --tone-speckit: var(--tone-codex);
        --tone-speckit-soft: var(--tone-codex-soft);
        --tone-speckit-line: var(--tone-codex-line);
        --tone-openspec: var(--tone-general);
        --tone-openspec-soft: var(--tone-general-soft);
        --tone-openspec-line: var(--tone-general-line);
        --tone-superpowers: var(--tone-opencode);
        --tone-superpowers-soft: var(--tone-opencode-soft);
        --tone-superpowers-line: var(--tone-opencode-line);
        --tone-bmad-method: oklch(0.45 0.105 45);
        --tone-bmad-method-soft: oklch(0.95 0.025 55);
        --tone-bmad-method-line: oklch(0.84 0.045 55);
        --tone-gsd: oklch(0.42 0.02 245);
        --tone-gsd-soft: oklch(0.955 0.006 245);
        --tone-gsd-line: oklch(0.83 0.012 245);
      }

      * { box-sizing: border-box; }
      html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
      body {
        margin: 0;
        font-family: Aptos, "Segoe UI", ui-sans-serif, system-ui, -apple-system, sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.55;
      }
      a { color: inherit; text-decoration: none; }
      .shell { max-width: 1240px; margin: 0 auto; padding: 0 24px 80px; }
      header.nav {
        position: sticky; top: 0; z-index: 10;
        background: color-mix(in oklch, var(--panel) 94%, transparent);
        border-bottom: 1px solid var(--line);
      }
      .nav-inner {
        max-width: 1240px; margin: 0 auto; padding: 14px 24px;
        display: flex; align-items: center; justify-content: space-between; gap: 16px;
      }
      .brand {
        font-size: 13px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--muted-strong);
        font-weight: 700;
      }
      .brand::before {
        content: "";
        display: inline-block;
        width: 8px;
        height: 8px;
        margin-right: 10px;
        border-radius: 999px;
        background: var(--accent);
        vertical-align: middle;
      }
      .nav-links, .nav-actions { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
      .nav-actions a { color: var(--muted-strong); font-size: 13px; }
      .nav-meta-label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .nav-links a, .lang-link {
        color: var(--muted-strong);
        padding: 8px 12px;
        border-radius: 999px;
      }
      .nav-links a:hover, .lang-link:hover {
        color: var(--text);
        background: var(--panel);
      }
      .lang-link.active {
        color: var(--panel);
        border: 1px solid var(--text);
        background: var(--text);
      }
      .hero {
        padding: 40px 0 20px;
        display: grid;
        grid-template-columns: minmax(0, 760px);
        gap: 12px;
      }
      .eyebrow {
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.14em;
        font-size: 11px;
        font-weight: 700;
      }
      h1, h2, h3, h4, p { margin: 0; }
      h1, h2 {
        font-family: "Iowan Old Style", "Palatino Linotype", Georgia, ui-serif, serif;
      }
      h1 { font-size: clamp(36px, 6vw, 70px); line-height: 0.94; letter-spacing: -0.045em; font-weight: 700; }
      h2 { font-size: clamp(24px, 3vw, 36px); line-height: 1.04; letter-spacing: -0.035em; font-weight: 700; }
      h3 { font-size: 18px; letter-spacing: -0.02em; }
      p.lead { color: var(--muted-strong); font-size: 17px; max-width: 62ch; }
      .grid-3, .grid-2 {
        display: grid;
        gap: 14px;
      }
      .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .section {
        padding: 22px 0;
        border-top: 1px solid var(--line);
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 16px;
        box-shadow: var(--shadow);
        min-width: 0;
        position: relative;
        overflow: hidden;
      }
      .muted { color: var(--muted); }
      .stack { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
      .inline { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; min-width: 0; }
      .badge {
        display: inline-flex; align-items: center;
        padding: 4px 8px; border-radius: 999px;
        border: 1px solid var(--line);
        background: var(--panel-soft);
        font-size: 11px; color: var(--muted-strong);
        font-weight: 600;
        max-width: 100%; overflow-wrap: anywhere;
      }
      .badge-success { border-color: rgba(6, 118, 71, 0.18); background: var(--good-soft); color: var(--good); }
      .badge-warning { border-color: rgba(181, 71, 8, 0.18); background: var(--warn-soft); color: var(--warn); }
      .table-wrap {
        overflow-x: auto;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: var(--panel);
        box-shadow: var(--shadow);
      }
      table { width: 100%; border-collapse: collapse; }
      th, td {
        text-align: left; padding: 12px 10px;
        border-bottom: 1px solid var(--line); vertical-align: top;
        overflow-wrap: anywhere;
      }
      th {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        background: #fbfcfd;
        font-weight: 700;
      }
      tr:hover td { background: #fbfdff; }
      .kpi { font-size: 28px; letter-spacing: -0.04em; }
      .meta-list, .bullet-list {
        list-style: none; padding: 0; margin: 0;
        display: flex; flex-direction: column; gap: 8px;
      }
      .bullet-list li::before {
        content: "•";
        color: var(--accent);
        margin-right: 8px;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px 20px;
      }
      .meta-grid dt { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
      .meta-grid dd { margin: 4px 0 0; word-break: break-word; }
      .hero-links {
        display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px;
      }
      .hero-links a, button, .button-link, .lang-link {
        display: inline-flex; align-items: center; justify-content: center;
        padding: 10px 14px; border-radius: 999px; border: 1px solid var(--line);
        background: var(--panel); color: var(--text);
        box-shadow: var(--shadow);
        cursor: pointer; font: inherit; text-align: center; white-space: normal;
      }
      .hero-links a:hover, button:hover, .button-link:hover {
        border-color: #cfe0ff;
        background: var(--accent-soft);
      }
      .button-primary {
        color: var(--panel) !important;
        border-color: var(--text) !important;
        background: var(--text) !important;
      }
      .button-primary:hover {
        background: var(--muted-strong) !important;
        border-color: #111827 !important;
      }
      .button-secondary {
        background: rgba(255, 255, 255, 0.84);
      }
      .lang-link { padding: 8px 12px; background: transparent; box-shadow: none; }
      input, select {
        width: 100%;
        background: var(--panel);
        color: var(--text);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 12px 14px;
        font: inherit;
      }
      textarea {
        width: 100%; min-height: 360px; resize: vertical;
        background: var(--panel); color: var(--text);
        border: 1px solid var(--line); border-radius: 18px;
        padding: 16px; font: 13px/1.5 "SFMono-Regular", Consolas, ui-monospace, monospace;
      }
      pre {
        margin: 0; white-space: pre-wrap; word-break: break-word;
        font: 13px/1.5 "SFMono-Regular", Consolas, ui-monospace, monospace;
      }
      .tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
      .tabs a {
        padding: 8px 12px; border-radius: 999px; border: 1px solid var(--line);
        color: var(--muted-strong);
        background: var(--panel);
        max-width: 100%; overflow-wrap: anywhere;
      }
      .tabs a.active {
        color: var(--panel);
        background: var(--text);
        border-color: var(--text);
      }
      .host-card {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 0;
      }
      .score-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .score-card {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 14px;
        background: var(--panel-soft);
      }
      .score-label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .score-value {
        font-size: 24px;
        letter-spacing: -0.04em;
      }
      .table-note {
        color: var(--muted);
        font-size: 13px;
      }
      .field-label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .hp-field {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
      .pill-row {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .subtle-link {
        color: var(--accent);
        font-weight: 600;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1.4fr 0.8fr;
        gap: 16px;
      }
      .map-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
      }
      .callout {
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: var(--panel-soft);
      }
      .timeline {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .timeline-item {
        padding-left: 16px;
        border-left: 1px solid var(--line-strong);
      }
      details {
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 14px 16px;
        background: var(--panel-soft);
      }
      summary {
        cursor: pointer;
        color: var(--text);
        font-weight: 600;
      }
      .search-form {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
      }
      footer {
        padding: 20px 24px 48px;
        max-width: 1240px; margin: 0 auto; color: var(--muted);
        border-top: 1px solid var(--line);
      }
      .overview-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }
      .home-strip {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 10px;
      }
      .summary-grid, .compare-card-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .summary-card {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .summary-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 10px;
      }
      .summary-rank {
        font-size: 12px;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
      }
      .score-pill {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 6px 10px;
        background: var(--accent-soft);
        border: 1px solid #cfe0ff;
        color: var(--accent-strong);
        font-size: 12px;
        font-weight: 700;
      }
      .mini-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .notice-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: #fffdf8;
        box-shadow: var(--shadow);
      }
      .notice-main {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
        flex: 1 1 420px;
      }
      .notice-main strong {
        font-size: 14px;
        line-height: 1.35;
      }
      .notice-actions {
        justify-content: flex-end;
      }
      .inline-details {
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }
      .inline-details summary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 10px 14px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: var(--panel);
        box-shadow: var(--shadow);
        font-size: 13px;
        color: var(--muted-strong);
      }
      .inline-details[open] {
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: var(--panel);
        box-shadow: var(--shadow);
      }
      .inline-details[open] summary {
        margin-bottom: 10px;
      }
      .key-metrics {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        color: var(--muted);
        font-size: 12px;
      }
      .key-metrics strong {
        color: var(--text);
      }
      .metric-inline {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
      }
      .metric-inline span {
        color: var(--muted);
        font-size: 12px;
      }
      .workflow-cell strong {
        display: inline-block;
        font-size: 15px;
        margin-bottom: 2px;
      }
      .workflow-subline {
        color: var(--muted);
        font-size: 13px;
        margin-top: 4px;
      }
      .rank-cell {
        font-weight: 700;
        white-space: nowrap;
      }
      .dense-table td, .dense-table th {
        min-width: 88px;
      }
      .dense-table td:first-child,
      .dense-table th:first-child,
      .dense-table td:nth-child(2),
      .dense-table th:nth-child(2) {
        min-width: 0;
      }
      .compare-card-grid .panel,
      .home-strip .panel,
      .overview-grid .panel {
        height: 100%;
      }
      .card-title-sm {
        font-size: 16px;
        line-height: 1.25;
      }
      .microcopy {
        color: var(--muted);
        font-size: 13px;
      }
      .notice-compact {
        align-items: center;
      }
      .hero-grid {
        grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
        align-items: end;
        gap: 24px;
      }
      .hero-grid-compact {
        grid-template-columns: minmax(0, 1fr) minmax(300px, 0.85fr);
      }
      .hero-copy {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .hero-scoreboard {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .hero-scoreboard-compact {
        grid-template-columns: 1fr;
      }
      .hero-tile {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
        border-radius: 16px;
        border: 1px solid var(--tone-line, var(--line));
        background: color-mix(in oklch, var(--tone-soft, var(--panel-soft)) 24%, var(--panel));
        box-shadow: none;
        min-height: 0;
      }
      .tile-pick {
        font-size: 20px;
        letter-spacing: -0.03em;
      }
      .tile-score {
        color: var(--text);
        font-size: 13px;
        font-weight: 600;
      }
      .tile-meta {
        color: var(--muted);
        font-size: 12px;
      }
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }
      .dashboard-card {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 18px;
      }
      .dashboard-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
      }
      .dashboard-pick {
        font-size: 24px;
        font-weight: 760;
        letter-spacing: -0.04em;
      }
      .dashboard-reason {
        color: var(--text);
        font-size: 14px;
        line-height: 1.45;
      }
      .score-cluster {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        flex-shrink: 0;
      }
      .score-cluster-left {
        align-items: flex-start;
      }
      .score-big {
        font-size: 36px;
        line-height: 0.9;
        letter-spacing: -0.06em;
        font-weight: 780;
      }
      .score-caption {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .metric-bars {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .metric-bar {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .metric-bar-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        color: var(--muted-strong);
        font-size: 12px;
      }
      .metric-bar-row strong {
        color: var(--text);
        font-size: 12px;
      }
      .bar-track {
        height: 8px;
        border-radius: 999px;
        background: #e9eef6;
        overflow: hidden;
      }
      .bar-fill {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: var(--accent);
      }
      .bar-fill.level-very_high {
        background: var(--accent);
      }
      .bar-fill.level-high {
        background: color-mix(in oklch, var(--accent) 82%, var(--panel));
      }
      .bar-fill.level-medium {
        background: var(--muted-strong);
      }
      .bar-fill.level-low {
        background: var(--warn);
      }
      .visual-section-head {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 18px;
        flex-wrap: wrap;
      }
      .toolbar-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
      }
      .toolbar-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .toolbar-label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .toolbar-pills {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .toolbar-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.88);
        color: var(--muted-strong);
        box-shadow: var(--shadow);
        font-size: 13px;
        font-weight: 600;
      }
      .toolbar-pill.active {
        color: var(--panel);
        border-color: var(--text);
        background: var(--text);
      }
      .scenario-strip {
        display: grid;
        grid-template-columns: repeat(6, minmax(0, 1fr));
        gap: 10px;
      }
      .scenario-tile {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 14px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: var(--panel);
        box-shadow: var(--shadow);
      }
      .scenario-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .scenario-arrow {
        color: var(--muted);
        font-weight: 700;
      }
      .utility-rail {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .utility-tile {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: #fbfdff;
        box-shadow: var(--shadow);
      }
      .utility-tile-compact {
        gap: 4px;
        padding: 14px 16px;
      }
      .backup-callout {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 12px 12px 10px;
        border-radius: 16px;
        border: 1px solid rgba(203, 213, 225, 0.9);
        background: rgba(248, 250, 252, 0.78);
      }
      .backup-callout strong {
        font-size: 14px;
        line-height: 1.2;
      }
      .backup-callout .microcopy {
        line-height: 1.4;
      }
      .tone-claude-code { --tone: var(--tone-claude); --tone-soft: var(--tone-claude-soft); --tone-line: var(--tone-claude-line); }
      .tone-codex { --tone: var(--tone-codex); --tone-soft: var(--tone-codex-soft); --tone-line: var(--tone-codex-line); }
      .tone-opencode { --tone: var(--tone-opencode); --tone-soft: var(--tone-opencode-soft); --tone-line: var(--tone-opencode-line); }
      .tone-general { --tone: var(--tone-general); --tone-soft: var(--tone-general-soft); --tone-line: var(--tone-general-line); }
      .tone-gstack { --tone: var(--tone-gstack); --tone-soft: var(--tone-gstack-soft); --tone-line: var(--tone-gstack-line); }
      .tone-speckit { --tone: var(--tone-speckit); --tone-soft: var(--tone-speckit-soft); --tone-line: var(--tone-speckit-line); }
      .tone-openspec { --tone: var(--tone-openspec); --tone-soft: var(--tone-openspec-soft); --tone-line: var(--tone-openspec-line); }
      .tone-superpowers { --tone: var(--tone-superpowers); --tone-soft: var(--tone-superpowers-soft); --tone-line: var(--tone-superpowers-line); }
      .tone-bmad-method { --tone: var(--tone-bmad-method); --tone-soft: var(--tone-bmad-method-soft); --tone-line: var(--tone-bmad-method-line); }
      .tone-gsd { --tone: var(--tone-gsd); --tone-soft: var(--tone-gsd-soft); --tone-line: var(--tone-gsd-line); }
      .podium-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .podium-card {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-height: 100%;
      }
      .podium-primary {
        border-color: #cfe0ff;
        background: color-mix(in oklch, var(--accent-soft) 42%, var(--panel));
      }
      .leaderboard-stack {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .leaderboard-row {
        display: grid;
        grid-template-columns: 72px minmax(0, 1.05fr) minmax(260px, 0.95fr) minmax(170px, 0.55fr);
        gap: 16px;
        align-items: start;
        border-color: var(--tone-line, var(--line));
        background: color-mix(in oklch, var(--tone-soft, var(--panel-soft)) 52%, var(--panel));
      }
      .rank-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 56px;
        border-radius: 18px;
        background: #f4f7fb;
        border: 1px solid var(--line);
        font-size: 22px;
        font-weight: 780;
        letter-spacing: -0.04em;
      }
      .leaderboard-main {
        min-width: 0;
      }
      .leaderboard-metrics {
        min-width: 0;
      }
      .leaderboard-side {
        min-width: 0;
        gap: 8px;
      }
      .row-details {
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }
      .row-details summary {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
        color: var(--muted-strong);
        font-size: 13px;
      }
      .row-details[open] {
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: var(--panel-soft);
      }
      .row-details[open] summary {
        margin-bottom: 10px;
      }
      .row-copy-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .benchmark-table-wrap {
        overflow-x: auto;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: var(--panel);
        box-shadow: var(--shadow);
      }
      .benchmark-table {
        width: 100%;
        min-width: 1080px;
        border-collapse: separate;
        border-spacing: 0;
      }
      .benchmark-table th,
      .benchmark-table td {
        padding: 12px 10px;
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }
      .benchmark-table th:last-child,
      .benchmark-table td:last-child {
        border-right: 0;
      }
      .benchmark-table tr:last-child td {
        border-bottom: 0;
      }
      .benchmark-table th {
        position: sticky;
        top: 0;
        z-index: 2;
        background: #fbfcff;
      }
      .benchmark-rank {
        font-size: 20px;
        font-weight: 780;
        letter-spacing: -0.04em;
      }
      .benchmark-main {
        min-width: 280px;
      }
      .benchmark-main strong {
        font-size: 16px;
        line-height: 1.2;
      }
      .benchmark-cell-score {
        font-size: 21px;
        line-height: 1;
        letter-spacing: -0.04em;
        font-weight: 780;
      }
      .benchmark-cell-label {
        color: var(--muted);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-top: 4px;
      }
      .benchmark-actions {
        min-width: 170px;
      }
      .benchmark-actions .subtle-link {
        display: inline-flex;
        margin-top: 4px;
      }
      .benchmark-table .mini-meta {
        margin-top: 8px;
      }
      .benchmark-inline-note {
        margin-top: 8px;
      }
      .heatmap-wrap {
        overflow-x: auto;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: var(--panel);
        box-shadow: var(--shadow);
      }
      .heatmap-wrap.compact .heat-cell {
        min-height: 76px;
      }
      .heatmap-wrap.compact .heat-copy {
        font-size: 11px;
      }
      .heatmap-table {
        width: 100%;
        min-width: 980px;
        border-collapse: separate;
        border-spacing: 0;
      }
      .heatmap-table th,
      .heatmap-table td {
        padding: 12px;
        border-right: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        vertical-align: top;
      }
      .heatmap-table th:last-child,
      .heatmap-table td:last-child {
        border-right: 0;
      }
      .heatmap-table tr:last-child td {
        border-bottom: 0;
      }
      .heat-dimension {
        min-width: 170px;
        background: #fbfcff;
        position: sticky;
        left: 0;
        z-index: 2;
      }
      .heat-corner {
        background: #f5f8fd;
        position: sticky;
        top: 0;
        z-index: 5;
      }
      .heat-framework-head {
        min-width: 128px;
        background: var(--tone-soft, #f9fbff);
        position: sticky;
        top: 0;
        z-index: 4;
      }
      .heat-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-height: 86px;
        padding: 10px;
        border-radius: 16px;
        background: #f8fafc;
      }
      .heat-cell.level-very_high {
        background: oklch(0.925 0.035 248);
      }
      .heat-cell.level-high {
        background: oklch(0.948 0.022 248);
      }
      .heat-cell.level-medium {
        background: var(--panel-soft);
      }
      .heat-cell.level-low {
        background: var(--warn-soft);
      }
      .heat-empty {
        min-height: 110px;
        align-items: center;
        justify-content: center;
      }
      .heat-score {
        font-size: 30px;
        line-height: 0.95;
        letter-spacing: -0.05em;
        font-weight: 780;
      }
      .heat-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
      }
      .heat-copy {
        color: var(--muted-strong);
        font-size: 12px;
        line-height: 1.4;
        font-weight: 600;
      }
      .compare-insights {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      .insight-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
      }
      .insight-score {
        font-size: 32px;
        line-height: 0.95;
        letter-spacing: -0.05em;
        font-weight: 780;
      }
      @media (max-width: 1180px) {
        .dashboard-grid,
        .scenario-strip,
        .utility-rail,
        .podium-grid,
        .hero-scoreboard,
        .overview-grid,
        .home-strip,
        .summary-grid,
        .compare-card-grid,
        .compare-insights {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .leaderboard-row {
          grid-template-columns: 72px minmax(0, 1fr);
        }
        .leaderboard-metrics,
        .leaderboard-side {
          grid-column: 2;
        }
      }
      @media (max-width: 920px) {
        .hero-grid,
        .leaderboard-row,
        .row-copy-grid,
        .grid-3,
        .grid-2,
        .meta-grid,
        .form-grid,
        .map-grid,
        .search-form,
        .score-grid,
        .dashboard-grid,
        .scenario-strip,
        .utility-rail,
        .podium-grid,
        .hero-scoreboard,
        .overview-grid,
        .home-strip,
        .summary-grid,
        .compare-card-grid,
        .compare-insights {
          grid-template-columns: 1fr;
        }
        .dashboard-head {
          flex-direction: column;
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .score-cluster,
        .score-cluster-left {
          align-items: flex-start;
        }
        .score-big {
          font-size: 30px;
        }
        .heatmap-table {
          min-width: 760px;
        }
        .nav-inner {
          align-items: center;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 8px 12px;
          padding: 10px 18px;
        }
        .brand {
          flex: 1 0 100%;
          font-size: 11px;
          letter-spacing: 0.12em;
        }
        .nav-links, .nav-actions {
          gap: 4px;
        }
        .nav-links a, .lang-link {
          padding: 6px 8px;
          font-size: 13px;
        }
        .nav-meta-label { display: none; }
        .nav-evaluator-link { display: none; }
        .shell { padding-inline: 18px; }
        .hero { padding: 28px 0 16px; }
        h1 {
          font-size: clamp(34px, 11vw, 48px);
          line-height: 1;
          letter-spacing: -0.05em;
        }
        p.lead {
          font-size: 16px;
          max-width: 34ch;
        }
      }
    </style>
  </head>
  <body>
    <header class="nav">
      <div class="nav-inner">
        <a href="${escapeHtml(withLang("/", lang))}" class="brand">OHBP / harnessbench</a>
        <nav class="nav-links">
          <a href="${escapeHtml(withLang("/leaderboards/general", lang))}">${escapeHtml(t(lang, "排行榜", "Leaderboards"))}</a>
          <a href="${escapeHtml(withLang("/compare", lang))}">${escapeHtml(t(lang, "对比", "Compare"))}</a>
          <a href="${escapeHtml(withLang("/boards/official-verified", lang))}">${escapeHtml(t(lang, "证据", "Evidence"))}</a>
          <a href="${escapeHtml(withLang("/submit", lang))}">${escapeHtml(t(lang, "提交", "Intake"))}</a>
        </nav>
        <div class="nav-actions">
          <span class="nav-meta-label">${escapeHtml(t(lang, "评测侧", "For evaluators"))}</span>
          <a class="nav-evaluator-link" href="${escapeHtml(withLang("/protocol", lang))}">${escapeHtml(t(lang, "协议", "Protocol"))}</a>
          <a class="nav-evaluator-link" href="${escapeHtml(withLang("/playground/validator", lang))}">${escapeHtml(t(lang, "校验器", "Validator"))}</a>
          <a class="lang-link ${lang === "zh-CN" ? "active" : ""}" href="${escapeHtml(withLang(currentPath, "zh-CN"))}">中文</a>
          <a class="lang-link ${lang === "en" ? "active" : ""}" href="${escapeHtml(withLang(currentPath, "en"))}">EN</a>
        </div>
      </div>
    </header>
    <main class="shell">${body}</main>
    <footer>${escapeHtml(t(lang, "仅展示 digest / metadata，sealed 原始内容默认不公开。", "Public surface only: only digests / metadata are visible; sealed raw content stays withheld."))}</footer>
  </body>
</html>`;
}

function renderBoardCards(view: HomePageView): string {
  return view.boards
    .map(
      (board) => `
        <a class="panel stack" href="${escapeHtml(withLang(`/boards/${board.board_id}`, view.lang))}">
          <div class="inline">
            ${badge(board.state, board.state === "ranked_ordinal" ? "success" : "warning")}
            <span class="muted">${board.count} ${escapeHtml(t(view.lang, "条目", board.count === 1 ? "entry" : "entries"))}</span>
          </div>
          <h3>${escapeHtml(board.title)}</h3>
          <p class="muted">${escapeHtml(board.summary)}</p>
        </a>
      `,
    )
    .join("");
}

function renderConsumerMethodology(
  lang: UiLanguage,
  note: ConsumerHomePageView["methodology_note"] | HostLeaderboardPageView["methodology_note"] | HarnessComparePageView["methodology_note"],
): string {
  return `
    <div class="notice-bar notice-compact">
      <div class="notice-main">
        <div class="inline">
          ${badge(t(lang, "策展导购", "Curated guide"), "warning")}
          ${badge(t(lang, "策展样本", "Curated demo"), "neutral")}
          <strong>${escapeHtml(note.title)}</strong>
        </div>
      </div>
      <div class="inline notice-actions">
        <details class="inline-details">
          <summary>${escapeHtml(t(lang, "边界", "Boundary"))}</summary>
          <p class="microcopy">${escapeHtml(note.body)}</p>
        </details>
        <a class="button-link" href="${escapeHtml(withLang("/boards/official-verified", lang))}">${escapeHtml(t(lang, "证据层", "Evidence Boards"))}</a>
      </div>
    </div>
  `;
}

function consumerScoreLevel(score: number): "very_high" | "high" | "medium" | "low" {
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

function levelClass(level: string): string {
  return `level-${level}`;
}

function metricLabel(
  lang: UiLanguage,
  metric: HostLeaderboardRowView["basis_metric_ids"][number],
): string {
  const labels = {
    overall: t(lang, "总分", "Overall"),
    host_fit: t(lang, "宿主适配", "Host fit"),
    specification: t(lang, "规范", "Spec"),
    planning: t(lang, "规划", "Planning"),
    execution: t(lang, "执行", "Execution"),
    context: t(lang, "上下文", "Context"),
    setup: t(lang, "上手", "Setup"),
  } as const;

  return labels[metric];
}

function renderScoreBar(label: string, score: number, level?: string): string {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const safeLevel = level ?? consumerScoreLevel(safeScore);

  return `
    <div class="metric-bar">
      <div class="metric-bar-row">
        <span>${escapeHtml(label)}</span>
        <strong>${safeScore}</strong>
      </div>
      <div class="bar-track">
        <span class="bar-fill ${escapeHtml(levelClass(safeLevel))}" style="width:${safeScore}%"></span>
      </div>
    </div>
  `;
}

function renderMetricBarGroup(
  metrics: Array<{ label: string; score: number; level?: string }>,
): string {
  return `<div class="metric-bars">${metrics
    .map((metric) => renderScoreBar(metric.label, metric.score, metric.level))
    .join("")}</div>`;
}

function hostToneClass(hostId: string): string {
  switch (hostId) {
    case "claude-code":
      return "tone-claude-code";
    case "codex":
      return "tone-codex";
    case "opencode":
      return "tone-opencode";
    default:
      return "tone-general";
  }
}

function harnessToneClass(harnessId: string): string {
  switch (harnessId) {
    case "gstack":
      return "tone-gstack";
    case "speckit":
      return "tone-speckit";
    case "openspec":
      return "tone-openspec";
    case "superpowers":
      return "tone-superpowers";
    case "bmad-method":
      return "tone-bmad-method";
    case "gsd":
    default:
      return "tone-gsd";
  }
}

function preferredHostOrder<T extends { host_id: string }>(items: T[]): T[] {
  const order: Record<string, number> = {
    "claude-code": 0,
    codex: 1,
    opencode: 2,
    general: 3,
  };

  return [...items].sort((left, right) => (order[left.host_id] ?? 99) - (order[right.host_id] ?? 99));
}

function splitAudienceTags(value: string): string[] {
  return value
    .split(/\s*\/\s*|\s*、\s*|\s*，\s*|\s*,\s*/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

type ComparePresetId = "all" | "claude" | "codex" | "opencode";
type DensityMode = "compact" | "detailed";

function currentUrl(currentPath: string): URL {
  return new URL(currentPath, "http://ohbp.local");
}

function mergePathParams(
  pathname: string,
  overrides: Record<string, string | undefined>,
  lang?: UiLanguage,
): string {
  const url = new URL(pathname, "http://ohbp.local");
  Object.entries(overrides).forEach(([key, value]) => {
    if (!value) {
      url.searchParams.delete(key);
      return;
    }

    url.searchParams.set(key, value);
  });

  if (lang) {
    url.searchParams.set("lang", lang);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

function parseDensity(currentPath: string, defaultMode: DensityMode = "compact"): DensityMode {
  const value = currentUrl(currentPath).searchParams.get("density");
  return value === "detailed" || value === "compact" ? value : defaultMode;
}

function parseComparePreset(currentPath: string): ComparePresetId {
  const value = currentUrl(currentPath).searchParams.get("preset");
  return value === "claude" || value === "codex" || value === "opencode" || value === "all"
    ? value
    : "all";
}

function comparePresetLabel(lang: UiLanguage, preset: ComparePresetId): string {
  switch (preset) {
    case "claude":
      return t(lang, "Claude Code 预设", "Claude Code preset");
    case "codex":
      return t(lang, "Codex 预设", "Codex preset");
    case "opencode":
      return t(lang, "OpenCode 预设", "OpenCode preset");
    default:
      return t(lang, "全部", "All harnesses");
  }
}

function densityLabel(lang: UiLanguage, density: DensityMode): string {
  return density === "compact"
    ? t(lang, "紧凑视图", "Compact")
    : t(lang, "详细视图", "Detailed");
}

function comparePresetDimensionId(
  preset: Exclude<ComparePresetId, "all">,
): HarnessComparePageView["dimensions"][number]["id"] {
  if (preset === "claude") {
    return "claude_fit";
  }

  if (preset === "codex") {
    return "codex_fit";
  }

  return "opencode_fit";
}

function filterCompareView(
  view: Pick<HarnessComparePageView, "frameworks" | "dimensions">,
  preset: ComparePresetId,
): Pick<HarnessComparePageView, "frameworks" | "dimensions"> {
  if (preset === "all") {
    return view;
  }

  const fitDimensionId = comparePresetDimensionId(preset);
  const keptDimensionIds = [
    "new_project",
    "existing_repo",
    "long_task",
    "setup_speed",
    "multi_agent",
    "context_control",
    fitDimensionId,
  ];

  const filteredDimensions = view.dimensions.filter((dimension) => keptDimensionIds.includes(dimension.id));
  const fitDimension = filteredDimensions.find((dimension) => dimension.id === fitDimensionId);
  const frameworkOrder = (fitDimension?.values ?? [])
    .slice()
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((value) => value.harness_id);

  const filteredFrameworks = view.frameworks
    .filter((framework) => frameworkOrder.includes(framework.harness_id))
    .sort(
      (left, right) =>
        frameworkOrder.indexOf(left.harness_id) - frameworkOrder.indexOf(right.harness_id),
    );

  return {
    frameworks: filteredFrameworks,
    dimensions: filteredDimensions.map((dimension) => ({
      ...dimension,
      values: dimension.values
        .filter((value) => frameworkOrder.includes(value.harness_id))
        .sort(
          (left, right) =>
            frameworkOrder.indexOf(left.harness_id) - frameworkOrder.indexOf(right.harness_id),
        ),
    })),
  };
}

function compareDimensionScoreById(
  view: Pick<HarnessComparePageView, "dimensions">,
  harnessId: string,
  dimensionId: HarnessComparePageView["dimensions"][number]["id"],
): number {
  const dimension = view.dimensions.find((item) => item.id === dimensionId);
  const value = dimension?.values.find((item) => item.harness_id === harnessId);
  return value?.score ?? 0;
}

function renderToolbarPills(
  items: Array<{ label: string; href: string; active: boolean }>,
): string {
  return `
    <div class="toolbar-pills">
      ${items
        .map(
          (item) => `
            <a class="toolbar-pill ${item.active ? "active" : ""}" href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderHeroTiles(
  options: ConsumerHomePageView["host_options"] | HostLeaderboardPageView["host_options"] | HarnessComparePageView["host_options"],
  lang: UiLanguage,
): string {
  return preferredHostOrder(options)
    .map(
      (option) => `
        <a class="hero-tile ${escapeHtml(hostToneClass(option.host_id))}" href="${escapeHtml(withLang(option.href, lang))}">
          <div class="inline">
            ${badge(option.badge_label, "neutral")}
            ${badge(option.level_label, option.level === "very_high" ? "success" : "neutral")}
          </div>
          <strong class="tile-pick">${escapeHtml(option.default_pick_label)}</strong>
          <div class="tile-score">${escapeHtml(option.title)}</div>
          <div class="tile-meta">${escapeHtml(t(lang, "总分", "Overall"))} ${option.score} · ${escapeHtml(t(lang, "宿主适配", "Host fit"))} ${option.host_fit_score}</div>
        </a>
      `,
    )
    .join("");
}

function renderHostOptionCards(
  options: ConsumerHomePageView["host_options"] | HostLeaderboardPageView["host_options"] | HarnessComparePageView["host_options"],
  lang: UiLanguage,
): string {
  return preferredHostOrder(options)
    .map(
      (option) => `
        <a class="panel dashboard-card ${escapeHtml(hostToneClass(option.host_id))}" href="${escapeHtml(withLang(option.href, lang))}">
          <div class="dashboard-head">
            <div class="stack">
              <div class="inline">
                ${badge(option.badge_label, "neutral")}
                ${badge(option.level_label, option.level === "very_high" ? "success" : "neutral")}
              </div>
              <h3 class="card-title-sm">${escapeHtml(option.title)}</h3>
              <div class="dashboard-pick">${escapeHtml(option.default_pick_label)}</div>
            </div>
            <div class="score-cluster">
              <div class="score-big">${option.default_pick_score}</div>
              <div class="score-caption">${escapeHtml(t(lang, "总分", "overall"))}</div>
            </div>
          </div>
          <p class="dashboard-reason">${escapeHtml(option.default_pick_reason)}</p>
          <div class="backup-callout">
            <span class="field-label">${escapeHtml(t(lang, "替代项", "Alternative"))}</span>
            <strong>${escapeHtml(option.backup_pick_label)}</strong>
            <span class="microcopy">${escapeHtml(option.backup_pick_reason)}</span>
          </div>
          ${renderMetricBarGroup([
            { label: t(lang, "宿主适配", "Host fit"), score: option.host_fit_score, level: option.level },
            { label: t(lang, "新项目", "New project"), score: option.new_project_score },
            { label: t(lang, "现有仓库", "Existing repo"), score: option.existing_repo_score },
            { label: t(lang, "长任务", "Long task"), score: option.long_task_score },
          ])}
          <div class="key-metrics">
            <span><strong>${escapeHtml(t(lang, "上手", "Setup"))}</strong> ${option.setup_score}</span>
            <span><strong>${escapeHtml(t(lang, "多 Agent", "Multi-agent"))}</strong> ${option.multi_agent_score}</span>
          </div>
          <div class="mini-meta">
            ${splitAudienceTags(option.recommended_for).map((item) => badge(item, "neutral")).join("")}
          </div>
        </a>
      `,
    )
    .join("");
}

function renderQuickPicks(view: ConsumerHomePageView): string {
  return view.quick_picks
    .map(
      (item) => `
        <a class="scenario-tile" href="${escapeHtml(withLang(item.href, view.lang))}" title="${escapeHtml(item.reason)}">
          <span class="field-label">${escapeHtml(item.title)}</span>
          <div class="scenario-line">
            <strong>${escapeHtml(item.harness_label)}</strong>
            <span class="scenario-arrow">→</span>
          </div>
        </a>
      `,
    )
    .join("");
}

function renderEvidenceRail(
  items: ConsumerHomePageView["evidence_bridge"],
  lang: UiLanguage,
): string {
  const toneByHref = (href: string): string => {
    if (href.includes("/protocol")) {
      return "tone-gsd";
    }
    if (href.includes("/boards/")) {
      return "tone-general";
    }
    return "tone-claude-code";
  };

  return `
    <div class="utility-rail">
      ${items
        .map(
          (item) => `
            <a class="utility-tile utility-tile-compact ${escapeHtml(toneByHref(item.href))}" href="${escapeHtml(withLang(item.href, lang))}" title="${escapeHtml(item.description)}">
              <span class="field-label">${escapeHtml(item.title)}</span>
              <strong>${escapeHtml(item.cta)}</strong>
            </a>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderTopCardDeck(
  view: HostLeaderboardPageView,
): string {
  const rowByHarness = new Map(view.rows.map((row) => [row.harness_id, row]));

  return view.top_cards
    .map((card, index) => {
      const row = rowByHarness.get(card.harness_id);
      if (!row) {
        return "";
      }

      return `
        <article class="panel podium-card ${index === 0 ? "podium-primary" : ""} ${escapeHtml(harnessToneClass(card.harness_id))}">
          <div class="summary-head">
            <div class="stack">
              <div class="inline">
                <span class="summary-rank">#${card.source_rank}</span>
                ${badge(card.title, index === 0 ? "success" : "neutral")}
              </div>
              <h3 class="card-title-sm">${escapeHtml(card.harness_label)}</h3>
            </div>
            <div class="score-cluster">
              <div class="score-big">${card.score}</div>
              <div class="score-caption">${escapeHtml(t(view.lang, "总分", "overall"))}</div>
            </div>
          </div>
          <p class="dashboard-reason">${escapeHtml(card.reason)}</p>
          ${renderMetricBarGroup([
            { label: t(view.lang, "宿主适配", "Host fit"), score: row.host_fit_score },
            { label: t(view.lang, "长任务", "Long task"), score: row.long_task_score },
            { label: t(view.lang, "现有仓库", "Existing repo"), score: row.existing_repo_score },
            { label: t(view.lang, "多 Agent", "Multi-agent"), score: row.multi_agent_score },
          ])}
          <div class="mini-meta">
            ${badge(card.confidence_label, "success")}
            ${card.basis_metric_ids.map((metric) => badge(metricLabel(view.lang, metric), "neutral")).join("")}
          </div>
          <div class="legend-row">
            <span>${escapeHtml(t(view.lang, "更新", "Updated"))}: ${escapeHtml(card.updated_at)}</span>
            <span>•</span>
            <a class="subtle-link" href="${escapeHtml(withLang(card.evidence_href, view.lang))}">${escapeHtml(card.evidence_cta)}</a>
            <span>•</span>
          <a class="subtle-link" href="${escapeHtml(withLang(card.href, view.lang))}">${escapeHtml(t(view.lang, "详情行", "Row detail"))}</a>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderLeaderboardHeroTiles(view: HostLeaderboardPageView): string {
  return view.top_cards
    .slice(0, 2)
    .map(
      (card, index) => `
        <a class="hero-tile ${escapeHtml(harnessToneClass(card.harness_id))}" href="${escapeHtml(withLang(card.href, view.lang))}">
          <div class="inline">
              ${badge(index === 0 ? t(view.lang, "首位", "Top pick") : t(view.lang, "替代项", "Alternative"), index === 0 ? "success" : "neutral")}
            ${badge(card.level_label, card.level === "very_high" ? "success" : "neutral")}
          </div>
          <strong class="tile-pick">${escapeHtml(card.harness_label)}</strong>
          <div class="tile-score">${card.score} · ${escapeHtml(card.title)}</div>
          <div class="microcopy">${escapeHtml(card.reason)}</div>
        </a>
      `,
    )
    .join("");
}

function renderLeaderboardDensityControls(
  lang: UiLanguage,
  currentPath: string,
): string {
  const activeDensity = parseDensity(currentPath);
  return `
    <div class="toolbar-group">
      <span class="toolbar-label">${escapeHtml(t(lang, "榜单密度", "Board density"))}</span>
      ${renderToolbarPills(
        (["compact", "detailed"] as DensityMode[]).map((density) => ({
          label: densityLabel(lang, density),
          href: mergePathParams(currentPath, { density }, lang),
          active: activeDensity === density,
        })),
      )}
    </div>
  `;
}

function renderLeaderboardDetailedRows(view: HostLeaderboardPageView): string {
  return `
    <div class="leaderboard-stack">
      ${view.rows
        .map(
          (row) => `
            <article class="panel leaderboard-row ${escapeHtml(harnessToneClass(row.harness_id))}" id="${escapeHtml(`harness-${row.harness_id}`)}">
              <div class="rank-pill">#${row.rank}</div>
              <div class="leaderboard-main stack">
                <div class="inline">
                  <h3 class="card-title-sm">${escapeHtml(row.harness_label)}</h3>
                  ${row.scenario_tags.map((tag) => badge(tag, "neutral")).join("")}
                </div>
                <p class="dashboard-reason">${escapeHtml(row.best_for)}</p>
                <details class="row-details">
                  <summary>${escapeHtml(t(view.lang, "理由与风险", "Rationale & risks"))}</summary>
                  <div class="row-copy-grid">
                    <div>
                      <span class="field-label">${escapeHtml(t(view.lang, "定位", "Positioning"))}</span>
                      <p class="microcopy">${escapeHtml(row.tagline)}</p>
                    </div>
                    <div>
                      <span class="field-label">${escapeHtml(t(view.lang, "证据提示", "Evidence note"))}</span>
                      <p class="microcopy">${escapeHtml(row.evidence_strength)}</p>
                    </div>
                    <div>
                      <span class="field-label">${escapeHtml(t(view.lang, "排序依据", "Rank basis"))}</span>
                      <p class="microcopy">${escapeHtml(row.why_this_rank)}</p>
                    </div>
                    <div>
                      <span class="field-label">${escapeHtml(t(view.lang, "注意点", "Watch-outs"))}</span>
                      <p class="microcopy">${escapeHtml(row.watch_outs)}</p>
                    </div>
                  </div>
                </details>
              </div>
              <div class="leaderboard-metrics">
                ${renderMetricBarGroup([
                  { label: t(view.lang, "宿主适配", "Host fit"), score: row.host_fit_score },
                  { label: t(view.lang, "新项目", "New project"), score: row.new_project_score },
                  { label: t(view.lang, "现有仓库", "Existing repo"), score: row.existing_repo_score },
                  { label: t(view.lang, "长任务", "Long task"), score: row.long_task_score },
                ])}
                <div class="key-metrics">
                  <span><strong>${escapeHtml(t(view.lang, "上手", "Setup"))}</strong> ${row.setup_score}</span>
                  <span><strong>${escapeHtml(t(view.lang, "多 Agent", "Multi-agent"))}</strong> ${row.multi_agent_score}</span>
                </div>
              </div>
              <div class="leaderboard-side stack">
                <div class="score-cluster score-cluster-left">
                  <div class="score-big">${row.overall_score}</div>
                  <div class="score-caption">${escapeHtml(t(view.lang, "总分", "overall"))}</div>
                </div>
                <div class="mini-meta">
                  ${badge(row.evidence_label, "warning")}
                  ${badge(row.confidence_label, "success")}
                </div>
                <div class="metric-inline">
                  ${row.basis_metric_ids.map((metric) => `<span>${escapeHtml(metricLabel(view.lang, metric))}</span>`).join("")}
                </div>
                <div class="microcopy">${escapeHtml(t(view.lang, "更新", "Updated"))}: ${escapeHtml(row.updated_at)}</div>
                <a class="subtle-link" href="${escapeHtml(withLang(row.evidence_href, view.lang))}">${escapeHtml(row.evidence_cta)}</a>
              </div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderLeaderboardCompactTable(view: HostLeaderboardPageView): string {
  return `
    <div class="benchmark-table-wrap">
      <table class="benchmark-table">
        <thead>
          <tr>
            <th>${escapeHtml(t(view.lang, "排名", "Rank"))}</th>
            <th>${escapeHtml(t(view.lang, "Harness", "Harness"))}</th>
            <th>${escapeHtml(t(view.lang, "总分", "Overall"))}</th>
            <th>${escapeHtml(t(view.lang, "宿主适配", "Host fit"))}</th>
            <th>${escapeHtml(t(view.lang, "新项目", "New"))}</th>
            <th>${escapeHtml(t(view.lang, "现有仓库", "Existing"))}</th>
            <th>${escapeHtml(t(view.lang, "长任务", "Long"))}</th>
            <th>${escapeHtml(t(view.lang, "上手", "Setup"))}</th>
            <th>${escapeHtml(t(view.lang, "多 Agent", "Agents"))}</th>
            <th>${escapeHtml(t(view.lang, "证据 / 备注", "Evidence / notes"))}</th>
          </tr>
        </thead>
        <tbody>
          ${view.rows
            .map(
              (row) => `
                <tr class="${escapeHtml(harnessToneClass(row.harness_id))}">
                  <td><div class="benchmark-rank">#${row.rank}</div></td>
                  <td class="benchmark-main">
                    <strong>${escapeHtml(row.harness_label)}</strong>
                    <div class="microcopy">${escapeHtml(row.best_for)}</div>
                    <div class="mini-meta">
                      ${row.scenario_tags.map((tag) => badge(tag, "neutral")).join("")}
                    </div>
                    <details class="row-details benchmark-inline-note">
                      <summary>${escapeHtml(t(view.lang, "理由与风险", "Rationale & risks"))}</summary>
                      <div class="row-copy-grid">
                        <div>
                          <span class="field-label">${escapeHtml(t(view.lang, "定位", "Positioning"))}</span>
                          <p class="microcopy">${escapeHtml(row.tagline)}</p>
                        </div>
                        <div>
                          <span class="field-label">${escapeHtml(t(view.lang, "排序依据", "Rank basis"))}</span>
                          <p class="microcopy">${escapeHtml(row.why_this_rank)}</p>
                        </div>
                        <div>
                          <span class="field-label">${escapeHtml(t(view.lang, "注意点", "Watch-outs"))}</span>
                          <p class="microcopy">${escapeHtml(row.watch_outs)}</p>
                        </div>
                        <div>
                          <span class="field-label">${escapeHtml(t(view.lang, "依据", "Basis"))}</span>
                          <p class="microcopy">${escapeHtml(row.basis_metric_ids.map((metric) => metricLabel(view.lang, metric)).join(" · "))}</p>
                        </div>
                      </div>
                    </details>
                  </td>
                  <td>
                    <div class="benchmark-cell-score">${row.overall_score}</div>
                    <div class="benchmark-cell-label">${escapeHtml(t(view.lang, "总分", "Overall"))}</div>
                  </td>
                  <td><div class="benchmark-cell-score">${row.host_fit_score}</div></td>
                  <td><div class="benchmark-cell-score">${row.new_project_score}</div></td>
                  <td><div class="benchmark-cell-score">${row.existing_repo_score}</div></td>
                  <td><div class="benchmark-cell-score">${row.long_task_score}</div></td>
                  <td><div class="benchmark-cell-score">${row.setup_score}</div></td>
                  <td><div class="benchmark-cell-score">${row.multi_agent_score}</div></td>
                  <td class="benchmark-actions">
                    <div class="mini-meta">
                      ${badge(row.evidence_label, "warning")}
                      ${badge(row.confidence_label, "success")}
                    </div>
                    <div class="microcopy">${escapeHtml(t(view.lang, "更新", "Updated"))}: ${escapeHtml(row.updated_at)}</div>
                    <a class="subtle-link" href="${escapeHtml(withLang(row.evidence_href, view.lang))}">${escapeHtml(row.evidence_cta)}</a>
                  </td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderCompareControls(
  view: HarnessComparePageView,
  currentPath: string,
): string {
  const activePreset = parseComparePreset(currentPath);
  const activeDensity = parseDensity(currentPath);
  return `
    <div class="toolbar-row">
      <div class="toolbar-group">
        <span class="toolbar-label">${escapeHtml(t(view.lang, "预设", "Preset"))}</span>
        ${renderToolbarPills(
          (["all", "claude", "codex", "opencode"] as ComparePresetId[]).map((preset) => ({
            label: comparePresetLabel(view.lang, preset),
            href: mergePathParams(currentPath, { preset, density: activeDensity }, view.lang),
            active: activePreset === preset,
          })),
        )}
      </div>
      <div class="toolbar-group">
        <span class="toolbar-label">${escapeHtml(t(view.lang, "密度", "Density"))}</span>
        ${renderToolbarPills(
          (["compact", "detailed"] as DensityMode[]).map((density) => ({
            label: densityLabel(view.lang, density),
            href: mergePathParams(currentPath, { preset: activePreset, density }, view.lang),
            active: activeDensity === density,
          })),
        )}
      </div>
    </div>
  `;
}

function renderCompareInsights(
  view: HarnessComparePageView,
  filteredView: Pick<HarnessComparePageView, "frameworks" | "dimensions">,
  preset: ComparePresetId,
): string {
  const ranking =
    preset === "all"
      ? filteredView.frameworks
          .map((framework) => ({
            framework,
            score:
              ["new_project", "existing_repo", "long_task", "setup_speed", "multi_agent", "context_control"]
                .map((dimensionId) =>
                  compareDimensionScoreById(
                    filteredView,
                    framework.harness_id,
                    dimensionId as HarnessComparePageView["dimensions"][number]["id"],
                  ),
                )
                .reduce((sum, value) => sum + value, 0) / 6,
          }))
          .sort((left, right) => right.score - left.score)
      : filteredView.frameworks
          .map((framework) => ({
            framework,
            score: compareDimensionScoreById(
              filteredView,
              framework.harness_id,
              comparePresetDimensionId(preset),
            ),
          }))
          .sort((left, right) => right.score - left.score);

  const winner = ranking[0];
  const backup = ranking[1];
  const longTaskRanking = filteredView.frameworks
    .map((framework) => ({
      framework,
      score: compareDimensionScoreById(filteredView, framework.harness_id, "long_task"),
    }))
    .sort((left, right) => right.score - left.score)[0];

  const cards = [
    winner
      ? {
          title:
            preset === "all"
              ? t(view.lang, "综合首位", "Top overall")
              : t(view.lang, "宿主首位", "Top host-fit"),
          framework: winner.framework,
          score: Math.round(winner.score),
        }
      : undefined,
    backup
      ? {
          title: t(view.lang, "替代项", "Alternative"),
          framework: backup.framework,
          score: Math.round(backup.score),
        }
      : undefined,
    longTaskRanking
      ? {
          title: t(view.lang, "长任务高分", "Long-task high"),
          framework: longTaskRanking.framework,
          score: Math.round(longTaskRanking.score),
        }
      : undefined,
  ].filter((value): value is { title: string; framework: HarnessComparePageView["frameworks"][number]; score: number } => Boolean(value));

  return `
    <div class="compare-insights">
      ${cards
        .map(
          (card) => `
            <article class="panel insight-card ${escapeHtml(harnessToneClass(card.framework.harness_id))}">
              <span class="field-label">${escapeHtml(card.title)}</span>
              <strong>${escapeHtml(card.framework.label)}</strong>
              <div class="insight-score">${card.score}</div>
              <div class="microcopy">${escapeHtml(card.framework.best_for)}</div>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderCompareHeatmap(
  view: Pick<HarnessComparePageView, "lang" | "frameworks" | "dimensions">,
  options?: { compact?: boolean },
): string {
  const compact = options?.compact ?? false;
  return `
    <div class="heatmap-wrap ${compact ? "compact" : "detailed"}">
      <table class="heatmap-table">
        <thead>
          <tr>
            <th class="heat-dimension heat-corner">${escapeHtml(t(view.lang, "决策维度", "Decision"))}</th>
            ${view.frameworks
              .map(
                (framework) => `
                  <th class="heat-framework-head ${escapeHtml(harnessToneClass(framework.harness_id))}">
                    <strong>${escapeHtml(framework.label)}</strong>
                    ${compact ? "" : `<div class="microcopy">${escapeHtml(framework.best_for)}</div>`}
                  </th>
                `,
              )
              .join("")}
          </tr>
        </thead>
        <tbody>
          ${view.dimensions
            .map(
              (dimension) => `
                <tr>
                  <td class="heat-dimension">
                    <strong>${escapeHtml(compact ? dimension.short_label : dimension.dimension)}</strong>
                    <div class="microcopy">${escapeHtml(dimension.description)}</div>
                  </td>
                  ${view.frameworks
                    .map((framework) => {
                      const value = dimension.values.find((item) => item.harness_id === framework.harness_id);
                      if (!value) {
                        return `<td><div class="heat-cell heat-empty">—</div></td>`;
                      }

                      const title = `${dimension.dimension} · ${framework.label}: ${value.summary}`;
                      return `
                        <td>
                          <div class="heat-cell ${escapeHtml(levelClass(value.level))}" title="${escapeHtml(title)}">
                            <div class="heat-score">${value.score}</div>
                            <div class="heat-label">${escapeHtml(value.level_label)}</div>
                            <div class="heat-copy">${escapeHtml(value.value)}</div>
                          </div>
                        </td>
                      `;
                    })
                    .join("")}
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

export function renderConsumerHomePage(
  view: ConsumerHomePageView,
  context: PageRenderContext,
): string {
  return pageShell(
    t(view.lang, "Harness Leaderboards", "Harness Leaderboards"),
    `
      <section class="hero hero-grid">
        <div class="hero-copy">
          <div class="eyebrow">${escapeHtml(t(view.lang, "选型层", "benchmark layer"))}</div>
          <h1>${escapeHtml(view.hero_title)}</h1>
          <p class="lead">${escapeHtml(view.hero_body)}</p>
          <div class="hero-links">
            <a class="button-primary" href="${escapeHtml(withLang("/leaderboards/general", view.lang))}">${escapeHtml(t(view.lang, "总榜", "General board"))}</a>
            <a class="button-secondary" href="${escapeHtml(withLang("/compare", view.lang))}">${escapeHtml(t(view.lang, "对比", "Comparison"))}</a>
          </div>
        </div>
        <div class="hero-scoreboard">
          ${renderHeroTiles(view.host_options, view.lang)}
        </div>
      </section>

      <section class="section stack">
        <div class="visual-section-head">
          <div class="stack">
            <h2>${escapeHtml(t(view.lang, "宿主适配视图", "Host-fit overview"))}</h2>
            <p class="microcopy">${escapeHtml(t(view.lang, "主选项、替代项、证据边界。", "Primary pick, alternative, evidence boundary."))}</p>
          </div>
        </div>
        <div class="dashboard-grid">
          ${renderHostOptionCards(view.host_options, view.lang)}
        </div>
      </section>

      <section class="section stack">
        <div class="visual-section-head">
          <div class="stack">
            <h2>${escapeHtml(view.compare_preview.title)}</h2>
            <p class="microcopy">${escapeHtml(view.compare_preview.summary)}</p>
          </div>
        </div>
        ${renderCompareHeatmap({
          lang: view.lang,
          frameworks: view.compare_preview.frameworks,
          dimensions: view.compare_preview.dimensions,
        }, { compact: true })}
      </section>

      <section class="section stack">
        <div class="visual-section-head">
          <div class="stack">
            <h2>${escapeHtml(t(view.lang, "场景速看", "Scenario quick picks"))}</h2>
          </div>
        </div>
        <div class="scenario-strip">
          ${renderQuickPicks(view)}
        </div>
      </section>

      <section class="section stack">
        ${renderEvidenceRail(view.evidence_bridge, view.lang)}
        ${renderConsumerMethodology(view.lang, view.methodology_note)}
      </section>
    `,
    { lang: view.lang, currentPath: context.currentPath },
  );
}

export function renderHostLeaderboardPage(
  view: HostLeaderboardPageView,
  context: PageRenderContext,
): string {
  const density = parseDensity(context.currentPath);
  return pageShell(
    `${view.title} · OHBP`,
    `
      <section class="hero hero-grid hero-grid-compact">
        <div class="hero-copy">
          <div class="eyebrow">${escapeHtml(t(view.lang, "宿主榜单", "host leaderboard"))}</div>
          <h1>${escapeHtml(view.title)}</h1>
          <p class="lead">${escapeHtml(view.hero_body)}</p>
          <div class="tabs">
            ${preferredHostOrder(view.host_options)
              .map(
                (option) => `
                  <a class="${option.host_id === view.host_id ? "active" : ""}" href="${escapeHtml(mergePathParams(option.href, { density }, view.lang))}">
                    ${escapeHtml(option.title)}
                  </a>
                `,
              )
              .join("")}
          </div>
        </div>
        <div class="hero-scoreboard hero-scoreboard-compact">
          ${renderLeaderboardHeroTiles(view)}
        </div>
      </section>

      <section class="section stack">
        <div class="visual-section-head">
          <div class="stack">
            <h2>${escapeHtml(t(view.lang, "Top 3", "Top 3"))}</h2>
          </div>
        </div>
        <div class="podium-grid">
          ${renderTopCardDeck(view)}
        </div>
      </section>

      <section id="full-ranking" class="section stack">
        <div class="toolbar-row">
          <div class="stack">
            <h2>${escapeHtml(t(view.lang, "完整榜单", "Full board"))}</h2>
            <p class="microcopy">${escapeHtml(view.table_intro)}</p>
          </div>
          ${renderLeaderboardDensityControls(view.lang, context.currentPath)}
        </div>
        <div class="visual-section-head">
          <div class="pill-row">
            ${view.scenario_pills.map((item) => badge(item, "neutral")).join("")}
          </div>
        </div>
        ${density === "compact" ? renderLeaderboardCompactTable(view) : renderLeaderboardDetailedRows(view)}
      </section>

      <section class="section stack">
        ${renderConsumerMethodology(view.lang, view.methodology_note)}
        <details class="inline-details">
          <summary>${escapeHtml(t(view.lang, "榜单边界", "Ranking notes"))}</summary>
          <div class="stack">
            ${view.explanation_blocks.map((item) => `<p class="microcopy"><strong>${escapeHtml(item.title)}</strong> ${escapeHtml(item.body)}</p>`).join("")}
          </div>
        </details>
      </section>
    `,
    { lang: view.lang, currentPath: context.currentPath },
  );
}

export function renderComparePage(
  view: HarnessComparePageView,
  context: PageRenderContext,
): string {
  const preset = parseComparePreset(context.currentPath);
  const density = parseDensity(context.currentPath);
  const filteredView = filterCompareView(view, preset);
  return pageShell(
    `${view.title} · OHBP`,
    `
      <section class="hero hero-grid hero-grid-compact">
        <div class="hero-copy">
          <div class="eyebrow">${escapeHtml(t(view.lang, "横向矩阵", "comparison matrix"))}</div>
          <h1>${escapeHtml(view.title)}</h1>
          <p class="lead">${escapeHtml(view.subtitle)}</p>
          <div class="hero-links">
            <a class="button-secondary" href="${escapeHtml(withLang("/leaderboards/claude-code", view.lang))}">${escapeHtml(t(view.lang, "Claude Code 榜", "Claude Code board"))}</a>
            <a class="button-secondary" href="${escapeHtml(withLang("/leaderboards/codex", view.lang))}">${escapeHtml(t(view.lang, "Codex 榜", "Codex board"))}</a>
            <a class="button-secondary" href="${escapeHtml(withLang("/leaderboards/opencode", view.lang))}">${escapeHtml(t(view.lang, "OpenCode 榜", "OpenCode board"))}</a>
          </div>
        </div>
        <div class="hero-scoreboard">
          ${renderHeroTiles(view.host_options, view.lang)}
        </div>
      </section>

      <section class="section stack">
        <div class="stack">
          ${renderCompareControls(view, context.currentPath)}
          ${renderCompareInsights(view, filteredView, preset)}
        </div>
      </section>

      <section class="section stack">
        <div class="visual-section-head">
          <div class="stack">
            <h2>${escapeHtml(t(view.lang, "决策热力矩阵", "Decision heatmap"))}</h2>
            <p class="microcopy">${escapeHtml(comparePresetLabel(view.lang, preset))} · ${escapeHtml(densityLabel(view.lang, density))}</p>
          </div>
        </div>
        ${renderCompareHeatmap(
          {
            lang: view.lang,
            frameworks: filteredView.frameworks,
            dimensions: filteredView.dimensions,
          },
          { compact: density === "compact" },
        )}
      </section>

      <section class="section stack">
        <details class="inline-details">
          <summary>${escapeHtml(t(view.lang, "对比边界", "Comparison notes"))}</summary>
          <div class="stack">
            ${view.notes.map((item) => `<p class="microcopy">${escapeHtml(item)}</p>`).join("")}
          </div>
        </details>
        ${renderConsumerMethodology(view.lang, view.methodology_note)}
      </section>
    `,
    { lang: view.lang, currentPath: context.currentPath },
  );
}
function renderBoardStory(view: BoardPageView): string {
  const lang = view.lang;
  const sections =
    view.board_id === "official-verified"
      ? [
          {
            title: t(lang, "不确定性与置信度条", "Uncertainty & confidence strip"),
             body: t(lang, "已验证、接近验证、待补证据分层展示，榜单边界保持可见。", "Verified, near-verified, and evidence-missing records stay visually separated."),
          },
          {
             title: t(lang, "对比入口", "Comparison link"),
             body: t(lang, "正式榜单与替代项保持同一条对比路径。", "Verified boards and alternatives share one comparison path."),
          },
        ]
      : view.board_id === "reproducibility-frontier"
        ? [
            {
              title: t(lang, "接近验证的候选 / 缺失证据原因", "Near-Verified candidates / missing evidence reasons"),
               body: t(lang, "接近 verified 的条目与仍缺失的证据并排呈现。", "Near-verified entries and their missing evidence stay side by side."),
            },
            {
               title: t(lang, "证据缺口", "Evidence backlog"),
               body: t(lang, "Frontier 页面保留待补证据、阻塞原因和状态距离。", "The frontier surface keeps evidence gaps, blockers, and promotion distance visible."),
            },
          ]
        : [
            {
              title: t(lang, "社区实验流", "Community feed"),
               body: t(lang, "社区公开实验、新发现和趋势信号集中在这一层。", "Community experiments, emerging findings, and trend signals live here."),
            },
            {
              title: t(lang, "升级路径", "Promotion path"),
               body: t(lang, "社区实验与正式证据层之间的距离保持透明。", "The distance between community experiments and formal evidence stays explicit."),
            },
          ];

  return `
    <section class="section grid-2">
      ${sections
        .map(
          (section) => `
            <div class="panel stack">
              <h3>${escapeHtml(section.title)}</h3>
              <p class="muted">${escapeHtml(section.body)}</p>
            </div>
          `,
        )
        .join("")}
    </section>
  `;
}

function boardBreakdownSummary(
  breakdown: BoardPageView["status_breakdown"],
  lang: UiLanguage,
): string {
  const parts: string[] = [];

  if (breakdown.active_blocked_entries > 0) {
    parts.push(
      t(
        lang,
        `${breakdown.active_blocked_entries} 条记录还卡在 admission gate 外`,
        `${breakdown.active_blocked_entries} records are still blocked by admission gates`,
      ),
    );
  }

  if (breakdown.suspended_entries > 0) {
    parts.push(
      t(
        lang,
        `${breakdown.suspended_entries} 条记录已被治理暂停`,
        `${breakdown.suspended_entries} records are suspended by governance`,
      ),
    );
  }

  if (breakdown.historical_entries > 0) {
    parts.push(
      t(
        lang,
        `${breakdown.historical_entries} 条记录只保留历史页`,
        `${breakdown.historical_entries} records remain historical only`,
      ),
    );
  }

  if (breakdown.hidden_entries > 0) {
    parts.push(
      t(
        lang,
        `${breakdown.hidden_entries} 条记录尚未公开`,
        `${breakdown.hidden_entries} records are not public yet`,
      ),
    );
  }

  return parts.join("；");
}

function renderBoardStatusBreakdown(view: BoardPageView): string {
  const lang = view.lang;
  const breakdown = view.status_breakdown;
  const summary = boardBreakdownSummary(breakdown, lang);

  return `
    <div class="panel stack">
      <h3>${escapeHtml(t(lang, "切片状态分布", "Slice status breakdown"))}</h3>
      ${renderSimpleMetaList([
        {
          label: t(lang, "活跃可展示", "Active eligible"),
          value: String(breakdown.active_eligible_entries),
        },
        {
          label: t(lang, "活跃但未达标", "Active but blocked"),
          value: String(breakdown.active_blocked_entries),
        },
        {
          label: t(lang, "暂停中", "Suspended"),
          value: String(breakdown.suspended_entries),
        },
        {
          label: t(lang, "历史保留", "Historical only"),
          value: String(breakdown.historical_entries),
        },
        {
          label: t(lang, "未公开", "Hidden"),
          value: String(breakdown.hidden_entries),
        },
      ])}
      <p class="muted">${escapeHtml(
        summary ||
          t(
            lang,
            "当前切片没有额外的治理阻塞，表中条目就是当前可公开比较面。",
            "This slice currently has no extra governance blockers, so the table reflects the active public comparison surface.",
          ),
      )}</p>
    </div>
  `;
}

function renderBoardRankingPolicy(view: BoardPageView): string {
  const lang = view.lang;
  const policy = view.ranking_policy;

  if (!policy) {
    return "";
  }

  return `
    <div class="panel stack">
      <h3>${escapeHtml(t(lang, "排序不确定性", "Ranking uncertainty"))}</h3>
      ${renderSimpleMetaList([
        {
          label: t(lang, "方法", "Method"),
          value: policy.method,
        },
        {
          label: t(lang, "置信水平", "Confidence"),
          value: `${Math.round(policy.confidence_level * 100)}%`,
        },
        {
          label: t(lang, "硬名次门槛", "Ordinal threshold"),
          value: `n ≥ ${policy.minimum_effective_n_for_ordinal}`,
        },
        {
          label: t(lang, "允许硬名次", "Ordinal allowed"),
          value: policy.ordinal_rank_allowed ? t(lang, "是", "yes") : t(lang, "否", "no"),
        },
      ])}
      <p class="muted">${escapeHtml(policy.note)}</p>
      <p class="microcopy">${escapeHtml(policy.separation_rule)}</p>
    </div>
  `;
}

function renderBoardEntries(view: BoardPageView): string {
  const lang = view.lang;
  const breakdownSummary = boardBreakdownSummary(view.status_breakdown, lang);
  const rows =
    view.entries.length > 0
      ? view.entries
          .map(
            (entry) => `
                <tr>
                  <td>
                    ${entry.rank ? `#${entry.rank}` : escapeHtml(entry.rank_uncertainty?.rank_band ?? "—")}
                    ${
                      entry.rank_uncertainty
                        ? `<div class="workflow-subline">${escapeHtml(entry.rank_uncertainty.interpretation)}</div>`
                        : ""
                    }
                  </td>
                  <td>
                    <strong>${escapeHtml(entry.display_name)}</strong>
                    <div class="workflow-subline">${escapeHtml(entry.harness_label)} · ${escapeHtml(entry.model_label)}</div>
                    <div class="workflow-subline">${escapeHtml(entry.benchmark_label)}</div>
                  </td>
                  <td>
                    <strong>${entry.success_rate_pct}%</strong>
                    ${
                      entry.rank_uncertainty
                        ? `
                          <div class="workflow-subline">
                            ${escapeHtml(
                              t(
                                lang,
                                `95% CI ${entry.rank_uncertainty.ci_low_pct}%–${entry.rank_uncertainty.ci_high_pct}%`,
                                `95% CI ${entry.rank_uncertainty.ci_low_pct}%–${entry.rank_uncertainty.ci_high_pct}%`,
                              ),
                            )}
                          </div>
                          <div class="workflow-subline">
                            ${escapeHtml(
                              `${entry.rank_uncertainty.rank_band} · ${t(lang, "区间精度", "interval confidence")}:${entry.rank_uncertainty.rank_confidence}`,
                            )}
                          </div>
                        `
                        : ""
                    }
                  </td>
                  <td>$${entry.median_cost_usd.toFixed(2)}</td>
                  <td>
                    <div class="inline">
                      ${badge(entry.trust_tier, entry.trust_tier === "verified" ? "success" : "warning")}
                      ${badge(entry.publication_state, entry.publication_state === "published" ? "success" : "neutral")}
                    </div>
                    <div class="workflow-subline">${escapeHtml(entry.health_warning)}</div>
                  </td>
                </tr>
              `,
          )
          .join("")
      : `
          <tr>
            <td colspan="5" class="muted">
              ${escapeHtml(
                t(
                  lang,
                  `当前还没有可公开展示的条目。${view.state_reason}${breakdownSummary ? ` 当前分布：${breakdownSummary}。` : ""}`,
                  `There are no public entries to show yet. ${view.state_reason}${breakdownSummary ? ` Current breakdown: ${breakdownSummary}.` : ""}`,
                ),
              )}
            </td>
          </tr>
        `;

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t(lang, "排名", "Rank"))}</th>
            <th>${escapeHtml(t(lang, "条目", "Entry"))}</th>
            <th>${escapeHtml(t(lang, "成功率", "Success"))}</th>
            <th>${escapeHtml(t(lang, "成本", "Cost"))}</th>
            <th>${escapeHtml(t(lang, "证据", "Evidence"))}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

export function renderBoardPage(
  view: BoardPageView,
  context: PageRenderContext,
): string {
  const lang = view.lang;
  return pageShell(
    `${view.title} · OHBP`,
    `
      <section class="hero">
        <div class="eyebrow">${escapeHtml(t(lang, `榜单 / ${view.board_id}`, `Board / ${view.board_id}`))}</div>
        <h1>${escapeHtml(view.title)}</h1>
        <p class="lead">${escapeHtml(view.subtitle)}</p>
        <div class="inline">
          ${badge(view.board_state, view.board_state === "ranked_ordinal" ? "success" : "warning")}
          ${badge(view.presentation_mode, "neutral")}
          <span class="microcopy">${escapeHtml(t(lang, "生成于", "Generated"))}: ${escapeHtml(view.generated_at)}</span>
        </div>
        ${
          view.available_slices.length > 0
            ? `
              <div class="tabs">
                ${view.available_slices
                  .map(
                    (slice) => `
                      <a class="${slice.slice_id === view.slice.slice_id ? "active" : ""}" href="${escapeHtml(withLang(`/boards/${view.board_id}?slice=${encodeURIComponent(slice.slice_id)}`, lang))}">
                        ${escapeHtml(slice.label)}
                      </a>
                    `,
                  )
                  .join("")}
              </div>
            `
            : `<p class="microcopy">${escapeHtml(t(lang, "当前还没有可切换的公开 slice。", "No public slices are available yet."))}</p>`
        }
      </section>
      ${renderProvenanceNotice(lang, view.data_provenance)}
      <section class="section grid-3">
        <div class="panel stack">
          <h3>${escapeHtml(t(lang, "当前切片", "Current slice"))}</h3>
          ${renderSimpleMetaList([
            { label: t(lang, "Slice", "Slice"), value: view.slice.label ?? view.slice.slice_id },
            ...(view.slice.task_package_digest
              ? [{ label: "task_package_digest", value: view.slice.task_package_digest }]
              : []),
            { label: t(lang, "状态理由", "State reason"), value: view.state_reason },
            { label: t(lang, "总条目", "Total entries"), value: String(view.stats.total_entries) },
            { label: t(lang, "可进入", "Eligible"), value: String(view.stats.eligible_entries) },
          ])}
        </div>
        ${renderBoardStatusBreakdown(view)}
        ${renderBoardRankingPolicy(view)}
        <div class="panel stack">
          <h3>${escapeHtml(t(lang, "发布规则", "Board rules"))}</h3>
          ${renderBulletList(view.rules, t(lang, "当前没有额外规则。", "No extra rules are recorded right now."))}
        </div>
      </section>
      ${renderBoardStory(view)}
      <section class="section stack">
        <h2>${escapeHtml(t(lang, "榜单条目", "Board entries"))}</h2>
        ${renderBoardEntries(view)}
      </section>
    `,
    { lang, currentPath: context.currentPath },
  );
}

function renderScorecard(view: EntryDetailView): string {
  const lang = view.lang;
  const stateNotice =
    view.summary.publication_state === "published" &&
    (view.summary.board_disposition ?? "active") === "active"
      ? ""
      : `
        <div class="callout stack">
          <h4>${escapeHtml(t(lang, "发布状态说明", "Publication state notice"))}</h4>
          <p>${escapeHtml(view.summary.state_summary ?? t(lang, "当前没有额外状态说明。", "No extra state note is attached."))}</p>
          <div class="inline">
            ${badge(`publication:${view.summary.publication_state}`, "warning")}
            ${badge(`boards:${view.summary.board_disposition ?? "active"}`, "warning")}
          </div>
        </div>
      `;
  return `
    <section class="section grid-2">
      <div class="panel stack">
        <h3>${escapeHtml(t(lang, "结论", "Verdict"))}</h3>
        <div class="inline">
          ${view.scorecard.badges.map((item) => badge(item.label, item.tone)).join("")}
        </div>
        <p>${escapeHtml(view.scorecard.verdict)}</p>
        ${stateNotice}
        <div class="callout stack">
      <h4>${escapeHtml(t(lang, "准入依据", "Eligibility basis"))}</h4>
          ${renderBulletList(view.scorecard.why_it_is_eligible, t(lang, "当前没有可进入理由。", "No explicit eligibility reasons are recorded."))}
        </div>
        <div class="callout stack">
      <h4>${escapeHtml(t(lang, "阻塞依据", "Blockers"))}</h4>
          ${renderBulletList(view.scorecard.why_it_is_blocked, t(lang, "当前没有阻塞项。", "No blockers are recorded right now."))}
        </div>
      </div>
      <div class="panel stack">
        <h3>${escapeHtml(t(lang, "关键指标", "Key metrics"))}</h3>
        ${renderSimpleMetaList(view.scorecard.metrics.map((item) => ({ label: item.label, value: item.hint ? `${item.value} · ${item.hint}` : item.value })))}
        <div class="callout stack">
          <h4>${escapeHtml(t(lang, "Baseline 对照", "Baseline panel"))}</h4>
          ${renderSimpleMetaList(view.scorecard.baseline_panel)}
        </div>
      </div>
    </section>
  `;
}

function renderResearch(view: EntryDetailView): string {
  const lang = view.lang;
  return `
    <section class="section grid-2">
      <div class="panel stack">
        <h3>${escapeHtml(t(lang, "发布状态与榜单处置", "Publication state & board disposition"))}</h3>
        ${renderSimpleMetaList(view.research.publication_panel)}
        <div class="callout stack">
          <h4>${escapeHtml(t(lang, "状态时间线", "State timeline"))}</h4>
          <div class="timeline">
            ${view.research.state_history.length > 0
              ? view.research.state_history
                  .map(
                    (item) => `
                      <div class="timeline-item">
                        <strong>${escapeHtml(item.to_state)}</strong>
                        <div class="muted">${escapeHtml(item.at)} · ${escapeHtml(item.actor)} · ${escapeHtml(item.reason_code)}</div>
                        <div>${escapeHtml(item.summary)}</div>
                      </div>
                    `,
                  )
                  .join("")
              : `<div class="muted">${escapeHtml(t(lang, "当前没有状态迁移记录。", "No state transitions are recorded."))}</div>`}
          </div>
        </div>
      </div>
      <div class="panel stack">
        <h3>${escapeHtml(t(lang, "绑定与摘要", "Bindings & summary"))}</h3>
        ${renderSimpleMetaList(view.research.bindings)}
        <div class="callout stack">
          <h4>${escapeHtml(t(lang, "Digests", "Digests"))}</h4>
          ${renderSimpleMetaList([
            { label: "public_bundle_digest", value: view.research.digests.public_bundle_digest },
            { label: "task_package_digest", value: view.research.digests.task_package_digest },
            { label: "execution_contract_digest", value: view.research.digests.execution_contract_digest },
            { label: "tolerance_policy_digest", value: view.research.digests.tolerance_policy_digest },
          ])}
        </div>
      </div>
      <div class="panel stack">
        <h3>${escapeHtml(t(lang, "Admission 与健康度", "Admission & health"))}</h3>
        ${renderSimpleMetaList(view.research.health_panel)}
        <div class="callout stack">
          <h4>${escapeHtml(t(lang, "Intake", "Intake"))}</h4>
          ${renderSimpleMetaList(view.research.intake_panel)}
        </div>
        <div class="callout stack">
          <h4>${escapeHtml(t(lang, "Research notes", "Research notes"))}</h4>
          ${renderBulletList(view.research.notes, t(lang, "暂无 notes。", "No research notes are recorded."))}
        </div>
      </div>
    </section>
    <section class="section stack">
      <h2>${escapeHtml(t(lang, "Admission 记录", "Admission records"))}</h2>
      <div class="grid-2">
        ${view.research.admission
          .map(
            (item) => `
              <div class="panel stack">
                <div class="inline">
                  ${badge(item.title, item.eligible ? "success" : "warning")}
                  ${badge(item.eligible ? t(lang, "可进入", "eligible") : t(lang, "被阻塞", "blocked"), item.eligible ? "success" : "warning")}
                </div>
                ${renderBulletList(item.satisfied_reasons, t(lang, "当前没有 satisfied reasons。", "No satisfied reasons are recorded."))}
                ${renderBulletList(item.blocked_reasons, t(lang, "当前没有 blocked reasons。", "No blocked reasons are recorded."))}
                <div class="callout stack">
                  <h4>${escapeHtml(t(lang, "下一步", "Next actions"))}</h4>
                  ${renderBulletList(item.next_actions, t(lang, "当前没有 next actions。", "No next actions are recorded."))}
                </div>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
    <section class="section grid-2">
      <div class="panel stack">
        <h3>${escapeHtml(t(lang, "纠正记录", "Correction log"))}</h3>
        ${
          view.research.correction_log.length > 0
            ? view.research.correction_log
                .map(
                  (item) => `
                    <div class="callout stack">
                      <strong>${escapeHtml(item.field)}</strong>
                      <div class="muted">${escapeHtml(item.reason)}</div>
                      <div>${escapeHtml(`${t(lang, "声明值", "Declared")}: ${item.declared ?? "N/A"}`)}</div>
                      <div>${escapeHtml(`${t(lang, "修正值", "Corrected")}: ${item.corrected ?? "N/A"}`)}</div>
                    </div>
                  `,
                )
                .join("")
            : `<p class="muted">${escapeHtml(t(lang, "当前没有 correction log。", "No correction log is recorded."))}</p>`
        }
      </div>
      <div class="panel stack">
        <h3>${escapeHtml(t(lang, "公开面说明", "Public surface notes"))}</h3>
        ${renderBulletList(view.research.redaction_notes, t(lang, "当前没有公开面说明。", "No public-surface notes are recorded."))}
      </div>
    </section>
    <section class="section grid-2">
      <div class="panel stack">
        <h3>${escapeHtml(t(lang, "时间线", "History timeline"))}</h3>
        <div class="timeline">
          ${view.research.history
            .map(
              (item) => `
                <div class="timeline-item">
                  <strong>${escapeHtml(item.label)}</strong>
                  <div class="muted">${escapeHtml(item.at)}</div>
                  <div>${escapeHtml(item.detail)}</div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
      <div class="panel stack">
        <h3>${escapeHtml(t(lang, "原始对象", "Raw objects"))}</h3>
        <details>
              <summary>${escapeHtml(t(lang, "completeness-proof.json", "completeness-proof.json"))}</summary>
          <pre>${escapeHtml(JSON.stringify(view.research.raw.completeness, null, 2))}</pre>
        </details>
        <details>
              <summary>${escapeHtml(t(lang, "verification-record.json", "verification-record.json"))}</summary>
          <pre>${escapeHtml(JSON.stringify(view.research.raw.verification, null, 2))}</pre>
        </details>
      </div>
    </section>
  `;
}
export function renderEntryPage(
  view: EntryDetailView,
  activeTab: "scorecard" | "research",
  context: PageRenderContext,
): string {
  const lang = view.lang;
  return pageShell(
    view.title,
    `
      <section class="hero">
        <div class="eyebrow">${escapeHtml(t(lang, `条目 / ${view.entry_id}`, `Entry / ${view.entry_id}`))}</div>
        <h1>${escapeHtml(view.title)}</h1>
        <p class="lead">${escapeHtml(view.subtitle)}</p>
        <div class="inline">
          ${badge(`trust:${view.summary.trust_tier}`, view.summary.trust_tier === "verified" ? "success" : "warning")}
          ${badge(`publication:${view.summary.publication_state}`, view.summary.publication_state === "published" ? "success" : "warning")}
          ${badge(`boards:${view.summary.board_disposition ?? "active"}`, (view.summary.board_disposition ?? "active") === "active" ? "success" : "warning")}
          ${badge(`autonomy:${view.summary.autonomy_mode}`)}
          <a class="button-link" href="${escapeHtml(withLang(`/api/entries/${view.entry_id}`, lang))}">JSON</a>
        </div>
        <div class="tabs">
          <a href="${escapeHtml(withLang(`/entries/${view.entry_id}?view=scorecard`, lang))}" class="${activeTab === "scorecard" ? "active" : ""}">${escapeHtml(t(lang, "评分卡", "Scorecard"))}</a>
          <a href="${escapeHtml(withLang(`/entries/${view.entry_id}?view=research`, lang))}" class="${activeTab === "research" ? "active" : ""}">${escapeHtml(t(lang, "研究视图", "Research"))}</a>
        </div>
      </section>
      ${renderProvenanceNotice(lang, view.data_provenance)}
      ${activeTab === "scorecard" ? renderScorecard(view) : renderResearch(view)}
    `,
    { lang, currentPath: context.currentPath },
  );
}

export function renderProtocolPage(
  view: ProtocolPageView,
  context: PageRenderContext,
): string {
  const lang = view.lang;
  return pageShell(
    t(lang, "协议浏览器", "Protocol browser"),
    `
      <section class="hero">
        <div class="eyebrow">${escapeHtml(view.version)}</div>
        <h1>${escapeHtml(t(lang, "协议浏览器", "Protocol browser"))}</h1>
        <p class="lead">${escapeHtml(view.intro)}</p>
        <div class="hero-links">
          <a href="${escapeHtml(withLang("/playground/validator", lang))}">${escapeHtml(t(lang, "Validator", "Validator"))}</a>
          <a href="${escapeHtml(withLang("/boards/official-verified", lang))}">${escapeHtml(t(lang, "Boards", "Boards"))}</a>
        </div>
      </section>

      <section class="section grid-2">
        <div class="panel stack">
          <h3>${escapeHtml(t(lang, "字段搜索", "Field search"))}</h3>
          <form method="get" action="${escapeHtml(withLang("/protocol", lang))}" class="search-form">
            <input type="search" name="q" placeholder="${escapeHtml(t(lang, "搜索 trust_tier / release_policy / manifest...", "Search trust_tier / release_policy / manifest..."))}" value="${escapeHtml(view.query ?? "")}" />
            <button type="submit">${escapeHtml(t(lang, "搜索", "Search"))}</button>
          </form>
          <p class="muted">${escapeHtml(view.search_summary ?? t(lang, "支持按字段名、值域、误用场景、对象名快速定位协议片段。", "Quickly locate protocol fragments by field name, value domain, misuse pattern, or object name."))}</p>
        </div>
        <div class="panel stack">
          <h3>${escapeHtml(t(lang, "分区锚点", "Section anchors"))}</h3>
          <div class="inline">
            ${view.sections
              .map((section) => `<a class="button-link" href="#section-${escapeHtml(section.id)}">${escapeHtml(section.title)}</a>`)
              .join("")}
          </div>
        </div>
      </section>

      <section class="section stack">
        <h2>${escapeHtml(t(lang, "对象模型映射", "Object model map"))}</h2>
        <div class="map-grid">
          ${view.object_map
            .map(
              (item) => `
                <div class="panel stack" id="object-${escapeHtml(item.id)}">
                  <div class="eyebrow">${escapeHtml(item.id)}</div>
                  <h3>${escapeHtml(item.title)}</h3>
                  <p class="muted">${escapeHtml(item.summary)}</p>
                  <div class="inline">
                    ${item.used_for.map((usedBy) => badge(`${t(lang, "用于", "used by")}:${usedBy}`)).join("")}
                  </div>
                  <div class="callout">
                    <strong>${escapeHtml(t(lang, "依赖于", "Depends on"))}</strong>
                    <div class="muted">${escapeHtml(item.depends_on.length > 0 ? item.depends_on.join(" → ") : t(lang, "根对象", "root object"))}</div>
                  </div>
                  <div class="inline">
                    ${item.links.map((link) => `<a class="button-link" href="${escapeHtml(withLang(link.href, lang))}">${escapeHtml(link.label)}</a>`).join("")}
                  </div>
                </div>
              `,
            )
            .join("")}
        </div>
      </section>

      <section class="section grid-2">
        ${view.sections
          .map(
            (section) => `
              <div class="panel stack" id="section-${escapeHtml(section.id)}">
                <div class="eyebrow">${escapeHtml(section.id)}</div>
                <h3>${escapeHtml(section.title)}</h3>
                <p class="muted">${escapeHtml(section.summary)}</p>
                <ul class="bullet-list">
                  ${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
                </ul>
              </div>
            `,
          )
          .join("")}
      </section>

      <section class="section stack">
        <h2>${escapeHtml(t(lang, "实现跳转", "Implementation deep links"))}</h2>
        <div class="grid-2">
          ${view.implementation_links
            .map(
              (link) => `
                <a class="panel stack" href="${escapeHtml(withLang(link.href, lang))}">
                  <h3>${escapeHtml(link.label)}</h3>
                  <p class="muted">${escapeHtml(link.description)}</p>
                  <div class="eyebrow">${escapeHtml(link.href)}</div>
                </a>
              `,
            )
            .join("")}
        </div>
      </section>

      <section class="section stack">
        <h2>${escapeHtml(t(lang, "Canonical 字段词汇表", "Canonical field glossary"))}</h2>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>${escapeHtml(t(lang, "字段", "Field"))}</th>
                <th>${escapeHtml(t(lang, "值域", "Value domain"))}</th>
                <th>${escapeHtml(t(lang, "Owner", "Owner"))}</th>
                <th>${escapeHtml(t(lang, "使用方", "Used by"))}</th>
                <th>${escapeHtml(t(lang, "常见误用", "Common misuse"))}</th>
              </tr>
            </thead>
            <tbody>
              ${view.glossary
                .map(
                  (entry) => `
                    <tr>
                      <td><strong>${escapeHtml(entry.field)}</strong></td>
                      <td>${escapeHtml(entry.value_domain)}</td>
                      <td>${escapeHtml(entry.owner)}</td>
                      <td>${escapeHtml(entry.used_by.join(", "))}</td>
                      <td>${escapeHtml(entry.common_misuse)}</td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>
    `,
    { lang, currentPath: context.currentPath },
  );
}

function validatorIssueRow(issue: ValidatorRunView["issues"][number]): string {
  return `
    <tr>
      <td>${badge(issue.severity, issue.severity === "error" ? "warning" : issue.severity === "warning" ? "neutral" : "success")}</td>
      <td><strong>${escapeHtml(issue.code)}</strong><div class="muted">${escapeHtml(issue.path)}</div></td>
      <td>${escapeHtml(issue.message)}</td>
      <td>${escapeHtml(issue.suggestion)}</td>
    </tr>
  `;
}

export function renderValidatorPage(
  payload: string,
  result?: ValidatorRunView,
  options?: ValidatorPageOptions,
  context?: PageRenderContext,
): string {
  const lang = options?.lang ?? "zh-CN";
  const selectedMode = options?.mode ?? "admission_readiness";
  const activeSampleId = options?.activeSampleId;
  return pageShell(
    t(lang, "校验器演练场", "Validator Playground"),
    `
      <section class="hero">
        <div class="eyebrow">${escapeHtml(t(lang, "校验器演练场", "Validator playground"))}</div>
        <h1>${escapeHtml(t(lang, "校验器演练场", "Validator Playground"))}</h1>
        <p class="lead">${escapeHtml(t(lang, "Schema、digest、准入缺口与 intake / verifier-worker 边界。", "Schema, digests, admission gaps, and the intake / verifier-worker boundary."))}</p>
      </section>

      <section class="section grid-2">
        <div class="panel stack">
          <h3>${escapeHtml(t(lang, "校验模式", "Validation modes"))}</h3>
          <div class="inline">
            ${badge("schema_only")}
            ${badge("bundle_integrity")}
            ${badge("admission_readiness", "success")}
          </div>
          <p class="muted">${escapeHtml(t(lang, "JSON/字段形状、digest/binding、目标 trust tier 三个问题面。", "Three surfaces: JSON/field shape, digest/binding, and target trust tier."))}</p>
        </div>
        <div class="panel stack">
          <h3>${escapeHtml(t(lang, "样例案例", "Sample cases"))}</h3>
          ${(options?.samples ?? [])
            .map(
              (sample) => `
                <a class="callout stack" href="${escapeHtml(withLang(`/playground/validator?sample=${encodeURIComponent(sample.id)}&mode=${encodeURIComponent(sample.recommended_mode)}`, lang))}">
                  <div class="inline">
                    ${badge(sample.id === activeSampleId ? t(lang, "当前", "active") : t(lang, "样例", "sample"), sample.id === activeSampleId ? "success" : "neutral")}
                    ${badge(validatorModeLabel(lang, sample.recommended_mode))}
                  </div>
                  <strong>${escapeHtml(sample.title)}</strong>
                  <span class="muted">${escapeHtml(sample.description)}</span>
                </a>
              `,
            )
            .join("") || `<p class="muted">${escapeHtml(t(lang, "暂无 sample cases。", "No sample cases are available."))}</p>`}
        </div>
      </section>

      <section class="section stack">
        <form method="post" action="${escapeHtml(withLang("/playground/validator", lang))}" class="stack">
          <div class="form-grid">
            <div class="stack">
              <label for="validator-mode">${escapeHtml(t(lang, "校验模式", "Validation mode"))}</label>
              <select id="validator-mode" name="mode">
                <option value="schema_only"${selectedMode === "schema_only" ? " selected" : ""}>${escapeHtml(validatorModeLabel(lang, "schema_only"))}</option>
                <option value="bundle_integrity"${selectedMode === "bundle_integrity" ? " selected" : ""}>${escapeHtml(validatorModeLabel(lang, "bundle_integrity"))}</option>
                <option value="admission_readiness"${selectedMode === "admission_readiness" ? " selected" : ""}>${escapeHtml(validatorModeLabel(lang, "admission_readiness"))}</option>
              </select>
            </div>
            <div class="stack">
              <label for="validator-sample">${escapeHtml(t(lang, "当前样例", "Current sample"))}</label>
              <input id="validator-sample" value="${escapeHtml(options?.activeSampleId ?? t(lang, "自定义", "custom"))}" readonly />
            </div>
          </div>
          <input type="hidden" name="sample" value="${escapeHtml(options?.activeSampleId ?? "")}" />
          <textarea name="payload">${escapeHtml(payload)}</textarea>
          <div class="hero-links">
            <button type="submit">${escapeHtml(t(lang, "预校验", "Preview"))}</button>
            <a href="${escapeHtml(withLang("/protocol", lang))}">${escapeHtml(t(lang, "Protocol", "Protocol"))}</a>
          </div>
        </form>
      </section>

      ${
        result
          ? `
            <section class="section grid-2">
              <div class="panel stack">
                <h3>${escapeHtml(t(lang, "结果", "Result"))}</h3>
                <div class="kpi">${escapeHtml(result.status.toUpperCase())}</div>
                <div class="inline">
                  ${badge(`mode:${result.mode}`)}
                  ${result.category_breakdown.map((item) => badge(`${item.category}:${item.count}`, item.category === "admission" ? "warning" : "neutral")).join("")}
                </div>
                <p class="muted">${escapeHtml(result.summary)}</p>
                <ul class="bullet-list">
                  ${result.next_steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
                </ul>
              </div>
              <div class="panel stack">
                <h3>${escapeHtml(t(lang, "归一化预览", "Normalized preview"))}</h3>
                <pre>${escapeHtml(JSON.stringify(result.normalized_preview ?? {}, null, 2))}</pre>
              </div>
            </section>

            <section class="section stack">
              <h2>${escapeHtml(t(lang, "问题列表", "Issues"))}</h2>
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>${escapeHtml(t(lang, "严重性", "Severity"))}</th>
                      <th>${escapeHtml(t(lang, "代码 / 路径", "Code / path"))}</th>
                      <th>${escapeHtml(t(lang, "信息", "Message"))}</th>
                      <th>${escapeHtml(t(lang, "修正提示", "Fix hint"))}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${result.issues.length > 0 ? result.issues.map(validatorIssueRow).join("") : `<tr><td colspan="4" class="muted">${escapeHtml(t(lang, "没有问题。", "No issues."))}</td></tr>`}
                  </tbody>
                </table>
              </div>
            </section>
          `
          : ""
      }
    `,
    { lang, currentPath: context?.currentPath ?? withLang("/playground/validator", lang) },
  );
}

function renderSubmissionReceipt(receipt: PublicSubmissionReceipt, lang: UiLanguage): string {
  return `
    <div class="panel stack">
      <div class="inline">
        ${badge(receipt.state, receipt.state === "received_untrusted" ? "success" : "warning")}
        ${badge(`validator:${receipt.validator_status}`, receipt.validator_status === "pass" ? "success" : receipt.validator_status === "warn" ? "neutral" : "warning")}
      </div>
      <h3>${escapeHtml(t(lang, "接收回执", "Receipt"))}</h3>
      <dl class="meta-grid">
        <div>
          <dt>${escapeHtml(t(lang, "编号", "ID"))}</dt>
          <dd>${escapeHtml(receipt.receipt_id)}</dd>
        </div>
        <div>
          <dt>${escapeHtml(t(lang, "状态", "State"))}</dt>
          <dd>${escapeHtml(receipt.state)}</dd>
        </div>
        <div>
          <dt>${escapeHtml(t(lang, "Payload digest", "Payload digest"))}</dt>
          <dd>${escapeHtml(receipt.payload_digest)}</dd>
        </div>
        <div>
          <dt>${escapeHtml(t(lang, "问题数", "Issue count"))}</dt>
          <dd>${escapeHtml(String(receipt.issue_count))}</dd>
        </div>
        <div>
          <dt>${escapeHtml(t(lang, "上榜影响", "Ranking effect"))}</dt>
          <dd>${escapeHtml(receipt.ranking_effect)}</dd>
        </div>
        <div>
          <dt>${escapeHtml(t(lang, "证据门禁", "Evidence gate"))}</dt>
          <dd>${escapeHtml(receipt.requires_verifier ? t(lang, "需 verifier", "requires verifier") : t(lang, "未要求", "not required"))}</dd>
        </div>
      </dl>
      <p class="microcopy">${escapeHtml(t(lang, "候选池记录；不进入排行榜。", "Candidate pool record; not ranked."))}</p>
    </div>
  `;
}

export function renderSubmitPage(
  options: SubmitPageOptions,
  context: PageRenderContext,
): string {
  const { lang, receipt, error } = options;
  const intakeEnabled = options.intakeEnabled ?? true;
  const action = withLang("/submit", lang);
  return pageShell(
    t(lang, "公开提交", "Public intake"),
    `
      <section class="hero hero-grid-compact">
        <div class="hero-copy">
          <div class="eyebrow">${escapeHtml(t(lang, "Public intake", "Public intake"))}</div>
          <h1>${escapeHtml(t(lang, "公开提交", "Public intake"))}</h1>
          <p class="lead">${escapeHtml(t(lang, "候选池入口。公开页只显示 digest 与状态。", "Candidate intake. Public pages show only digest and state."))}</p>
        </div>
        <div class="panel stack">
          <div class="inline">
            ${badge(t(lang, "不直接上榜", "not ranked"), "warning")}
            ${intakeEnabled ? badge(t(lang, "候选池写入", "candidate store")) : badge(t(lang, "暂停写入", "intake paused"), "warning")}
          </div>
          <p class="microcopy">${escapeHtml(intakeEnabled ? t(lang, "Verified / Official 仍由 intake、verifier 与人工治理决定。", "Verified / Official stays gated by intake, verifier, and governance.") : t(lang, "当前部署未接入持久化存储，提交入口仅展示流程。", "This deployment has no durable storage attached; intake is shown as a flow preview."))}</p>
        </div>
      </section>

      ${!intakeEnabled ? `<section class="section"><div class="notice-bar"><strong>${escapeHtml(t(lang, "提交暂停", "Intake paused"))}</strong><span class="muted">${escapeHtml(t(lang, "Vercel 版本先保留页面与校验器，正式接收需接入 Blob / 数据库。", "The Vercel build keeps the page and validator online; durable intake needs Blob or a database."))}</span></div></section>` : ""}
      ${error ? `<section class="section"><div class="notice-bar"><strong>${escapeHtml(t(lang, "提交未接收", "Not received"))}</strong><span class="muted">${escapeHtml(error)}</span></div></section>` : ""}
      ${receipt ? `<section class="section">${renderSubmissionReceipt(receipt, lang)}</section>` : ""}

      <section class="section stack">
        <form method="post" action="${escapeHtml(action)}" class="stack">
          <fieldset ${intakeEnabled ? "" : "disabled"}>
          <div class="form-grid">
            <div class="stack">
              <label for="submitter-label">${escapeHtml(t(lang, "名称", "Name"))}</label>
              <input id="submitter-label" name="submitter_label" maxlength="120" />
            </div>
            <div class="stack">
              <label for="contact">${escapeHtml(t(lang, "联系", "Contact"))}</label>
              <input id="contact" name="contact" maxlength="180" />
            </div>
          </div>
          <div class="stack">
            <label for="artifact-url">${escapeHtml(t(lang, "证据链接", "Artifact URL"))}</label>
            <input id="artifact-url" name="artifact_url" maxlength="500" placeholder="https://..." />
          </div>
          <div class="stack">
            <label for="payload">${escapeHtml(t(lang, "Payload JSON", "Payload JSON"))}</label>
            <textarea id="payload" name="payload">{}</textarea>
          </div>
          <div class="stack">
            <label for="notes">${escapeHtml(t(lang, "备注", "Notes"))}</label>
            <input id="notes" name="notes" maxlength="1000" />
          </div>
          <div class="hp-field" aria-hidden="true">
            <label for="website">Website</label>
            <input id="website" name="website" tabindex="-1" autocomplete="off" />
          </div>
          <label class="inline">
            <input type="checkbox" name="consent_to_store" style="width:auto" />
            <span>${escapeHtml(t(lang, "同意保存提交记录。", "Consent to store the submission record."))}</span>
          </label>
          <div class="hero-links">
            <button type="submit">${escapeHtml(intakeEnabled ? t(lang, "提交", "Submit") : t(lang, "暂停", "Paused"))}</button>
            <a href="${escapeHtml(withLang("/playground/validator", lang))}">${escapeHtml(t(lang, "Validator", "Validator"))}</a>
          </div>
          </fieldset>
        </form>
      </section>
    `,
    { lang, currentPath: context.currentPath },
  );
}

export function renderNotFound(
  pathname: string,
  lang: UiLanguage,
  context: PageRenderContext,
): string {
  return pageShell(
    t(lang, "未找到页面", "Not found"),
    `
      <section class="hero">
        <div class="eyebrow">404</div>
        <h1>${escapeHtml(t(lang, "路由不存在", "Route not found"))}</h1>
        <p class="lead">${escapeHtml(t(lang, `未找到 ${pathname}。首页、榜单、对比、证据层、协议、校验器和提交入口仍可用。`, `Could not find ${pathname}. Home, leaderboards, comparison, evidence, protocol, validator, and intake are still available.`))}</p>
      </section>
    `,
    { lang, currentPath: context.currentPath },
  );
}
