# Privacy Policy

This Firefox extension helps you understand how much time you spend on websites. Privacy is a core principle of its design. This document explains what data is collected, how it is processed and stored, and your options.

## Overview
- Measures time per domain (e.g., `example.com`) while you browse.
- Stores all data locally in Firefox’s `browser.storage.local`.
- Sends no data to external servers and uses no advertising or tracking networks.

## Data We Collect
- Domain names (hostnames) of visited sites (e.g., `example.com`).
- Aggregated time spent per domain, per day, and weekly totals.
- A cumulative “total time” counter for usage statistics.

## Data We Do NOT Collect
- Full URLs, page content, form inputs, keystrokes, cookies, or your broader browsing history.
- Identifiers or sensitive personal information.

## How Data Is Processed
- Listens to tab activity (`tabs`, `activeTab`), page transitions (`webNavigation`), and window focus changes to start/stop timing accurately.
- Assigns timing to the active tab’s domain and stores aggregated milliseconds.
- Pauses timing when the browser loses focus, resumes when focus returns.

## Storage and Retention
- Location: Firefox `browser.storage.local` (on‑device storage).
- Retention: Records older than 30 days are automatically deleted by a scheduled cleanup task.
- Portability: The extension does not export or transmit data.

## Permissions and Purpose
- `tabs`, `activeTab`: Determine the active tab for correct attribution.
- `webNavigation`: Detect page changes within a tab for accurate timing.
- `storage`: Persist time records locally.
- `<all_urls>`: Resolve the current page’s domain name.

Permissions are used only for time tracking and the UI. The extension does not read page content.

## Security
- No external network requests are made by the extension.
- Data is stored using Firefox’s WebExtension storage APIs.
- Access to stored data is limited to your browser and this extension.

## Your Controls
- Remove all stored data by uninstalling the extension via Add‑ons Manager.
- Temporarily stop tracking by disabling the extension.
- Future releases may add an in‑extension “Clear Data” option.

## Children’s Privacy
- Intended for general audiences; does not knowingly collect personal information.

## Policy Updates
- This policy may be updated to reflect functionality or legal changes. The latest version is bundled with the extension.

## Contact
- Questions or feedback: use the contact option on the extension’s AMO (Firefox Add‑ons) listing page.