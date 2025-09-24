import React from 'react';
import { User, Duel, DuelStatus } from '../types';

interface DuelHistoryItemProps {
  duel: Duel;
  currentUser: User;
}

const DuelHistoryItem: React.FC<DuelHistoryItemProps> = ({ duel, currentUser }) => {
  const isChallenger = duel.challenger === currentUser.id;
  const opponent = isChallenger ? duel.expand?.opponent : duel.expand?.challenger;

  const getResult = () => {
    switch (duel.status) {
      case DuelStatus.DECLINED:
        return { text: 'Отклонена', color: 'text-gray-400' };
      case DuelStatus.CANCELLED:
        return { text: 'Отменена', color: 'text-gray-400' };
      case DuelStatus.COMPLETED:
        if (!duel.winner) {
          return { text: 'Ничья', color: 'text-amber-400' };
        }
        if (duel.winner === currentUser.id) {
          return { text: `Победа (+${duel.stake})`, color: 'text-green-400' };
        }
        return { text: `Поражение (-${duel.stake})`, color: 'text-red-400' };
      default:
        return { text: 'Неизвестно', color: 'text-gray-500' };
    }
  };

  const result = getResult();

  if (!opponent) {
    // Fallback if opponent data is not available for some reason
    return (
      <div className="bg-tg-secondary-bg p-4 rounded-xl shadow-md">
        <p>Дуэль с неизвестным игроком ({new Date(duel.created).toLocaleDateString()})</p>
      </div>
    );
  }

  return (
    <div className="bg-tg-secondary-bg p-4 rounded-xl shadow-md animate-slide-in-up">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-lg font-semibold text-tg-text">
            Дуэль против <span className="text-tg-link">@{opponent.username}</span>
          </p>
          <p className={`text-sm font-bold ${result.color}`}>{result.text}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
            <div className="flex items-center justify-end font-bold text-amber-400">
                <span>{duel.stake}</span><span className="ml-1">🪙</span>
            </div>
            <p className="text-xs text-tg-hint mt-1">
                {new Date(duel.created).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
            </p>
        </div>
      </div>
       <div className="flex items-center space-x-3 mt-3 pt-3 border-t border-gray-700">
        <img src={currentUser.avatarUrl} alt="You" className="w-8 h-8 rounded-full" />
        <span className="text-lg font-bold text-tg-hint">vs</span>
        <img src={opponent.avatarUrl} alt={opponent.username} className="w-8 h-8 rounded-full" />
      </div>
    </div>
  );
};

export default DuelHistoryItem;