import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Option, User, AppState } from '../types';

interface RouletteProps {
  options: Option[];
  users: User[];
  onAddOption: (text: string, category: string) => void;
  onRemoveOption: (id: string) => void;
  onSpinRequest: () => Promise<void>;
  onSpinEnd: (winner: Option) => Promise<void>;
  currentUser: User;
  appState: AppState;
}

const WinnerModal: React.FC<{ winner: Option; author: User; onClose: () => void }> = ({ winner, author, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-tg-secondary-bg rounded-2xl p-8 text-center shadow-2xl relative animate-slide-in-up transform-gpu w-11/12 max-w-sm">
         <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-xl font-bold text-tg-text mb-2">Победитель!</h2>
        <p className="text-2xl font-semibold text-tg-link mb-4 break-words">"{winner.text}"</p>
        <div className="flex items-center justify-center space-x-3 bg-tg-bg p-3 rounded-lg">
          <img src={author.avatarUrl} alt={author.username} className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-bold text-tg-text">Предложил(а):</p>
            <p className="text-tg-hint">@{author.username}</p>
          </div>
        </div>
        <button
            onClick={onClose}
            className="mt-6 w-full bg-tg-button text-tg-button-text font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
        >
          Отлично!
        </button>
      </div>
    </div>
  );
};


const Roulette: React.FC<RouletteProps> = ({ options, users, onAddOption, onRemoveOption, onSpinRequest, onSpinEnd, currentUser, appState }) => {
  const [newOption, setNewOption] = useState('');
  const [newCategory, setNewCategory] = useState('еда');
  const [winner, setWinner] = useState<Option | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isSpinning = useMemo(() => appState.roulette_status === 'spinning', [appState.roulette_status]);

  const repeatedOptions = useMemo(() => {
    if (options.length === 0) return [];
    // Увеличиваем количество повторений для более плавной и длинной прокрутки
    return Array(20).fill(options).flat();
  }, [options]);
  
  useEffect(() => {
    if (appState.roulette_status === 'spinning' && options.length > 0) {
      const winnerOption = options.find(o => o.id === appState.roulette_winner_id);
      if (!winnerOption || !listRef.current) return;

      const spinDuration = 5000;
      const winnerIndexInOriginal = options.findIndex(o => o.id === winnerOption.id);
      
      if (winnerIndexInOriginal === -1) return;

      const itemHeight = 72;
      const listVisibleHeight = listRef.current.parentElement!.clientHeight;
      
      // Целимся в элемент в середине дублированного массива для долгого вращения
      const targetIndexInRepeated = (options.length * 10) + winnerIndexInOriginal;
      const randomOffset = (Math.random() - 0.5) * itemHeight * 0.8;
      const targetY = (targetIndexInRepeated * itemHeight) - (listVisibleHeight / 2) + (itemHeight / 2) + randomOffset;

      listRef.current.style.transition = 'none';
      listRef.current.style.transform = `translateY(0px)`;
      
      void listRef.current.offsetHeight; 

      listRef.current.style.transition = `transform ${spinDuration / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
      listRef.current.style.transform = `translateY(-${targetY}px)`;

      setTimeout(() => {
        setWinner(winnerOption);
        if (currentUser.id === appState.roulette_spinning_by) {
          onSpinEnd(winnerOption);
        }
      }, spinDuration);

    } else if (appState.roulette_status === 'idle') {
       // Плавный сброс в начальное положение после закрытия модального окна
      if (winner === null && listRef.current) {
         listRef.current.style.transition = 'transform 0.5s ease-out';
         listRef.current.style.transform = 'translateY(0)';
      }
    }
  }, [appState.roulette_status, options, currentUser.id, appState.roulette_spinning_by]);


  const handleAdd = () => {
    if (newOption.trim() && currentUser.energy >= 1) {
      onAddOption(newOption.trim(), newCategory.trim() || 'разное');
      setNewOption('');
    }
  };
  
  const winnerAuthor = useMemo(() => {
    if (!winner) return null;
    return users.find(u => u.id === winner.author);
  }, [winner, users]);

  return (
    <div className="space-y-6">
       {winner && winnerAuthor && (
        <WinnerModal 
          winner={winner} 
          author={winnerAuthor} 
          onClose={() => setWinner(null)} 
        />
      )}
      <div>
        <h2 className="text-xl font-bold mb-3">Добавить вариант</h2>
        <div className="bg-tg-secondary-bg p-4 rounded-xl space-y-3">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            placeholder="Например: Пойти в боулинг"
            className="w-full bg-tg-bg border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-tg-link focus:outline-none transition"
          />
           <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Категория (еда, спорт)"
            className="w-full bg-tg-bg border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-tg-link focus:outline-none transition"
          />
          <button
            onClick={handleAdd}
            className="w-full bg-tg-button text-tg-button-text font-bold py-3 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            disabled={!newOption.trim() || currentUser.energy < 1 || isSpinning}
          >
            Добавить (-1⚡️)
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Варианты</h2>
         <div className="h-64 bg-tg-secondary-bg rounded-xl relative p-2 shadow-inner overflow-y-auto">
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 bg-tg-link/20 border-y-2 border-tg-link rounded-lg z-10 pointer-events-none"></div>
             <div ref={listRef} className="will-change-transform">
                {(isSpinning ? repeatedOptions : options).map((option, index) => {
                    const author = users.find(u => u.id === option.author);
                    return (
                        <div key={`${option.id}-${index}`} className="flex items-center space-x-4 p-2 bg-tg-bg rounded-lg mb-2 h-16">
                             <img src={author?.avatarUrl} alt={author?.username} className="w-10 h-10 rounded-full flex-shrink-0 object-cover" />
                            <div className="flex-grow overflow-hidden">
                                <p className="font-semibold truncate">{option.text}</p>
                                <p className="text-sm text-tg-hint">@{author?.username}</p>
                            </div>
                            {!isSpinning && (
                              <button 
                                onClick={() => onRemoveOption(option.id)}
                                className="ml-2 bg-red-500/50 text-white w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center hover:bg-red-600 transition-colors text-lg font-bold"
                                aria-label={`Удалить ${option.text}`}
                              >
                                &times;
                              </button>
                            )}
                        </div>
                    );
                })}
             </div>
        </div>
      </div>
      
      <button
        onClick={onSpinRequest}
        disabled={isSpinning || options.length < 2 || currentUser.energy < 5}
        className="w-full bg-green-500 text-white font-bold text-lg py-4 rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-not-allowed"
      >
        {isSpinning ? 'Крутится...' : `Запустить рулетку (-5⚡️)`}
      </button>
    </div>
  );
};

export default Roulette;
