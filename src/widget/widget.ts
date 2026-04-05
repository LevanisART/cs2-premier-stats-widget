import { fetchPremierData, type PremierData } from '../shared/api';
import { paramsToConfig } from '../shared/config';
import { formatRating, getRankTier } from '../shared/ranks';
import type { WidgetConfig } from '../shared/types';
import './widget.css';

function render(container: HTMLElement, config: WidgetConfig, data: PremierData) {
  const tier = getRankTier(data.rating);
  const recent = data.recentGames.slice(0, config.matchCount);

  // Rating change (from last game)
  let changeHtml = '';
  if (config.showChange) {
    const diff = data.ratingChange;
    const cls = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
    const prefix = diff > 0 ? '+' : '';
    changeHtml = `<span class="change ${cls}">(${prefix}${formatRating(diff)})</span>`;
  }

  // Stats from the same N matches
  let statsHtml = '';
  if (config.showStats) {
    const totalKills = recent.reduce((s, g) => s + g.kills, 0);
    const totalDeaths = recent.reduce((s, g) => s + g.deaths, 0);
    const avgKills = totalKills / recent.length;
    const kd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : '—';
    statsHtml = `
      <div class="stats">
        <div class="stat"><span class="stat-val">${avgKills.toFixed(1)}</span><span class="stat-lbl">AVG</span></div>
        <div class="stat"><span class="stat-val">${kd}</span><span class="stat-lbl">K/D</span></div>
        <div class="stat"><span class="stat-val">${data.aimRating.toFixed(1)}</span><span class="stat-lbl">AIM</span></div>
      </div>`;
  }

  // W/L history as colored letters
  let historyHtml = '';
  if (config.showMatchHistory) {
    const letters = recent
      .map((g) => {
        const w = g.matchResult === 'win';
        return `<span class="${w ? 'w' : 'l'}">${w ? 'W' : 'L'}</span>`;
      })
      .join(' ');
    historyHtml = `<div class="history">${letters}</div>`;
  }

  container.innerHTML = `
    <div class="widget rank-${tier.key}">
      <div class="top-row">
        ${config.showAvatar ? `<img class="avatar" src="${data.avatarUrl}" alt="">` : ''}
        <div class="identity">
          ${config.showName ? `<div class="name">${data.name}</div>` : ''}
          <div class="rating-line">
            <span class="rating">${formatRating(data.rating)}</span>
            ${changeHtml}
          </div>
        </div>
        ${statsHtml}
      </div>
      ${historyHtml}
    </div>
  `;
}

function renderError(container: HTMLElement, message: string) {
  container.innerHTML = `
    <div class="widget rank-gray">
      <div class="top-row">
        <div class="identity">
          <div class="name">Error</div>
          <div class="rating-line"><span class="rating">${message}</span></div>
        </div>
      </div>
    </div>`;
}

function renderLoading(container: HTMLElement) {
  container.innerHTML = `
    <div class="widget rank-gray loading">
      <div class="top-row">
        <div class="identity">
          <div class="name">Loading...</div>
          <div class="rating-line"><span class="rating">—</span></div>
        </div>
      </div>
    </div>`;
}

async function init() {
  const container = document.getElementById('app')!;
  const params = new URLSearchParams(window.location.search);
  const config = paramsToConfig(params);

  if (!config.steamId) {
    renderError(container, 'No Steam ID provided.');
    return;
  }

  renderLoading(container);

  async function update() {
    try {
      const data = await fetchPremierData(config.steamId);
      render(container, config, data);
    } catch (e) {
      renderError(container, e instanceof Error ? e.message : 'Failed to fetch');
    }
  }

  await update();
  setInterval(update, config.refreshInterval * 1000);
}

init();
