
import React from 'react';
import { User, Option, Achievement, AchievementId } from './types';

// Achievement Icons
const IdeologueIcon = () => <span title="Идеолог" className="text-2xl">🏆</span>;
const FoodmakerIcon = () => <span title="Фудмейкер" className="text-2xl">🍔</span>;
const LuckyIcon = () => <span title="Везунчик" className="text-2xl">🎯</span>;
const TrollIcon = () => <span title="Тролль отдела" className="text-2xl">😂</span>;

// Achievements Map
export const ACHIEVEMENTS_MAP: Record<AchievementId, Achievement> = {
  [AchievementId.IDEOLOGUE]: {
    id: AchievementId.IDEOLOGUE,
    name: 'Идеолог',
    description: 'За 10 предложений',
    icon: <IdeologueIcon />,
  },
  [AchievementId.FOODMAKER]: {
    id: AchievementId.FOODMAKER,
    name: 'Фудмейкер',
    description: 'За 5 ресторанов, выпавших на рулетке',
    icon: <FoodmakerIcon />,
  },
  [AchievementId.LUCKY]: {
    id: AchievementId.LUCKY,
    name: 'Везунчик',
    description: 'Вариант выпал 3 раза подряд',
    icon: <LuckyIcon />,
  },
  [AchievementId.TROLL]: {
    id: AchievementId.TROLL,
    name: 'Тролль отдела',
    description: 'За смешные/странные варианты',
    icon: <TrollIcon />,
  },
};

// Mock Users
export const MOCK_USERS: User[] = [
  {
    id: 1,
    username: 'anna_dev',
    avatarUrl: 'https://picsum.photos/seed/anna/100/100',
    role: 'Frontend-разработчик',
    stats: { ideasProposed: 12, wins: 4, winStreak: 0 },
    achievements: [AchievementId.IDEOLOGUE, AchievementId.FOODMAKER],
  },
  {
    id: 2,
    username: 'mike_ux',
    avatarUrl: 'https://picsum.photos/seed/mike/100/100',
    role: 'UX/UI Дизайнер',
    stats: { ideasProposed: 8, wins: 6, winStreak: 3 },
    achievements: [AchievementId.LUCKY],
  },
  {
    id: 3,
    username: 'oleg_pm',
    avatarUrl: 'https://picsum.photos/seed/oleg/100/100',
    role: 'Project Manager',
    stats: { ideasProposed: 5, wins: 1, winStreak: 0 },
    achievements: [],
  },
    {
    id: 4,
    username: 'gena_troll',
    avatarUrl: 'https://picsum.photos/seed/gena/100/100',
    role: 'QA Engineer',
    stats: { ideasProposed: 15, wins: 2, winStreak: 0 },
    achievements: [AchievementId.IDEOLOGUE, AchievementId.TROLL],
  },
];

// Mock Options
export const MOCK_OPTIONS: Option[] = [
  { id: 1, text: 'Пицца в "Napoli"', category: 'еда', authorId: 1 },
  { id: 2, text: 'Поиграть в настолки', category: 'развлечения', authorId: 2 },
  { id: 3, text: 'Сходить в кино на новый блокбастер', category: 'развлечения', authorId: 1 },
  { id: 4, text: 'Заказать суши в офис', category: 'еда', authorId: 3 },
  { id: 5, text: 'Посчитать голубей в парке', category: 'странное', authorId: 4 },
];
