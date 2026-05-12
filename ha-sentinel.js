/**
 * Sentinel Cards
 * Lovelace cards for the Sentinel integration.
 *
 * ha-sentinel-card — integrations health
 *   type: custom:ha-sentinel-card
 *   title: "Sentinel"        # optional — omit to hide header
 *   show_ok: false           # show healthy items (default: false)
 *   max_items: 10            # optional: limit number of rows shown
 *
 * ha-sentinel-devices-card — physical devices health
 *   type: custom:ha-sentinel-devices-card
 *   title: "Devices"         # optional — omit to hide header
 *   show_ok: false           # show healthy devices (default: false)
 *   max_items: 10            # optional: limit number of rows shown
 *   group_by_source: true    # group by integration source (default: true)
 *
 * ha-sentinel-apps-card — HA OS add-ons health
 *   type: custom:ha-sentinel-apps-card
 *   title: "Add-ons"         # optional — omit to hide header
 *   show_ok: false           # show healthy add-ons (default: false)
 *   max_items: 10            # optional: limit number of rows shown
 *
 * Requires: https://github.com/GuiPoM/ha-sentinel
 */

const CARD_VERSION = "0.6.0";

// Provider identifiers — must match PROVIDER_* constants in sentinel/const.py
const PROVIDER_INTEGRATIONS = "integrations";
const PROVIDER_DEVICES = "devices";
const PROVIDER_APPS = "apps";

// Localization — auto-detected from hass.language
const LABELS = {
  fr: {
    integrations_error: "Intégrations en erreur",
    devices_error:      "Appareils en erreur",
    apps_error:         "Add-ons en erreur",
    no_error:           "Aucune erreur détectée.",
    unavailable:        "Indisponible",
    silent:             "Muet",
    ok:                 "OK",
    more_items:         (hidden, total) => `+ ${hidden} autre${hidden > 1 ? "s" : ""} sur ${total}`,
    unavailable_count:  (n) => `${n} entité${n > 1 ? "s" : ""} indisponible${n > 1 ? "s" : ""}`,
  },
  en: {
    integrations_error: "Integrations with errors",
    devices_error:      "Devices with errors",
    apps_error:         "Add-ons with errors",
    no_error:           "No errors detected.",
    unavailable:        "Unavailable",
    silent:             "Silent",
    ok:                 "OK",
    more_items:         (hidden, total) => `+ ${hidden} more out of ${total}`,
    unavailable_count:  (n) => `${n} unavailable entit${n > 1 ? "ies" : "y"}`,
  },
};

function getLabels(hass) {
  const lang = hass?.language?.split("-")[0] || "en";
  return LABELS[lang] || LABELS["en"];
}

// State color map matching HA's --state-binary_sensor-problem-*-color
const COLOR = {
  error:   "var(--error-color, #f44336)",
  warning: "var(--warning-color, #ff9800)",
  ok:      "var(--success-color, #4caf50)",
  off:     "var(--disabled-color, #bdbdbd)",
};

const ICON = {
  error:   "mdi:alert-circle",
  warning: "mdi:alert",
  ok:      "mdi:check-circle",
};

// Shared CSS for both cards (injected once per render — unavoidable with innerHTML approach)
const SHARED_CSS = `
  ha-card { overflow: hidden; }
  .card-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px 8px;
    font-size: 0.875rem; font-weight: 500; color: var(--secondary-text-color);
    text-transform: uppercase; letter-spacing: 0.05em; }
  .card-header ha-icon { --mdc-icon-size: 18px; }
  .card-content { padding: 8px 0; }
  .row { display: flex; align-items: center; min-height: 48px; padding: 4px 16px;
    box-sizing: border-box; gap: 16px; }
  ha-icon { --mdc-icon-size: 24px; flex-shrink: 0; }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
  .name { font-size: 0.9em; color: var(--primary-text-color);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .name a.device-link { color: var(--primary-text-color); text-decoration: none; }
  .name a.device-link:hover { text-decoration: underline; }
  .secondary { font-size: 0.78em; color: var(--secondary-text-color);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .value { font-size: 0.85em; font-weight: 500; flex-shrink: 0; }
  .divider { border-top: 1px solid var(--divider-color, rgba(0,0,0,0.12)); margin: 0; }
  .source-header { padding: 4px 16px 2px; font-size: 0.7em; font-weight: 600;
    color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.08em; }
  .footer { padding: 4px 16px 8px; font-size: 0.75em; color: var(--secondary-text-color); text-align: right; }
  .empty { padding: 8px 16px; color: var(--secondary-text-color); font-size: 0.9em; }
`;

