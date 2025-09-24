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
  onInitiateChess: (opponent: User) => void;
  onInitiateTictactoe: (opponent: User) => void;
  onPokeUser: (opponent: User) => void;
}

const DUEL_COST = 10;
const CHESS_COST = 25;
const POKE_COST = 5;
const TICTACTOE_COST = 5;

const ProfileCard: React.FC<ProfileCardProps> = ({ user, winHistory, purchases, isCurrentUser, currentUser, onInitiateDuel, onInitiateChess, onInitiateTictactoe, onPokeUser }) => {
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
  
  const sortedPurchases = [...purchases].sort(
    (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
  );

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
        <div className="flex-grow">
          <h3 className="text-xl font-bold">@{user.username}</h3>
          <p className="text-tg-hint">{user.role}</p>
        </div>
         {!isCurrentUser && (
           <button
             onClick={() => onPokeUser(user)}
             disabled={(currentUser.points || 0) < POKE_COST}
             className="flex-shrink-0 bg-teal-500 text-white w-14 h-14 rounded-full flex flex-col items-center justify-center hover:bg-teal-600 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed group transform hover:scale-110"
             title={`Покнуть (-${POKE_COST} 🪙)`}
           >
            <span className="text-3xl transition-transform duration-300 group-hover:rotate-12">😉</span>
           </button>
        )}
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
        <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
          <button
            onClick={() => onInitiateDuel(user)}
            disabled={(currentUser.points || 0) < DUEL_COST || (user.points || 0) < DUEL_COST}
            className="w-full bg-red-600/80 text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-not-allowed"
          >
            Дуэль<br/>(-{DUEL_COST} 🪙)
          </button>
          <button
            onClick={() => onInitiateChess(user)}
            disabled={(currentUser.points || 0) < CHESS_COST || (user.points || 0) < CHESS_COST}
            className="w-full bg-blue-600/80 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-not-allowed"
          >
            Шахматы<br/>(-{CHESS_COST} 🪙)
          </button>
          <button
            onClick={() => onInitiateTictactoe(user)}
            disabled={(currentUser.points || 0) < TICTACTOE_COST || (user.points || 0) < TICTACTOE_COST}
            className="w-full bg-purple-600/80 text-white font-bold py-2.5 rounded-lg hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-not-allowed"
          >
            К/Н<br/>(-{TICTACTOE_COST} 🪙)
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

      {isCurrentUser && sortedPurchases.length > 0 && (
         <div className="mt-6">
          <h4 className="font-bold text-tg-text mb-2">Мои покупки</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-tg-bg rounded-lg">
            {sortedPurchases.map(purchase => (
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