import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../types';

interface DuelViewProps {
  currentUser: User;
  opponent: User;
  stake: number;
  onDuelComplete: (result: 'win' | 'loss' | 'draw') => void;
}

const CHOICES = {
  rock: { name: 'Камень', icon: '✊', beats: 'scissors' },
  paper: { name: 'Бумага', icon: '✋', beats: 'rock' },
  scissors: { name: 'Ножницы', icon: '✌️', beats: 'paper' },
};
type Choice = keyof typeof CHOICES;

const DuelView: React.FC<DuelViewProps> = ({ currentUser, opponent, stake, onDuelComplete }) => {
  const [phase, setPhase] = useState<'choosing' | 'countdown' | 'reveal' | 'finished'>('choosing');
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<'win' | 'loss' | 'draw' | null>(null);
  const [countdown, setCountdown] = useState(3);

  const handlePlay = (choice: Choice) => {
    if (phase !== 'choosing') return;
    setPlayerChoice(choice);
    setPhase('countdown');
  };

  useEffect(() => {
    if (phase !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 800);
      return () => clearTimeout(timer);
    } else {
      setPhase('reveal');
      const choices: Choice[] = ['rock', 'paper', 'scissors'];
      const compChoice = choices[Math.floor(Math.random() * 3)];
      setOpponentChoice(compChoice);

      setTimeout(() => {
        if (playerChoice) {
          if (CHOICES[playerChoice].beats === compChoice) {
            setResult('win');
          } else if (CHOICES[compChoice].beats === playerChoice) {
            setResult('loss');
          } else {
            setResult('draw');
          }
        }
        setPhase('finished');
      }, 1500);
    }
  }, [phase, countdown, playerChoice]);
  
  const getResultText = useMemo(() => {
    switch (result) {
      case 'win': return 'Вы победили!';
      case 'loss': return 'Вы проиграли';
      case 'draw': return 'Ничья!';
      default: return '';
    }
  }, [result]);

  const getPlayerCardClass = (isWinner: boolean) => {
    if (phase !== 'finished' || result === 'draw') return 'border-transparent';
    return isWinner ? 'border-green-500' : 'border-red-500';
  }

  return (
    <div className="animate-fade-in text-center p-4 bg-tg-secondary-bg rounded-2xl shadow-2xl">
      <h1 className="text-3xl font-bold text-tg-text">Дуэль!</h1>
      <p className="text-tg-hint mt-1">Победитель получает <span className="font-bold text-amber-400">{stake * 2} 🪙</span></p>

      <div className="flex justify-around items-center my-6">
        <div className={`p-2 border-4 rounded-xl transition-colors duration-500 ${getPlayerCardClass(result === 'win')}`}>
          <img src={currentUser.avatarUrl} alt={currentUser.username} className="w-20 h-20 rounded-lg" />
          <p className="font-bold mt-1 truncate">Вы</p>
        </div>
        <span className="text-5xl font-bold text-tg-hint animate-pulse">VS</span>
        <div className={`p-2 border-4 rounded-xl transition-colors duration-500 ${getPlayerCardClass(result === 'loss')}`}>
          <img src={opponent.avatarUrl} alt={opponent.username} className="w-20 h-20 rounded-lg" />
          <p className="font-bold mt-1 truncate">@{opponent.username}</p>
        </div>
      </div>

      <div className="flex justify-around items-center my-6 h-32 bg-tg-bg rounded-xl p-4 overflow-hidden">
        {phase === 'countdown' ? (
          <div className="text-8xl font-bold text-tg-link animate-ping">{countdown}</div>
        ) : (
          <>
            <div className={`text-6xl transition-transform duration-500 ${phase === 'reveal' ? 'animate-slide-in-up' : ''}`}>
              {playerChoice ? CHOICES[playerChoice].icon : '❔'}
            </div>
            <div className={`text-6xl transition-transform duration-500 ${phase === 'reveal' ? 'animate-slide-in-up' : ''}`}>
              {opponentChoice ? CHOICES[opponentChoice].icon : '❔'}
            </div>
          </>
        )}
      </div>

      <div className="h-28">
        {phase === 'choosing' && (
          <div className="animate-fade-in">
            <h2 className="text-xl mb-4 font-semibold">Выберите ход:</h2>
            <div className="flex justify-center gap-4">
              {(Object.keys(CHOICES) as Choice[]).map(key => (
                <button
                  key={key}
                  onClick={() => handlePlay(key)}
                  className="w-20 h-20 text-4xl bg-tg-secondary-bg rounded-full hover:bg-tg-link hover:text-white transition-all transform hover:scale-110"
                  aria-label={CHOICES[key].name}
                >
                  {CHOICES[key].icon}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'finished' && result && (
          <div className="animate-fade-in">
            <h2 className={`text-3xl font-bold mb-4 ${result === 'win' ? 'text-green-400' : result === 'loss' ? 'text-red-400' : 'text-amber-400'}`}>{getResultText}</h2>
            <button
              onClick={() => onDuelComplete(result)}
              className="w-full bg-tg-button text-tg-button-text font-bold py-3 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
            >
              Завершить
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuelView;
