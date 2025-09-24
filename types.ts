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
}

// Глобальное состояние для синхронизации
export interface AppState extends BaseRecord {
  roulette_status: 'idle' | 'spinning';
  roulette_winner_id: string; // ID опции-победителя
  roulette_spinning_by: string; // ID пользователя, запустившего рулетку
}

// Награды в магазине
export interface Reward extends BaseRecord {
  name: string;
  description: string;
  cost: number;
  icon: string;
}
