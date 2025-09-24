import React from 'react';
import { User, Duel, ChessGame, ChessGameStatus } from '../types';
import DuelHistoryItem from './DuelHistoryItem';

interface GamesViewProps {
  duelHistory: Duel[];
  chessHistory: ChessGame[];
  pendingDuels: Duel[];
  pendingChessGames: ChessGame[];
  ongoingChessGames: ChessGame[];
  currentUser: User;
  onAcceptDuel: (duel: Duel) => void;
  onDeclineDuel: (duelId: string) => void;
  onAcceptChess: (game: ChessGame) => void;
  onDeclineChess: (gameId: string) => void;
  onJoinChessGame: (game: ChessGame) => void;
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

const OngoingChessCard: React.FC<{
  game: ChessGame,
  currentUser: User,
  onJoin: () => void
}> = ({ game, currentUser, onJoin }) => {
  const opponent = game.player_white === currentUser.id ? game.expand?.player_black : game.expand?.player_white;
  if (!opponent) return null;

  const isMyTurn = (game.turn === 'w' && game.player_white === currentUser.id) || (game.turn === 'b' && game.player_black === currentUser.id);

  return (
    <div className="bg-tg-secondary-bg p-4 rounded-xl shadow-md animate-slide-in-up">
      <div className="flex items-center gap-3">
        <img src={opponent.avatarUrl} alt={opponent.username} className="w-12 h-12 rounded-full" />
        <div>
          <p className="font-bold text-tg-text">Партия с @{opponent.username}</p>
          <p className={`text-sm font-bold ${isMyTurn ? 'text-green-400 animate-pulse' : 'text-tg-hint'}`}>
            {isMyTurn ? 'Ваш ход' : 'Ход соперника'}
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={onJoin}
            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Войти
          </button>
        </div>
      </div>
    </div>
  );
};

const ChessHistoryItem: React.FC<{ game: ChessGame; currentUser: User; }> = ({ game, currentUser }) => {
    const isWhite = game.player_white === currentUser.id;
    const opponent = isWhite ? game.expand?.player_black : game.expand?.player_white;

    const getResult = () => {
        switch (game.status) {
            case ChessGameStatus.DECLINED: return { text: 'Отклонена', color: 'text-gray-400', stake: '' };
            case ChessGameStatus.CANCELLED: return { text: 'Отменена', color: 'text-gray-400', stake: '' };
            case ChessGameStatus.COMPLETED:
                if (!game.winner) return { text: 'Ничья', color: 'text-amber-400', stake: '' };
                if (game.winner === currentUser.id) return { text: `Победа`, color: 'text-green-400', stake: `+${game.stake}` };
                return { text: `Поражение`, color: 'text-red-400', stake: `-${game.stake}` };
            default: return { text: 'Неизвестно', color: 'text-gray-500', stake: '' };
        }
    };
    const result = getResult();

    if (!opponent) return null;

    return (
      <div className="bg-tg-secondary-bg p-4 rounded-xl shadow-md animate-slide-in-up">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-lg font-semibold text-tg-text">Шахматы против <span className="text-tg-link">@{opponent.username}</span></p>
                <p className={`text-sm font-bold ${result.color}`}>{result.text} {result.stake && `(${result.stake} 🪙)`}</p>
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

const GamesView: React.FC<GamesViewProps> = ({ duelHistory, chessHistory, pendingDuels, pendingChessGames, ongoingChessGames, currentUser, onAcceptDuel, onDeclineDuel, onAcceptChess, onDeclineChess, onJoinChessGame }) => {
  const sortedPendingDuels = [...pendingDuels].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  const sortedPendingChess = [...pendingChessGames].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  const sortedOngoingChess = [...ongoingChessGames].sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

  const combinedHistory = [...duelHistory, ...chessHistory].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

  const hasOngoing = sortedOngoingChess.length > 0;
  const hasPending = sortedPendingDuels.length > 0 || sortedPendingChess.length > 0;
  const hasHistory = combinedHistory.length > 0;

  if (!hasPending && !hasHistory && !hasOngoing) {
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
      {hasOngoing && (
        <div>
          <h2 className="text-xl font-bold mb-3 text-tg-text">Активные игры</h2>
          <div className="space-y-3">
            {sortedOngoingChess.map(game => (
              <OngoingChessCard
                key={game.id}
                game={game}
                currentUser={currentUser}
                onJoin={() => onJoinChessGame(game)}
              />
            ))}
          </div>
        </div>
      )}
      
      {hasPending && (
        <div>
          <h2 className="text-xl font-bold mb-3 text-tg-text">Входящие вызовы</h2>
          <div className="space-y-3">
            {sortedPendingDuels.map(duel => {
              const challenger = duel.expand?.challenger;
              if (!challenger) return null;
              return <DuelInvitationCard key={duel.id} duel={duel} challenger={challenger} onAccept={() => onAcceptDuel(duel)} onDecline={() => onDeclineDuel(duel.id)} />;
            })}
            {sortedPendingChess.map(game => {
              const challenger = game.expand?.player_white;
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
             {combinedHistory.map(item => {
              if (item.collectionName === 'duels') {
                return <DuelHistoryItem key={item.id} duel={item as Duel} currentUser={currentUser} />;
              } else {
                return <ChessHistoryItem key={item.id} game={item as ChessGame} currentUser={currentUser} />;
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GamesView;