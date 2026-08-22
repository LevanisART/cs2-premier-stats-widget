import { trackEvent } from '../shared/analytics';
import { fetchPremierData, type PremierData } from '../shared/api';
import { paramsToConfig } from '../shared/config';
import { formatRating, getRankTier } from '../shared/ranks';
import type { WidgetConfig } from '../shared/types';
import './widget.css';

function render(container: HTMLElement, config: WidgetConfig, data: PremierData) {
  const tier = getRankTier(data.rating);
  const recent = data.recentGames.slice(0, config.matchCount);

  // Rating change — Leetify's public API doesn't expose historical Premier
  // point deltas, so this shows the most recent match's performance rating
  // (a small decimal, e.g. +1.42 or -0.87) rather than a rank-point swing.
  let changeHtml = '';
  if (config.showChange) {
    const diff = data.ratingChange;
    const cls = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
    const prefix = diff > 0 ? '+' : '';
    changeHtml = `<span class="change ${cls}">(${prefix}${diff.toFixed(2)})</span>`;
  }

  // Stats from the same N matches. Raw kills/deaths aren't in Leetify's
  // public API response, so AVG KILLS / K:D are replaced with win rate and
  // average match rating — both real fields the API actually returns.
  let statsHtml = '';
  if (config.showStats) {
    const avgRating = recent.reduce((s, g) => s + g.leetify_rating, 0) / recent.length;
    const ratingPrefix = avgRating > 0 ? '+' : '';
    statsHtml = `
      <div class="stats">
        <div class="stat"><span class="stat-val">${data.winratePct.toFixed(0)}%</span><span class="stat-lbl">WIN</span></div>
        <div class="stat"><span class="stat-val">${ratingPrefix}${avgRating.toFixed(2)}</span><span class="stat-lbl">RATING</span></div>
        <div class="stat"><span class="stat-val">${data.aimRating.toFixed(1)}</span><span class="stat-lbl">AIM</span></div>
      </div>`;
  }

  // W/L history as colored letters
  let historyHtml = '';
  if (config.showMatchHistory) {
    const letters = [...recent]
      .reverse()
      .map((g) => {
        const cls = g.outcome === 'win' ? 'w' : g.outcome === 'tie' ? 't' : 'l';
        const lbl = g.outcome === 'win' ? 'W' : g.outcome === 'tie' ? 'T' : 'L';
        return `<span class="${cls}">${lbl}</span>`;
      })
      .join(' ');
    historyHtml = `<div class="history">${letters}</div>`;
  }

  container.innerHTML = `
    <div class="widget rank-${tier.key}">
      <div class="top-row">
        ${config.showAvatar && data.avatarUrl ? `<img class="avatar" src="${data.avatarUrl}" alt="">` : ''}
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

  trackEvent('widget_loaded', { steamId: config.steamId });

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
