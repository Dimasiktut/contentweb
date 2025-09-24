import React, { useState, useCallback, useEffect } from 'react';
import { MOCK_USERS, MOCK_OPTIONS } from './constants';
import Header from './components/Header';
import Roulette from './components/Roulette';
import ProfileView from './components/ProfileView';
import HistoryView from './components/HistoryView';
import { User, Option, AppView, AchievementId, WinRecord } from './types';

// Расширяем глобальный интерфейс Window
declare global {
  interface Window {
    Telegram: any;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.ROULETTE);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [options, setOptions] = useState<Option[]>(MOCK_OPTIONS);
  const [winHistory, setWinHistory] = useState<WinRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(users[0]);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        // Проверяем, есть ли такой пользователь в нашем моковом списке
        const existingUser = MOCK_USERS.find(u => u.id === tgUser.id);
        if (existingUser) {
          setCurrentUser(existingUser);
        } else {
          // Если пользователя нет, создаем нового на основе данных из ТГ
          // и добавляем его в общий список.
          const newUser: User = {
            id: tgUser.id,
            username: tgUser.username || `${tgUser.first_name}_${tgUser.last_name || ''}`.toLowerCase(),
            avatarUrl: `https://picsum.photos/seed/${tgUser.id}/100/100`, // Placeholder avatar
            role: 'Участник',
            stats: { ideasProposed: 0, wins: 0, winStreak: 0 },
            achievements: [],
          };
          setUsers(prev => [...prev, newUser]);
          setCurrentUser(newUser);
        }
      }
    }
  }, []);


  const handleAddOption = useCallback((text: string, category: string) => {
    setOptions(prevOptions => [
      ...prevOptions,
      {
        id: Date.now(),
        text,
        category,
        authorId: currentUser.id,
      },
    ]);
    setUsers(prevUsers => prevUsers.map(user => 
      user.id === currentUser.id 
        ? { ...user, stats: { ...user.stats, ideasProposed: user.stats.ideasProposed + 1 } }
        : user
    ));
    // Here you would check for achievement unlocks like 'Ideologue'
  }, [currentUser.id]);
  
  const handleWin = useCallback((winnerOption: Option) => {
     setWinHistory(prev => [{ option: winnerOption, timestamp: Date.now() }, ...prev]);
    
     setUsers(prevUsers => prevUsers.map(user => {
        if (user.id === winnerOption.authorId) {
            const newWinStreak = user.stats.winStreak + 1;
            const newAchievements = [...user.achievements];
            if (newWinStreak >= 3 && !newAchievements.includes(AchievementId.LUCKY)) {
                newAchievements.push(AchievementId.LUCKY);
            }
            return {
                ...user,
                stats: {
                    ...user.stats,
                    wins: user.stats.wins + 1,
                    winStreak: newWinStreak,
                },
                achievements: newAchievements
            };
        }
        // Reset streak for others, but only if they are not the winner
        if (user.id !== winnerOption.authorId) {
             return { ...user, stats: { ...user.stats, winStreak: 0 } };
        }
        return user;
    }));
  }, []);


  return (
    <div className="min-h-screen bg-tg-bg font-sans p-4">
      <div className="max-w-md mx-auto">
        <Header currentView={view} setView={setView} />
        <main className="mt-4">
          {view === AppView.ROULETTE && (
            <Roulette
              options={options}
              users={users}
              onAddOption={handleAddOption}
              onWin={handleWin}
              currentUser={currentUser}
            />
          )}
          {view === AppView.PROFILES && <ProfileView users={users} winHistory={winHistory} />}
          {view === AppView.HISTORY && <HistoryView history={winHistory} users={users} />}
        </main>
      </div>
    </div>
  );
};

export default App;