import React from 'react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const getButtonClass = (view: AppView) => {
    return `w-full py-3 text-sm font-bold rounded-lg transition-colors duration-300 ${
      currentView === view
        ? 'bg-tg-button text-tg-button-text'
        : 'bg-tg-secondary-bg text-tg-hint hover:bg-gray-700'
    }`;
  };

  return (
    <header className="bg-tg-secondary-bg p-1 rounded-xl shadow-lg">
      <div className="flex space-x-1">
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
    </header>
  );
};

export default Header;