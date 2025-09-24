import React from 'react';
import { User, Duel } from '../types';
import DuelHistoryItem from './DuelHistoryItem';

// FIX: Removed unused `users` prop from the component's interface.
interface DuelHistoryViewProps {
  history: Duel[];
  currentUser: User;
}

// FIX: Removed unused `users` prop from the function signature.
const DuelHistoryView: React.FC<DuelHistoryViewProps> = ({ history, currentUser }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-10 px-4 animate-fade-in">
        <p className="text-5xl mb-4">⚔️</p>
        <h3 className="text-xl font-bold text-tg-text">История дуэлей пуста</h3>
        <p className="text-tg-hint">
          Сыграйте в дуэль, чтобы увидеть здесь результаты.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {history.map(duel => (
        // FIX: Removed `users` prop as it is not defined in `DuelHistoryItemProps`, resolving the type error.
        <DuelHistoryItem key={duel.id} duel={duel} currentUser={currentUser} />
      ))}
    </div>
  );
};

export default DuelHistoryView;
