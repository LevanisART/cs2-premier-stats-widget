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

// rank_type that marks a Premier match in recent_matches. Competitive is 12,
// Wingman is 7, Faceit is null. For Premier matches, `rank` holds the CS Rating.
const PREMIER_RANK_TYPE = 11;

export interface PremierData {
  name: string;
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

  // This is a Premier widget: rating, change, W/L, and stats all reflect Premier
  // matches only. recent_matches mixes modes (Competitive/Wingman/Faceit), so we
  // filter to Premier (rank_type 11) up front. During a non-Premier session this
  // list may be empty — that's expected and the widget degrades gracefully.
  const premierGames = (data.recent_matches ?? []).filter(
    (m) => m.rank_type === PREMIER_RANK_TYPE,
  );
  await enrichWithKills(steamId, premierGames, headers);
  // Premier point change: for Premier matches `rank` is the CS Rating after that
  // match, so the change is the diff between the two most recent. If there aren't
  // two Premier matches in recent history (e.g. only Competitive lately), this
  // stays 0 and the widget hides the change rather than showing a bogus number.
  const ranked = premierGames.filter((m) => typeof m.rank === 'number');
  const ratingChange = ranked.length >= 2 ? ranked[0].rank! - ranked[1].rank! : 0;

  return {
    name: data.name,
    rating: data.ranks.premier,
    ratingChange,
    recentGames: premierGames,
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

