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
| `ha-sentinel-apps-card` | `PROVIDER_APPS` | `false` | HA OS add-on health |

---

## Architecture

Single JS file — shared helpers at the top, then two classes:

```
CARD_VERSION
PROVIDER_INTEGRATIONS / PROVIDER_DEVICES / PROVIDER_APPS   — must match sentinel/const.py
LABELS (fr/en)                             — all UI strings
getLabels(hass)                            — auto-detect language from hass.language
COLOR / ICON                               — shared color/icon maps
SHARED_CSS                                 — single CSS block for both cards
extractDisplayName(entity)                 — strip "Sentinel " prefix + "(source)" suffix
sanitizeUrl(url)                           — allow relative paths only (XSS guard)
sortEntities(entities, includeSource)      — sort by severity then name (+ source for devices)

class HaSentinelCard extends HTMLElement
class HaSentinelDevicesCard extends HTMLElement
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

## Localization

All UI strings live in `LABELS`. Add new strings to **both** `fr` and `en`:

```javascript
const LABELS = {
  fr: {
    integrations_error: "Intégrations en erreur",
    devices_error:      "Appareils en erreur",
    no_error:           "Aucune erreur détectée.",
    unavailable:        "Indisponible",
    silent:             "Muet",
    ok:                 "OK",
    more_items:         (hidden, total) => `...`,
    unavailable_count:  (n) => `...`,
  },
  en: { ... },
};
```

`getLabels(hass)` returns the correct locale. Always call it once at the top of `_render()` and pass `L` as a parameter to helper methods — **never call `getLabels()` inside a loop**.

---

## Problem Count Rule

`problemCount` must be computed from **all entities** before any `show_ok` filter or `max_items` truncation:

```javascript
const allEntities  = this._getSentinelEntities();
const problemCount = allEntities.filter((e) => e.state === "on").length;
let entities = showOk ? allEntities : allEntities.filter((e) => e.state === "on");
entities = sortEntities(entities);
// max_items truncation AFTER
```

---

## Shared Helpers

### `extractDisplayName(entity)`
Strips `"Sentinel "` prefix and trailing `"(source)"` suffix from entity friendly_name.
Use this everywhere — never inline the regex.

### `sanitizeUrl(url)`
Only allows relative URLs starting with `/` (HA internal links).
**Always use this before injecting `device_url` into HTML** — XSS guard.

### `sortEntities(entities, includeSource = false)`
Sorts by severity (error→warning→ok) then by name. Pass `includeSource = true` for the devices card to add secondary sort by source.

### `SHARED_CSS`
Single CSS constant used by both cards. Add styles here, not inline in `innerHTML`.

---

## Icons

| Card | OK icon | Error icon |
|---|---|---|
| Integrations | `mdi:puzzle-check` | `mdi:puzzle-remove` |
| Devices | `mdi:check-network` | `mdi:devices` |

Row icons — always use the `ICON` constant, never inline strings:
```javascript
const ICON = {
  error:   "mdi:alert-circle",
  warning: "mdi:alert",
  ok:      "mdi:check-circle",
};
// Usage:
const icon = isProblem ? ICON[severity] || ICON.warning : ICON.ok;
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

All state strings come from `L` (LABELS) — never hardcode:

```javascript
const stateStr = isProblem
  ? (e.attributes.state === "unavailable" ? L.unavailable
    : e.attributes.state === "silent"     ? L.silent
    : (e.attributes.state || "").replace(/_/g, " "))
  : L.ok;
```

---

## `connectedCallback`

**Always re-render unconditionally** — no `_built` guard:

```javascript
connectedCallback() {
  this._render();
}
```

HA mounts/unmounts cards when navigating between dashboards. A guard would leave the card blank on remount.

---

## `_renderRow(e, L)`

- Always receives `L` as a parameter (computed once in `_render()`)
- Uses `ICON[severity]` — never inline icon strings
- Uses `sanitizeUrl(e.attributes.device_url)` for device links
- Uses `extractDisplayName(e)` for entity names

---

## Release Rules

- Bump `CARD_VERSION` in `ha-sentinel.js` for every release
- **JS file must be attached as a release asset** — HACS fetches it from the release, not from the branch
- Release on `github.com` — no push without explicit user approval
- CI: HACS Action (plugin category) runs on every push

---

## Coding Rules

- No French in code — all UI strings in `LABELS.fr` only
- No magic strings for provider names — use `PROVIDER_INTEGRATIONS` / `PROVIDER_DEVICES` / `PROVIDER_APPS`
- No entity_id prefix filtering — filter by `provider` attribute only
- No hardcoded text outside `LABELS` — including footer, empty states, state strings
- No inline icon strings — use `ICON[]`
- No XSS — use `sanitizeUrl()` before injecting any URL attribute
- Keep both cards in the single `ha-sentinel.js` file
- No linter (vanilla JS) — conventions enforced by code review and this AGENTS.md
