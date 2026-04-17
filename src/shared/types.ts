export interface LeetifyProfile {
  meta: {
    name: string;
    steam64Id: string;
    steamAvatarUrl: string;
    faceitNickname: string | null;
  };
  games: LeetifyGame[];
  recentGameRatings: {
    aim: number;
    positioning: number;
    utility: number;
    leetify: number;
    gamesPlayed: number;
  } | null;
}

export interface LeetifyGame {
  gameId: string;
  mapName: string;
  matchResult: 'win' | 'loss' | 'tie';
  scores: [number, number];
  kills: number;
  deaths: number;
  skillLevel: number;
  rankType: number | null;
  elo: number | null;
  dataSource: string;
  ctLeetifyRating: number;
  tLeetifyRating: number;
}

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