/**
 * Extract display name from an entity — strips "Sentinel " prefix and trailing "(source)" suffix.
 * @param {object} entity - HA state object
 * @returns {string}
 */
function extractDisplayName(entity) {
  const fullName = (entity.attributes.friendly_name || entity.entity_id)
    .replace(/^Sentinel\s+/i, "");
  return fullName.replace(/\s*\([^)]+\)\s*$/, "").trim() || fullName;
}

/**
 * Sanitize a URL — only allow relative paths starting with / (HA internal links).
 * Prevents XSS via javascript: or data: URLs.
 * @param {string|null} url
 * @returns {string|null}
 */
function sanitizeUrl(url) {
  if (!url) return null;
  return /^\//.test(url) ? url : null;
}

/**
 * Sort entities by severity (errors first, then warnings, then ok), then by name.
 * Devices card adds a secondary sort by source.
 */
function sortEntities(entities, includeSource = false) {
  const severityRank = { error: 0, warning: 1, ok: 2 };
  return [...entities].sort((a, b) => {
    const ra = a.state === "on" ? (severityRank[a.attributes.severity] ?? 1) : 2;
    const rb = b.state === "on" ? (severityRank[b.attributes.severity] ?? 1) : 2;
    if (ra !== rb) return ra - rb;
    if (includeSource) {
      const sa = (a.attributes.source || "").toUpperCase();
      const sb = (b.attributes.source || "").toUpperCase();
      if (sa !== sb) return sa.localeCompare(sb);
    }
    return extractDisplayName(a).localeCompare(extractDisplayName(b));
  });
}

// ---------------------------------------------------------------------------
// HaSentinelCard — integrations health
// ---------------------------------------------------------------------------

class HaSentinelCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) {
    this._config = config;
    if (this._hass) this._render();
  }

  getCardSize() {
    return (this._config?.max_items || 10) + 2;
  }

  connectedCallback() {
    // Always re-render on reconnect — HA may have mounted/unmounted the card
    this._render();
  }

  _getSentinelEntities() {
    if (!this._hass) return [];
    return Object.values(this._hass.states).filter(
      (s) => s.attributes.provider === PROVIDER_INTEGRATIONS
    );
  }

  _render() {
    if (!this._config) return;

    const L        = getLabels(this._hass);
    const showOk   = this._config.show_ok === true;
    const maxItems = this._config.max_items || 10;
    const title    = this._config.title ?? null;

    const allEntities  = this._getSentinelEntities();
    const problemCount = allEntities.filter((e) => e.state === "on").length;
    let entities = showOk ? allEntities : allEntities.filter((e) => e.state === "on");
    entities = sortEntities(entities);

    const total = entities.length;
    let hidden = 0;
    if (maxItems && entities.length > maxItems) {
      hidden   = entities.length - maxItems;
      entities = entities.slice(0, maxItems);
    }

    const problemRow = `
      <div class="row">
        <ha-icon icon="${problemCount > 0 ? "mdi:puzzle-remove" : "mdi:puzzle-check"}"
          style="color:${problemCount > 0 ? COLOR.error : COLOR.ok}"></ha-icon>
        <div class="info">
          <span class="name">${L.integrations_error}</span>
        </div>
        <span class="value" style="color:${problemCount > 0 ? COLOR.error : COLOR.ok}">
          ${problemCount}
        </span>
      </div>
      <div class="divider"></div>
    `;

    const rows = entities.map((e) => {
      const isProblem = e.state === "on";
      const severity  = isProblem ? (e.attributes.severity || "warning") : "ok";
      const color     = isProblem ? COLOR[severity] || COLOR.warning : COLOR.off;
      const icon      = isProblem ? ICON[severity] || ICON.warning : ICON.ok;
      const name      = extractDisplayName(e);
      const domain    = e.attributes.domain || "";
      const reason    = e.attributes.reason || "";
      const stateStr  = isProblem ? (e.attributes.state || "").replace(/_/g, " ") : L.ok;

      return `
        <div class="row">
          <ha-icon icon="${icon}" style="color:${color}"></ha-icon>
          <div class="info">
            <span class="name">${name}</span>
            <span class="secondary">${reason || domain}</span>
          </div>
          <span class="value" style="color:${isProblem ? color : "var(--secondary-text-color)"}">
            ${stateStr}
          </span>
        </div>
      `;
    }).join("");

    const footer = hidden > 0 ? `<div class="footer">${L.more_items(hidden, total)}</div>` : "";

    const header = title !== null ? `
      <div class="card-header">
        <ha-icon icon="mdi:shield-check" class="header-icon"></ha-icon>
        <span>${title}</span>
      </div>
    ` : "";

    this.innerHTML = `
      <ha-card>
        ${header}
        <div class="card-content">
          ${problemRow}
          ${rows || `<div class="empty">${L.no_error}</div>`}
        </div>
        ${footer}
      </ha-card>
      <style>${SHARED_CSS}</style>
    `;
  }
}

