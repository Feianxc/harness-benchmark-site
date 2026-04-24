# Consumer-first redesign v2

Updated: 2026-04-21

## What changed from v1

This v2 note folds in three reviewer tracks:

- product / UX review
- architecture / truthfulness review
- bilingual copy review

The project direction remains the same:

- **consumer layer** answers: “I use Claude Code / Codex / OpenCode, what should I try first?”
- **evidence layer** answers: “Why should I trust this?”

But v2 tightens the presentation so the site feels more like a real leaderboard / comparison surface for everyday users, not just a protocol explainer.

## v2 principles

### 1. Answer first, explain second

The first screen should help a visitor decide quickly.

Priority order:

1. main recommendation
2. scenario fit
3. trade-offs
4. evidence path

### 2. Keep the truthfulness boundary explicit

Consumer leaderboards remain:

- editorial
- curated
- host-fit oriented

They are **not** protocol-verified final truth tables.

### 3. Localize for normal users

Chinese pages should avoid over-exposing internal terms like:

- consumer layer
- host fit
- protocol-backed evidence layer

Those concepts can still exist, but the primary copy should read like a buyer guide.

## Implemented v2 UI moves

### Home

- hero copy now uses “tool / workflow” framing
- quick recommendation strip moved above the disclaimer
- added OpenCode CTA in the hero
- six quick-pick cards now cover:
  - unsure / start here
  - Claude Code default
  - Codex default
  - OpenCode default
  - existing repo default
  - lightweight default
- host cards now use readable badges and “Best for / 适合谁” labels

### Host leaderboard pages

- hero copy now reads like a tool-specific leaderboard
- subtitle is rendered
- top cards link to the ranked row instead of self-linking back to the same page
- table headers are renamed to be more consumer-readable
- evidence CTA is now phrased honestly as opening the evidence boards

### Compare

- page title and eyebrow are more comparison-site oriented
- subtitle is rendered
- evidence CTA is available directly from the hero
- dimensions are renamed around user questions:
  - how the plan gets defined
  - how work gets broken down
  - how execution flows
  - how context stays organized
  - working style
  - best tool fit

## Remaining known gaps

### 1. Evidence deep-linking is still generic

Leaderboard rows still open a shared evidence board instead of a harness-specific evidence target.

That is honest, but not yet ideal.

### 2. Preview and full compare matrix still use separate structures

The homepage preview still adapts a lighter shape into the shared matrix renderer.

Good enough for demo, but not ideal for long-term type safety.

### 3. The detailed ranking table is still dense

The compact recommendation cards now absorb most of the first-pass UX burden, but the full table remains expert-heavy.

## Stop condition for demo readiness

The consumer-first demo is good enough to show externally when:

- a normal visitor can reach a host-specific answer in one click
- the host-specific page shows a fast default pick before the dense table
- the site clearly says this layer is curated / editorial
- the evidence path is visible on every consumer page
- both Chinese and English pages remain readable without layout breakage

## Suggested next phase

### Phase B1

- harness-specific evidence deep-links
- “why this rank” micro-explanations per top card / per row

### Phase B2

- shared compare dimension schema
- stronger type constraints for harness ids and compare dimensions

### Phase B3

- richer host pages:
  - best for
  - not for
  - confidence
  - updated at
  - methodology snippet
