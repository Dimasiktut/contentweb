
import React, { useState, useRef, useEffect } from 'react';
import { Option, User } from '../types';

interface RouletteProps {
  options: Option[];
  users: User[];
  onAddOption: (text: string, category: string) => void;
  onWin: (winnerOption: Option) => void;
  currentUser: User;
}

const WinnerModal: React.FC<{ winner: Option; author: User; onClose: () => void }> = ({ winner, author, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-tg-secondary-bg rounded-2xl p-8 text-center shadow-2xl relative animate-slide-in-up transform-gpu">
         <div className="text-6xl mb-4">🎉</div>
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
            onClick={() => alert(`Тэг для @${author.username} скопирован!`)}
            className="mt-6 w-full bg-tg-button text-tg-button-text font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
        >
          Тегнуть счастливчика
        </button>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-tg-bg text-tg-text rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg hover:bg-red-500 transition-colors"
        >
          &times;
        </button>
      </div>
    </div>
  );
};


const Roulette: React.FC<RouletteProps> = ({ options, users, onAddOption, onWin, currentUser }) => {
  const [newOption, setNewOption] = useState('');
  const [newCategory, setNewCategory] = useState('еда');
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Option | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  
  const handleAdd = () => {
    if (newOption.trim()) {
      onAddOption(newOption.trim(), newCategory.trim() || 'разное');
      setNewOption('');
    }
  };

  const handleSpin = () => {
    if (options.length < 2 || isSpinning) return;
    setIsSpinning(true);

    const spinDuration = 4000;
    const randomIndex = Math.floor(Math.random() * options.length);
    const winnerOption = options[randomIndex];

    if (listRef.current) {
        const itemHeight = 64; // Corresponds to h-16
        const listHeight = listRef.current.clientHeight;
        const totalScroll = listRef.current.scrollHeight;
        const randomOffset = Math.random() * itemHeight - itemHeight / 2;
        const targetPosition = randomIndex * itemHeight - listHeight / 2 + itemHeight / 2 + randomOffset;
        
        const spinCount = 5;
        const finalScroll = spinCount * totalScroll + targetPosition;

        listRef.current.style.transition = `transform ${spinDuration / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
        listRef.current.style.transform = `translateY(-${finalScroll}px)`;
    }

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(winnerOption);
      onWin(winnerOption);
      if(listRef.current){
        listRef.current.style.transition = 'none';
        listRef.current.style.transform = 'translateY(0)';
      }
    }, spinDuration + 500);
  };
  
  const repeatedOptions = isSpinning ? Array(20).fill(options).flat() : options;

  return (
    <div className="space-y-6">
       {winner && (
        <WinnerModal 
          winner={winner} 
          author={users.find(u => u.id === winner.authorId)!} 
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
            className="w-full bg-tg-button text-tg-button-text font-bold py-3 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
            disabled={!newOption.trim()}
          >
            Добавить
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">Варианты</h2>
         <div className="h-64 bg-tg-secondary-bg rounded-xl relative overflow-hidden p-2 shadow-inner">
             <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 bg-tg-link/20 border-y-2 border-tg-link rounded-lg z-10 pointer-events-none"></div>
             <div ref={listRef} className="transition-transform duration-300 ease-in-out">
                {repeatedOptions.map((option, index) => {
                    const author = users.find(u => u.id === option.authorId);
                    return (
                        <div key={`${option.id}-${index}`} className="flex items-center space-x-4 p-2 bg-tg-bg rounded-lg mb-2 h-16">
                             <img src={author?.avatarUrl} alt={author?.username} className="w-10 h-10 rounded-full flex-shrink-0" />
                            <div className="flex-grow overflow-hidden">
                                <p className="font-semibold truncate">{option.text}</p>
                                <p className="text-sm text-tg-hint">@{author?.username}</p>
                            </div>
                        </div>
                    );
                })}
             </div>
        </div>
      </div>
      
      <button
        onClick={handleSpin}
        disabled={isSpinning || options.length < 2}
        className="w-full bg-green-500 text-white font-bold text-lg py-4 rounded-xl hover:bg-green-600 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 disabled:cursor-not-allowed"
      >
        {isSpinning ? 'Крутится...' : 'Запустить рулетку'}
      </button>
    </div>
  );
};

export default Roulette;
