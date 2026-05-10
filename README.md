# Sentinel Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
[![GitHub release](https://img.shields.io/github/release/GuiPoM/lovelace-ha-sentinel.svg)](https://github.com/GuiPoM/lovelace-ha-sentinel/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

**Lovelace cards for [Sentinel](https://github.com/GuiPoM/ha-sentinel) — a visual health dashboard for your Home Assistant integrations and devices.**

> **Requires:** [Sentinel integration](https://github.com/GuiPoM/ha-sentinel) installed and configured.

![Sentinel Card](icon.png)

---

## Cards

This package provides two independent cards:

| Card | Type | Shows |
|---|---|---|
| `ha-sentinel-card` | Integrations | Config entries (Netatmo, Z-Wave, MQTT…) |
| `ha-sentinel-devices-card` | Devices | Physical devices (sensors, locks, lights…) |

---

## Installation

### Via HACS (recommended)

1. In HACS, go to **Frontend** → **Custom repositories**
2. Add `https://github.com/GuiPoM/lovelace-ha-sentinel` — type **Dashboard**
3. Search for **Sentinel Card** and install
4. Clear browser cache

<details>
<summary>Manual installation</summary>

Copy `ha-sentinel.js` to `<config>/www/ha-sentinel.js`, then add as a Lovelace resource:

```yaml
resources:
  - url: /local/ha-sentinel.js
    type: module
```

</details>

---

## Usage

### Integrations card

```yaml
type: custom:ha-sentinel-card
```

Shows integrations monitored by Sentinel. Problems appear first, grouped by severity.

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Card title (omit to hide header) |
| `show_ok` | boolean | `false` | Show healthy integrations |
| `max_items` | number | `10` | Maximum rows to display |

### Devices card

```yaml
type: custom:ha-sentinel-devices-card
```

Shows physical devices monitored by Sentinel, grouped by integration source.

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Card title (omit to hide header) |
| `show_ok` | boolean | `false` | Show healthy devices |
| `max_items` | number | `10` | Maximum rows to display |
| `group_by_source` | boolean | `true` | Group devices by integration source |

---

## Examples

### Minimal dashboard — problems only

```yaml
type: vertical-stack
cards:
  - type: custom:ha-sentinel-card
  - type: custom:ha-sentinel-devices-card
```

### With titles and show all

```yaml
type: vertical-stack
cards:
  - type: custom:ha-sentinel-card
    title: "Integrations"
    show_ok: true
    max_items: 20
  - type: custom:ha-sentinel-devices-card
    title: "Devices"
    show_ok: true
    max_items: 20
    group_by_source: true
```

---

## States

| Display | Meaning |
|---|---|
| `En erreur` / `setup error` | Integration or device has a real problem |
| `Warning` / `setup retry` | Integration is retrying — may self-recover |
| `Indisponible` | Device entity is unavailable |
| `Muet` | Device has not reported in >24h |
| `OK` | Healthy (shown only when `show_ok: true`) |

---

## License

MIT — © 2026 GuiPoM
