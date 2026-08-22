// Raw shape of Leetify's official Public API response:
// GET https://api-public.cs-prod.leetify.com/v3/profile?steam64_id={id}
export interface LeetifyProfile {
  privacy_mode: string;
  winrate: number; // fraction, e.g. 0.6429
  total_matches: number;
  first_match_date: string;
  name: string;
  steam64_id: string;
  id: string;
  ranks: {
    leetify: number;
    premier: number | null;
    faceit: number | null;
    faceit_elo: number | null;
    wingman: number | null;
    renown: number | null;
    competitive: { map_name: string; rank: number }[];
  };
  rating: {
    aim: number;
    positioning: number;
    utility: number;
    clutch: number;
    opening: number;
    ct_leetify: number;
    t_leetify: number;
  };
  recent_matches: LeetifyMatch[];
}

export interface LeetifyMatch {
  data_source: string;
  outcome: 'win' | 'loss' | 'tie';
  rank: number | null;
  rank_type: string | null;
  map_name: string;
  leetify_rating: number;
  score: [number, number];
  preaim: number;
  reaction_time_ms: number;
  accuracy_enemy_spotted: number;
  accuracy_head: number;
  spray_accuracy: number;
}

// Kept as an alias so widget.ts's existing rendering code doesn't need renaming.
export type LeetifyGame = LeetifyMatch;

export interface RankTier {
  min: number;
  max: number;
  name: string;
  key: string;
  color: string;
  colorLight: string;
  gradient: string;
}

export interface WidgetConfig {
  steamId: string;
  showAvatar: boolean;
  showName: boolean;
  showChange: boolean;
  showStats: boolean;
  showMatchHistory: boolean;
  matchCount: number;
  refreshInterval: number;
}

export const DEFAULT_CONFIG: WidgetConfig = {
  steamId: '',
  showAvatar: true,
  showName: true,
  showChange: true,
  showStats: true,
  showMatchHistory: true,
  matchCount: 5,
  refreshInterval: 60,
};
