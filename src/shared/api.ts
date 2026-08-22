import type { LeetifyGame, LeetifyProfile } from './types';

// Leetify's real, documented Public API (see https://api-public-docs.cs-prod.leetify.com/).
// The old cs-prod.leetify.com/api/profile/id/{steamId} endpoint this widget used to call
// doesn't exist on that API at all — hence the persistent 404s.
const API_BASE = 'https://api-public.cs-prod.leetify.com/v3/profile';
const LEETIFY_KEY = import.meta.env.VITE_LEETIFY_KEY as string | undefined;

// Optional Steam avatar proxy (a small Cloudflare Worker — see worker/README.md).
// Leetify's public API doesn't return an avatar, and the browser can't call
// Steam's Web API directly (needs a secret key, no CORS), so when this is set
// the widget fetches the avatar from the Worker instead.
const AVATAR_PROXY = import.meta.env.VITE_AVATAR_PROXY_URL as string | undefined;

export interface PremierData {
  name: string;
  avatarUrl: string;
  rating: number;
  ratingChange: number;
  recentGames: LeetifyGame[];
  aimRating: number;
  winratePct: number;
}

export async function fetchPremierData(steamId: string): Promise<PremierData> {
  const headers: Record<string, string> = {};
  if (LEETIFY_KEY) headers._leetify_key = LEETIFY_KEY;

  const res = await fetch(`${API_BASE}?steam64_id=${encodeURIComponent(steamId)}`, { headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data: LeetifyProfile = await res.json();

  if (data.ranks.premier == null) throw new Error('No Premier rank found');

  const recentGames = data.recent_matches ?? [];
  // Leetify's public API doesn't expose an avatar URL. If an avatar proxy is
  // configured we resolve it from the Steam Web API; otherwise this stays blank
  // and config.showAvatar hides the avatar slot entirely.
  const avatarUrl = await fetchAvatarUrl(steamId);
  // The API doesn't return historical Premier point deltas, so "change" is
  // repurposed to the most recent match's performance rating instead of a
  // literal rank-point swing.
  const ratingChange = recentGames.length > 0 ? recentGames[0].leetify_rating : 0;

  return {
    name: data.name,
    avatarUrl,
    rating: data.ranks.premier,
    ratingChange,
    recentGames,
    aimRating: data.rating.aim,
    winratePct: data.winrate * 100,
  };
}

// Resolves a Steam avatar URL via the optional proxy Worker. Never throws:
// if the proxy is unset, unreachable, or the profile is private, the widget
// just renders without an avatar rather than failing the whole update.
async function fetchAvatarUrl(steamId: string): Promise<string> {
  if (!AVATAR_PROXY) return '';
  try {
    const res = await fetch(`${AVATAR_PROXY}?steam64_id=${encodeURIComponent(steamId)}`);
    if (!res.ok) return '';
    const body = (await res.json()) as { avatarUrl?: unknown };
    return typeof body.avatarUrl === 'string' ? body.avatarUrl : '';
  } catch {
    return '';
  }
}
