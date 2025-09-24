
import React, { useState, useCallback, useEffect } from 'react';
// Fix: Correctly import the RecordSubscriptionEvent type for PocketBase real-time subscriptions.
import type { RecordSubscriptionEvent } from 'pocketbase';
import Header from './components/Header';
import Roulette from './components/Roulette';
import ProfileView from './components/ProfileView';
import HistoryView from './components/HistoryView';
import { User, Option, AppView, AchievementId, WinRecord } from './types';
import { pb } from './pocketbase';

declare global {
  interface Window {
    Telegram: any;
  }
}

const LOCAL_STORAGE_USER_KEY = 'team-roulette-user-id';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.ROULETTE);
  const [users, setUsers] = useState<User[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [winHistory, setWinHistory] = useState<WinRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [dataErrors, setDataErrors] = useState<string[]>([]);

  // Инициализация Telegram и определение пользователя
  useEffect(() => {
    const initializeUser = async (tgUser: any) => {
      try {
        setInitError(null);
        let user: User | null = null;
        const storedUserId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);

        // 1. Пытаемся найти пользователя по ID из localStorage
        if (storedUserId) {
          try {
            user = await pb.collection('users').getOne<User>(storedUserId);
          } catch (error: any) {
            console.warn("Failed to fetch user from localStorage ID, clearing it.", error);
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          }
        }

        // 2. Если не нашли, ищем по tg_id
        if (!user) {
          try {
            user = await pb.collection('users').getFirstListItem<User>(`tg_id = ${tgUser.id}`);
          } catch (error: any) {
            if (error.status === 404) {
              user = null; // Не найден, будет создан ниже
            } else {
              throw error; // Перебрасываем другие ошибки
            }
          }
        }

        if (user) {
          // Пользователь существует, обновляем аватар если нужно
          const avatarUrl = tgUser.photo_url || user.avatarUrl;
          if (avatarUrl !== user.avatarUrl) {
            const updatedUser = await pb.collection('users').update<User>(user.id, { avatarUrl });
            setCurrentUser(updatedUser);
          } else {
            setCurrentUser(user);
          }
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, user.id); // Сохраняем ID на случай если его не было
        } else {
          // 3. Пользователь не найден, создаем нового
          let username = (tgUser.username || `user_${tgUser.id}`).toLowerCase().replace(/ /g, '_');
          
          const newUserPayload = {
            tg_id: tgUser.id,
            username: username,
            avatarUrl: tgUser.photo_url || `https://picsum.photos/seed/${tgUser.id}/100/100`,
            role: 'Участник',
            stats_ideasProposed: 0,
            stats_wins: 0,
            stats_winStreak: 0,
            achievements: [],
          };

          try {
            const createdUser = await pb.collection('users').create<User>(newUserPayload);
            setCurrentUser(createdUser);
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, createdUser.id);
          } catch (creationError: any) {
            // Обработка возможного конфликта имен
            const isUsernameError = creationError.originalError?.data?.data?.username?.code === 'validation_not_unique';
            if (isUsernameError) {
              console.warn(`Username ${username} is taken. Retrying with a more unique name.`);
              newUserPayload.username = `${username}_${tgUser.id}`;
              const createdUserWithSuffix = await pb.collection('users').create<User>(newUserPayload);
              setCurrentUser(createdUserWithSuffix);
              localStorage.setItem(LOCAL_STORAGE_USER_KEY, createdUserWithSuffix.id);
            } else {
              throw creationError;
            }
          }
        }
      } catch (error: any) {
        console.error("Critical error during user initialization:", error);
        const pbError = error.originalError?.data?.message || error.message || "Произошла неизвестная ошибка.";
        setInitError(`Не удалось создать или загрузить профиль. (${pbError})`);
      } finally {
        setIsLoading(false);
      }
    };

    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        initializeUser(tgUser);
      } else {
        console.warn("Telegram user not found. Creating a mock user for development.");
        initializeUser({ id: 123456789, username: 'dev_user', first_name: 'Dev', last_name: 'User', photo_url: `https://picsum.photos/seed/123456789/100/100` });
      }
    } else {
      console.warn("Telegram Web App script not loaded. Running in development mode with a mock user.");
       initializeUser({ id: 123456789, username: 'dev_user', first_name: 'Dev', last_name: 'User', photo_url: `https://picsum.photos/seed/123456789/100/100` });
    }
  }, []);

  // Real-time listeners for data from PocketBase
  useEffect(() => {
    if (!currentUser) return; // Don't fetch data until user is initialized

    const fetchData = async () => {
        const results = await Promise.allSettled([
            pb.collection('users').getFullList<User>(),
            pb.collection('options').getFullList<Option>(),
            pb.collection('history').getFullList<WinRecord>({ sort: '-timestamp' })
        ]);

        const newErrors: string[] = [];

        // Users
        if (results[0].status === 'fulfilled') {
            setUsers(results[0].value);
        } else {
            console.error("Failed to fetch users", results[0].reason);
        }

        // Options
        if (results[1].status === 'fulfilled') {
            setOptions(results[1].value);
        } else {
            console.error("Failed to fetch options", results[1].reason);
            newErrors.push("Не удалось загрузить варианты. Проверьте права доступа к коллекции 'options' в PocketBase.");
        }

        // History
        if (results[2].status === 'fulfilled') {
            setWinHistory(results[2].value);
        } else {
            console.error("Failed to fetch history", results[2].reason);
            newErrors.push("Не удалось загрузить историю. Проверьте права доступа к коллекции 'history' в PocketBase.");
        }

        if (newErrors.length > 0) {
            setDataErrors(newErrors);
        }
    };

    fetchData();

    // Subscriptions
    const unsubscribers: (() => void)[] = [];

    const subscribeToCollection = async (collectionName: string, callback: (data: RecordSubscriptionEvent<any>) => void) => {
        try {
            const unsub = await pb.collection(collectionName).subscribe('*', callback);
            unsubscribers.push(unsub);
        } catch (err) {
            console.error(`Failed to subscribe to ${collectionName}:`, err);
        }
    };

    subscribeToCollection('users', (e: RecordSubscriptionEvent<User>) => {
        setUsers(prev => {
          const filtered = prev.filter(u => u.id !== e.record.id);
          return e.action === 'delete' ? filtered : [...filtered, e.record].sort((a,b) => b.stats_wins - a.stats_wins);
        });
    });

    subscribeToCollection('options', (e: RecordSubscriptionEvent<Option>) => {
        setOptions(prev => {
            if (e.action === 'delete') return prev.filter(o => o.id !== e.record.id);
            if (e.action === 'create') return [...prev, e.record];
            return prev.map(o => o.id === e.record.id ? e.record : o);
        });
    });

    subscribeToCollection('history', (e: RecordSubscriptionEvent<WinRecord>) => {
         setWinHistory(prev => [e.record, ...prev].sort((a,b) => b.timestamp - a.timestamp));
    });
    
    // Cleanup on unmount
    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
}, [currentUser]);


  const handleAddOption = useCallback(async (text: string, category: string) => {
    if (!currentUser) return;
    const newOption = {
      text,
      category,
      author: currentUser.id,
    };
    await pb.collection('options').create(newOption);

    // Update user's proposed ideas count
    await pb.collection('users').update(currentUser.id, {
        'stats_ideasProposed+': 1
    });
  }, [currentUser]);

  const handleRemoveOption = useCallback(async (idToRemove: string) => {
    await pb.collection('options').delete(idToRemove);
  }, []);

  const handleWin = useCallback(async (winnerOption: Option) => {
    // 1. Add to win history
    await pb.collection('history').create({
        option_text: winnerOption.text,
        option_category: winnerOption.category,
        author: winnerOption.author,
        timestamp: Date.now()
    });

    // 2. Update stats for all users
    const allUsers = await pb.collection('users').getFullList<User>();
    for (const user of allUsers) {
        if (user.id === winnerOption.author) {
            const newWinStreak = user.stats_winStreak + 1;
            const newAchievements = [...user.achievements];
            if (newWinStreak >= 3 && !newAchievements.includes(AchievementId.LUCKY)) {
                newAchievements.push(AchievementId.LUCKY);
            }
            await pb.collection('users').update(user.id, {
                'stats_wins+': 1,
                'stats_winStreak': newWinStreak,
                'achievements': newAchievements
            });
        } else {
             if (user.stats_winStreak > 0) {
                await pb.collection('users').update(user.id, { 'stats_winStreak': 0 });
            }
        }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-tg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-spin mb-4">⚙️</div>
          <p className="text-lg text-tg-hint animate-pulse">Подключаемся к PocketBase...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser) {
     return (
      <div className="min-h-screen bg-tg-bg flex items-center justify-center">
        <div className="text-center p-4 max-w-sm">
          <div className="text-4xl mb-4">🤔</div>
          <h2 className="text-xl font-bold text-tg-text mb-2">Ошибка инициализации</h2>
          <p className="text-base text-tg-hint break-words">
             {initError 
              ? initError 
              : 'Не удалось определить пользователя Telegram. Пожалуйста, убедитесь, что приложение открыто внутри Telegram.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tg-bg font-sans p-4">
      <div className="max-w-md mx-auto">
        {dataErrors.length > 0 && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-xl mb-4 text-sm" role="alert">
            <p className="font-bold mb-1">⚠️ Ошибка данных</p>
            <ul className="list-disc list-inside">
              {dataErrors.map((error, index) => <li key={index}>{error}</li>)}
            </ul>
          </div>
        )}
        <Header currentView={view} setView={setView} />
        <main className="mt-4">
          {view === AppView.ROULETTE && currentUser && (
            <Roulette
              options={options}
              users={users}
              onAddOption={handleAddOption}
              onRemoveOption={handleRemoveOption}
              onWin={handleWin}
              currentUser={currentUser}
            />
          )}
          {view === AppView.PROFILES && currentUser && <ProfileView users={users} winHistory={winHistory} currentUser={currentUser} />}
          {view === AppView.HISTORY && <HistoryView history={winHistory} users={users} />}
        </main>
      </div>
    </div>
  );
};

export default App;
