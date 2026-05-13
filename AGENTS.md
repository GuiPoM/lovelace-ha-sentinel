# Sentinel Card — Agent Instructions

## Project Overview

**Sentinel Card** is the Lovelace frontend companion for the Sentinel HA integration. It provides three custom cards for visualizing integration, device and application health.

- **Repo:** `GuiPoM/lovelace-ha-sentinel` on `github.com`
- **File:** `ha-sentinel.js` (single file, three custom elements)
- **Identity:** always use `GuiPoM` / `11942518+GuiPoM@users.noreply.github.com`

---

## Cards

| Element | Provider filter | Default show_ok | Description |
|---|---|---|---|
| `ha-sentinel-card` | `PROVIDER_INTEGRATIONS` | `false` | Integration health |
| `ha-sentinel-devices-card` | `PROVIDER_DEVICES` | `false` | Physical device health |
| `ha-sentinel-apps-card` | `PROVIDER_APPS` | `false` | HA OS applications (add-ons) health |

---

## Architecture

Single JS file — shared helpers at the top, then three classes:

```
CARD_VERSION
PROVIDER_INTEGRATIONS / PROVIDER_DEVICES / PROVIDER_APPS   — must match sentinel/const.py
LABELS (fr/en)                             — all UI strings, including localized state keys
getLabels(hass)                            — auto-detect language from hass.language
COLOR / ICON                               — shared color/icon maps
SHARED_CSS                                 — single CSS block for all cards
extractDisplayName(entity)                 — strip "Sentinel " prefix + "(source)" suffix
sanitizeUrl(url)                           — allow relative paths only (XSS guard)
localizeState(state, L)                    — look up state_<raw> in L, fallback capitalize
sortEntities(entities, includeSource)      — sort by severity then name (+ source for devices)

class HaSentinelCard extends HTMLElement
class HaSentinelDevicesCard extends HTMLElement
class HaSentinelAppsCard extends HTMLElement
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

### `ha-sentinel-apps-card`
| Option | Type | Default | Description |
|---|---|---|---|
| `title` | string | — | Card title (omit to hide header) |
| `show_ok` | boolean | `false` | Show healthy applications |
| `max_items` | number | `10` | Max rows displayed |

---

## Localization

All UI strings live in `LABELS`. Add new strings to **both** `fr` and `en`.

State strings use the `state_<raw>` key convention:

```javascript
const LABELS = {
  fr: {
    // Summary rows
    integrations_error: "Intégrations en erreur",
    devices_error:      "Appareils en erreur",
    apps_error:         "Applications en erreur",
    no_error:           "Aucune erreur détectée.",
    ok:                 "OK",
    more_items:         (hidden, total) => `...`,
    unavailable_count:  (n) => `...`,
    // Integration states (state_<raw>)
    state_loaded:             "Chargée",
    state_setup_error:        "Erreur de configuration",
    state_migration_error:    "Erreur de migration",
    state_setup_retry:        "Nouvelle tentative",
    state_not_loaded:         "Non chargée",
    state_failed_unload:      "Échec du déchargement",
    state_setup_in_progress:  "Configuration en cours",
    state_unload_in_progress: "Déchargement en cours",
    // Device states
    state_unavailable: "Indisponible",
    // App states
    state_started: "Démarrée",
    state_error:   "En erreur",
    state_stopped: "Arrêtée",
    state_unknown: "Inconnu",
    state_startup: "Démarrage",
  },
  en: { ... },
};
```

`getLabels(hass)` returns the correct locale. Always call it once at the top of `_render()` and pass `L` as a parameter to helper methods — **never call `getLabels()` inside a loop**.

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

## Shared Helpers

### `extractDisplayName(entity)`
Strips `"Sentinel "` prefix and trailing `"(source)"` suffix from entity friendly_name.
Use this everywhere — never inline the regex.

### `sanitizeUrl(url)`
Only allows relative URLs starting with `/` (HA internal links).
**Always use this before injecting `device_url` into HTML** — XSS guard.

### `localizeState(state, L)`
Localizes a raw backend state string. Looks up `state_<raw>` in `L` first; falls back to
underscores→spaces + capitalize first letter. Use this in all three cards — never inline
`.replace(/_/g, " ")` directly.

```javascript
const stateStr = isProblem ? localizeState(e.attributes.state, L) : L.ok;
```

### `sortEntities(entities, includeSource = false)`
Sorts by severity (error→warning→ok) then by name. Pass `includeSource = true` for the devices card to add secondary sort by source.

### `SHARED_CSS`
Single CSS constant used by all three cards. Add styles here, not inline in `innerHTML`.

---

## Icons

### Summary row icons (per card)

| Card | OK icon | Error icon |
|---|---|---|
| Integrations | `mdi:puzzle-check` | `mdi:puzzle-remove` |
| Devices | `mdi:check-network` | `mdi:devices` |
| Apps | `mdi:puzzle-check` | `mdi:puzzle-remove` |

### Header icons (per card)

| Card | Icon |
|---|---|
| Integrations | `mdi:shield-check` |
| Devices | `mdi:devices` |
| Apps | `mdi:puzzle` |

### Row icons — always use the `ICON` constant, never inline strings:
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

## State Display

All state strings go through `localizeState(state, L)` — never hardcode or inline `.replace()`:

```javascript
const stateStr = isProblem ? localizeState(e.attributes.state, L) : L.ok;
```

`localizeState` looks up `state_<raw>` in the current locale, then falls back to
`"setup_error"` → `"Setup error"` (capitalize + underscores to spaces).

---

## Subtitle Rules (`.secondary`)

Subtitles follow different rules per card:

| Card | isProblem = true | isProblem = false |
|---|---|---|
| Integrations | `reason \|\| domain` | hidden |
| Devices | `unavailable_count(n)` if n > 0, else hidden | hidden |
| Apps | `slug` always (Docker container name) | `slug` always |

**Never show domain/reason on OK integration rows** — this creates visual noise with `show_ok: true`.

---

## `_render()` Structure

All three cards follow the same `_render()` pattern:

```javascript
_render() {
  if (!this._config) return;

  const L        = getLabels(this._hass);          // 1. locale
  const showOk   = this._config.show_ok === true;
  const maxItems = this._config.max_items || 10;
  const title    = this._config.title ?? null;

  const allEntities  = this._get*Entities();
  const problemCount = allEntities.filter((e) => e.state === "on").length;  // 2. count BEFORE filter
  let entities = showOk ? allEntities : allEntities.filter((e) => e.state === "on");
  entities = sortEntities(entities);

  const total = entities.length;
  let hidden = 0;
  if (maxItems && entities.length > maxItems) {     // 3. truncate AFTER sort
    hidden   = entities.length - maxItems;
    entities = entities.slice(0, maxItems);
  }

  const summaryRow = `...`;                         // 4. always named summaryRow
  const rows = entities.map(...).join("");
  const footer = hidden > 0 ? `...` : "";
  const header = title !== null ? `...` : "";

  this.innerHTML = `<ha-card>...</ha-card><style>${SHARED_CSS}</style>`;
}
```

Key rules:
- `problemCount` computed from **all entities** — never from the filtered/truncated list
- Variable always named `summaryRow` (not `problemRow`)
- `max_items` truncation happens **after** sort, never before

---

## `_renderRow(e, L)`

Only `HaSentinelDevicesCard` uses a separate `_renderRow` method (needed for the `groupBySource` loop). The other two cards inline their row rendering in `.map()`.

Rules for `_renderRow`:
- Always receives `L` as a parameter (computed once in `_render()`)
- Uses `ICON[severity]` — never inline icon strings
- Uses `sanitizeUrl(e.attributes.device_url)` for device links
- Uses `extractDisplayName(e)` for entity names
- Uses `localizeState(e.attributes.state, L)` for the state string

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
- No inline state strings — use `localizeState(state, L)`, never `.replace(/_/g, " ")` directly
- No inline icon strings — use `ICON[]`
- No XSS — use `sanitizeUrl()` before injecting any URL attribute
- Keep all three cards in the single `ha-sentinel.js` file
- No linter (vanilla JS) — conventions enforced by code review and this AGENTS.md
