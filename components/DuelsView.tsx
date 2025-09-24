import React from 'react';
import { User, Duel, ChessGame, ChessGameStatus } from '../types';
import DuelHistoryItem from './DuelHistoryItem';

interface GamesViewProps {
  duelHistory: Duel[];
  chessHistory: ChessGame[];
  pendingDuels: Duel[];
  pendingChessGames: ChessGame[];
  users: User[];
  currentUser: User;
  onAcceptDuel: (duel: Duel) => void;
  onDeclineDuel: (duelId: string) => void;
  onAcceptChess: (game: ChessGame) => void;
  onDeclineChess: (gameId: string) => void;
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
        <p className="text-sm text-tg-hint">бросает вам вызов на дуэль!</p>
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

const ChessInvitationCard: React.FC<{
  game: ChessGame,
  challenger: User,
  onAccept: () => void,
  onDecline: () => void
}> = ({ game, challenger, onAccept, onDecline }) => (
  <div className="bg-tg-secondary-bg p-4 rounded-xl shadow-md animate-slide-in-up">
    <div className="flex items-center gap-3">
      <img src={challenger.avatarUrl} alt={challenger.username} className="w-12 h-12 rounded-full" />
      <div>
        <p className="font-bold text-tg-text">@{challenger.username}</p>
        <p className="text-sm text-tg-hint">вызывает на партию в шахматы!</p>
      </div>
      <div className="ml-auto text-lg font-bold text-amber-400 flex items-center">
        {game.stake} <span className='ml-1'>🪙</span>
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

const ChessHistoryItem: React.FC<{ game: ChessGame; users: User[]; currentUser: User; }> = ({ game, users, currentUser }) => {
    const isWhite = game.player_white === currentUser.id;
    const opponentId = isWhite ? game.player_black : game.player_white;
    const opponent = users.find(u => u.id === opponentId);

    const getResult = () => {
        switch (game.status) {
            case ChessGameStatus.DECLINED: return { text: 'Отклонена', color: 'text-gray-400' };
            case ChessGameStatus.CANCELLED: return { text: 'Отменена', color: 'text-gray-400' };
            case ChessGameStatus.COMPLETED:
                if (!game.winner) return { text: 'Ничья', color: 'text-amber-400' };
                if (game.winner === currentUser.id) return { text: `Победа (+${game.stake})`, color: 'text-green-400' };
                return { text: `Поражение (-${game.stake})`, color: 'text-red-400' };
            default: return { text: 'Неизвестно', color: 'text-gray-500' };
        }
    };
    const result = getResult();

    if (!opponent) return null;

    return (
      <div className="bg-tg-secondary-bg p-4 rounded-xl shadow-md animate-slide-in-up">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-lg font-semibold text-tg-text">Шахматы против <span className="text-tg-link">@{opponent.username}</span></p>
                <p className={`text-sm font-bold ${result.color}`}>{result.text}</p>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
                <div className="flex items-center justify-end font-bold text-amber-400">
                    <span>{game.stake}</span><span className="ml-1">🪙</span>
                </div>
                <p className="text-xs text-tg-hint mt-1">{new Date(game.created).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</p>
            </div>
        </div>
      </div>
    );
};

const GamesView: React.FC<GamesViewProps> = ({ duelHistory, chessHistory, pendingDuels, pendingChessGames, users, currentUser, onAcceptDuel, onDeclineDuel, onAcceptChess, onDeclineChess }) => {
  const sortedPendingDuels = [...pendingDuels].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  const sortedPendingChess = [...pendingChessGames].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  const sortedDuelHistory = [...duelHistory].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  const sortedChessHistory = [...chessHistory].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  const hasPending = sortedPendingDuels.length > 0 || sortedPendingChess.length > 0;
  const hasHistory = sortedDuelHistory.length > 0 || sortedChessHistory.length > 0;

  if (!hasPending && !hasHistory) {
    return (
      <div className="text-center py-10 px-4 animate-fade-in">
        <p className="text-5xl mb-4">⚔️</p>
        <h3 className="text-xl font-bold text-tg-text">Игр пока нет</h3>
        <p className="text-tg-hint">Вызовите кого-нибудь на дуэль или партию в шахматы.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {hasPending && (
        <div>
          <h2 className="text-xl font-bold mb-3 text-tg-text">Входящие вызовы</h2>
          <div className="space-y-3">
            {sortedPendingDuels.map(duel => {
              const challenger = users.find(u => u.id === duel.challenger);
              if (!challenger) return null;
              return <DuelInvitationCard key={duel.id} duel={duel} challenger={challenger} onAccept={() => onAcceptDuel(duel)} onDecline={() => onDeclineDuel(duel.id)} />;
            })}
            {sortedPendingChess.map(game => {
              const challengerId = game.player_white === currentUser.id ? game.player_black : game.player_white;
              const challenger = users.find(u => u.id === challengerId);
              if (!challenger) return null;
              return <ChessInvitationCard key={game.id} game={game} challenger={challenger} onAccept={() => onAcceptChess(game)} onDecline={() => onDeclineChess(game.id)} />;
            })}
          </div>
        </div>
      )}

      {hasHistory && (
         <div>
          <h2 className="text-xl font-bold mb-3 text-tg-text">История игр</h2>
          <div className="space-y-3">
            {sortedDuelHistory.map(duel => <DuelHistoryItem key={duel.id} duel={duel} users={users} currentUser={currentUser} />)}
            {sortedChessHistory.map(game => <ChessHistoryItem key={game.id} game={game} users={users} currentUser={currentUser} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesView;