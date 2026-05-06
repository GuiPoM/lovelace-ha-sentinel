/**
 * Sentinel Card
 * Lovelace card for the Sentinel integration — native HA look and feel.
 *
 * Usage:
 *   type: custom:ha-sentinel-card
 *   title: "Sentinel"        # optional
 *   show_ok: true            # show healthy items (default: true)
 *
 * Requires: https://github.com/GuiPoM/ha-sentinel
 */

const CARD_VERSION = "0.2.0";

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

    let entities = this._getSentinelEntities();

    if (!showOk) {
      entities = entities.filter((e) => e.state === "on");
    }

    entities.sort((a, b) => {
      if (a.state === "on" && b.state !== "on") return -1;
      if (a.state !== "on" && b.state === "on") return 1;
      const nameA = (a.attributes.friendly_name || a.entity_id).replace(/^Sentinel\s+/i, "");
      const nameB = (b.attributes.friendly_name || b.entity_id).replace(/^Sentinel\s+/i, "");
      return nameA.localeCompare(nameB);
    });

    const problemCount = entities.filter((e) => e.state === "on").length;

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

      const stateLabel = isProblem
        ? state.replace(/_/g, " ")
        : "OK";

      return `
        <div class="entity-row">
          <ha-icon icon="${icon}" style="color:${iconColor};--mdc-icon-size:20px;flex-shrink:0"></ha-icon>
          <div class="entity-info">
            <span class="entity-name">${name}</span>
            ${reason ? `<span class="entity-secondary">${reason}</span>` : ""}
          </div>
          <span class="entity-state" style="color:${iconColor}">${stateLabel}</span>
        </div>
      `;
    }).join("");

    this.innerHTML = `
      <ha-card>
        <div class="card-header">
          <div class="name">${title}</div>
          ${problemCount > 0
            ? `<div class="problem-badge">${problemCount} problème${problemCount > 1 ? "s" : ""}</div>`
            : `<ha-icon icon="mdi:shield-check" style="color:var(--success-color);--mdc-icon-size:20px"></ha-icon>`
          }
        </div>
        <div class="card-content">
          ${rows || `<div class="empty">Aucune intégration à afficher.</div>`}
        </div>
      </ha-card>
      <style>
        ha-card {
          --ha-card-border-radius: var(--ha-card-border-radius, 12px);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 16px 0;
          font-size: 1.1em;
          font-weight: var(--ha-card-header-font-weight, 500);
          color: var(--ha-card-header-color, var(--primary-text-color));
        }
        .problem-badge {
          background: var(--error-color);
          color: white;
          font-size: 0.75em;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .card-content {
          padding: 8px 0 8px;
        }
        .entity-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          min-height: 44px;
          border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.12));
          box-sizing: border-box;
        }
        .entity-row:last-child {
          border-bottom: none;
        }
        .entity-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .entity-name {
          font-size: 0.9em;
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
