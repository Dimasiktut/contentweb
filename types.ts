import { ReactElement } from 'react';

// Базовый интерфейс для всех записей PocketBase
export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}

export enum AchievementId {
  IDEOLOGUE = 'IDEOLOGUE',
  FOODMAKER = 'FOODMAKER',
  LUCKY = 'LUCKY',
  TROLL = 'TROLL',
}

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: ReactElement;
}

export interface User extends BaseRecord {
  tg_id: number;
  username: string;
  avatarUrl: string;
  role: string;
  stats_ideasProposed: number;
  stats_wins: number;
  stats_winStreak: number;
  achievements: AchievementId[];
  energy: number;
  points: number;
  last_energy_update: string;
}

export interface Option extends BaseRecord {
  text: string;
  category: string;
  author: string; // Relation to User ID
}

export interface WinRecord extends BaseRecord {
  option_text: string;
  option_category: string;
  author: string; // Relation to User ID
  timestamp: number;
}

export enum AppView {
  ROULETTE = 'ROULETTE',
  PROFILES = 'PROFILES',
  HISTORY = 'HISTORY',
  REWARDS = 'REWARDS',
  DUEL = 'DUEL',
  GAMES_VIEW = 'GAMES_VIEW',
  GUIDE = 'GUIDE',
  CHESS = 'CHESS',
}

// Награды в магазине
export interface Reward extends BaseRecord {
  name: string;
  description: string;
  cost: number;
  icon: string;
}

// Записи о покупках
export interface Purchase extends BaseRecord {
  user: string; // Relation to User ID
  reward_name: string;
  reward_icon: string;
  cost: number;
}

// Типы для дуэлей
export enum DuelStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  CHALLENGER_CHOSE = 'challenger_chose',
  OPPONENT_CHOSE = 'opponent_chose',
  COMPLETED = 'completed',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export type DuelChoice = 'rock' | 'paper' | 'scissors';

export interface Duel extends BaseRecord {
  challenger: string; // User ID
  opponent: string; // User ID
  stake: number;
  status: DuelStatus;
  challenger_choice?: DuelChoice;
  opponent_choice?: DuelChoice;
  winner?: string; // User ID
  expand?: {
    challenger?: User;
    opponent?: User;
    winner?: User;
  };
}

// Типы для шахмат
export enum ChessGameStatus {
  PENDING = 'pending',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DECLINED = 'declined',
}

export type ChessPlayerColor = 'w' | 'b';

export interface ChessGame extends BaseRecord {
  player_white: string; // User ID
  player_black: string; // User ID
  stake: number;
  status: ChessGameStatus;
  fen: string; // Forsyth-Edwards Notation for board state
  turn: ChessPlayerColor;
  winner?: string; // User ID
  pgn: string; // Portable Game Notation for move history
  expand?: {
    player_white?: User;
    player_black?: User;
    winner?: User;
  };
}