customElements.define("ha-sentinel-card", HaSentinelCard);

// ---------------------------------------------------------------------------
// HaSentinelDevicesCard — physical devices health
// ---------------------------------------------------------------------------

class HaSentinelDevicesCard extends HTMLElement {
  set hass(hass) { this._hass = hass; this._render(); }

  setConfig(config) { this._config = config; if (this._hass) this._render(); }

  getCardSize() { return (this._config?.max_items || 10) + 2; }

  connectedCallback() { this._render(); }

  _getDeviceEntities() {
    if (!this._hass) return [];
    return Object.values(this._hass.states).filter(
      (s) => s.attributes.provider === PROVIDER_DEVICES
    );
  }

  _render() {
    if (!this._config) return;

    const L             = getLabels(this._hass);
    const showOk        = this._config.show_ok === true;
    const maxItems      = this._config.max_items || 10;
    const title         = this._config.title ?? null;
    const groupBySource = this._config.group_by_source !== false;

    const allEntities  = this._getDeviceEntities();
    const problemCount = allEntities.filter((e) => e.state === "on").length;
    let entities = showOk ? allEntities : allEntities.filter((e) => e.state === "on");
    entities = sortEntities(entities, true);

    const total = entities.length;
    let hidden = 0;
    if (maxItems && entities.length > maxItems) {
      hidden   = entities.length - maxItems;
      entities = entities.slice(0, maxItems);
    }

    const summaryRow = `
      <div class="row">
        <ha-icon icon="${problemCount > 0 ? "mdi:devices" : "mdi:check-network"}"
          style="color:${problemCount > 0 ? COLOR.error : COLOR.ok}"></ha-icon>
        <div class="info">
          <span class="name">${L.devices_error}</span>
        </div>
        <span class="value" style="color:${problemCount > 0 ? COLOR.error : COLOR.ok}">
          ${problemCount}
        </span>
      </div>
      <div class="divider"></div>
    `;

    let rows = "";
    if (groupBySource && entities.length > 0) {
      let currentSource = null;
      for (const e of entities) {
        const source = (e.attributes.source || "DEVICE").toUpperCase();
        if (source !== currentSource) {
          if (currentSource !== null) rows += `<div class="divider"></div>`;
          rows += `<div class="source-header">${source}</div>`;
          currentSource = source;
        }
        rows += this._renderRow(e, L);
      }
    } else {
      rows = entities.map((e) => this._renderRow(e, L)).join("");
    }

    const footer = hidden > 0 ? `<div class="footer">${L.more_items(hidden, total)}</div>` : "";

    const header = title !== null ? `
      <div class="card-header">
        <ha-icon icon="mdi:devices" class="header-icon"></ha-icon>
        <span>${title}</span>
      </div>
    ` : "";

    this.innerHTML = `
      <ha-card>
        ${header}
        <div class="card-content">
          ${summaryRow}
          ${rows || `<div class="empty">${L.no_error}</div>`}
        </div>
        ${footer}
      </ha-card>
      <style>${SHARED_CSS}</style>
    `;
  }

  _renderRow(e, L) {
    const isProblem        = e.state === "on";
    const severity         = isProblem ? (e.attributes.severity || "warning") : "ok";
    const color            = isProblem ? COLOR[severity] || COLOR.warning : COLOR.off;
    const icon             = isProblem ? ICON[severity] || ICON.warning : ICON.ok;
    const name             = extractDisplayName(e);
    const deviceUrl        = sanitizeUrl(e.attributes.device_url);
    const unavailableCount = (e.attributes.unavailable_entities || []).length;
    const subtitle         = isProblem && unavailableCount > 0 ? L.unavailable_count(unavailableCount) : "";
    const stateStr         = isProblem
      ? (e.attributes.state === "unavailable" ? L.unavailable
        : e.attributes.state === "silent"     ? L.silent
        : (e.attributes.state || "").replace(/_/g, " "))
      : L.ok;
    const nameHtml = deviceUrl
      ? `<a class="device-link" href="${deviceUrl}">${name}</a>`
      : name;

    return `
      <div class="row">
        <ha-icon icon="${icon}" style="color:${color}"></ha-icon>
        <div class="info">
          <span class="name">${nameHtml}</span>
          ${subtitle ? `<span class="secondary">${subtitle}</span>` : ""}
        </div>
        <span class="value" style="color:${isProblem ? color : "var(--secondary-text-color)"}">
          ${stateStr}
        </span>
      </div>
    `;
  }
}

