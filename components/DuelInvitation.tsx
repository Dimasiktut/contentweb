import React from 'react';
import { Duel, User } from '../types';

interface DuelInvitationProps {
  duel: Duel;
  users: User[];
  onAccept: () => void;
  onDecline: () => void;
}

const DuelInvitation: React.FC<DuelInvitationProps> = ({ duel, users, onAccept, onDecline }) => {
  const challenger = users.find(u => u.id === duel.challenger);

  if (!challenger) return null;

  return (
    <div className="bg-tg-secondary-bg p-4 rounded-xl shadow-lg animate-slide-in-up w-80">
      <div className="flex items-center gap-3">
        <img src={challenger.avatarUrl} alt={challenger.username} className="w-12 h-12 rounded-full" />
        <div>
          <p className="font-bold text-tg-text">@{challenger.username}</p>
          <p className="text-sm text-tg-hint">бросает вам вызов!</p>
        </div>
        <div className="ml-auto text-lg font-bold text-amber-400">
          {duel.stake} 🪙
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={onAccept}
          className="bg-green-500 text-white font-bold py-2 rounded-lg hover:bg-green-600 transition"
        >
          Принять
        </button>
        <button
          onClick={onDecline}
          className="bg-red-500 text-white font-bold py-2 rounded-lg hover:bg-red-600 transition"
        >
          Отклонить
        </button>
      </div>
    </div>
  );
};

export default DuelInvitation;
