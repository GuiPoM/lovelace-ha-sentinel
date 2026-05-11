# Sentinel Card — Agent Instructions

## Project Overview

**Sentinel Card** is the Lovelace frontend companion for the Sentinel HA integration. It provides two custom cards for visualizing integration and device health.

- **Repo:** `GuiPoM/lovelace-ha-sentinel` on `github.com`
- **File:** `ha-sentinel.js` (single file, two custom elements)
- **Identity:** always use `GuiPoM` / `11942518+GuiPoM@users.noreply.github.com`

---

## Cards

| Element | Provider filter | Default show_ok | Description |
|---|---|---|---|
| `ha-sentinel-card` | `PROVIDER_INTEGRATIONS` | `false` | Integration health |
| `ha-sentinel-devices-card` | `PROVIDER_DEVICES` | `false` | Physical device health |

---

## Architecture

Single JS file with two classes + shared constants:

```javascript
const PROVIDER_INTEGRATIONS = "integrations";  // must match sentinel/const.py
const PROVIDER_DEVICES = "devices";             // must match sentinel/const.py

class HaSentinelCard extends HTMLElement { ... }
customElements.define("ha-sentinel-card", HaSentinelCard);

class HaSentinelDevicesCard extends HTMLElement { ... }
customElements.define("ha-sentinel-devices-card", HaSentinelDevicesCard);
```

---

## Entity Filtering

Cards filter `hass.states` by `provider` attribute **only** — no entity_id prefix:

```javascript
// Correct — robust against domain renames
Object.values(this._hass.states).filter(
  (s) => s.attributes.provider === PROVIDER_INTEGRATIONS
)

// Wrong — fragile magic string
s.entity_id.startsWith("binary_sensor.sentinel_")
```

---

## Card Config Options

### `ha-sentinel-card`
| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Card title (omit to hide header) |
| `show_ok` | boolean | `false` | Show healthy integrations |
| `max_items` | number | `10` | Max rows displayed |

### `ha-sentinel-devices-card`
| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Card title (omit to hide header) |
| `show_ok` | boolean | `false` | Show healthy devices |
| `max_items` | number | `10` | Max rows displayed |
| `group_by_source` | boolean | `true` | Group by integration source |

---

## Problem Count Rule

`problemCount` must be computed **before** any `show_ok` filter or `max_items` truncation:

```javascript
const allEntities = this._getDeviceEntities();
const problemCount = allEntities.filter((e) => e.state === "on").length;
let entities = allEntities;
if (!showOk) entities = entities.filter((e) => e.state === "on");
// max_items truncation AFTER
```

---

## Icons

| Card | OK icon | Error icon |
|---|---|---|
| Integrations | `mdi:puzzle-check` | `mdi:puzzle-remove` |
| Devices | `mdi:check-network` | `mdi:devices` |

Row icons:
```javascript
const ICON = {
  error:   "mdi:alert-circle",
  warning: "mdi:alert",
  ok:      "mdi:check-circle",
};
```

---

## Colors

```javascript
const COLOR = {
  error:   "var(--error-color, #f44336)",
  warning: "var(--warning-color, #ff9800)",
  ok:      "var(--success-color, #4caf50)",
  off:     "var(--disabled-color, #bdbdbd)",
};
```

---

## Device States Display

```javascript
const stateStr = isProblem
  ? (e.attributes.state === "unavailable" ? "Indisponible"
    : e.attributes.state === "silent"     ? "Muet"
    : (e.attributes.state || "").replace(/_/g, " "))
  : "OK";
```

---

## Release Rules

- Bump `CARD_VERSION` in `ha-sentinel.js` for every release
- **JS file must be attached as a release asset** — HACS fetches it from the release, not from the branch
- Release on `github.com` — no push without explicit user approval
- CI: HACS Action (plugin category) runs on every push

---

## Coding Rules

- No French in code — UI strings (labels, empty states) may be French for the user
- No magic strings for provider names — use `PROVIDER_INTEGRATIONS` / `PROVIDER_DEVICES` constants
- No entity_id prefix filtering — filter by `provider` attribute only
- Keep both cards in the single `ha-sentinel.js` file
