# Time Tracker – Firefox Extension

A lightweight, privacy‑friendly time tracker for Firefox. It measures how long you spend on websites and presents clean daily/weekly stats in a retro‑styled UI.

## Overview
- Tracks time per domain (hostnames such as `example.com`).
- Stores all data locally using `browser.storage.local`.
- Offers Today, Week, and Stats views with an accessible canvas chart.
- Full localization (i18n) with automatic UI language detection.

  ![timertracker](https://github.com/user-attachments/assets/06eb7887-1b69-40b8-a995-848d0fe94352)


## Architecture

### Manifest (MV2)
- `default_locale: "en"` and i18n keys:
  - `name`: `__MSG_extName__`
  - `description`: `__MSG_extDescription__`
  - `browser_action.default_title`: `__MSG_logo_title__`
- Permissions: `tabs`, `activeTab`, `storage`, `webNavigation`, `<all_urls>`.
- `applications.gecko`: extension id and minimum Firefox version.
- Icons: `icons/icon-16.svg`, `32.svg`, `48.svg`, `128.svg` (SVG; PNG can be used for AMO if preferred).

### Background Service (`background.js`)
- Listens to:
  - Tab activation (`browser.tabs.onActivated`).
  - URL changes (`browser.tabs.onUpdated`).
  - Window focus changes (`browser.windows.onFocusChanged`).
- Aggregates time per domain and stores it under `browser.storage.local`.
- Schedules daily cleanup to remove records older than 30 days.
- Responds to popup requests:
  - `getTodayData`, `getWeekData`, `getTotalTime`.
- Week data is provided keyed by `Date.toDateString()` for the past 7 days.

### Popup UI (`popup.html`, `popup.css`, `popup.js`)
- Tabs: Today, Week, Stats.
- Summary cards for total time and today’s time.
- Weekly line chart in the Stats tab:
  - Labels are locale‑aware (`Intl.DateTimeFormat(locale, { weekday: 'short' })`).
  - Axis labels and chart description come from i18n messages.
  - Canvas `aria-label` improves accessibility.
- UI enhancements: ripple interactions, clear typography, and a bold retro header style (no animation).

### Localization (`_locales/*/messages.json`)
- Default English plus Turkish, German, French, Spanish, Italian, Russian, Japanese.
- Message keys used by the UI: section titles, tab labels, status text, chart labels.
- Automatic UI language detection with safe fallbacks and mapping for unsupported languages.

## File Structure
```
time-tracker-extension/
├── manifest.json
├── background.js
├── popup.html
├── popup.css
├── popup.js
├── _locales/
│   ├── en/messages.json
│   ├── tr/messages.json
│   ├── de/messages.json
│   ├── fr/messages.json
│   ├── es/messages.json
│   ├── it/messages.json
│   ├── ru/messages.json
│   └── ja/messages.json
├── icons/
│   ├── icon-16.svg
│   ├── icon-32.svg
│   ├── icon-48.svg
│   └── icon-128.svg
├── PRIVACY.md
└── README.md
```

## Features
- Local, domain‑level time tracking.
- Daily and weekly summaries with a clear, responsive chart.
- Internationalized UI with automatic language selection.
- Accessible canvas (labels and `aria-label`).
- Privacy‑first storage and automatic retention cleanup.

## Development & Preview
- Quick UI preview (no extension APIs):
  - `python -m http.server 8000`
  - Open `http://localhost:8000/popup.html`
- Load as a temporary add‑on in Firefox:
  1. Open `about:debugging`
  2. Click “This Firefox” → “Load Temporary Add‑on”
  3. Select `manifest.json`

## Build & Publish
- Install tooling: `npm i -g web-ext`
- Lint: `web-ext lint`
- Build: `web-ext build`
- Optional sign: `web-ext sign` (requires AMO credentials)
- Icons: AMO may prefer PNG; if needed, provide 16/32/48/128 PNGs and update paths in `manifest.json`.

## Localization Notes
- Add new languages by creating `_locales/<lang>/messages.json` and providing keys used in the UI (tabs, sections, chart labels, status messages).
- `popup.js` applies translations programmatically via `browser.i18n.getMessage` and redraws the chart to reflect language changes.

## Accessibility
- `html lang` is set based on detected UI locale.
- Chart includes `aria-label` and readable axis labels.

## Privacy
- See `PRIVACY.md`. No data leaves the device; retention is 30 days.

## Known Limitations
- Tracking is domain‑level; sub‑page granularity is not recorded.
- Data remains local; there is no export feature in this version.

## License
MIT
