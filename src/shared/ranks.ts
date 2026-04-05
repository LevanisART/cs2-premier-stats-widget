import type { RankTier } from './types';

export const RANK_TIERS: RankTier[] = [
  {
    min: 0,
    max: 4999,
    name: 'Gray',
    key: 'gray',
    color: '#9ca3af',
    colorLight: '#d1d5db',
    gradient: 'linear-gradient(135deg, #6b7280, #9ca3af)',
  },
  {
    min: 5000,
    max: 9999,
    name: 'Light Blue',
    key: 'lightblue',
    color: '#7ec8e3',
    colorLight: '#bae6fd',
    gradient: 'linear-gradient(135deg, #5b8fa8, #7ec8e3)',
  },
  {
    min: 10000,
    max: 14999,
    name: 'Blue',
    key: 'blue',
    color: '#3b82f6',
    colorLight: '#93c5fd',
    gradient: 'linear-gradient(135deg, #1e3a6e, #3b82f6)',
  },
  {
    min: 15000,
    max: 19999,
    name: 'Purple',
    key: 'purple',
    color: '#a855f7',
    colorLight: '#d8b4fe',
    gradient: 'linear-gradient(135deg, #6b21a8, #a855f7)',
  },
  {
    min: 20000,
    max: 24999,
    name: 'Pink',
    key: 'pink',
    color: '#ec4899',
    colorLight: '#f9a8d4',
    gradient: 'linear-gradient(135deg, #be185d, #ec4899)',
  },
  {
    min: 25000,
    max: 29999,
    name: 'Red',
    key: 'red',
    color: '#ef4444',
    colorLight: '#fca5a5',
    gradient: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
  },
  {
    min: 30000,
    max: 999999,
    name: 'Gold',
    key: 'gold',
    color: '#eab308',
    colorLight: '#fde047',
    gradient: 'linear-gradient(135deg, #92700c, #eab308)',
  },
];

export function getRankTier(rating: number): RankTier {
  return RANK_TIERS.find((t) => rating >= t.min && rating <= t.max) ?? RANK_TIERS[0];
}

export function formatRating(rating: number): string {
  return rating.toLocaleString('en-US');
}
