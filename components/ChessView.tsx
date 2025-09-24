import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, ChessGame, ChessGameStatus } from '../types';

declare var Chess: any;

const PIECE_UNICODE: { [key: string]: string } = {
  p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔',
  P: '♟', N: '♞', B: '♝', R: '♜', Q: '♛', K: '♚',
};

const Chessboard: React.FC<{
  fen: string;
  onMove: (move: { from: string, to: string, promotion?: string }) => void;
  isMyTurn: boolean;
  playerColor: 'w' | 'b';
}> = ({ fen, onMove, isMyTurn, playerColor }) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const chess = useMemo(() => new Chess(fen), [fen]);

  const board = useMemo(() => chess.board(), [chess]);
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const boardSquares = playerColor === 'w' ? ranks.map(rank => files.map(file => ({ file, rank }))) : ranks.reverse().map(rank => files.reverse().map(file => ({ file, rank })));

  const handleSquareClick = (square: string) => {
    if (!isMyTurn) return;

    if (selectedSquare) {
      const move = { from: selectedSquare, to: square, promotion: 'q' };
      const isValid = chess.move(move);
      chess.undo(); 
      if (isValid) {
        onMove(move);
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
        const piece = chess.get(square);
        if (piece && piece.color === playerColor) {
           setSelectedSquare(square);
           setValidMoves(chess.moves({ square, verbose: true }).map((m: any) => m.to));
        }
      }
    } else {
      const piece = chess.get(square);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        setValidMoves(chess.moves({ square, verbose: true }).map((m: any) => m.to));
      }
    }
  };

  return (
    <div className="aspect-square w-full grid grid-cols-8 bg-gray-500 rounded-md overflow-hidden shadow-lg">
      {boardSquares.flat().map(({ file, rank }, index) => {
        const squareId = `${file}${rank}`;
        const piece = board[8 - parseInt(rank)][files.indexOf(file)];
        const isLight = (files.indexOf(file) + parseInt(rank)) % 2 === 1;
        const isSelected = selectedSquare === squareId;
        const isPossibleMove = validMoves.includes(squareId);

        return (
          <div
            key={squareId}
            onClick={() => handleSquareClick(squareId)}
            className={`flex items-center justify-center cursor-pointer relative ${
              isLight ? 'bg-gray-300' : 'bg-gray-600'
            }`}
          >
            {isPossibleMove && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1/3 h-1/3 bg-green-500/50 rounded-full" />
              </div>
            )}
             {isSelected && (
              <div className="absolute inset-0 bg-yellow-400/50" />
            )}
            <span className={`text-4xl sm:text-5xl transition-transform duration-100 ${piece?.color === 'b' ? 'text-black' : 'text-white'}`}>
              {piece ? PIECE_UNICODE[piece.type.toUpperCase()] : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
};


const PlayerCard: React.FC<{ user: User; isTurn: boolean }> = ({ user, isTurn }) => (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isTurn ? 'bg-tg-link/30' : 'bg-transparent'}`}>
        <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full" />
        <div>
            <p className="font-bold text-tg-text truncate">@{user.username}</p>
        </div>
    </div>
);

const ChessView: React.FC<{
  currentUser: User;
  game: ChessGame;
  users: User[];
  onMove: (move: { from: string, to: string, promotion?: string }) => void;
  onClose: () => void;
}> = ({ currentUser, game, users, onMove, onClose }) => {
  const chess = useMemo(() => new Chess(game.fen), [game.fen]);

  const opponent = useMemo(() => {
    const opponentId = game.player_white === currentUser.id ? game.player_black : game.player_white;
    return users.find(u => u.id === opponentId);
  }, [game, currentUser, users]);

  const playerColor = game.player_white === currentUser.id ? 'w' : 'b';
  const isMyTurn = chess.turn() === playerColor;
  
  const statusText = useMemo(() => {
    if (game.status === ChessGameStatus.PENDING) return "Ожидание соперника...";
    if (game.status === ChessGameStatus.COMPLETED) {
        if (!game.winner) return "Ничья!";
        return game.winner === currentUser.id ? "Вы победили!" : "Вы проиграли";
    }
    if (chess.isCheck()) return "Шах!";
    return isMyTurn ? "Ваш ход" : `Ход @${opponent?.username}`;
  }, [game, currentUser, opponent, isMyTurn, chess]);

  const statusColor = useMemo(() => {
    if (game.status === ChessGameStatus.COMPLETED) {
        if (!game.winner) return 'text-amber-400';
        return game.winner === currentUser.id ? 'text-green-400' : 'text-red-400';
    }
    return isMyTurn ? 'text-tg-link' : 'text-tg-hint';
  }, [game, currentUser, isMyTurn]);


  if (!opponent) {
    return <div className="text-center p-4">Загрузка данных об оппоненте...</div>;
  }
  
  if (game.status === ChessGameStatus.PENDING && game.player_black === currentUser.id) {
    return (
       <div className="animate-fade-in text-center p-4 bg-tg-secondary-bg rounded-2xl shadow-2xl">
        <h2 className="text-xl font-semibold">Вызов на партию в шахматы!</h2>
        <p>@{opponent.username} ожидает вашего ответа.</p>
        <p className="text-tg-hint mt-1">Это не должно отображаться, но на всякий случай.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 bg-tg-secondary-bg rounded-2xl shadow-2xl space-y-4">
        <PlayerCard user={opponent} isTurn={!isMyTurn} />

        <Chessboard fen={game.fen} onMove={onMove} isMyTurn={isMyTurn} playerColor={playerColor} />

        <PlayerCard user={currentUser} isTurn={isMyTurn} />

        <div className="text-center">
            <h3 className={`text-xl font-bold ${statusColor}`}>{statusText}</h3>
            {game.status === ChessGameStatus.COMPLETED && (
                 <button onClick={onClose} className="mt-4 w-full bg-tg-button text-tg-button-text font-bold py-3 rounded-lg hover:bg-blue-600 transition">
                    Завершить
                </button>
            )}
        </div>
    </div>
  );
};

export default ChessView;
