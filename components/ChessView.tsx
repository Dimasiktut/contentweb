

import React, { useState, useMemo, useEffect } from 'react';
import { User, ChessGame, ChessGameStatus } from '../types';

const PIECE_UNICODE: { [key: string]: string } = {
  p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔', // White
  P: '♟', N: '♞', B: '♝', R: '♜', Q: '♛', K: '♚', // Black
};

const Chessboard: React.FC<{
  chess: any; // Instance of Chess.js game
  onMove: (move: { from: string, to: string, promotion?: string }) => void;
  isMyTurn: boolean;
  playerColor: 'w' | 'b';
}> = ({ chess, onMove, isMyTurn, playerColor }) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);

  const board = useMemo(() => chess.board(), [chess]);
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  // Flip board for black player
  const boardRanks = playerColor === 'w' ? ranks : [...ranks].reverse();
  const boardFiles = playerColor === 'w' ? files : [...files].reverse();

  const handleSquareClick = (square: string) => {
    if (!isMyTurn || !chess) return;

    const pieceOnTarget = chess.get(square);

    // If a piece is already selected
    if (selectedSquare) {
      const isMoveValid = validMoves.includes(square);
      if (isMoveValid) {
        // It's a valid move, let's make it
        const move = { from: selectedSquare, to: square, promotion: 'q' }; // Default promotion to Queen
        onMove(move);
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
    }
    
    // If the target square has one of my pieces, select it.
    // This works for deselecting the current piece or selecting a different one.
    if (pieceOnTarget && pieceOnTarget.color === playerColor) {
      setSelectedSquare(square);
      setValidMoves(chess.moves({ square, verbose: true }).map((m: any) => m.to));
    } else {
      // Otherwise, deselect.
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  return (
    <div className="aspect-square w-full grid grid-cols-8 bg-gray-500 rounded-md overflow-hidden shadow-lg">
      {boardRanks.map((rank) =>
        boardFiles.map((file) => {
          const squareId = `${file}${rank}`;
          const piece = chess.get(squareId);
          const isLight = (files.indexOf(file) + parseInt(rank)) % 2 !== 0;
          const isSelected = selectedSquare === squareId;
          const isPossibleMove = validMoves.includes(squareId);
          
          let pieceUnicodeChar = '';
          if (piece) {
            const pieceKey = piece.color === 'b' ? piece.type.toUpperCase() : piece.type;
            pieceUnicodeChar = PIECE_UNICODE[pieceKey] || '';
          }

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
                {pieceUnicodeChar}
              </span>
            </div>
          );
      }))}
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
  onMove: (move: { from: string, to: string, promotion?: string }) => void;
  onClose: () => void;
}> = ({ currentUser, game, onMove, onClose }) => {
  const [isEngineReady, setIsEngineReady] = useState(typeof window.Chess !== 'undefined');

  useEffect(() => {
    if (isEngineReady) return;
    const timeoutId = setTimeout(() => {
        if (!isEngineReady) console.error("Chess.js engine failed to load in 10 seconds.");
    }, 10000);
    const intervalId = setInterval(() => {
        if (typeof window.Chess !== 'undefined') {
            setIsEngineReady(true);
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        }
    }, 100);
    return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
    };
  }, [isEngineReady]);

  const chess = useMemo(() => {
    if (!isEngineReady) return null;
    try {
      return new window.Chess(game.fen);
    } catch (e) {
      console.error("Invalid FEN provided to Chess.js:", game.fen, e);
      return null;
    }
  }, [game.fen, isEngineReady]);

  const opponent = useMemo(() => {
    return game.player_white === currentUser.id ? game.expand?.player_black : game.expand?.player_white;
  }, [game, currentUser]);
  
  const playerColor = game.player_white === currentUser.id ? 'w' : 'b';
  const isMyTurn = chess ? chess.turn() === playerColor : false;
  
  const statusText = useMemo(() => {
    if (!chess) return "Загрузка движка...";
    if (game.status === ChessGameStatus.PENDING) return "Ожидание соперника...";
    if (game.status === ChessGameStatus.COMPLETED) {
        if (!game.winner) return "Ничья!";
        return game.winner === currentUser.id ? "Вы победили!" : "Вы проиграли";
    }

    if (chess.isCheckmate()) return "Мат!";
    if (chess.isStalemate()) return "Пат! Ничья.";
    if (chess.isThreefoldRepetition()) return "Ничья (троекратное повторение).";
    if (chess.isInsufficientMaterial()) return "Ничья (недостаточно фигур).";
    if (chess.isDraw() && !chess.isCheck()) return "Ничья.";
    
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

  if (!isEngineReady || !chess) {
    return (
        <div className="animate-fade-in p-4 bg-tg-secondary-bg rounded-2xl shadow-2xl space-y-4 text-center">
            <h3 className="text-xl font-bold">{!isEngineReady ? "Загрузка..." : "Ошибка"}</h3>
            <p className="text-tg-hint">
              {!isEngineReady ? "Загружаем шахматный движок..." : "Не удалось обработать состояние игры. Попробуйте обновить страницу."}
            </p>
        </div>
    );
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

        {/* FIX: Removed extraneous `fen` prop that was causing a type error. The `chess` object is sufficient. */}
        <Chessboard chess={chess} onMove={onMove} isMyTurn={isMyTurn} playerColor={playerColor} />

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