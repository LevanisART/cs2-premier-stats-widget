import { DEFAULT_CONFIG, type WidgetConfig } from './types';

export function configToParams(config: WidgetConfig): URLSearchParams {
  const params = new URLSearchParams();
  params.set('steamId', config.steamId);
  if (!config.showAvatar) params.set('avatar', '0');
  if (!config.showName) params.set('name', '0');
  if (!config.showChange) params.set('change', '0');
  if (!config.showStats) params.set('stats', '0');
  if (!config.showMatchHistory) params.set('history', '0');
  if (config.matchCount !== 5) params.set('matchCount', String(config.matchCount));
  if (config.refreshInterval !== 30) params.set('refresh', String(config.refreshInterval));
  return params;
}

export function paramsToConfig(params: URLSearchParams): WidgetConfig {
  return {
    steamId: params.get('steamId') ?? DEFAULT_CONFIG.steamId,
    showAvatar: params.get('avatar') !== '0',
    showName: params.get('name') !== '0',
    showChange: params.get('change') !== '0',
    showStats: params.get('stats') !== '0',
    showMatchHistory: params.get('history') !== '0',
    matchCount: parseInt(params.get('matchCount') ?? '5', 10),
    refreshInterval: parseInt(params.get('refresh') ?? '30', 10),
  };
}
