/**
 * Sentinel Card
 * Lovelace card for the Sentinel integration — native HA look and feel.
 *
 * Usage:
 *   type: custom:ha-sentinel-card
 *   title: "Sentinel"        # optional
 *   show_ok: true            # show healthy items (default: true)
 *   max_items: 10            # optional: limit number of rows shown
 *
 * Requires: https://github.com/GuiPoM/ha-sentinel
 */

const CARD_VERSION = "0.2.2";

class HaSentinelCard extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) {
    this._config = config;
  }

  getCardSize() {
    return 4;
  }

  _getSentinelEntities() {
    if (!this._hass) return [];
    return Object.values(this._hass.states).filter(
      (s) =>
        s.entity_id.startsWith("binary_sensor.ha_sentinel_") &&
        s.attributes.provider !== undefined
    );
  }

  _render() {
    if (!this._hass || !this._config) return;

    const title = this._config.title || "Sentinel";
    const showOk = this._config.show_ok !== false;
    const maxItems = this._config.max_items || null;

    let entities = this._getSentinelEntities();

    if (!showOk) {
      entities = entities.filter((e) => e.state === "on");
    }

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

    const rows = entities.map((entity) => {
      const isProblem = entity.state === "on";
      const severity = entity.attributes.severity || "ok";
      const state = entity.attributes.state || "unknown";
      const reason = entity.attributes.reason || "";
      const name = (entity.attributes.friendly_name || entity.entity_id)
        .replace(/^Sentinel\s+/i, "");

      const icon = isProblem
        ? severity === "error" ? "mdi:alert-circle" : "mdi:alert"
        : "mdi:check-circle";

      const iconColor = isProblem
        ? severity === "error" ? "var(--error-color)" : "var(--warning-color)"
        : "var(--success-color)";

      const stateLabel = isProblem ? state.replace(/_/g, " ") : "OK";
      const stateColor = isProblem
        ? severity === "error" ? "var(--error-color)" : "var(--warning-color)"
        : "var(--secondary-text-color)";

      return `
        <div class="entity-row">
          <ha-icon icon="${icon}" style="color:${iconColor}"></ha-icon>
          <div class="entity-info">
            <span class="entity-name">${name}</span>
            ${reason ? `<span class="entity-secondary">${reason}</span>` : ""}
          </div>
          <span class="entity-state" style="color:${stateColor}">${stateLabel}</span>
        </div>
      `;
    }).join("");

    this.innerHTML = `
      <ha-card>
        <div class="card-header">
          <ha-icon icon="mdi:shield-check" class="header-icon"></ha-icon>
          <span class="header-title">${title}</span>
          ${problemCount > 0
            ? `<span class="problem-badge">${problemCount}</span>`
            : ""
          }
        </div>
        <div class="card-content">
          ${rows || `<div class="empty">Aucune intégration à afficher.</div>`}
          ${hiddenCount > 0
            ? `<div class="hidden-count">+ ${hiddenCount} autre${hiddenCount > 1 ? "s" : ""} sur ${totalCount}</div>`
            : ""}
        </div>
      </ha-card>
      <style>
        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px 8px;
          font-size: 0.9em;
          font-weight: 500;
          color: var(--secondary-text-color);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .header-icon {
          --mdc-icon-size: 18px;
          color: var(--secondary-text-color);
        }
        .header-title {
          flex: 1;
        }
        .problem-badge {
          background: var(--error-color);
          color: white;
          font-size: 0.75em;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 8px;
          line-height: 1.6;
        }
        .card-content {
          padding: 0 0 4px;
        }
        .entity-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-top: 1px solid var(--divider-color, rgba(0,0,0,0.08));
          box-sizing: border-box;
        }
        ha-icon {
          --mdc-icon-size: 20px;
          flex-shrink: 0;
        }
        .entity-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .entity-name {
          font-size: 0.95em;
          color: var(--primary-text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .entity-secondary {
          font-size: 0.78em;
          color: var(--secondary-text-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 1px;
        }
        .entity-state {
          font-size: 0.85em;
          font-weight: 500;
          flex-shrink: 0;
        }
        .empty {
          padding: 12px 16px;
          color: var(--secondary-text-color);
          font-size: 0.9em;
          border-top: 1px solid var(--divider-color, rgba(0,0,0,0.08));
        }
        .hidden-count {
          padding: 4px 16px 8px;
          color: var(--secondary-text-color);
          font-size: 0.78em;
          text-align: right;
        }
      </style>
    `;
  }

  connectedCallback() {
    this._render();
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
