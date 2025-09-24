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
  DUEL_HISTORY = 'DUEL_HISTORY',
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
}
