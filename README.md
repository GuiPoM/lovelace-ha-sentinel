# HA Sentinel Card

Lovelace card for [HA Sentinel](https://github.com/GuiPoM/ha-sentinel) — shows the health status of your Home Assistant integrations at a glance.

> **Requires:** [HA Sentinel integration](https://github.com/GuiPoM/ha-sentinel) installed and configured.

---

## Installation

### Via HACS (recommended)

1. In HACS, go to **Frontend** → **Custom repositories**
2. Add `https://github.com/GuiPoM/lovelace-ha-sentinel` as a **Dashboard** type
3. Search for "HA Sentinel Card" and install
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

## Card options

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | `HA Sentinel` | Card title |
| `show_ok` | boolean | `true` | Show healthy integrations |
| `filter_provider` | string | — | Filter by provider (`integrations`) |

---

## Features

- Color-coded status per integration (green / orange / red)
- Problems sorted to the top
- Shows time since last state change
- Failure count badge
- Inline reload button for broken integrations (calls `ha_sentinel.reload`)

---

## License

MIT — © 2026 GuiPoM
