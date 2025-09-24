import React, { useState, useCallback, useEffect } from 'react';
import { ACHIEVEMENTS_MAP } from './constants';
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
  const [users, setUsers] = useState<User[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [winHistory, setWinHistory] = useState<WinRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка данных из localStorage при первом запуске
  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('team-roulette-users') || '[]') as User[];
    const storedOptions = JSON.parse(localStorage.getItem('team-roulette-options') || '[]') as Option[];
    const storedHistory = JSON.parse(localStorage.getItem('team-roulette-history') || '[]') as WinRecord[];

    setUsers(storedUsers);
    setOptions(storedOptions);
    setWinHistory(storedHistory);

    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        const existingUser = storedUsers.find(u => u.id === tgUser.id);
        if (existingUser) {
          setCurrentUser(existingUser);
        } else {
          const newUser: User = {
            id: tgUser.id,
            username: tgUser.username || `${tgUser.first_name}_${tgUser.last_name || ''}`.toLowerCase(),
            avatarUrl: `https://picsum.photos/seed/${tgUser.id}/100/100`,
            role: 'Участник',
            stats: { ideasProposed: 0, wins: 0, winStreak: 0 },
            achievements: [],
          };
          setUsers(prev => [...prev, newUser]);
          setCurrentUser(newUser);
        }
      } else {
         // Fallback for development outside Telegram
         if (storedUsers.length > 0) {
            setCurrentUser(storedUsers[0]);
         }
      }
    }
    setIsLoading(false);
  }, []);

  // Сохранение данных в localStorage при их изменении
  useEffect(() => {
    if(!isLoading) localStorage.setItem('team-roulette-users', JSON.stringify(users));
  }, [users, isLoading]);
  useEffect(() => {
    if(!isLoading) localStorage.setItem('team-roulette-options', JSON.stringify(options));
  }, [options, isLoading]);
  useEffect(() => {
    if(!isLoading) localStorage.setItem('team-roulette-history', JSON.stringify(winHistory));
  }, [winHistory, isLoading]);


  const handleAddOption = useCallback((text: string, category: string) => {
    if (!currentUser) return;
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
  }, [currentUser]);

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
      if (user.id !== winnerOption.authorId) {
        return { ...user, stats: { ...user.stats, winStreak: 0 } };
      }
      return user;
    }));
  }, []);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-tg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-spin mb-4">⚙️</div>
          <p className="text-lg text-tg-hint animate-pulse">Загрузка данных...</p>
        </div>
      </div>
    );
  }

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
          {view === AppView.PROFILES && <ProfileView users={users} winHistory={winHistory} currentUser={currentUser} />}
          {view === AppView.HISTORY && <HistoryView history={winHistory} users={users} />}
        </main>
      </div>
    </div>
  );
};

export default App;
