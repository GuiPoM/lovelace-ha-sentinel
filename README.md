# Sentinel Card

[![Install via HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=GuiPoM&repository=lovelace-ha-sentinel&category=plugin)
[![GitHub release](https://img.shields.io/github/release/GuiPoM/lovelace-ha-sentinel.svg)](https://github.com/GuiPoM/lovelace-ha-sentinel/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

**Lovelace cards for [Sentinel](https://github.com/GuiPoM/ha-sentinel) — a visual health dashboard for your Home Assistant integrations, devices and add-ons.**

> **Requires:** [Sentinel integration](https://github.com/GuiPoM/ha-sentinel) installed and configured.

![Sentinel Card](icon.png)

---

## Cards

This package provides three independent cards:

| Card | Type | Shows |
|---|---|---|
| `ha-sentinel-card` | Integrations | Config entries (Netatmo, Z-Wave, MQTT…) |
| `ha-sentinel-devices-card` | Devices | Physical devices (sensors, locks, lights…) |
| `ha-sentinel-apps-card` | Add-ons | HA OS add-ons (Mosquitto, Zigbee2MQTT…) — HA OS only |

---

## Installation

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=GuiPoM&repository=lovelace-ha-sentinel&category=plugin)

<details>
<summary>Install via HACS (manual steps)</summary>

1. In HACS, go to **Frontend** → three-dot menu → **Custom repositories**
2. Add `https://github.com/GuiPoM/lovelace-ha-sentinel` — type **Dashboard**
3. Search for **Sentinel Card** and install
4. Clear browser cache

</details>

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

### Apps card (HA OS only)

```yaml
type: custom:ha-sentinel-apps-card
```

Shows HA OS add-on health. Only displays data on HA OS / Supervised installations — shows "No errors detected" on other installation types.

| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Card title (omit to hide header) |
| `show_ok` | boolean | `false` | Show healthy add-ons |
| `max_items` | number | `10` | Maximum rows to display |

---

## Examples

### Minimal dashboard — problems only

```yaml
type: vertical-stack
cards:
  - type: custom:ha-sentinel-card
  - type: custom:ha-sentinel-devices-card
  - type: custom:ha-sentinel-apps-card
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
  - type: custom:ha-sentinel-apps-card
    title: "Add-ons"
    show_ok: true
    max_items: 10
```

---

## States

| Display | Meaning |
|---|---|
| `setup error` / `error` | Integration, device or add-on has a real problem |
| `setup retry` / `unknown` | Retrying or in unknown state — may self-recover |
| `Unavailable` | Device entity is unavailable |
| `OK` | Healthy (shown only when `show_ok: true`) |

---

## License

MIT — © 2026 GuiPoM
