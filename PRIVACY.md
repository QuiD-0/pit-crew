# Privacy Policy — Pit Crew

**Last updated:** 2026-03-22

## Overview

Pit Crew is a Chrome extension that displays Formula 1 race schedules, championship standings, and race results. This extension does not collect, store, or transmit any personal information.

## Data Collection

Pit Crew does **not** collect:
- Personal information (name, email, etc.)
- Browsing history or activity
- Authentication or login credentials
- Location data
- Cookies or tracking identifiers
- Analytics or usage data

## Data Storage

The extension stores the following data **locally on your device** using Chrome's Storage API:
- Cached F1 race data (schedules, standings, results) for performance
- User preferences (selected team color theme, light/dark mode setting)

This data never leaves your device and is not shared with any third party.

## Network Requests

The extension makes requests only to the following API:
- **Jolpi Ergast F1 API** (`https://api.jolpi.ca/ergast/f1`) — to fetch publicly available Formula 1 race data

No user data is included in these requests.

## Third-Party Services

This extension does not use any third-party analytics, advertising, or tracking services.

## Permissions

| Permission | Purpose |
|---|---|
| `storage` | Save cached race data and user preferences locally |
| `host_permissions: api.jolpi.ca` | Fetch F1 race data from the public API |

## Changes

If this policy is updated, changes will be reflected in this document with an updated date.

## Contact

If you have questions about this privacy policy, please open an issue at:
https://github.com/QuiD-0/pit-crew/issues
