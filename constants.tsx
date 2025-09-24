import React from 'react';
import { Achievement, AchievementId } from './types';

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