customElements.define("ha-sentinel-devices-card", HaSentinelDevicesCard);

// ---------------------------------------------------------------------------
// HaSentinelAppsCard — HA OS add-ons health (requires HA OS / Supervisor)
// ---------------------------------------------------------------------------

class HaSentinelAppsCard extends HTMLElement {
  set hass(hass) { this._hass = hass; this._render(); }

  setConfig(config) { this._config = config; if (this._hass) this._render(); }

  getCardSize() { return (this._config?.max_items || 10) + 2; }

  connectedCallback() { this._render(); }

  _getAppsEntities() {
    if (!this._hass) return [];
    return Object.values(this._hass.states).filter(
      (s) => s.attributes.provider === PROVIDER_APPS
    );
  }

  _render() {
    if (!this._config) return;

    const L        = getLabels(this._hass);
    const showOk   = this._config.show_ok === true;
    const maxItems = this._config.max_items || 10;
    const title    = this._config.title ?? null;

    const allEntities  = this._getAppsEntities();
    const problemCount = allEntities.filter((e) => e.state === "on").length;
    let entities = showOk ? allEntities : allEntities.filter((e) => e.state === "on");
    entities = sortEntities(entities);

    const total = entities.length;
    let hidden = 0;
    if (maxItems && entities.length > maxItems) {
      hidden   = entities.length - maxItems;
      entities = entities.slice(0, maxItems);
    }

    const summaryRow = `
      <div class="row">
        <ha-icon icon="${problemCount > 0 ? "mdi:puzzle-remove" : "mdi:puzzle-check"}"
          style="color:${problemCount > 0 ? COLOR.error : COLOR.ok}"></ha-icon>
        <div class="info">
          <span class="name">${L.apps_error}</span>
        </div>
        <span class="value" style="color:${problemCount > 0 ? COLOR.error : COLOR.ok}">
          ${problemCount}
        </span>
      </div>
      <div class="divider"></div>
    `;

    const rows = entities.map((e) => {
      const isProblem = e.state === "on";
      const severity  = isProblem ? (e.attributes.severity || "warning") : "ok";
      const color     = isProblem ? COLOR[severity] || COLOR.warning : COLOR.off;
      const icon      = isProblem ? ICON[severity] || ICON.warning : ICON.ok;
      const name      = extractDisplayName(e);
      const slug      = e.attributes.slug || "";
      const stateStr  = isProblem
        ? (e.attributes.state || "").replace(/_/g, " ")
        : L.ok;

      return `
        <div class="row">
          <ha-icon icon="${icon}" style="color:${color}"></ha-icon>
          <div class="info">
            <span class="name">${name}</span>
            ${slug ? `<span class="secondary">${slug}</span>` : ""}
          </div>
          <span class="value" style="color:${isProblem ? color : "var(--secondary-text-color)"}">
            ${stateStr}
          </span>
        </div>
      `;
    }).join("");

    const footer = hidden > 0 ? `<div class="footer">${L.more_items(hidden, total)}</div>` : "";

    const header = title !== null ? `
      <div class="card-header">
        <ha-icon icon="mdi:puzzle" class="header-icon"></ha-icon>
        <span>${title}</span>
      </div>
    ` : "";

    this.innerHTML = `
      <ha-card>
        ${header}
        <div class="card-content">
          ${summaryRow}
          ${rows || `<div class="empty">${L.no_error}</div>`}
        </div>
        ${footer}
      </ha-card>
      <style>${SHARED_CSS}</style>
    `;
  }
}

customElements.define("ha-sentinel-apps-card", HaSentinelAppsCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-sentinel-card",
  name: "Sentinel Card",
  description: "Health status of your integrations. Requires the Sentinel integration.",
  preview: false,
  documentationURL: "https://github.com/GuiPoM/lovelace-ha-sentinel",
});
window.customCards.push({
  type: "ha-sentinel-devices-card",
  name: "Sentinel Devices Card",
  description: "Health status of your physical devices. Requires the Sentinel integration.",
  preview: false,
  documentationURL: "https://github.com/GuiPoM/lovelace-ha-sentinel",
});
window.customCards.push({
  type: "ha-sentinel-apps-card",
  name: "Sentinel Apps Card",
  description: "Health status of your HA OS add-ons. Requires the Sentinel integration (HA OS only).",
  preview: false,
  documentationURL: "https://github.com/GuiPoM/lovelace-ha-sentinel",
});

console.info(
  `%c SENTINEL-CARD %c v${CARD_VERSION} `,
  "color:white;background:#1976D2;font-weight:700;",
  "color:#1976D2;background:white;font-weight:700;"
);
