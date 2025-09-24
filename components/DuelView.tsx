import React, { useMemo } from 'react';
import { User, Duel, DuelChoice, DuelStatus } from '../types';

const CHOICES: Record<DuelChoice, { name: string; icon: string; beats: DuelChoice }> = {
  rock: { name: 'Камень', icon: '✊', beats: 'scissors' },
  paper: { name: 'Бумага', icon: '✋', beats: 'rock' },
  scissors: { name: 'Ножницы', icon: '✌️', beats: 'paper' },
};

interface DuelViewProps {
  currentUser: User;
  duel: Duel;
  users: User[];
  onMakeChoice: (choice: DuelChoice) => void;
  onClose: () => void;
  onCancel: () => void;
}

const DuelView: React.FC<DuelViewProps> = ({ currentUser, duel, users, onMakeChoice, onClose, onCancel }) => {
  const isChallenger = duel.challenger === currentUser.id;
  const opponentUser = users.find(u => u.id === (isChallenger ? duel.opponent : duel.challenger));
  
  const myChoice = isChallenger ? duel.challenger_choice : duel.opponent_choice;
  const opponentChoice = isChallenger ? duel.opponent_choice : duel.challenger_choice;

  const getPlayerCardClass = (isWinner: boolean) => {
    if (duel.status !== DuelStatus.COMPLETED || !duel.winner) return 'border-transparent';
    return isWinner ? 'border-green-500' : 'border-red-500';
  };
  
  const resultText = useMemo(() => {
    if (duel.status !== DuelStatus.COMPLETED) {
        if (duel.status === DuelStatus.DECLINED) return 'Дуэль отклонена';
        if (duel.status === DuelStatus.CANCELLED) return 'Дуэль отменена';
        return '';
    };
    if (!duel.winner) return 'Ничья!';
    if (duel.winner === currentUser.id) return 'Вы победили!';
    return 'Вы проиграли';
  }, [duel, currentUser.id]);

  const renderContent = () => {
    if (duel.status === DuelStatus.PENDING) {
      return (
        <div className="h-28 flex flex-col items-center justify-center animate-fade-in">
          <h2 className="text-xl font-semibold">Ожидание ответа...</h2>
          <p className="text-tg-hint">@{opponentUser?.username} должен принять вызов.</p>
          {isChallenger && (
            <button
              onClick={onCancel}
              className="mt-4 w-full bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 transition"
            >
              Отменить вызов
            </button>
          )}
        </div>
      );
    }

    if ([DuelStatus.COMPLETED, DuelStatus.DECLINED, DuelStatus.CANCELLED].includes(duel.status)) {
      return (
        <div className="h-28 flex flex-col items-center justify-center animate-fade-in">
          <h2 className={`text-3xl font-bold mb-4 ${!duel.winner && duel.status === 'completed' ? 'text-amber-400' : duel.winner === currentUser.id ? 'text-green-400' : (duel.status !== 'completed' ? 'text-tg-hint' : 'text-red-400')}`}>
            {resultText}
          </h2>
          <button
            onClick={onClose}
            className="w-full bg-tg-button text-tg-button-text font-bold py-3 rounded-lg hover:bg-blue-600 transition"
          >
            Завершить
          </button>
        </div>
      );
    }
    
    // Status is 'accepted', 'challenger_chose', or 'opponent_chose'
    if (!myChoice) {
       return (
        <div className="h-28 animate-fade-in">
          <h2 className="text-xl mb-4 font-semibold">Выберите ход:</h2>
          <div className="flex justify-center gap-4">
            {(Object.keys(CHOICES) as DuelChoice[]).map(key => (
              <button
                key={key}
                onClick={() => onMakeChoice(key)}
                className="w-20 h-20 text-4xl bg-tg-bg rounded-full hover:bg-tg-link hover:text-white transition-all transform hover:scale-110"
                aria-label={CHOICES[key].name}
              >
                {CHOICES[key].icon}
              </button>
            ))}
          </div>
        </div>
       );
    }
    
    return (
       <div className="h-28 flex flex-col items-center justify-center animate-fade-in">
          <h2 className="text-xl font-semibold">Выбор сделан!</h2>
          <p className="text-tg-hint">Ожидаем хода от @{opponentUser?.username}...</p>
        </div>
    );
  };

  if (!opponentUser) {
    return (
       <div className="animate-fade-in text-center p-4 bg-tg-secondary-bg rounded-2xl shadow-2xl">
         <p>Загрузка данных об оппоненте...</p>
       </div>
    );
  }

  return (
    <div className="animate-fade-in text-center p-4 bg-tg-secondary-bg rounded-2xl shadow-2xl">
      <h1 className="text-3xl font-bold text-tg-text">Дуэль!</h1>
      <p className="text-tg-hint mt-1">Победитель получает <span className="font-bold text-amber-400">{duel.stake * 2} 🪙</span></p>

      <div className="flex justify-around items-center my-6">
        <div className={`p-2 border-4 rounded-xl transition-colors duration-500 ${getPlayerCardClass(duel.winner === currentUser.id)}`}>
          <img src={currentUser.avatarUrl} alt={currentUser.username} className="w-20 h-20 rounded-lg" />
          <p className="font-bold mt-1 truncate">Вы</p>
        </div>
        <span className="text-5xl font-bold text-tg-hint animate-pulse">VS</span>
        <div className={`p-2 border-4 rounded-xl transition-colors duration-500 ${getPlayerCardClass(duel.winner === opponentUser.id)}`}>
          <img src={opponentUser.avatarUrl} alt={opponentUser.username} className="w-20 h-20 rounded-lg" />
          <p className="font-bold mt-1 truncate">@{opponentUser.username}</p>
        </div>
      </div>

      <div className="flex justify-around items-center my-6 h-32 bg-tg-bg rounded-xl p-4 overflow-hidden">
        <div className="text-6xl">
            {myChoice && CHOICES[myChoice] ? CHOICES[myChoice].icon : '❔'}
        </div>
        <div className="text-6xl">
            {opponentChoice && CHOICES[opponentChoice] ? CHOICES[opponentChoice].icon : '❔'}
        </div>
      </div>
      
      {renderContent()}
    </div>
  );
};

export default DuelView;