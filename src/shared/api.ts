import type { LeetifyGame, LeetifyMatch, LeetifyMatchDetails, LeetifyProfile } from './types';

// Leetify's real, documented Public API (see https://api-public-docs.cs-prod.leetify.com/).
// The old cs-prod.leetify.com/api/profile/id/{steamId} endpoint this widget used to call
// doesn't exist on that API at all — hence the persistent 404s.
const API_BASE = 'https://api-public.cs-prod.leetify.com/v3/profile';
// Match-list endpoint. The profile payload has no kills/deaths, but this returns
// all recent matches in one call, each with a per-player `stats` array that does
// — keyed by steam64_id — so we join it back onto the profile's matches by id.
const MATCHES_BASE = 'https://api-public.cs-prod.leetify.com/v3/profile/matches';
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
}

export async function fetchPremierData(steamId: string): Promise<PremierData> {
  const headers: Record<string, string> = {};
  if (LEETIFY_KEY) headers._leetify_key = LEETIFY_KEY;

  const res = await fetch(`${API_BASE}?steam64_id=${encodeURIComponent(steamId)}`, { headers });
  if (res.status === 404) throw new Error('Profile not found on Leetify');
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data: LeetifyProfile = await res.json();

  if (data.ranks.premier == null) throw new Error('No Premier rank found');

  const recentGames = data.recent_matches ?? [];
  // Kills/deaths aren't in the profile payload, so fetch them from the match-list
  // endpoint (one call) and attach them to these matches. Runs alongside the
  // avatar lookup so both happen in parallel.
  const [avatarUrl] = await Promise.all([
    // Leetify's public API doesn't expose an avatar URL. If an avatar proxy is
    // configured we resolve it from the Steam Web API; otherwise this stays blank
    // and config.showAvatar hides the avatar slot entirely.
    fetchAvatarUrl(steamId),
    enrichWithKills(steamId, recentGames, headers),
  ]);
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
  };
}

// Attaches kills/deaths to each match from the match-list endpoint, which the
// profile payload doesn't carry. One request returns every recent match with a
// per-player `stats` array; we index the player's kills/deaths by match id and
// join them onto the passed matches (mutating them). Best-effort: if the request
// fails, matches keep undefined kills/deaths and the stats row falls back.
async function enrichWithKills(
  steamId: string,
  matches: LeetifyMatch[],
  headers: Record<string, string>,
): Promise<void> {
  try {
    const res = await fetch(
      `${MATCHES_BASE}?steam64_id=${encodeURIComponent(steamId)}`,
      { headers },
    );
    if (!res.ok) return;
    const details = (await res.json()) as LeetifyMatchDetails[];

    const byId = new Map<string, { kills: number; deaths: number }>();
    for (const detail of details) {
      const me = detail.stats?.find((p) => p.steam64_id === steamId);
      if (me) byId.set(detail.id, { kills: me.total_kills, deaths: me.total_deaths });
    }

    for (const m of matches) {
      const stat = byId.get(m.id);
      if (stat) {
        m.kills = stat.kills;
        m.deaths = stat.deaths;
      }
    }
  } catch {
    // Leave kills/deaths undefined; the widget handles missing data.
  }
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
