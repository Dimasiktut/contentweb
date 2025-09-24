
import React from 'react';
import { ACHIEVEMENTS_MAP } from '../constants';
import { AchievementId } from '../types';

interface AchievementIconProps {
  achievementId: AchievementId;
}

const AchievementIcon: React.FC<AchievementIconProps> = ({ achievementId }) => {
  const achievement = ACHIEVEMENTS_MAP[achievementId];

  if (!achievement) return null;

  return (
    <div className="relative group">
      {achievement.icon}
      <div className="absolute bottom-full mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <p className="font-bold">{achievement.name}</p>
        <p>{achievement.description}</p>
      </div>
    </div>
  );
};

export default AchievementIcon;
