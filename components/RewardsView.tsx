import React from 'react';
import { User, Reward } from '../types';

interface RewardsViewProps {
  rewards: Reward[];
  currentUser: User;
  onBuyReward: (reward: Reward) => void;
}

const RewardsView: React.FC<RewardsViewProps> = ({ rewards, currentUser, onBuyReward }) => {
  if (rewards.length === 0) {
    return (
      <div className="text-center py-10 px-4 animate-fade-in">
        <p className="text-5xl mb-4">🛍️</p>
        <h3 className="text-xl font-bold text-tg-text">Магазин пока пуст</h3>
        <p className="text-tg-hint">Администратор скоро добавит награды.</p>
      </div>
    );
  }

  const sortedRewards = [...rewards].sort((a, b) => a.cost - b.cost);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-tg-secondary-bg p-4 rounded-xl text-center">
        <p className="text-tg-hint">Ваш баланс</p>
        <p className="text-3xl font-bold text-amber-400 flex items-center justify-center space-x-2">
          <span>🪙</span>
          <span>{currentUser.points || 0}</span>
        </p>
      </div>
      {sortedRewards.map(reward => (
        <div key={reward.id} className="bg-tg-secondary-bg p-4 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-grow min-w-0">
            <span className="text-4xl">{reward.icon || '🎁'}</span>
            <div className="flex-grow">
              <h3 className="font-bold text-tg-text">{reward.name}</h3>
              <p className="text-sm text-tg-hint">{reward.description}</p>
            </div>
          </div>
          <button
            onClick={() => onBuyReward(reward)}
            disabled={(currentUser.points || 0) < reward.cost}
            className="w-full sm:w-auto bg-tg-button text-tg-button-text font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-not-allowed flex-shrink-0"
          >
            <div className="flex items-center justify-center space-x-2">
              <span>{reward.cost}</span>
              <span className="text-amber-300">🪙</span>
            </div>
          </button>
        </div>
      ))}
    </div>
  );
};

export default RewardsView;