/**
 * Sentinel Card
 * Lovelace card for the Sentinel integration.
 * Uses hui-generic-entity-row for pixel-perfect native HA rendering.
 *
 * Usage:
 *   type: custom:ha-sentinel-card
 *   title: "Sentinel"        # optional
 *   show_ok: true            # show healthy items (default: true)
 *   max_items: 10            # optional: limit number of rows shown
 *
 * Requires: https://github.com/GuiPoM/ha-sentinel
 */

const CARD_VERSION = "0.3.0";

class HaSentinelCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    this._updateRows();
  }

  setConfig(config) {
    this._config = config;
    if (this._hass) this._updateRows();
  }

  getCardSize() {
    return Math.min(this._config?.max_items || 5, 10) + 1;
  }

  connectedCallback() {
    if (!this._card) this._build();
  }

  _getSentinelEntities() {
    if (!this._hass) return [];
    return Object.values(this._hass.states).filter(
      (s) =>
        s.entity_id.startsWith("binary_sensor.ha_sentinel_") &&
        s.attributes.provider !== undefined
    );
  }

  _build() {
    // Build the static card shell once
    this._card = document.createElement("ha-card");

    this._header = document.createElement("div");
    this._header.className = "card-header";
    this._card.appendChild(this._header);

    this._list = document.createElement("div");
    this._card.appendChild(this._list);

    this._footer = document.createElement("div");
    this._footer.className = "sentinel-footer";
    this._card.appendChild(this._footer);

    const style = document.createElement("style");
    style.textContent = `
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px 4px;
        font-size: var(--paper-font-subhead_-_font-size, 0.875rem);
        font-weight: 500;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        line-height: 40px;
      }
      .card-header ha-icon {
        --mdc-icon-size: 18px;
        color: var(--secondary-text-color);
      }
      .header-title { flex: 1; }
      .problem-badge {
        background: var(--error-color);
        color: white;
        font-size: 0.7em;
        font-weight: 700;
        min-width: 18px;
        height: 18px;
        line-height: 18px;
        text-align: center;
        padding: 0 5px;
        border-radius: 9px;
      }
      hui-generic-entity-row {
        padding: 0 16px;
      }
      .sentinel-footer {
        padding: 4px 16px 8px;
        font-size: 0.75em;
        color: var(--secondary-text-color);
        text-align: right;
        min-height: 0;
      }
    `;
    this._card.appendChild(style);
    this.appendChild(this._card);
  }

  _updateRows() {
    if (!this._card) this._build();

    const title = this._config?.title || "Sentinel";
    const showOk = this._config?.show_ok !== false;
    const maxItems = this._config?.max_items || null;

    let entities = this._getSentinelEntities();
    if (!showOk) entities = entities.filter((e) => e.state === "on");

    // Sort: error → warning → ok, then alphabetical
    const severityOrder = { error: 0, warning: 1, ok: 2 };
    entities.sort((a, b) => {
      const sa = a.state === "on" ? (severityOrder[a.attributes.severity] ?? 1) : 2;
      const sb = b.state === "on" ? (severityOrder[b.attributes.severity] ?? 1) : 2;
      if (sa !== sb) return sa - sb;
      const nameA = (a.attributes.friendly_name || a.entity_id).replace(/^Sentinel\s+/i, "");
      const nameB = (b.attributes.friendly_name || b.entity_id).replace(/^Sentinel\s+/i, "");
      return nameA.localeCompare(nameB);
    });

    const totalCount = entities.length;
    const problemCount = entities.filter((e) => e.state === "on").length;

    let hiddenCount = 0;
    if (maxItems && entities.length > maxItems) {
      hiddenCount = entities.length - maxItems;
      entities = entities.slice(0, maxItems);
    }

    // Header
    this._header.innerHTML = `
      <ha-icon icon="mdi:shield-check"></ha-icon>
      <span class="header-title">${title}</span>
      ${problemCount > 0 ? `<span class="problem-badge">${problemCount}</span>` : ""}
    `;

    // Rows — reuse existing hui-generic-entity-row elements when possible
    const existing = Array.from(this._list.children);

    entities.forEach((entity, i) => {
      let row = existing[i];
      if (!row || row.tagName.toLowerCase() !== "hui-generic-entity-row") {
        row = document.createElement("hui-generic-entity-row");
        if (existing[i]) {
          this._list.replaceChild(row, existing[i]);
        } else {
          this._list.appendChild(row);
        }
      }

      row.hass = this._hass;
      row.config = {
        entity: entity.entity_id,
        name: (entity.attributes.friendly_name || entity.entity_id)
          .replace(/^Sentinel\s+/i, ""),
        secondary_info: entity.attributes.reason || null,
      };
    });

    // Remove extra rows
    while (this._list.children.length > entities.length) {
      this._list.removeChild(this._list.lastChild);
    }

    // Footer
    this._footer.textContent = hiddenCount > 0
      ? `+ ${hiddenCount} autre${hiddenCount > 1 ? "s" : ""} sur ${totalCount}`
      : "";
  }
}

customElements.define("ha-sentinel-card", HaSentinelCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ha-sentinel-card",
  name: "Sentinel Card",
  description: "Health status of your integrations. Requires the Sentinel integration.",
  preview: false,
  documentationURL: "https://github.com/GuiPoM/lovelace-ha-sentinel",
});

console.info(
  `%c SENTINEL-CARD %c v${CARD_VERSION} `,
  "color:white;background:#1976D2;font-weight:700;",
  "color:#1976D2;background:white;font-weight:700;"
);
