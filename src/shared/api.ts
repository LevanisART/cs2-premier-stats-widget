import type { LeetifyGame, LeetifyProfile } from './types';

const API_BASE = 'https://api.cs-prod.leetify.com/api/profile/id';

export interface PremierData {
  name: string;
  avatarUrl: string;
  rating: number;
  ratingChange: number;
  recentGames: LeetifyGame[];
  aimRating: number;
}

export async function fetchPremierData(steamId: string): Promise<PremierData> {
  const res = await fetch(`${API_BASE}/${steamId}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data: LeetifyProfile = await res.json();
  const premier = data.games.filter((g) => g.rankType === 11);

  if (premier.length === 0) throw new Error('No Premier games found');

  const rating = premier[0].skillLevel;
  const prevRating = premier.length >= 2 ? premier[1].skillLevel : rating;
  const aimRating = data.recentGameRatings?.aim ?? 0;

  return {
    name: data.meta.name,
    avatarUrl: data.meta.steamAvatarUrl,
    rating,
    ratingChange: rating - prevRating,
    recentGames: premier,
    aimRating,
  };
}
