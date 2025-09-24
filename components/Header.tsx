import React from 'react';
import { AppView, User } from '../types';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  currentUser: User | null;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, currentUser }) => {
  const getButtonClass = (view: AppView) => {
    return `w-full py-2.5 text-xs font-bold rounded-lg transition-colors duration-300 ${
      currentView === view
        ? 'bg-tg-button text-tg-button-text'
        : 'bg-tg-secondary-bg text-tg-hint hover:bg-gray-700'
    }`;
  };

  return (
    <header className="bg-tg-secondary-bg p-2 rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
      <div className="flex space-x-1 flex-grow min-w-[240px]">
        <button onClick={() => setView(AppView.ROULETTE)} className={getButtonClass(AppView.ROULETTE)}>
          Рулетка
        </button>
        <button onClick={() => setView(AppView.PROFILES)} className={getButtonClass(AppView.PROFILES)}>
          Профили
        </button>
         <button onClick={() => setView(AppView.REWARDS)} className={getButtonClass(AppView.REWARDS)}>
          Магазин
        </button>
        <button onClick={() => setView(AppView.HISTORY)} className={getButtonClass(AppView.HISTORY)}>
          История
        </button>
      </div>
      {currentUser && (
        <div className="flex items-center divide-x divide-gray-600">
          <div className="flex items-center space-x-1 pr-2 text-yellow-400" title={`${currentUser.energy} энергии`}>
            <span className="text-xl">⚡️</span>
            <span className="font-bold text-base">{currentUser.energy}</span>
          </div>
           <div className="flex items-center space-x-1 pl-2 text-amber-400" title={`${currentUser.points} баллов`}>
            <span className="text-xl">🪙</span>
            <span className="font-bold text-base">{currentUser.points}</span>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
