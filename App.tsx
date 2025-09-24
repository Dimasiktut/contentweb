import React, { useState, useCallback, useEffect } from 'react';
// FIX: Removed import to prevent module resolution conflict with local `pocketbase.ts` file.
// import type { RecordSubscription } from 'pocketbase';
import Header from './components/Header';
import Roulette from './components/Roulette';
import ProfileView from './components/ProfileView';
import HistoryView from './components/HistoryView';
import RewardsView from './components/RewardsView';
import DuelView from './components/DuelView';
import { User, Option, AppView, AchievementId, WinRecord, Reward, Purchase } from './types';
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
const DUEL_COST = 10;


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
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [dataErrors, setDataErrors] = useState<string[]>([]);
  
  // Local state for roulette control
  const [isSpinning, setIsSpinning] = useState(false);
  const [isProcessingWin, setIsProcessingWin] = useState(false);
  const [winnerForAnimation, setWinnerForAnimation] = useState<Option | null>(null);
  const [currentDuel, setCurrentDuel] = useState<{ opponent: User; stake: number } | null>(null);


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
            user = await pb.collection('users').getOne<User>(storedUserId, { requestKey: null });
          } catch (error: any) {
            console.warn("Failed to fetch user from localStorage ID, clearing it.", error);
            localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
          }
        }

        if (!user) {
          try {
            user = await pb.collection('users').getFirstListItem<User>(`tg_id = ${tgUser.id}`, { requestKey: null });
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
            const updatedUser = await pb.collection('users').update<User>(user.id, updatePayload, { requestKey: null });
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
            const createdUser = await pb.collection('users').create<User>(newUserPayload, { requestKey: null });
            setCurrentUser(createdUser);
            localStorage.setItem(LOCAL_STORAGE_USER_KEY, createdUser.id);
          } catch (creationError: any) {
            const isUsernameError = creationError.originalError?.data?.data?.username?.code === 'validation_not_unique';
            if (isUsernameError) {
              console.warn(`Username ${username} is taken. Retrying with a more unique name.`);
              newUserPayload.username = `${username}_${tgUser.id}`;
              const createdUserWithSuffix = await pb.collection('users').create<User>(newUserPayload, { requestKey: null });
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
        try {
            // Fetch primary data that should not fail
            const [usersRes, optionsRes, historyRes, rewardsRes] = await Promise.all([
                pb.collection('users').getFullList<User>({ requestKey: null }),
                pb.collection('options').getFullList<Option>({ requestKey: null }),
                pb.collection('history').getFullList<WinRecord>({ sort: '-created', requestKey: null }),
                pb.collection('rewards').getFullList<Reward>({ requestKey: null })
            ]);

            usersRes.sort((a, b) => b.stats_wins - a.stats_wins);
            optionsRes.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

            setUsers(usersRes);
            setOptions(optionsRes);
            setWinHistory(historyRes);
            setRewards(rewardsRes);

            // Fetch purchases separately as it might fail due to API rules
            try {
                const purchasesRes = await pb.collection('purchases').getFullList<Purchase>({ filter: `user = "${currentUser.id}"`, sort: '-created', requestKey: null });
                setPurchases(purchasesRes);
            } catch (purchaseError: any) {
                console.error("Failed to fetch purchases. This might be due to restrictive API rules on the 'purchases' collection.", purchaseError);
                setDataErrors(prev => [...prev, "Не удалось загрузить историю покупок. Проверьте права доступа в PocketBase."]);
                setPurchases([]); // Set to empty array on failure
            }

        } catch (err: any) {
            console.error("Error fetching initial data:", err);
            const errorMessage = err.message || "Не удалось загрузить основные данные приложения.";
            setDataErrors(prev => [...prev, errorMessage]);
            // Set essential states to empty arrays to prevent crashes
            setUsers([]);
            setOptions([]);
            setWinHistory([]);
            setRewards([]);
            setPurchases([]);
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
        setWinHistory(prev => [record, ...prev].sort((a,b) => new Date(b.created).getTime() - new Date(a.created).getTime()));
      });
      
      subscribeToCollection('purchases', (e) => {
        const record = e.record as Purchase;
        if (record.user !== currentUser.id) return;
        setPurchases(prev => {
           if (e.action === 'create') return [record, ...prev];
           return prev; // No updates/deletes handled for now
        });
      });
    }

    setupSubscriptions();
    
    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
}, [currentUser]);

  const handleAddOption = useCallback(async (text: string, category: string) => {
    if (!currentUser || currentUser.energy < 1) return;
    const newOption = { text, category, author: currentUser.id };
    await pb.collection('options').create(newOption, { requestKey: null });
    await pb.collection('users').update(currentUser.id, { 'stats_ideasProposed+': 1, 'energy-': 1 }, { requestKey: null });
  }, [currentUser]);

  const handleRemoveOption = useCallback(async (idToRemove: string) => {
    await pb.collection('options').delete(idToRemove, { requestKey: null });
  }, []);
  
  const handleSpinRequest = useCallback(async () => {
    if (!currentUser || options.length < 2 || currentUser.energy < 5 || isSpinning || isProcessingWin) {
        return;
    }
    try {
        setIsSpinning(true);
        await pb.collection('users').update(currentUser.id, { 'energy-': 5 }, { requestKey: null });
        const winnerIndex = Math.floor(Math.random() * options.length);
        const winnerOption = options[winnerIndex];
        setWinnerForAnimation(winnerOption); // Trigger animation in Roulette component
    } catch (error) {
        console.error("Failed to start spin:", error);
        setIsSpinning(false); // Reset on error
    }
  }, [currentUser, options, isSpinning, isProcessingWin]);

  const handleSpinEnd = useCallback(async (winnerOption: Option) => {
    // 1. Create history record
    await pb.collection('history').create({
        option_text: winnerOption.text,
        option_category: winnerOption.category,
        author: winnerOption.author,
        timestamp: Date.now()
    }, { requestKey: null });
    
    // 2. Award points to spinner
    if (currentUser) {
      try {
        await pb.collection('users').update(currentUser.id, { 'points+': 5 }, { requestKey: null });
      } catch(error) {
        console.error("Failed to award points to spinner:", error);
      }
    }


    // 3. Update winner's stats
    try {
        const winnerUser = await pb.collection('users').getOne<User>(winnerOption.author, { requestKey: null });
        
        const newWinStreak = winnerUser.stats_winStreak + 1;
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
        }, { requestKey: null });
    } catch (error: any) {
        console.error("Failed to update winner stats:", error);
        setDataErrors(prev => [...prev, "Не удалось обновить статистику победителя."]);
    }
  }, [currentUser]);
  
  const handleAnimationComplete = useCallback(async (winnerOption: Option) => {
      if (!currentUser) return;
      
      // Reset state IMMEDIATELY to prevent re-triggering the animation from a re-render
      setIsSpinning(false);
      setWinnerForAnimation(null);
      setIsProcessingWin(true);

      try {
        await handleSpinEnd(winnerOption);
      } catch (error) {
          console.error("Failed to process spin end:", error);
          setDataErrors(prev => [...prev, "Ошибка при обработке результатов."]);
      } finally {
        setIsProcessingWin(false);
      }
  }, [currentUser, handleSpinEnd]);

  const handleBuyReward = useCallback(async (reward: Reward) => {
    if (!currentUser || currentUser.points < reward.cost) {
      alert("Недостаточно баллов!");
      return;
    }
    if (!confirm(`Вы уверены, что хотите приобрести "${reward.name}" за ${reward.cost} баллов?`)) {
      return;
    }
    try {
      // First create the purchase record for atomicity
      await pb.collection('purchases').create({
        user: currentUser.id,
        reward_name: reward.name,
        reward_icon: reward.icon || '🎁',
        cost: reward.cost
      }, { requestKey: null });
      // Then deduct points
      await pb.collection('users').update(currentUser.id, { 'points-': reward.cost }, { requestKey: null });
      alert("Награда успешно приобретена!");
    } catch (error) {
      console.error("Failed to buy reward:", error);
      alert("Не удалось приобрести награду. Если баллы списались, а награда не появилась, обратитесь к администратору.");
    }
  }, [currentUser]);

  const handleInitiateDuel = useCallback(async (opponent: User) => {
    if (!currentUser || currentUser.points < DUEL_COST) {
      alert("Недостаточно баллов для вызова на дуэль!");
      return;
    }
    if (!confirm(`Вызвать @${opponent.username} на дуэль? Это будет стоить ${DUEL_COST} баллов.`)) {
      return;
    }
    try {
      await pb.collection('users').update(currentUser.id, { 'points-': DUEL_COST }, { requestKey: null });
      setCurrentDuel({ opponent, stake: DUEL_COST });
      setView(AppView.DUEL);
    } catch (error) {
      console.error("Failed to initiate duel:", error);
      alert("Не удалось начать дуэль.");
    }
  }, [currentUser]);

  const handleDuelComplete = useCallback(async (result: 'win' | 'loss' | 'draw') => {
    if (!currentUser || !currentDuel) return;
    const prize = currentDuel.stake * 2;
    try {
      if (result === 'win') {
        await pb.collection('users').update(currentUser.id, { 'points+': prize }, { requestKey: null });
        alert(`Вы выиграли ${prize} баллов!`);
      } else if (result === 'loss') {
        await pb.collection('users').update(currentDuel.opponent.id, { 'points+': prize }, { requestKey: null });
        alert(`Противник выиграл ${prize} баллов.`);
      } else { // draw
        await pb.collection('users').update(currentUser.id, { 'points+': currentDuel.stake }, { requestKey: null });
        alert("Ничья! Ваши баллы возвращены.");
      }
    } catch (error) {
      console.error("Failed to update points after duel:", error);
      alert("Ошибка при начислении награды.");
    } finally {
      setCurrentDuel(null);
      setView(AppView.PROFILES);
    }
  }, [currentUser, currentDuel]);

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
          {view === AppView.ROULETTE && currentUser && (
            <Roulette
              options={options}
              users={users}
              onAddOption={handleAddOption}
              onRemoveOption={handleRemoveOption}
              onSpinRequest={handleSpinRequest}
              onAnimationComplete={handleAnimationComplete}
              currentUser={currentUser}
              isSpinning={isSpinning}
              isProcessingWin={isProcessingWin}
              winnerForAnimation={winnerForAnimation}
            />
          )}
          {view === AppView.PROFILES && currentUser && <ProfileView users={users} winHistory={winHistory} purchases={purchases} currentUser={currentUser} onInitiateDuel={handleInitiateDuel} />}
          {view === AppView.HISTORY && <HistoryView history={winHistory} users={users} />}
          {view === AppView.REWARDS && currentUser && <RewardsView rewards={rewards} currentUser={currentUser} onBuyReward={handleBuyReward} />}
          {view === AppView.DUEL && currentUser && currentDuel && (
            <DuelView
                currentUser={currentUser}
                opponent={currentDuel.opponent}
                stake={currentDuel.stake}
                onDuelComplete={handleDuelComplete}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;