import React from 'react';
import { User, Duel } from '../types';
import DuelHistoryItem from './DuelHistoryItem';

interface DuelsViewProps {
  history: Duel[];
  pendingDuels: Duel[];
  users: User[];
  currentUser: User;
  onAcceptDuel: (duel: Duel) => void;
  onDeclineDuel: (duelId: string) => void;
}

const DuelInvitationCard: React.FC<{
  duel: Duel,
  challenger: User,
  onAccept: () => void,
  onDecline: () => void
}> = ({ duel, challenger, onAccept, onDecline }) => (
  <div className="bg-tg-secondary-bg p-4 rounded-xl shadow-md animate-slide-in-up">
    <div className="flex items-center gap-3">
      <img src={challenger.avatarUrl} alt={challenger.username} className="w-12 h-12 rounded-full" />
      <div>
        <p className="font-bold text-tg-text">@{challenger.username}</p>
        <p className="text-sm text-tg-hint">бросает вам вызов!</p>
      </div>
      <div className="ml-auto text-lg font-bold text-amber-400 flex items-center">
        {duel.stake} <span className='ml-1'>🪙</span>
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


const DuelsView: React.FC<DuelsViewProps> = ({ history, pendingDuels, users, currentUser, onAcceptDuel, onDeclineDuel }) => {
  // Sort both lists to ensure newest items are always first
  const sortedPendingDuels = [...pendingDuels].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  const sortedHistory = [...history].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  if (sortedHistory.length === 0 && sortedPendingDuels.length === 0) {
    return (
      <div className="text-center py-10 px-4 animate-fade-in">
        <p className="text-5xl mb-4">⚔️</p>
        <h3 className="text-xl font-bold text-tg-text">Дуэлей пока нет</h3>
        <p className="text-tg-hint">
          Вызовите кого-нибудь на дуэль или подождите, пока вызовут вас.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {sortedPendingDuels.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-3 text-tg-text">Входящие вызовы</h2>
          <div className="space-y-3">
            {sortedPendingDuels.map(duel => {
              const challenger = users.find(u => u.id === duel.challenger);
              if (!challenger) return null;
              return (
                <DuelInvitationCard
                  key={duel.id}
                  duel={duel}
                  challenger={challenger}
                  onAccept={() => onAcceptDuel(duel)}
                  onDecline={() => onDeclineDuel(duel.id)}
                />
              );
            })}
          </div>
        </div>
      )}

      {sortedHistory.length > 0 && (
         <div>
          <h2 className="text-xl font-bold mb-3 text-tg-text">История дуэлей</h2>
          <div className="space-y-3">
            {sortedHistory.map(duel => (
              <DuelHistoryItem key={duel.id} duel={duel} users={users} currentUser={currentUser} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DuelsView;