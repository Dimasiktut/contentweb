import React from 'react';
import { AppView, User } from '../types';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  currentUser: User | null;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView, currentUser }) => {
  const getButtonClass = (view: AppView) => {
    return `w-full py-3 text-sm font-bold rounded-lg transition-colors duration-300 ${
      currentView === view
        ? 'bg-tg-button text-tg-button-text'
        : 'bg-tg-secondary-bg text-tg-hint hover:bg-gray-700'
    }`;
  };

  return (
    <header className="bg-tg-secondary-bg p-1 rounded-xl shadow-lg flex items-center justify-between">
      <div className="flex space-x-1 flex-grow">
        <button onClick={() => setView(AppView.ROULETTE)} className={getButtonClass(AppView.ROULETTE)}>
          Рулетка
        </button>
        <button onClick={() => setView(AppView.PROFILES)} className={getButtonClass(AppView.PROFILES)}>
          Профили
        </button>
        <button onClick={() => setView(AppView.HISTORY)} className={getButtonClass(AppView.HISTORY)}>
          История
        </button>
      </div>
      {currentUser && (
        <div className="flex items-center space-x-1 px-3 text-yellow-400" title={`${currentUser.energy} энергии`}>
          <span className="text-2xl">⚡️</span>
          <span className="font-bold text-lg">{currentUser.energy}</span>
        </div>
      )}
    </header>
  );
};

export default Header;