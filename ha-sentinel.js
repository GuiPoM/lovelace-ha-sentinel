/**
 * Sentinel Cards
 * Lovelace cards for the Sentinel integration.
 *
 * ha-sentinel-card — integrations health
 *   type: custom:ha-sentinel-card
 *   title: "Sentinel"        # optional — omit to hide header
 *   show_ok: true            # show healthy items (default: true)
 *   max_items: 10            # optional: limit number of rows shown
 *
 * ha-sentinel-devices-card — physical devices health
 *   type: custom:ha-sentinel-devices-card
 *   title: "Appareils"       # optional — omit to hide header
 *   show_ok: false           # show healthy devices (default: false)
 *   max_items: 20            # optional: limit number of rows shown
 *   group_by_source: true    # group by integration source (default: true)
 *
 * Requires: https://github.com/GuiPoM/ha-sentinel
 */

const CARD_VERSION = "0.5.5";

// Provider identifiers — must match PROVIDER_* constants in sentinel/const.py
const PROVIDER_INTEGRATIONS = "integrations";
const PROVIDER_DEVICES = "devices";

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

// ---------------------------------------------------------------------------
// HaSentinelCard — integrations health (unchanged from v0.4.1)
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
    return (this._config?.max_items || 5) + 2;
  }

  connectedCallback() {
    if (!this._built) this._render();
  }

  _getSentinelEntities() {
    if (!this._hass) return [];
    return Object.values(this._hass.states).filter(
      (s) => s.attributes.provider === PROVIDER_INTEGRATIONS
    );
  }

  _render() {
    if (!this._config) return;

    const showOk   = this._config.show_ok === true;
    const maxItems = this._config.max_items || 10;
    const title    = this._config.title ?? null;

    // --- sort entities ---
    const severityRank = { error: 0, warning: 1, ok: 2 };
    const allEntities  = this._getSentinelEntities();
    const problemCount = allEntities.filter((e) => e.state === "on").length;
    let entities = allEntities;

    if (!showOk) entities = entities.filter((e) => e.state === "on");

    entities.sort((a, b) => {
      const ra = a.state === "on" ? (severityRank[a.attributes.severity] ?? 1) : 2;
      const rb = b.state === "on" ? (severityRank[b.attributes.severity] ?? 1) : 2;
      if (ra !== rb) return ra - rb;
      const na = (a.attributes.friendly_name || a.entity_id).replace(/^Sentinel\s+/i, "");
      const nb = (b.attributes.friendly_name || b.entity_id).replace(/^Sentinel\s+/i, "");
      return na.localeCompare(nb);
    });

    const total = entities.length;
    let hidden = 0;
    if (maxItems && entities.length > maxItems) {
      hidden   = entities.length - maxItems;
      entities = entities.slice(0, maxItems);
    }

    // --- build rows HTML ---
    const problemRow = `
      <div class="row">
        <ha-icon icon="${problemCount > 0 ? "mdi:puzzle-remove" : "mdi:puzzle-check"}"
          style="color:${problemCount > 0 ? COLOR.error : COLOR.ok}"></ha-icon>
        <div class="info">
          <span class="name">Intégrations en erreur</span>
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
      const icon      = isProblem ? ICON[severity]  || ICON.warning  : ICON.ok;
      const fullName  = (e.attributes.friendly_name || e.entity_id).replace(/^Sentinel\s+/i, "");
      const domain    = e.attributes.domain || "";
      const name      = fullName.replace(/\s*\([^)]+\)\s*$/, "").trim() || fullName;
      const reason    = e.attributes.reason || "";
      const stateStr  = isProblem ? (e.attributes.state || "").replace(/_/g, " ") : "OK";

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

    const footer = hidden > 0
      ? `<div class="footer">+ ${hidden} autre${hidden > 1 ? "s" : ""} sur ${total}</div>`
      : "";

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
          ${rows || '<div class="empty">Aucune intégration à afficher.</div>'}
        </div>
        ${footer}
      </ha-card>
      <style>
        ha-card { overflow: hidden; }
        .card-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px 8px;
          font-size: 0.875rem; font-weight: 500; color: var(--secondary-text-color);
          text-transform: uppercase; letter-spacing: 0.05em; }
        .card-header ha-icon { --mdc-icon-size: 18px; }
        .card-content { padding: 8px 0; }
        .row { display: flex; align-items: center; min-height: 52px; padding: 4px 16px;
          box-sizing: border-box; gap: 16px; }
        ha-icon { --mdc-icon-size: 24px; flex-shrink: 0; }
        .info { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
        .name { font-size: 0.9em; color: var(--primary-text-color);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .secondary { font-size: 0.78em; color: var(--secondary-text-color);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .value { font-size: 0.85em; font-weight: 500; flex-shrink: 0; }
        .divider { border-top: 1px solid var(--divider-color, rgba(0,0,0,0.12)); margin: 0; }
        .footer { padding: 4px 16px 8px; font-size: 0.75em; color: var(--secondary-text-color); text-align: right; }
        .empty { padding: 8px 16px; color: var(--secondary-text-color); font-size: 0.9em; }
      </style>
    `;
    this._built = true;
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

  connectedCallback() { if (!this._built) this._render(); }

  _getDeviceEntities() {
    if (!this._hass) return [];
    return Object.values(this._hass.states).filter(
      (s) => s.attributes.provider === PROVIDER_DEVICES
    );
  }

  _render() {
    if (!this._config) return;

    const showOk        = this._config.show_ok === true;
    const maxItems      = this._config.max_items || 10;
    const title         = this._config.title ?? null;
    const groupBySource = this._config.group_by_source !== false;

    const severityRank = { error: 0, warning: 1, ok: 2 };
    const allEntities = this._getDeviceEntities();
    const problemCount = allEntities.filter((e) => e.state === "on").length;
    let entities = allEntities;

    if (!showOk) entities = entities.filter((e) => e.state === "on");

    entities.sort((a, b) => {
      const ra = a.state === "on" ? (severityRank[a.attributes.severity] ?? 1) : 2;
      const rb = b.state === "on" ? (severityRank[b.attributes.severity] ?? 1) : 2;
      if (ra !== rb) return ra - rb;
      const sa = (a.attributes.source || "").toUpperCase();
      const sb = (b.attributes.source || "").toUpperCase();
      if (sa !== sb) return sa.localeCompare(sb);
      const na = (a.attributes.friendly_name || a.entity_id).replace(/^Sentinel\s+/i, "");
      const nb = (b.attributes.friendly_name || b.entity_id).replace(/^Sentinel\s+/i, "");
      return na.localeCompare(nb);
    });

    const total = entities.length;
    let hidden = 0;
    if (maxItems && entities.length > maxItems) {
      hidden   = entities.length - maxItems;
      entities = entities.slice(0, maxItems);
    }

    const summaryRow = `
      <div class="row">
        <ha-icon icon="${problemCount > 0 ? "mdi:network-off" : "mdi:check-network"}"
          style="color:${problemCount > 0 ? COLOR.error : COLOR.ok}"></ha-icon>
        <div class="info">
          <span class="name">Appareils en erreur</span>
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
        rows += this._renderRow(e);
      }
    } else {
      rows = entities.map((e) => this._renderRow(e)).join("");
    }

    const footer = hidden > 0
      ? `<div class="footer">+ ${hidden} autre${hidden > 1 ? "s" : ""} sur ${total}</div>`
      : "";

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
          ${rows || '<div class="empty">Aucun appareil problématique.</div>'}
        </div>
        ${footer}
      </ha-card>
      <style>
        ha-card { overflow: hidden; }
        .card-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px 8px;
          font-size: 0.875rem; font-weight: 500; color: var(--secondary-text-color);
          text-transform: uppercase; letter-spacing: 0.05em; }
        .card-header ha-icon { --mdc-icon-size: 18px; }
        .card-content { padding: 8px 0; }
        .source-header { padding: 4px 16px 2px; font-size: 0.7em; font-weight: 600;
          color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.08em; }
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
        .footer { padding: 4px 16px 8px; font-size: 0.75em; color: var(--secondary-text-color); text-align: right; }
        .empty { padding: 8px 16px; color: var(--secondary-text-color); font-size: 0.9em; }
      </style>
    `;
    this._built = true;
  }

  _renderRow(e) {
    const isProblem  = e.state === "on";
    const severity   = isProblem ? (e.attributes.severity || "warning") : "ok";
    const color      = isProblem ? COLOR[severity] || COLOR.warning : COLOR.off;
    const icon       = isProblem
      ? (severity === "error" ? "mdi:alert-circle" : "mdi:alert")
      : "mdi:check-circle";
    const fullName   = (e.attributes.friendly_name || e.entity_id).replace(/^Sentinel\s+/i, "");
    const name       = fullName.replace(/\s*\([^)]+\)\s*$/, "").trim() || fullName;
    const reason     = e.attributes.reason || "";
    const deviceUrl  = e.attributes.device_url || null;
    const stateStr   = isProblem
      ? (e.attributes.state === "unavailable" ? "Indisponible"
        : e.attributes.state === "silent"     ? "Muet"
        : (e.attributes.state || "").replace(/_/g, " "))
      : "OK";
    const nameHtml = deviceUrl
      ? `<a class="device-link" href="${deviceUrl}">${name}</a>`
      : name;
    return `
      <div class="row">
        <ha-icon icon="${icon}" style="color:${color}"></ha-icon>
        <div class="info">
          <span class="name">${nameHtml}</span>
          ${reason ? `<span class="secondary">${reason}</span>` : ""}
        </div>
        <span class="value" style="color:${isProblem ? color : "var(--secondary-text-color)"}">
          ${stateStr}
        </span>
      </div>
    `;
  }
}

customElements.define("ha-sentinel-devices-card", HaSentinelDevicesCard);

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

console.info(
  `%c SENTINEL-CARD %c v${CARD_VERSION} `,
  "color:white;background:#1976D2;font-weight:700;",
  "color:#1976D2;background:white;font-weight:700;"
);
