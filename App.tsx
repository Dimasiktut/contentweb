import React, { useState, useCallback, useEffect } from 'react';
// FIX: Removed import to prevent module resolution conflict with local `pocketbase.ts` file.
// import type { RecordSubscription } from 'pocketbase';
import Header from './components/Header';
import Roulette from './components/Roulette';
import ProfileView from './components/ProfileView';
import HistoryView from './components/HistoryView';
import RewardsView from './components/RewardsView';
import { User, Option, AppView, AchievementId, WinRecord, AppState, Reward } from './types';
import { pb } from './pocketbase';

// FIX: Added local type definition for RecordSubscription to replace the removed import.
interface RecordSubscription<T = any> {
  action: string;
  record: T;
}

declare global {
  interface Window {
    Telegram: any;
  }
}

const LOCAL_STORAGE_USER_KEY = 'team-roulette-user-id';

// Helper function to check if it's a new day
const needsEnergyUpdate = (lastUpdateDate: string | null): boolean => {
    if (!lastUpdateDate) return true; // first time
    const today = new Date();
    const lastUpdate = new Date(lastUpdateDate);
    return (
        today.getFullYear() !== lastUpdate.getFullYear() ||
        today.getMonth() !== lastUpdate.getMonth() ||
        today.getDate() !== lastUpdate.getDate()
    );
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.ROULETTE);
  const [users, setUsers] = useState<User[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [winHistory, setWinHistory] = useState<WinRecord[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [dataErrors, setDataErrors] = useState<string[]>([]);

  // Инициализация Telegram и определение пользователя
  useEffect(() => {
    const initializeUser = async (tgUser: any) => {
      try {
        // ... (user initialization logic remains the same)
        setInitError(null);
        let user: User | null = null;
        const storedUserId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);

        if (storedUserId) {
          try {
            user = await pb.collection('users').getOne<User>(storedUserId);
          } catch (error: any) {
            console.warn("Failed to fetch user from localStorage ID, clearing it.", error);
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          }
        }

        if (!user) {
          try {
            user = await pb.collection('users').getFirstListItem<User>(`tg_id = ${tgUser.id}`);
          } catch (error: any) {
            if (error.status === 404) {
              user = null;
            } else {
              throw error;
            }
          }
        }

        if (user) {
          const updatePayload: Partial<User> & { [key: string]: any } = {};
          const avatarUrl = tgUser.photo_url || user.avatarUrl;

          if (avatarUrl !== user.avatarUrl) {
            updatePayload.avatarUrl = avatarUrl;
          }

          if (needsEnergyUpdate(user.last_energy_update)) {
            updatePayload.energy = Math.min(20, user.energy + 10);
            updatePayload.last_energy_update = new Date().toISOString();
          }

          if (Object.keys(updatePayload).length > 0) {
            const updatedUser = await pb.collection('users').update<User>(user.id, updatePayload);
            setCurrentUser(updatedUser);
          } else {
            setCurrentUser(user);
          }
          localStorage.setItem(LOCAL_STORAGE_USER_KEY, user.id);
        } else {
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
            energy: 10,
            points: 0,
            last_energy_update: new Date().toISOString(),
          };

          try {
            const createdUser = await pb.collection('users').create<User>(newUserPayload);
            setCurrentUser(createdUser);
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, createdUser.id);
          } catch (creationError: any) {
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
      } catch (error: any)
      {
        console.error("Critical error during user initialization:", error);
        const pbError = error.originalError?.data?.message || error.message || "Произошла неизвестная ошибка.";
        setInitError(`Не удалось создать или загрузить профиль. (${pbError})`);
      } finally {
        setIsLoading(false);
      }
    };

    // ... (TG initialization logic remains the same)
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

  // Real-time listeners
  useEffect(() => {
    if (!currentUser) return;

    let unsubscribers: (() => void)[] = [];

    const setupSubscriptions = async () => {
        // Fetch initial data
        try {
            const [usersRes, optionsRes, historyRes, appStateListRes, rewardsRes] = await Promise.all([
                pb.collection('users').getFullList<User>(),
                pb.collection('options').getFullList<Option>(),
                pb.collection('history').getFullList<WinRecord>({ perPage: 50 }),
                pb.collection('app_state').getFullList<AppState>({ perPage: 1 }),
                pb.collection('rewards').getFullList<Reward>()
            ]);
            
            if (appStateListRes.length === 0) {
              throw new Error("Запись состояния приложения не найдена. Убедитесь, что в коллекции 'app_state' есть одна запись.");
            }
            const appStateRes = appStateListRes[0];

            // Sort data on the client-side for robustness
            usersRes.sort((a, b) => b.stats_wins - a.stats_wins);
            optionsRes.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
            historyRes.sort((a, b) => b.timestamp - a.timestamp);

            setUsers(usersRes);
            setOptions(optionsRes);
            setWinHistory(historyRes);
            setAppState(appStateRes);
            setRewards(rewardsRes);

            // Subscribe to AppState changes
            const appStateUnsub = await pb.collection('app_state').subscribe<AppState>(appStateRes.id, (e) => setAppState(e.record));
            unsubscribers.push(appStateUnsub);
        
        } catch (err: any) {
            console.error("Error fetching initial data:", err);
            const errorMessage = err.message || "Не удалось загрузить данные или подписаться на обновления.";
            setDataErrors(prev => [...prev, errorMessage]);
        }


      const subscribeToCollection = async (collectionName: string, callback: (data: RecordSubscription) => void) => {
          try {
              const unsub = await pb.collection(collectionName).subscribe('*', callback);
              unsubscribers.push(() => pb.collection(collectionName).unsubscribe(unsub.toString()));
          } catch (err) {
              console.error(`Failed to subscribe to ${collectionName}:`, err);
          }
      };

      subscribeToCollection('users', (e) => {
          const record = e.record as User;
          setUsers(prev => {
            const filtered = prev.filter(u => u.id !== record.id);
            return e.action === 'delete' ? filtered : [...filtered, record].sort((a,b) => b.stats_wins - a.stats_wins);
          });
          if (currentUser && record.id === currentUser.id) {
            setCurrentUser(record);
          }
      });

      subscribeToCollection('options', (e) => {
        const record = e.record as Option;
        setOptions(prev => {
          if (e.action === 'delete') return prev.filter(o => o.id !== record.id);
          if (e.action === 'create') return [...prev, record];
          return prev.map(o => o.id === record.id ? record : o);
        });
      });

      subscribeToCollection('history', (e) => {
        const record = e.record as WinRecord;
        setWinHistory(prev => [record, ...prev].sort((a,b) => b.timestamp - a.timestamp));
      });
    }

    setupSubscriptions();
    
    return () => {
        unsubscribers.forEach(unsub => unsub());
        pb.autoCancellation(true);
    };
}, [currentUser]);

  const handleAddOption = useCallback(async (text: string, category: string) => {
    if (!currentUser || currentUser.energy < 1) return;
    const newOption = { text, category, author: currentUser.id };
    await pb.collection('options').create(newOption);
    await pb.collection('users').update(currentUser.id, { 'stats_ideasProposed+': 1, 'energy-': 1 });
  }, [currentUser]);

  const handleRemoveOption = useCallback(async (idToRemove: string) => {
    await pb.collection('options').delete(idToRemove);
  }, []);
  
  const handleSpinRequest = useCallback(async () => {
    if (!currentUser || !appState || options.length < 2 || currentUser.energy < 5 || appState.roulette_status !== 'idle') {
        return;
    }
    try {
        await pb.collection('users').update(currentUser.id, { 'energy-': 5 });
        const winnerIndex = Math.floor(Math.random() * options.length);
        const winnerOption = options[winnerIndex];
        await pb.collection('app_state').update(appState.id, {
            roulette_status: 'spinning',
            roulette_winner_id: winnerOption.id,
            roulette_spinning_by: currentUser.id,
        });
    } catch (error) {
        console.error("Failed to start spin:", error);
    }
  }, [currentUser, appState, options]);

  const handleSpinEnd = useCallback(async (winnerOption: Option) => {
    if (!appState || !currentUser || currentUser.id !== appState.roulette_spinning_by) return;
    
    // 1. Create history record
    await pb.collection('history').create({
        option_text: winnerOption.text,
        option_category: winnerOption.category,
        author: winnerOption.author,
        timestamp: Date.now()
    });
    
    // 2. Award points to spinner
    try {
      await pb.collection('users').update(currentUser.id, { 'points+': 5 });
    } catch(error) {
      console.error("Failed to award points to spinner:", error);
    }

    // 3. Update winner's stats
    try {
        // Force a fetch from the network to avoid any potential SDK/browser caching issues
        const winnerUser = await pb.collection('users').getOne<User>(winnerOption.author, { requestKey: null });
        
        const newWinStreak = winnerUser.stats_winStreak + 1;
        // Ensure achievements is an array to prevent errors
        const newAchievements = [...(winnerUser.achievements || [])]; 
        
        if (newWinStreak >= 3 && !newAchievements.includes(AchievementId.LUCKY)) {
            newAchievements.push(AchievementId.LUCKY);
        }
        
        await pb.collection('users').update(winnerUser.id, {
            'stats_wins+': 1,
            stats_winStreak: newWinStreak,
            achievements: newAchievements,
            'energy+': 5,
            'points+': 25,
        });
    } catch (error: any) {
        console.error("Failed to update winner stats:", error);
        if (error.originalError) {
          console.error("PocketBase original error:", JSON.stringify(error.originalError, null, 2));
        }
        setDataErrors(prev => [...prev, "Не удалось обновить статистику победителя."]);
    }

    // 4. Reset app state for everyone
    await pb.collection('app_state').update(appState.id, {
        roulette_status: 'idle',
        roulette_winner_id: null,
        roulette_spinning_by: null,
    });
  }, [appState, currentUser]);
  
  const handleBuyReward = useCallback(async (reward: Reward) => {
    if (!currentUser || currentUser.points < reward.cost) {
      alert("Недостаточно баллов!");
      return;
    }
    if (!confirm(`Вы уверены, что хотите приобрести "${reward.name}" за ${reward.cost} баллов?`)) {
      return;
    }
    try {
      await pb.collection('users').update(currentUser.id, { 'points-': reward.cost });
      alert("Награда успешно приобретена!");
    } catch (error) {
      console.error("Failed to buy reward:", error);
      alert("Не удалось приобрести награду.");
    }
  }, [currentUser]);

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
        <Header currentView={view} setView={setView} currentUser={currentUser} />
        <main className="mt-4">
          {view === AppView.ROULETTE && currentUser && appState && (
            <Roulette
              options={options}
              users={users}
              onAddOption={handleAddOption}
              onRemoveOption={handleRemoveOption}
              onSpinRequest={handleSpinRequest}
              onSpinEnd={handleSpinEnd}
              currentUser={currentUser}
              appState={appState}
            />
          )}
          {view === AppView.PROFILES && currentUser && <ProfileView users={users} winHistory={winHistory} currentUser={currentUser} />}
          {view === AppView.HISTORY && <HistoryView history={winHistory} users={users} />}
          {view === AppView.REWARDS && currentUser && <RewardsView rewards={rewards} currentUser={currentUser} onBuyReward={handleBuyReward} />}
        </main>
      </div>
    </div>
  );
};

export default App;
