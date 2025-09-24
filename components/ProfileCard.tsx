import React from 'react';
import { User, WinRecord } from '../types';
import AchievementIcon from './AchievementIcon';

interface ProfileCardProps {
  user: User;
  winHistory: WinRecord[];
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user, winHistory }) => {
  const getFavoriteCategory = (): string => {
    const userWins = winHistory.filter(win => win.option.authorId === user.id);
    if (userWins.length === 0) {
      return '—';
    }

    const categories = userWins.reduce((acc, win) => {
      const category = win.option.category || 'разное';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b);
  };
  
  const favoriteCategory = getFavoriteCategory();

  return (
    <div className="bg-tg-secondary-bg p-5 rounded-2xl shadow-lg animate-slide-in-up transition-transform transform hover:scale-105 duration-300">
      <div className="flex items-center space-x-4">
        <img src={user.avatarUrl} alt={user.username} className="w-20 h-20 rounded-full border-4 border-tg-bg" />
        <div>
          <h3 className="text-xl font-bold">@{user.username}</h3>
          <p className="text-tg-hint">{user.role}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{user.stats.ideasProposed}</p>
          <p className="text-sm text-tg-hint">Идей</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{user.stats.wins}</p>
          <p className="text-sm text-tg-hint">Побед</p>
        </div>
        <div>
           <p className="text-2xl font-bold text-tg-link capitalize">{favoriteCategory}</p>
          <p className="text-sm text-tg-hint">Любимое</p>
        </div>
      </div>

      {user.achievements.length > 0 && (
        <div className="mt-6">
          <h4 className="font-bold text-tg-text mb-2">Ачивки</h4>
          <div className="flex flex-wrap gap-3 p-3 bg-tg-bg rounded-lg">
            {user.achievements.map(achId => (
              <AchievementIcon key={achId} achievementId={achId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;