# Sentinel Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
[![GitHub release](https://img.shields.io/github/release/GuiPoM/lovelace-ha-sentinel.svg)](https://github.com/GuiPoM/lovelace-ha-sentinel/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

**Lovelace card for [Sentinel](https://github.com/GuiPoM/ha-sentinel) — visual health dashboard for your Home Assistant integrations.**

> **Requires:** [Sentinel integration](https://github.com/GuiPoM/ha-sentinel) installed and configured.

---

## Installation

### Via HACS (recommended)

1. In HACS, go to **Frontend** → **Custom repositories**
2. Add `https://github.com/GuiPoM/lovelace-ha-sentinel` — type **Dashboard**
3. Search for **Sentinel Card** and install
4. Refresh your browser

### Manual

Copy `ha-sentinel.js` to `<config>/www/ha-sentinel.js`, then add as a Lovelace resource:

```yaml
resources:
  - url: /local/ha-sentinel.js
    type: module
```

---

## Usage

```yaml
type: custom:ha-sentinel-card
title: "Integration Status"   # optional, default: "HA Sentinel"
show_ok: true                  # show healthy integrations (default: true)
filter_provider: integrations  # optional: filter by provider
```

---

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | `HA Sentinel` | Card title |
| `show_ok` | boolean | `true` | Show healthy integrations |
| `filter_provider` | string | — | Filter by provider (`integrations`) |

---

## Features

- Color-coded status per integration (green / orange / red)
- Problems sorted to the top
- Time since last state change
- Failure count badge
- Inline reload button for broken integrations

---

## License

MIT — © 2026 GuiPoM
