import { fetchPremierData, type PremierData } from "../shared/api";
import { configToParams } from "../shared/config";
import { formatRating, getRankTier } from "../shared/ranks";
import { DEFAULT_CONFIG, type WidgetConfig } from "../shared/types";
import "./customizer.css";

let currentConfig: WidgetConfig = { ...DEFAULT_CONFIG };
let previewData: PremierData | null = null;
let previewError: string | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function getWidgetUrl(): string {
  const params = configToParams(currentConfig);
  const base =
    window.location.origin + window.location.pathname.replace(/\/$/, "");
  return `${base}/widget/?${params.toString()}`;
}

function renderPreview() {
  const previewEl = document.getElementById("preview-widget")!;

  if (previewError) {
    previewEl.innerHTML = `
      <div class="wp rank-gray">
        <div class="wp-top"><div class="wp-identity"><div class="wp-name">Error</div><div class="wp-rating-line"><span class="wp-rating">${previewError}</span></div></div></div>
      </div>`;
    return;
  }

  if (!previewData) {
    previewEl.innerHTML = `
      <div class="wp rank-gray">
        <div class="wp-top"><div class="wp-identity"><div class="wp-name">Enter a Steam ID</div><div class="wp-rating-line"><span class="wp-rating">—</span></div></div></div>
      </div>`;
    return;
  }

  const data = previewData;
  const config = currentConfig;
  const tier = getRankTier(data.rating);
  const recent = data.recentGames.slice(0, config.matchCount);

  let changeHtml = "";
  if (config.showChange) {
    const diff = data.ratingChange;
    const cls = diff > 0 ? "positive" : diff < 0 ? "negative" : "neutral";
    const prefix = diff > 0 ? "+" : "";
    changeHtml = `<span class="wp-change ${cls}">(${prefix}${formatRating(diff)})</span>`;
  }

  let statsHtml = "";
  if (config.showStats) {
    const totalKills = recent.reduce((s, g) => s + g.kills, 0);
    const totalDeaths = recent.reduce((s, g) => s + g.deaths, 0);
    const avgKills = totalKills / recent.length;
    const kd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : "—";
    statsHtml = `
      <div class="wp-stats">
        <div class="wp-stat"><span class="wp-stat-val">${avgKills.toFixed(1)}</span><span class="wp-stat-lbl">AVG</span></div>
        <div class="wp-stat"><span class="wp-stat-val">${kd}</span><span class="wp-stat-lbl">K/D</span></div>
        <div class="wp-stat"><span class="wp-stat-val">${data.aimRating.toFixed(1)}</span><span class="wp-stat-lbl">AIM</span></div>
      </div>`;
  }

  let historyHtml = "";
  if (config.showMatchHistory) {
    const letters = [...recent]
      .reverse()
      .map((g) => {
        const cls = g.matchResult === "win" ? "w" : g.matchResult === "tie" ? "t" : "l";
        const lbl = g.matchResult === "win" ? "W" : g.matchResult === "tie" ? "T" : "L";
        return `<span class="${cls}">${lbl}</span>`;
      })
      .join(" ");
    historyHtml = `<div class="wp-history">${letters}</div>`;
  }

  previewEl.innerHTML = `
    <div class="wp rank-${tier.key}">
      <div class="wp-top">
        ${config.showAvatar ? `<img class="wp-avatar" src="${data.avatarUrl}" alt="">` : ""}
        <div class="wp-identity">
          ${config.showName ? `<div class="wp-name">${data.name}</div>` : ""}
          <div class="wp-rating-line">
            <span class="wp-rating">${formatRating(data.rating)}</span>
            ${changeHtml}
          </div>
        </div>
        ${statsHtml}
      </div>
      ${historyHtml}
    </div>`;
}

function updateGeneratedUrl() {
  const urlEl = document.getElementById("generated-url") as HTMLInputElement;
  if (currentConfig.steamId) {
    urlEl.value = getWidgetUrl();
  } else {
    urlEl.value = "";
  }
}

async function loadPreview() {
  if (!currentConfig.steamId) {
    previewData = null;
    previewError = null;
    renderPreview();
    return;
  }

  try {
    previewError = null;
    previewData = await fetchPremierData(currentConfig.steamId);
  } catch (e) {
    previewError = e instanceof Error ? e.message : "Failed to load";
    previewData = null;
  }
  renderPreview();
  updateGeneratedUrl();
}

function debouncedLoadPreview() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadPreview, 600);
}

