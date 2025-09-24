import React from 'react';
import { User, WinRecord, Purchase } from '../types';
import AchievementIcon from './AchievementIcon';

interface ProfileCardProps {
  user: User;
  winHistory: WinRecord[];
  purchases: Purchase[];
  isCurrentUser: boolean;
  currentUser: User;
  onInitiateDuel: (opponent: User) => void;
}

const DUEL_COST = 10;

const ProfileCard: React.FC<ProfileCardProps> = ({ user, winHistory, purchases, isCurrentUser, currentUser, onInitiateDuel }) => {
  const getFavoriteCategory = (): string => {
    const userWins = winHistory.filter(win => win.author === user.id);
    if (userWins.length === 0) {
      return '—';
    }

    const categories = userWins.reduce((acc, win) => {
      const category = win.option_category || 'разное';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b);
  };
  
  const favoriteCategory = getFavoriteCategory();

  const cardClasses = `bg-tg-secondary-bg p-5 rounded-2xl shadow-lg animate-slide-in-up transition-all duration-300 ${
    isCurrentUser ? 'ring-2 ring-tg-link ring-offset-2 ring-offset-tg-bg' : ''
  }`;

  return (
    <div className={cardClasses}>
      <div className="flex items-center space-x-4 relative">
        {isCurrentUser && (
          <span className="absolute -top-3 -left-3 bg-tg-link text-white text-xs font-bold px-2 py-1 rounded-full z-10">Вы</span>
        )}
        <img src={user.avatarUrl} alt={user.username} className="w-20 h-20 rounded-full border-4 border-tg-bg" />
        <div>
          <h3 className="text-xl font-bold">@{user.username}</h3>
          <p className="text-tg-hint">{user.role}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 text-center">
        <div>
          <p className="text-2xl font-bold">{user.stats_ideasProposed}</p>
          <p className="text-sm text-tg-hint">Идей</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{user.stats_wins}</p>
          <p className="text-sm text-tg-hint">Побед</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-amber-400">{user.points || 0}</p>
          <p className="text-sm text-tg-hint">Баллов</p>
        </div>
        <div className="min-w-0 overflow-hidden">
           <p className="text-2xl font-bold text-tg-link capitalize truncate" title={favoriteCategory}>{favoriteCategory}</p>
          <p className="text-sm text-tg-hint">Любимое</p>
        </div>
      </div>
      
      {!isCurrentUser && (
        <div className="mt-5">
          <button
            onClick={() => onInitiateDuel(user)}
            disabled={(currentUser.points || 0) < DUEL_COST}
            className="w-full bg-red-600/80 text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-not-allowed"
          >
            Дуэль (-{DUEL_COST} 🪙)
          </button>
        </div>
      )}

      {(user.achievements?.length > 0) && (
        <div className="mt-6">
          <h4 className="font-bold text-tg-text mb-2">Ачивки</h4>
          <div className="flex flex-wrap gap-3 p-3 bg-tg-bg rounded-lg">
            {user.achievements.map(achId => (
              <AchievementIcon key={achId} achievementId={achId} />
            ))}
          </div>
        </div>
      )}

      {isCurrentUser && purchases.length > 0 && (
         <div className="mt-6">
          <h4 className="font-bold text-tg-text mb-2">Мои покупки</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-tg-bg rounded-lg">
            {purchases.map(purchase => (
              <div key={purchase.id} className="flex items-center gap-3 bg-tg-secondary-bg/50 p-2 rounded-md">
                <span className="text-2xl">{purchase.reward_icon}</span>
                <div className="flex-grow">
                  <p className="text-sm font-semibold text-tg-text">{purchase.reward_name}</p>
                  <p className="text-xs text-tg-hint">
                    {new Date(purchase.created).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div className="flex items-center text-sm font-bold text-amber-400">
                  <span>{purchase.cost}</span>
                  <span className="ml-1">🪙</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCard;