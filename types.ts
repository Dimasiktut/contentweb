import { ReactElement } from 'react';

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

export interface User {
  id: number;
  username: string;
  avatarUrl: string;
  role: string;
  stats: {
    ideasProposed: number;
    wins: number;
    winStreak: number;
  };
  achievements: AchievementId[];
}

export interface Option {
  id: string; // Changed from number to string for Firestore compatibility
  text: string;
  category: string;
  authorId: number;
}

export interface WinRecord {
  id?: string; // Optional Firestore ID
  option: Option;
  timestamp: number;
}

export enum AppView {
  ROULETTE = 'ROULETTE',
  PROFILES = 'PROFILES',
  HISTORY = 'HISTORY',
}