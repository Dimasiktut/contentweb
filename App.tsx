import React, { useState, useCallback, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, deleteDoc, query, orderBy, writeBatch, getDoc } from 'firebase/firestore';
import Header from './components/Header';
import Roulette from './components/Roulette';
import ProfileView from './components/ProfileView';
import HistoryView from './components/HistoryView';
import { User, Option, AppView, AchievementId, WinRecord } from './types';

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

  // Инициализация Telegram и определение пользователя
  useEffect(() => {
    const initializeUser = async (tgUser: any) => {
      const userRef = doc(db, 'users', tgUser.id.toString());
      let userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        const newUser: User = {
          id: tgUser.id,
          username: tgUser.username || `${tgUser.first_name}_${tgUser.last_name || ''}`.toLowerCase(),
          avatarUrl: tgUser.photo_url || `https://picsum.photos/seed/${tgUser.id}/100/100`,
          role: 'Участник',
          stats: { ideasProposed: 0, wins: 0, winStreak: 0 },
          achievements: [],
        };
        await setDoc(userRef, newUser);
        setCurrentUser(newUser);
      } else {
         const existingUser = userDoc.data() as User;
         // Обновляем аватар, если он изменился в Telegram
         if (tgUser.photo_url && existingUser.avatarUrl !== tgUser.photo_url) {
            const updatedUser = { ...existingUser, avatarUrl: tgUser.photo_url };
            await setDoc(userRef, updatedUser, { merge: true });
            setCurrentUser(updatedUser);
         } else {
            setCurrentUser(existingUser);
         }
      }
      setIsLoading(false);
    };

    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        initializeUser(tgUser);
      } else {
        // Fallback for development if no user is found
        setIsLoading(false);
      }
    } else {
      console.warn("Telegram Web App script not loaded. Running in development mode.");
      setIsLoading(false);
    }
  }, []);

  // Real-time listeners for data from Firestore
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setUsers(usersData);
    });

    const unsubscribeOptions = onSnapshot(collection(db, 'options'), (snapshot) => {
      const optionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Option));
      setOptions(optionsData);
    });

    const historyQuery = query(collection(db, 'history'), orderBy('timestamp', 'desc'));
    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WinRecord));
      setWinHistory(historyData);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeOptions();
      unsubscribeHistory();
    };
  }, []);

  const handleAddOption = useCallback(async (text: string, category: string) => {
    if (!currentUser) return;
    const newOption = {
      text,
      category,
      authorId: currentUser.id,
    };
    await addDoc(collection(db, 'options'), newOption);

    // Update user's proposed ideas count
    const userRef = doc(db, 'users', currentUser.id.toString());
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const newStats = { ...userData.stats, ideasProposed: userData.stats.ideasProposed + 1 };
      await setDoc(userRef, { stats: newStats }, { merge: true });
    }
  }, [currentUser]);

  const handleRemoveOption = useCallback(async (idToRemove: string) => {
    await deleteDoc(doc(db, 'options', idToRemove));
  }, []);

  const handleWin = useCallback(async (winnerOption: Option) => {
    const batch = writeBatch(db);

    // 1. Add to win history
    const historyRef = doc(collection(db, 'history'));
    batch.set(historyRef, { option: { ...winnerOption, id: 'ref' }, timestamp: Date.now() });

    // 2. Update stats for all users
    users.forEach(user => {
        const userRef = doc(db, 'users', user.id.toString());
        if (user.id === winnerOption.authorId) {
            const newWinStreak = user.stats.winStreak + 1;
            const newAchievements = [...user.achievements];
            if (newWinStreak >= 3 && !newAchievements.includes(AchievementId.LUCKY)) {
                newAchievements.push(AchievementId.LUCKY);
            }
            batch.update(userRef, {
                'stats.wins': user.stats.wins + 1,
                'stats.winStreak': newWinStreak,
                'achievements': newAchievements
            });
        } else {
             if (user.stats.winStreak > 0) {
                batch.update(userRef, { 'stats.winStreak': 0 });
            }
        }
    });

    await batch.commit();
  }, [users]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-tg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-spin mb-4">⚙️</div>
          <p className="text-lg text-tg-hint animate-pulse">Подключаемся к Firebase...</p>
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
              onRemoveOption={handleRemoveOption}
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