function bindControls() {
  const steamInput = document.getElementById("steam-id") as HTMLInputElement;
  steamInput.addEventListener("input", () => {
    currentConfig.steamId = steamInput.value.trim();
    updateGeneratedUrl();
    debouncedLoadPreview();
  });

  const checkboxMap: Record<string, keyof WidgetConfig> = {
    "show-avatar": "showAvatar",
    "show-name": "showName",
    "show-change": "showChange",
    "show-stats": "showStats",
    "show-history": "showMatchHistory",
  };

  for (const [id, key] of Object.entries(checkboxMap)) {
    const el = document.getElementById(id) as HTMLInputElement;
    el.checked = currentConfig[key] as boolean;
    el.addEventListener("change", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (currentConfig as any)[key] = el.checked;
      renderPreview();
      updateGeneratedUrl();
    });
  }

  const matchCountEl = document.getElementById(
    "match-count",
  ) as HTMLSelectElement;
  matchCountEl.value = String(currentConfig.matchCount);
  matchCountEl.addEventListener("change", () => {
    currentConfig.matchCount = parseInt(matchCountEl.value, 10);
    renderPreview();
    updateGeneratedUrl();
  });

  const refreshEl = document.getElementById(
    "refresh-interval",
  ) as HTMLSelectElement;
  refreshEl.value = String(currentConfig.refreshInterval);
  refreshEl.addEventListener("change", () => {
    currentConfig.refreshInterval = parseInt(refreshEl.value, 10);
    updateGeneratedUrl();
  });

  const mapEl = document.getElementById("preview-map") as HTMLSelectElement;
  mapEl.addEventListener("change", () => {
    const previewArea = document.getElementById("preview-widget")!;
    previewArea.style.backgroundImage = `url('https://leetify.com/assets/images/maps/${mapEl.value}.jpg')`;
  });

  document.getElementById("copy-url")!.addEventListener("click", () => {
    const urlEl = document.getElementById("generated-url") as HTMLInputElement;
    if (urlEl.value) {
      navigator.clipboard.writeText(urlEl.value);
      const btn = document.getElementById("copy-url")!;
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    }
  });

  document.getElementById("reset-btn")!.addEventListener("click", () => {
    const steamId = currentConfig.steamId;
    currentConfig = { ...DEFAULT_CONFIG, steamId };

    for (const [id, key] of Object.entries(checkboxMap)) {
      (document.getElementById(id) as HTMLInputElement).checked = currentConfig[
        key
      ] as boolean;
    }
    matchCountEl.value = String(currentConfig.matchCount);
    refreshEl.value = String(currentConfig.refreshInterval);
    renderPreview();
    updateGeneratedUrl();
  });
}

function init() {
  const app = document.getElementById("app")!;
  app.innerHTML = `
    <div class="customizer">
      <header class="header">
        <h1 class="title">CS2 Premier Widget</h1>
        <p class="subtitle">OBS browser source widget for CS2 Premier rating</p>
      </header>

      <div class="layout">
        <div class="panel settings-panel">
          <h2 class="panel-title">Settings</h2>

          <div class="field">
            <label class="field-label" for="steam-id">Steam ID (Steam64)</label>
            <input type="text" id="steam-id" class="input" placeholder="e.g. 76561198012345678">
            <span class="field-hint">Find your Steam64 ID at steamid.io</span>
          </div>

          <div class="section">
            <h3 class="section-title">Display Options</h3>
            <label class="checkbox-row"><input type="checkbox" id="show-avatar" checked><span>Show avatar</span></label>
            <label class="checkbox-row"><input type="checkbox" id="show-name" checked><span>Show player name</span></label>
            <label class="checkbox-row"><input type="checkbox" id="show-change" checked><span>Show rating change (+/-)</span></label>
            <label class="checkbox-row"><input type="checkbox" id="show-stats" checked><span>Show stats (AVG kills, K/D)</span></label>
            <label class="checkbox-row"><input type="checkbox" id="show-history" checked><span>Show match history (W L W L ...)</span></label>
          </div>

          <div class="field">
            <label class="field-label" for="match-count">Recent matches to use</label>
            <select id="match-count" class="input">
              <option value="3">3</option>
              <option value="5" selected>5</option>
              <option value="8">8</option>
              <option value="10">10</option>
            </select>
            <span class="field-hint">Used for stats, W/L count, and match history</span>
          </div>

          <div class="field">
            <label class="field-label" for="refresh-interval">Refresh interval</label>
            <select id="refresh-interval" class="input">
              <option value="60" selected>1 minute</option>
              <option value="180">3 minutes</option>
              <option value="300">5 minutes</option>
            </select>
          </div>

          <button class="btn btn-secondary" id="reset-btn">Restore defaults</button>
        </div>

        <div class="panel preview-panel">
          <h2 class="panel-title">Widget Preview</h2>
          <div id="preview-widget" class="preview-area"></div>

          <div class="field" style="margin-top: 16px;">
            <select id="preview-map" class="input">
              <option value="de_anubis">Anubis</option>
              <option value="de_ancient">Ancient</option>
              <option value="de_dust2">Dust 2</option>
              <option value="de_inferno">Inferno</option>
              <option value="de_mirage">Mirage</option>
              <option value="de_nuke">Nuke</option>
              <option value="de_overpass">Overpass</option>
              <option value="de_train">Train</option>
              <option value="de_vertigo">Vertigo</option>
            </select>
          </div>

          <div class="field" style="margin-top: 16px;">
            <label class="field-label">Widget URL</label>
            <div class="url-row">
              <input type="text" id="generated-url" class="input url-input" readonly placeholder="Enter a Steam ID to generate URL">
              <button class="btn btn-primary" id="copy-url">Copy</button>
            </div>
            <span class="field-hint">Add this URL as a Browser Source in OBS (recommended size: 520×120)</span>
          </div>
        </div>
      </div>

      <footer class="footer">
        <p>CS2 Premier Widget · Data from <a href="https://leetify.com" target="_blank">Leetify</a></p>
      </footer>
    </div>
  `;

  bindControls();

  const params = new URLSearchParams(window.location.search);
  const idFromUrl = params.get("id");
  if (idFromUrl) {
    const steamInput = document.getElementById("steam-id") as HTMLInputElement;
    steamInput.value = idFromUrl;
    currentConfig.steamId = idFromUrl;
    loadPreview();
  } else {
    renderPreview();
  }
}

init();
