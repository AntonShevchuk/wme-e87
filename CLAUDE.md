# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WME E87 is a TamperMonkey/GreaseMonkey userscript for Waze Map Editor (WME). It solves the inconsistent direction problem -- providing buttons to reverse segment direction, align directions across multiple selected segments, and swap associated properties (speed limits, lanes).

Source is written in TypeScript under `src/`, built with Rollup into a single IIFE at `dist/WME-E87.user.js`. GreasyFork auto-syncs from the dist output.

## Commands

- **Install:** `npm install`
- **Build:** `npm run build`
- **Watch:** `npm run watch` (rebuild on changes)
- No test or lint steps exist.

## Architecture

```
src/
  meta.ts          # userscript header (comment block, not TS code)
  style.css        # plain CSS, imported as string
  globals.d.ts     # declares WME runtime globals (WMEBase, WMEUI, I18n, etc.)
  translations.ts  # NAME constant, TRANSLATION (en, uk, ru)
  settings.ts      # SETTINGS, getButtons() (deferred I18n evaluation)
  e87.ts           # E87 class (extends WMEBase)
  index.ts         # bootstrap: registers translations/CSS, instantiates E87
```

**Build output:** `dist/WME-E87.user.js` -- IIFE with userscript header prepended as banner. Version is read from `package.json` via `{{version}}` placeholder in `meta.ts`.

**Key external dependencies** (loaded via `@require` in userscript header, not bundled):
- WME-Bootstrap.js, WME-Base.js, WME-UI.js, CommonUtils.js (WME script ecosystem)

## Coding Conventions

- TypeScript with `strict: false` -- minimal type annotations, `any` for WME SDK types
- GitHub Actions auto-builds `dist/` on push to main
