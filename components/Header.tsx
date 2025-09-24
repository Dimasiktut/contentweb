import React, { useMemo } from 'react';
import { AppView, User, UserQuest } from '../types';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  currentUser: User | null;
  userQuests: UserQuest[];
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, currentUser, userQuests }) => {
  const getButtonClass = (view: AppView) => {
    return `w-full py-2.5 text-xs font-bold rounded-lg transition-colors duration-300 ${
      currentView === view
        ? 'bg-tg-button text-tg-button-text'
        : 'bg-tg-secondary-bg text-tg-hint hover:bg-gray-700'
    }`;
  };
  
  const hasClaimableQuests = useMemo(() => {
    return userQuests.some(q => q.is_completed && !q.is_claimed);
  }, [userQuests]);

  return (
    <header className="bg-tg-secondary-bg p-2 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-3 gap-x-4">
      <div className="grid grid-cols-4 gap-2 flex-grow">
        <button onClick={() => setView(AppView.ROULETTE)} className={getButtonClass(AppView.ROULETTE)}>
          Рулетка
        </button>
        <button onClick={() => setView(AppView.PROFILES)} className={getButtonClass(AppView.PROFILES)}>
          Профили
        </button>
        <button onClick={() => setView(AppView.GAMES_VIEW)} className={getButtonClass(AppView.GAMES_VIEW)}>
          Игры
        </button>
        <button onClick={() => setView(AppView.QUESTS)} className={`${getButtonClass(AppView.QUESTS)} relative`}>
          Задания
           {hasClaimableQuests && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-tg-secondary-bg animate-pulse"></span>}
        </button>
         <button onClick={() => setView(AppView.REWARDS)} className={getButtonClass(AppView.REWARDS)}>
          Магазин
        </button>
        <button onClick={() => setView(AppView.HISTORY)} className={getButtonClass(AppView.HISTORY)}>
          История
        </button>
         <button onClick={() => setView(AppView.GUIDE)} className={getButtonClass(AppView.GUIDE)}>
          Гайд
        </button>
      </div>
      {currentUser && (
        <div className="flex items-center divide-x divide-gray-600 self-center sm:self-auto">
          <div className="flex items-center space-x-1 pr-3 text-yellow-400" title={`${currentUser.energy} энергии`}>
            <span className="text-xl">⚡️</span>
            <span className="font-bold text-base">{currentUser.energy}</span>
          </div>
           <div className="flex items-center space-x-1 pl-3 text-amber-400" title={`${currentUser.points} баллов`}>
            <span className="text-xl">🪙</span>
            <span className="font-bold text-base">{currentUser.points}</span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;