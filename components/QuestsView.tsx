import React, { useState, useEffect } from 'react';
import { UserQuest } from '../types';

/*
NOTE FOR THE DEVELOPER / DATABASE SETUP

To enable the new Daily Quests feature, you need to create two new collections 
in your PocketBase admin panel and modify the `users` collection.

1. `quests` collection:
  - `title` (text, required) - e.g., "Победить в дуэли"
  - `description` (text) - e.g., "Одержите победу в дуэли Камень-Ножницы-Бумага"
  - `type` (select, required, single value) - Values: ADD_OPTION, SPIN_ROULETTE, WIN_ROULETTE, WIN_DUEL, WIN_CHESS, WIN_TICTACTOE, POKE_USER
  - `target_count` (number, required, default 1) - How many times the action must be completed.
  - `reward_points` (number, required, default 0)
  - `reward_energy` (number, required, default 0)

  Example Quest Records to add to your DB:
  - { title: "Новая идея", type: "ADD_OPTION", target_count: 2, reward_points: 10, reward_energy: 0 }
  - { title: "Чемпион дуэлей", type: "WIN_DUEL", target_count: 1, reward_points: 15, reward_energy: 0 }
  - { title: "Шах и Мат", type: "WIN_CHESS", target_count: 1, reward_points: 30, reward_energy: 0 }
  - { title: "Так-тик", type: "WIN_TICTACTOE", target_count: 1, reward_points: 10, reward_energy: 0 }
  - { title: "Крути барабан!", type: "SPIN_ROULETTE", target_count: 1, reward_points: 5, reward_energy: 0 }
  - { title: "Дружеский тычок", type: "POKE_USER", target_count: 3, reward_points: 20, reward_energy: 0 }

2. `user_quests` collection:
  - `user` (relation to `users`, required, cascade delete)
  - `quest` (relation to `quests`, required, cascade delete)
  - `progress` (number, required, default 0)
  - `is_completed` (bool, default false)
  - `is_claimed` (bool, default false)
  - `day_string` (text, required) - e.g., "2024-07-30"

3. Modify `users` collection:
  - Add a new field: `last_quests_assigned` (date) - Make it optional.

After setting these up, populate the `quests` collection with a few quests to get started!
*/


interface QuestsViewProps {
    userQuests: UserQuest[];
    onClaimReward: (userQuest: UserQuest) => void;
}

const questIcons: { [key: string]: string } = {
    ADD_OPTION: '💡',
    SPIN_ROULETTE: '🎰',
    WIN_ROULETTE: '🎯',
    WIN_DUEL: '⚔️',
    WIN_CHESS: '♟️',
    WIN_TICTACTOE: '⭕',
    POKE_USER: '😉',
};

const CountdownTimer: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const intervalId = setInterval(() => {
            const now = new Date();
            const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
            const diff = tomorrow.getTime() - now.getTime();

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    return <span className="font-mono">{timeLeft}</span>;
};

const QuestsView: React.FC<QuestsViewProps> = ({ userQuests, onClaimReward }) => {

    if (userQuests.length === 0) {
        return (
            <div className="text-center py-10 px-4 animate-fade-in">
                <p className="text-5xl mb-4">📜</p>
                <h3 className="text-xl font-bold text-tg-text">Нет доступных заданий</h3>
                <p className="text-tg-hint">
                    Задания обновляются каждый день. Заходите завтра!
                </p>
            </div>
        );
    }

    const sortedQuests = [...userQuests].sort((a, b) => {
      if (a.is_claimed !== b.is_claimed) return a.is_claimed ? 1 : -1;
      if (a.is_completed !== b.is_completed) return a.is_completed ? -1 : 1;
      return 0;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="text-center bg-tg-secondary-bg p-4 rounded-xl">
                <h2 className="text-2xl font-bold text-tg-text">Ежедневные задания</h2>
                <p className="text-tg-hint mt-1">Новые задания через: <CountdownTimer /></p>
            </div>

            <div className="space-y-3">
                {sortedQuests.map(uq => {
                    const quest = uq.expand?.quest;
                    if (!quest) return <div key={uq.id} className="bg-tg-secondary-bg p-4 rounded-xl">Загрузка задания...</div>;
                    
                    const progressPercentage = Math.min((uq.progress / quest.target_count) * 100, 100);
                    const isClaimable = uq.is_completed && !uq.is_claimed;

                    return (
                        <div key={uq.id} className={`bg-tg-secondary-bg p-4 rounded-xl shadow-md transition-all ${uq.is_claimed ? 'opacity-60' : ''}`}>
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">{questIcons[quest.type] || '⭐'}</span>
                                <div className="flex-grow">
                                    <h3 className="font-bold text-tg-text">{quest.title}</h3>
                                    <p className="text-sm text-tg-hint">{quest.description}</p>
                                    <div className="mt-2">
                                        <div className="w-full bg-tg-bg rounded-full h-2.5">
                                            <div 
                                              className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                                              style={{ width: `${progressPercentage}%` }}>
                                            </div>
                                        </div>
                                        <p className="text-xs text-right text-tg-hint mt-1">{uq.progress} / {quest.target_count}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center w-24 flex-shrink-0">
                                    <div className="font-bold text-lg">
                                        {quest.reward_points > 0 && <span className="text-amber-400">+{quest.reward_points} 🪙</span>}
                                        {quest.reward_energy > 0 && <span className="text-yellow-400 ml-2">+{quest.reward_energy} ⚡️</span>}
                                    </div>
                                    <button
                                        onClick={() => onClaimReward(uq)}
                                        disabled={!isClaimable}
                                        className="mt-2 w-full text-sm font-bold py-2 px-3 rounded-lg transition-colors duration-300 disabled:cursor-not-allowed
                                          ${isClaimable ? 'bg-green-600 hover:bg-green-700 text-white' 
                                            : uq.is_claimed ? 'bg-gray-700 text-gray-400' 
                                            : 'bg-gray-600 text-gray-400'}`
                                        }
                                    >
                                        {uq.is_claimed ? 'Выполнено' : isClaimable ? 'Забрать' : 'В процессе'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QuestsView;
