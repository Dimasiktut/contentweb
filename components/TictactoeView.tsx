import React, { useMemo } from 'react';
import { User, TictactoeGame, TictactoeGameStatus } from '../types';

const PlayerCard: React.FC<{ user: User; symbol: 'x' | 'o'; isTurn: boolean }> = ({ user, symbol, isTurn }) => (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${isTurn ? 'bg-tg-link/30' : 'bg-transparent'}`}>
        <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full" />
        <div>
            <p className="font-bold text-tg-text truncate">@{user.username}</p>
            <p className={`font-bold text-xl ${symbol === 'x' ? 'text-blue-400' : 'text-red-400'}`}>{symbol.toUpperCase()}</p>
        </div>
    </div>
);

const TictactoeView: React.FC<{
  currentUser: User;
  game: TictactoeGame;
  onMove: (index: number) => void;
  onClose: () => void;
}> = ({ currentUser, game, onMove, onClose }) => {
    
    const { board, turn, status, player_x, player_o } = game;
    const opponent = useMemo(() => player_x === currentUser.id ? game.expand?.player_o : game.expand?.player_x, [game, currentUser]);
    
    const mySymbol = player_x === currentUser.id ? 'x' : 'o';
    const isMyTurn = turn === mySymbol && status === TictactoeGameStatus.ONGOING;

    const statusText = useMemo(() => {
        if (status === TictactoeGameStatus.PENDING) return "Ожидание соперника...";
        if (status === TictactoeGameStatus.COMPLETED) {
            if (!game.winner) return "Ничья!";
            return game.winner === currentUser.id ? "Вы победили!" : "Вы проиграли";
        }
        if (status === TictactoeGameStatus.DECLINED) return "Вызов отклонен";
        if (status === TictactoeGameStatus.CANCELLED) return "Игра отменена";

        return isMyTurn ? "Ваш ход" : `Ход @${opponent?.username}`;
    }, [status, game.winner, currentUser.id, isMyTurn, opponent]);

    const statusColor = useMemo(() => {
        if (status === TictactoeGameStatus.COMPLETED) {
            if (!game.winner) return 'text-amber-400';
            return game.winner === currentUser.id ? 'text-green-400' : 'text-red-400';
        }
        return isMyTurn ? 'text-tg-link' : 'text-tg-hint';
    }, [status, game.winner, currentUser.id, isMyTurn]);

    if (!opponent) {
        return <div className="text-center p-4">Загрузка данных об оппоненте...</div>;
    }
    
    const playerX = game.expand?.player_x ?? (player_x === currentUser.id ? currentUser : opponent);
    const playerO = game.expand?.player_o ?? (player_o === currentUser.id ? currentUser : opponent);

    return (
        <div className="animate-fade-in p-4 bg-tg-secondary-bg rounded-2xl shadow-2xl space-y-4">
            <PlayerCard user={playerO} symbol="o" isTurn={turn === 'o' && status === 'ongoing'} />

            <div className="aspect-square w-full grid grid-cols-3 gap-2 bg-tg-bg p-2 rounded-lg">
                {board.map((cell, index) => (
                    <button
                        key={index}
                        onClick={() => onMove(index)}
                        disabled={!isMyTurn || cell !== null}
                        className="aspect-square bg-tg-secondary-bg rounded-md flex items-center justify-center text-6xl font-bold disabled:cursor-not-allowed transition-colors duration-200 hover:bg-gray-700"
                        aria-label={`Square ${index + 1}`}
                    >
                        {cell === 'x' && <span className="text-blue-400 animate-fade-in">X</span>}
                        {cell === 'o' && <span className="text-red-400 animate-fade-in">O</span>}
                    </button>
                ))}
            </div>

            <PlayerCard user={playerX} symbol="x" isTurn={turn === 'x' && status === 'ongoing'} />
            
            <div className="text-center">
                <h3 className={`text-xl font-bold ${statusColor}`}>{statusText}</h3>
                {status === TictactoeGameStatus.COMPLETED && (
                    <button onClick={onClose} className="mt-4 w-full bg-tg-button text-tg-button-text font-bold py-3 rounded-lg hover:bg-blue-600 transition">
                        Завершить
                    </button>
                )}
            </div>
        </div>
    );
};

export default TictactoeView;
