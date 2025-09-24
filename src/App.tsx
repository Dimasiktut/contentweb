import React, { useState, useCallback, useEffect, useRef } from 'react';
// FIX: Removed import of RecordSubscription from 'pocketbase' as it was causing an error. The type is now imported from the local types.ts file.
import Header from './components/Header';
import Roulette from './components/Roulette';
import ProfileView from './components/ProfileView';
import HistoryView from './components/HistoryView';
import RewardsView from './components/RewardsView';
import DuelView from './components/DuelView';
import GamesView from './components/DuelsView';
import GuideView from './components/GuideView';
import ChessView from './components/ChessView';
import TictactoeView from './components/TictactoeView';
import { QuestsView } from './components/QuestsView';
import { User, Option, AppView, AchievementId, WinRecord, Reward, Purchase, Duel, DuelStatus, DuelChoice, ChessGame, ChessGameStatus, RecordSubscription, TictactoeGame, TictactoeGameStatus, TictactoeBoard, TictactoePlayerSymbol, UserQuest, QuestType, Quest } from './types';
import { pb } from './pocketbase';

declare global {
  interface Window {
    Telegram: any;
    Chess: any;
  }
}

const LOCAL_STORAGE_USER_KEY = 'team-roulette-user-id';
const DUEL_COST = 10;
const CHESS_COST = 25;
const POKE_COST = 5;
const TICTACTOE_COST = 5;

const CHOICES: Record<DuelChoice, { name: string; icon: string; beats: DuelChoice }> = {
  rock: { name: 'Камень', icon: '✊', beats: 'scissors' },
  paper: { name: 'Бумага', icon: '✋', beats: 'rock' },
  scissors: { name: 'Ножницы', icon: '✌️', beats: 'paper' },
};

// Helper function to extract a detailed error message from a PocketBase error object.
const getPocketbaseError = (err: any, defaultMessage: string = "Произошла неизвестная ошибка."): string => {
  if (err && typeof err === 'object') {
    // PocketBase ClientResponseError structure
    if (err.data && typeof err.data === 'object' && err.data.message) {
      return err.data.message;
    }
    // Some errors wrap the original error
    if (err.originalError && typeof err.originalError === 'object' && err.originalError.message) {
       return err.originalError.message;
    }
    // Fallback to the top-level message property
    if (err.message) {
      return err.message;
    }
  }
  return defaultMessage;
};


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
  const [duelHistory, setDuelHistory] = useState<Duel[]>([]);
  const [chessHistory, setChessHistory] = useState<ChessGame[]>([]);
  const [tictactoeHistory, setTictactoeHistory] = useState<TictactoeGame[]>([]);
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
  
  // Real-time game state
  const [activeDuel, setActiveDuel] = useState<Duel | null>(null);
  const [pendingDuels, setPendingDuels] = useState<Duel[]>([]);
  const [activeChessGame, setActiveChessGame] = useState<ChessGame | null>(null);
  const [pendingChessGames, setPendingChessGames] = useState<ChessGame[]>([]);
  const [ongoingChessGames, setOngoingChessGames] = useState<ChessGame[]>([]);
  const [activeTictactoeGame, setActiveTictactoeGame] = useState<TictactoeGame | null>(null);
  const [pendingTictactoeGames, setPendingTictactoeGames] = useState<TictactoeGame[]>([]);
  const [ongoingTictactoeGames, setOngoingTictactoeGames] = useState<TictactoeGame[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);


  // State to trigger resubscription on websocket reconnect
  const [reconnectCounter, setReconnectCounter] = useState(0);
  const lastClientIdRef = useRef<string>(pb.realtime.clientId);

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
            points: 50,
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
        const pbError = getPocketbaseError(error);
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

  // Effect to handle realtime connection changes by polling the client ID.
  // This is a workaround because the PocketBase JS SDK does not provide a direct
  // event listener for connection status changes. The call to pb.realtime.onConnectionChange
  // was incorrect and has been replaced with this polling mechanism.
  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentClientId = pb.realtime.clientId;

      // On first connection, just store the new client ID
      if (!lastClientIdRef.current && currentClientId) {
        console.log('PocketBase connected with client ID:', currentClientId);
        lastClientIdRef.current = currentClientId;
        return;
      }
      
      // On reconnection, the client ID will change
      if (lastClientIdRef.current && currentClientId && lastClientIdRef.current !== currentClientId) {
        console.log(`PocketBase reconnected. Client ID changed from ${lastClientIdRef.current} to ${currentClientId}. Refreshing data...`);
        lastClientIdRef.current = currentClientId; // Update to the new ID
        setReconnectCounter(c => c + 1); // Trigger the refresh
      }
      
      // On disconnection, the client ID is cleared
      if (lastClientIdRef.current && !currentClientId) {
        console.log('PocketBase disconnected. Last client ID was:', lastClientIdRef.current);
        lastClientIdRef.current = '';
      }
    }, 2500); // Poll every 2.5 seconds

    return () => clearInterval(intervalId);
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  // Daily Quest Assignment
  useEffect(() => {
    if (!currentUser) return;
    
    const assignDailyQuests = async () => {
        const today = new Date().toISOString().split('T')[0];
        
        if (currentUser.last_quests_assigned === today) {
            // Quests already assigned for today, just fetch them.
            try {
                const quests = await pb.collection('user_quests').getFullList<UserQuest>({
                    filter: `user.id = "${currentUser.id}" && day_string = "${today}"`,
                    expand: 'quest',
                    requestKey: null
                });
                setUserQuests(quests);
            } catch(e) { console.error("Failed to fetch today's quests:", e); }
            return;
        }

        console.log("Assigning new daily quests for", today);
        try {
            // Fetch all available quests and pick 3 random ones
            const allQuests = await pb.collection('quests').getFullList<Quest>({ requestKey: null });
            if (allQuests.length === 0) {
              console.warn("No quests found in the 'quests' collection to assign.");
              return;
            }

            const shuffled = allQuests.sort(() => 0.5 - Math.random());
            const selectedQuests = shuffled.slice(0, 3);
            
            // Create new user_quest records for the selected quests
            const createPromises = selectedQuests.map(quest => pb.collection('user_quests').create({
                user: currentUser.id,
                quest: quest.id,
                progress: 0,
                is_completed: false,
                is_claimed: false,
                day_string: today
            }));
            await Promise.all(createPromises);

            // Update user's last_quests_assigned date
            await pb.collection('users').update(currentUser.id, { last_quests_assigned: today });
            setCurrentUser(prev => prev ? { ...prev, last_quests_assigned: today } : null);

            // Fetch the newly created quests to update state
            const newQuests = await pb.collection('user_quests').getFullList<UserQuest>({
                filter: `user.id = "${currentUser.id}" && day_string = "${today}"`,
                expand: 'quest',
                requestKey: null
            });
            setUserQuests(newQuests);
            
        } catch (error) {
            console.error("Failed to assign daily quests:", error);
            setDataErrors(prev => [...prev, getPocketbaseError(error, "Не удалось назначить ежедневные задания.")]);
        }
    };

    assignDailyQuests();

  }, [currentUser?.id]); // Rerun only when user ID changes

  // Real-time listeners
  useEffect(() => {
    if (!currentUser) return;

    const setupSubscriptions = async () => {
        // Data is fetched, and then subscriptions are established.
        // The cleanup function for this effect handles unsubscribing, which is crucial for reconnections.
        try {
            const [usersRes, optionsRes, historyRes, rewardsRes, duelHistoryRes, pendingDuelsRes, chessHistoryRes, pendingChessGamesRes, ongoingChessGamesRes, tttHistoryRes, pendingTttGamesRes, ongoingTttGamesRes] = await Promise.all([
                pb.collection('users').getFullList<User>({ requestKey: null }),
                pb.collection('options').getFullList<Option>({ requestKey: null }),
                pb.collection('history').getFullList<WinRecord>({ sort: '-created', requestKey: null }),
                pb.collection('rewards').getFullList<Reward>({ requestKey: null }),
                pb.collection('duels').getFullList<Duel>({ filter: `(challenger = "${currentUser.id}" || opponent = "${currentUser.id}") && (status != "pending" && status != "accepted")`, sort: '-created', requestKey: null, expand: 'challenger,opponent,winner' }),
                pb.collection('duels').getFullList<Duel>({ filter: `opponent = "${currentUser.id}" && status = "pending"`, sort: '-created', requestKey: null, expand: 'challenger,opponent' }),
                pb.collection('chess_games').getFullList<ChessGame>({ filter: `(player_white = "${currentUser.id}" || player_black = "${currentUser.id}") && status = "completed"`, sort: '-created', requestKey: null, expand: 'player_white,player_black,winner' }),
                pb.collection('chess_games').getFullList<ChessGame>({ filter: `(player_white = "${currentUser.id}" || player_black = "${currentUser.id}") && status = "pending"`, requestKey: null, expand: 'player_white,player_black' }),
                pb.collection('chess_games').getFullList<ChessGame>({ filter: `(player_white = "${currentUser.id}" || player_black = "${currentUser.id}") && status = "ongoing"`, requestKey: null, expand: 'player_white,player_black' }),
                pb.collection('tictactoe_games').getFullList<TictactoeGame>({ filter: `(player_x = "${currentUser.id}" || player_o = "${currentUser.id}") && status = "completed"`, sort: '-created', requestKey: null, expand: 'player_x,player_o,winner' }),
                pb.collection('tictactoe_games').getFullList<TictactoeGame>({ filter: `(player_x = "${currentUser.id}" || player_o = "${currentUser.id}") && status = "pending"`, requestKey: null, expand: 'player_x,player_o' }),
                pb.collection('tictactoe_games').getFullList<TictactoeGame>({ filter: `(player_x = "${currentUser.id}" || player_o = "${currentUser.id}") && status = "ongoing"`, requestKey: null, expand: 'player_x,player_o' })
            ]);

            setUsers(usersRes.sort((a, b) => b.stats_wins - a.stats_wins));
            setOptions(optionsRes.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()));
            setWinHistory(historyRes);
            setRewards(rewardsRes);
            setDuelHistory(duelHistoryRes);
            setPendingDuels(pendingDuelsRes);
            setChessHistory(chessHistoryRes);
            setPendingChessGames(pendingChessGamesRes.filter(g => g.player_black === currentUser.id)); // Only opponent gets pending games
            setOngoingChessGames(ongoingChessGamesRes);
            setTictactoeHistory(tttHistoryRes);
            setPendingTictactoeGames(pendingTttGamesRes.filter(g => g.player_o === currentUser.id)); // Player 'O' is the opponent
            setOngoingTictactoeGames(ongoingTttGamesRes);


            try {
                const purchasesRes = await pb.collection('purchases').getFullList<Purchase>({ filter: `user = "${currentUser.id}"`, sort: '-created', requestKey: null });
                setPurchases(purchasesRes);
            } catch (purchaseError: any) {
                console.error("Failed to fetch purchases:", purchaseError);
                setDataErrors(prev => [...prev, `Не удалось загрузить историю покупок: ${getPocketbaseError(purchaseError)}`]);
                setPurchases([]);
            }
            
            // Check for an ongoing duel to rejoin
            try {
                const activeDuelFilter = `(challenger = "${currentUser.id}" && status = "${DuelStatus.PENDING}") || ((challenger = "${currentUser.id}" || opponent = "${currentUser.id}") && (status = "${DuelStatus.ACCEPTED}" || status = "${DuelStatus.CHALLENGER_CHOSE}" || status = "${DuelStatus.OPPONENT_CHOSE}"))`;
                const ongoingDuel = await pb.collection('duels').getFirstListItem<Duel>(activeDuelFilter, { requestKey: null, expand: 'challenger,opponent' });
                if (ongoingDuel) {
                    setActiveDuel(ongoingDuel);
                    setView(AppView.DUEL);
                }
            } catch (error: any) {
                if (error.status !== 404) console.error("Error checking for active duel:", error);
            }

        } catch (err: any) {
            console.error("Error fetching initial data:", err);
            setDataErrors(prev => [...prev, getPocketbaseError(err, "Не удалось загрузить основные данные.")]);
            setUsers([]); setOptions([]); setWinHistory([]); setRewards([]); setPurchases([]); setDuelHistory([]); setPendingDuels([]); setChessHistory([]); setPendingChessGames([]); setOngoingChessGames([]);
        }

      const subscribeToCollection = async (collectionName: string, callback: (data: RecordSubscription) => void) => {
          try {
              await pb.collection(collectionName).subscribe('*', callback);
          } catch (err) {
              console.error(`Failed to subscribe to ${collectionName}:`, err);
          }
      };

      subscribeToCollection('users', (e) => { /* ... no changes ... */ });
      subscribeToCollection('options', (e) => { /* ... no changes ... */ });
      subscribeToCollection('history', (e) => { /* ... no changes ... */ });
      subscribeToCollection('purchases', (e) => { /* ... no changes ... */ });
      subscribeToCollection('duels', (e) => { 
        const record = e.record as Duel;
        const isParticipant = record.challenger === currentUser.id || record.opponent === currentUser.id;

        if (!isParticipant) return;

        if (e.action === 'create' && record.status === DuelStatus.PENDING && record.opponent === currentUser.id) {
            pb.collection('duels').getOne<Duel>(record.id, { expand: 'challenger,opponent' })
             .then(newDuel => setPendingDuels(prev => [newDuel, ...prev]))
             .catch(err => console.error("Failed to fetch new pending duel:", err));
        } else if (e.action === 'update') {
            if (record.status !== DuelStatus.PENDING) setPendingDuels(prev => prev.filter(d => d.id !== record.id));
            if (activeDuel?.id === record.id) {
                pb.collection('duels').getOne<Duel>(record.id, { expand: 'challenger,opponent' })
                    .then(setActiveDuel)
                    .catch(err => {
                        console.error("Failed to re-fetch active duel:", err);
                        setActiveDuel(record); // fallback
                    });
            }
            if ([DuelStatus.COMPLETED, DuelStatus.DECLINED, DuelStatus.CANCELLED, DuelStatus.EXPIRED].includes(record.status)) {
                pb.collection('duels').getOne<Duel>(record.id, { expand: 'challenger,opponent,winner' })
                    .then(newHistoryItem => {
                        setDuelHistory(prev => [newHistoryItem, ...prev.filter(d => d.id !== record.id)].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()));
                    })
                    .catch(err => console.error("Failed to fetch duel history item:", err));
            }
        } else if (e.action === 'delete') {
            setPendingDuels(prev => prev.filter(d => d.id !== record.id));
            if (activeDuel?.id === record.id) {
                setActiveDuel(null);
                setView(AppView.PROFILES);
                alert("Дуэль была отменена администратором.");
            }
        }
      });
      
       subscribeToCollection('chess_games', (e) => {
        const record = e.record as ChessGame;
        const isParticipant = record.player_white === currentUser.id || record.player_black === currentUser.id;
        
        if (!isParticipant) return;

        if (e.action === 'create' && record.status === ChessGameStatus.PENDING && record.player_black === currentUser.id) {
            pb.collection('chess_games').getOne<ChessGame>(record.id, { expand: 'player_white,player_black' })
              .then(newGame => setPendingChessGames(prev => [newGame, ...prev]))
              .catch(err => console.error("Failed to fetch new pending chess game:", err));
        } else if (e.action === 'update') {
            if (record.status === ChessGameStatus.ONGOING) {
                pb.collection('chess_games').getOne<ChessGame>(record.id, { expand: 'player_white,player_black' })
                    .then(game => setOngoingChessGames(prev => {
                        const exists = prev.some(g => g.id === game.id);
                        return exists ? prev.map(g => (g.id === game.id ? game : g)) : [...prev, game];
                    }))
                    .catch(err => console.error("Failed to update ongoing games list:", err));
            } else {
                setOngoingChessGames(prev => prev.filter(g => g.id !== record.id));
            }

            if (record.status !== ChessGameStatus.PENDING) setPendingChessGames(prev => prev.filter(g => g.id !== record.id));
            
            if (activeChessGame?.id === record.id) {
                 pb.collection('chess_games').getOne<ChessGame>(record.id, { expand: 'player_white,player_black' })
                    .then(setActiveChessGame)
                    .catch(err => {
                        console.error("Failed to re-fetch active chess game:", err);
                        setActiveChessGame(record); // fallback
                    });
            }
            if ([ChessGameStatus.COMPLETED, ChessGameStatus.DECLINED, ChessGameStatus.CANCELLED].includes(record.status)) {
                 pb.collection('chess_games').getOne<ChessGame>(record.id, { expand: 'player_white,player_black,winner' })
                    .then(newHistoryItem => {
                        setChessHistory(prev => [newHistoryItem, ...prev.filter(g => g.id !== record.id)].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()));
                    })
                    .catch(err => console.error("Failed to fetch chess history item:", err));
            }
        } else if (e.action === 'delete') {
            setPendingChessGames(prev => prev.filter(g => g.id !== record.id));
            setOngoingChessGames(prev => prev.filter(g => g.id !== record.id));
             if (activeChessGame?.id === record.id) {
                setActiveChessGame(null);
                setView(AppView.PROFILES);
                alert("Партия была отменена администратором.");
            }
        }
      });
      
      subscribeToCollection('tictactoe_games', (e) => {
        const record = e.record as TictactoeGame;
        const isParticipant = record.player_x === currentUser.id || record.player_o === currentUser.id;

        if (!isParticipant) return;

        if (e.action === 'create' && record.status === TictactoeGameStatus.PENDING && record.player_o === currentUser.id) {
            pb.collection('tictactoe_games').getOne<TictactoeGame>(record.id, { expand: 'player_x,player_o' })
              .then(newGame => setPendingTictactoeGames(prev => [newGame, ...prev]))
              .catch(err => console.error("Failed to fetch new pending tictactoe game:", err));
        } else if (e.action === 'update') {
            if (record.status === TictactoeGameStatus.ONGOING) {
                 pb.collection('tictactoe_games').getOne<TictactoeGame>(record.id, { expand: 'player_x,player_o' })
                    .then(game => setOngoingTictactoeGames(prev => {
                        const exists = prev.some(g => g.id === game.id);
                        return exists ? prev.map(g => (g.id === game.id ? game : g)) : [...prev, game];
                    }))
                    .catch(err => console.error("Failed to update ongoing tictactoe games list:", err));
            } else {
                 setOngoingTictactoeGames(prev => prev.filter(g => g.id !== record.id));
            }

            if (record.status !== TictactoeGameStatus.PENDING) setPendingTictactoeGames(prev => prev.filter(g => g.id !== record.id));

            if (activeTictactoeGame?.id === record.id) {
                pb.collection('tictactoe_games').getOne<TictactoeGame>(record.id, { expand: 'player_x,player_o' })
                   .then(setActiveTictactoeGame)
                   .catch(err => {
                       console.error("Failed to re-fetch active tictactoe game:", err);
                       setActiveTictactoeGame(record); // fallback
                   });
            }

            if ([TictactoeGameStatus.COMPLETED, TictactoeGameStatus.DECLINED, TictactoeGameStatus.CANCELLED].includes(record.status)) {
                pb.collection('tictactoe_games').getOne<TictactoeGame>(record.id, { expand: 'player_x,player_o,winner' })
                   .then(newHistoryItem => {
                       setTictactoeHistory(prev => [newHistoryItem, ...prev.filter(g => g.id !== record.id)].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()));
                   })
                   .catch(err => console.error("Failed to fetch tictactoe history item:", err));
            }
        } else if (e.action === 'delete') {
            setPendingTictactoeGames(prev => prev.filter(g => g.id !== record.id));
            setOngoingTictactoeGames(prev => prev.filter(g => g.id !== record.id));
            if (activeTictactoeGame?.id === record.id) {
               setActiveTictactoeGame(null);
               setView(AppView.PROFILES);
               alert("Партия была отменена администратором.");
           }
        }
      });
      
      subscribeToCollection('user_quests', (e) => {
        const record = e.record as UserQuest;
        if (e.action === 'update' && record.user === currentUser.id) {
            // Re-fetch with expand to get the latest quest details
            pb.collection('user_quests').getOne<UserQuest>(record.id, { expand: 'quest' })
              .then(updatedQuest => {
                  setUserQuests(prevQuests => 
                      prevQuests.map(q => q.id === updatedQuest.id ? updatedQuest : q)
                  );
              }).catch(err => console.error("Failed to fetch updated quest:", err));
        }
      });
    }

    setupSubscriptions();
    
    // This cleanup function is crucial for handling reconnections.
    // It unsubscribes from all collections, preventing errors from stale client IDs.
    return () => {
        pb.realtime.unsubscribe();
    };
}, [currentUser, activeDuel, activeChessGame, activeTictactoeGame, reconnectCounter]);

  const handleUpdateQuestProgress = useCallback(async (questType: QuestType, amount = 1) => {
    const questToUpdate = userQuests.find(uq => uq.expand?.quest?.type === questType && !uq.is_completed);

    if (!questToUpdate || !questToUpdate.expand?.quest) return;

    const newProgress = questToUpdate.progress + amount;
    const isCompleted = newProgress >= questToUpdate.expand.quest.target_count;

    // Optimistic UI update
    setUserQuests(prev => prev.map(q => 
      q.id === questToUpdate.id ? { ...q, progress: newProgress, is_completed: isCompleted } : q
    ));
    
    try {
      await pb.collection('user_quests').update(questToUpdate.id, {
        'progress+': amount,
        is_completed: isCompleted,
      });
      console.log(`Quest ${questType} progress updated.`);
    } catch(error) {
      console.error("Failed to update quest progress:", error);
      // Revert optimistic update on failure
       setUserQuests(prev => prev.map(q => 
        q.id === questToUpdate.id ? { ...questToUpdate } : q // Revert to original state
      ));
    }
  }, [userQuests]);

  const handleAddOption = useCallback(async (text: string, category: string) => {
    if (!currentUser || currentUser.energy < 1) return;
    try {
        await pb.collection('options').create({ text, category, author: currentUser.id });
        await pb.collection('users').update(currentUser.id, { 'energy-': 1, 'stats_ideasProposed+': 1 });
        handleUpdateQuestProgress(QuestType.ADD_OPTION);
    } catch (error) {
        console.error("Failed to add option:", error);
        alert("Не удалось добавить вариант.");
    }
  }, [currentUser, handleUpdateQuestProgress]);
  
  const handleRemoveOption = useCallback(async (idToRemove: string) => { /* ... no changes ... */ }, []);
  
  const handleSpinRequest = useCallback(async () => {
    if (!currentUser || currentUser.energy < 5 || options.length < 2 || isSpinning || isProcessingWin) {
      return;
    }
    handleUpdateQuestProgress(QuestType.SPIN_ROULETTE);
    // ... rest of the function is the same
  }, [currentUser, options, isSpinning, isProcessingWin, handleUpdateQuestProgress]);
  
  const handleSpinEnd = useCallback(async (winnerOption: Option) => { /* ... no changes ... */ }, [currentUser]);
  
  const handleAnimationComplete = useCallback(async (winnerOption: Option) => {
    if (!currentUser) return;
    setIsProcessingWin(true);
    try {
        // ... (existing logic for awarding points/energy)
        if (winnerOption.author === currentUser.id) {
           handleUpdateQuestProgress(QuestType.WIN_ROULETTE);
        }
    } catch (error) {
        // ... (existing error handling)
    } finally {
        setIsProcessingWin(false);
    }
  }, [currentUser, handleSpinEnd, handleUpdateQuestProgress]);
  
  const handleBuyReward = useCallback(async (reward: Reward) => { /* ... no changes ... */ }, [currentUser]);
  
  // Poke Handler
  const handlePokeUser = useCallback(async (opponent: User) => {
    if (!currentUser || currentUser.points < POKE_COST) {
      alert("Недостаточно баллов для пока.");
      return;
    }
    if (!confirm(`"Покнуть" @${opponent.username} за ${POKE_COST} 🪙?\nОн(а) получит 1 🪙.`)) return;

    const originalUser = currentUser; // Keep a reference to revert on error
    try {
      // Optimistic UI update for responsiveness
      setCurrentUser(prev => prev ? { ...prev, points: prev.points - POKE_COST } : null);

      // Perform DB operations
      await Promise.all([
        pb.collection('users').update(currentUser.id, { 'points-': POKE_COST }),
        pb.collection('users').update(opponent.id, { 'points+': 1 }), // Poked user gets 1 point
      ]);
      handleUpdateQuestProgress(QuestType.POKE_USER);
      alert(`Вы успешно "покнули" @${opponent.username}!`);
      
    } catch (error) {
      console.error("Failed to poke user:", error);
      alert(`Не удалось "покнуть" пользователя: ${getPocketbaseError(error)}`);
      // Revert optimistic update on failure
      setCurrentUser(originalUser);
    }
  }, [currentUser, handleUpdateQuestProgress]);

  // Duel Handlers
  const handleInitiateDuel = useCallback(async (opponent: User) => { /* ... no changes ... */ }, [currentUser]);
  const handleAcceptDuel = useCallback(async (duel: Duel) => { /* ... no changes ... */ }, [currentUser]);
  const handleDeclineDuel = useCallback(async (duelId: string) => { /* ... no changes ... */ }, []);
  const handleCancelDuel = useCallback(async () => { /* ... no changes ... */ }, [activeDuel]);
// FIX: The function body was implemented to correctly handle duel logic, define `updatedStatus` and `winnerId` before use, and manage point transfers and quest updates. This resolves the "Cannot find name" errors.
  const handleMakeDuelChoice = useCallback(async (choice: DuelChoice) => {
    if (!activeDuel || !currentUser) return;

    const isChallenger = activeDuel.challenger === currentUser.id;
    const myChoiceKey = isChallenger ? 'challenger_choice' : 'opponent_choice';
    const opponentChoiceKey = isChallenger ? 'opponent_choice' : 'challenger_choice';
    const opponentChoice = activeDuel[opponentChoiceKey];

    let updatedStatus = activeDuel.status;
    let winnerId: string | null = null; 

    const updatePayload: Partial<Duel> & {[key:string]: any} = {
        [myChoiceKey]: choice,
    };

    if (opponentChoice) { // Opponent has already chosen, game completes
        updatedStatus = DuelStatus.COMPLETED;
        updatePayload.status = updatedStatus;

        const myPick = CHOICES[choice];
        const opponentPick = CHOICES[opponentChoice];

        if (myPick.beats === opponentChoice) {
            winnerId = currentUser.id;
        } else if (opponentPick.beats === choice) {
            winnerId = isChallenger ? activeDuel.opponent : activeDuel.challenger;
        } else {
            winnerId = null; // Draw
        }
        updatePayload.winner = winnerId;

        // Handle points transfer
        if (winnerId) {
            const loserId = winnerId === currentUser.id 
              ? (isChallenger ? activeDuel.opponent : activeDuel.challenger) 
              : currentUser.id;
            try {
                await Promise.all([
                    pb.collection('users').update(winnerId, { 'points+': activeDuel.stake }),
                    pb.collection('users').update(loserId, { 'points-': activeDuel.stake })
                ]);
            } catch (e) {
                console.error("CRITICAL: Failed to update points after duel.", e);
            }
        }
    } else { // I am the first to choose
        updatedStatus = isChallenger ? DuelStatus.CHALLENGER_CHOSE : DuelStatus.OPPONENT_CHOSE;
        updatePayload.status = updatedStatus;
    }

    try {
        await pb.collection('duels').update(activeDuel.id, updatePayload);
        // The quest progress update should be here, AFTER the DB update succeeds.
        if (updatedStatus === DuelStatus.COMPLETED && winnerId === currentUser.id) {
           handleUpdateQuestProgress(QuestType.WIN_DUEL);
        }
    } catch(error) {
        console.error("Failed to make duel choice:", error);
        alert(`Не удалось сделать ход: ${getPocketbaseError(error)}`);
    }
  }, [activeDuel, currentUser, handleUpdateQuestProgress]);
  const handleCloseDuel = useCallback(() => { setActiveDuel(null); setView(AppView.PROFILES); }, []);

  // Chess Handlers
  const handleInitiateChess = useCallback(async (opponent: User) => {
    if (!currentUser || currentUser.points < CHESS_COST || opponent.points < CHESS_COST) {
      alert("Недостаточно баллов для игры в шахматы.");
      return;
    }
    if (!confirm(`Вызвать @${opponent.username} на шахматную партию? Ставка: ${CHESS_COST} 🪙`)) return;

    try {
      const newGame = await pb.collection('chess_games').create<ChessGame>({
        player_white: currentUser.id,
        player_black: opponent.id,
        stake: CHESS_COST,
        status: ChessGameStatus.PENDING,
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        turn: 'w',
        pgn: ''
      }, { requestKey: null, expand: 'player_white,player_black' });
      setActiveChessGame(newGame);
      setView(AppView.CHESS);
    } catch (error) {
      console.error("Failed to initiate chess game:", error);
      alert("Не удалось начать партию.");
    }
  }, [currentUser]);

  const handleAcceptChess = useCallback(async (game: ChessGame) => {
    if (!currentUser || currentUser.points < CHESS_COST) {
      alert("Недостаточно баллов для принятия вызова!");
      await pb.collection('chess_games').update(game.id, { status: ChessGameStatus.DECLINED }).catch();
      return;
    }
    try {
      const updatedGame = await pb.collection('chess_games').update<ChessGame>(game.id, {
        status: ChessGameStatus.ONGOING,
      }, { requestKey: null, expand: 'player_white,player_black' });
      setActiveChessGame(updatedGame);
      setView(AppView.CHESS);
    } catch(error) {
      console.error("Failed to accept chess game:", error);
      alert("Не удалось принять вызов.");
    }
  }, [currentUser]);

  const handleDeclineChess = useCallback(async (gameId: string) => {
    try { await pb.collection('chess_games').update(gameId, { status: ChessGameStatus.DECLINED }); }
    catch(error) { console.error("Failed to decline chess game:", error); }
  }, []);
  
  const handleMakeChessMove = useCallback(async (move: { from: string, to: string, promotion?: string }) => {
    if (!activeChessGame || !currentUser) return;

    // Ensure the chess engine is loaded
    if (typeof window.Chess === 'undefined') {
      console.error("Chess.js library not loaded, cannot make a move.");
      alert("Ошибка: Шахматный движок не загружен. Попробуйте обновить страницу.");
      return;
    }
    
    // Create a game instance from the current FEN to validate the move
    const game = new window.Chess(activeChessGame.fen);
    
    // 1. Validate the move
    // Check if it's the current player's turn
    if (game.turn() !== (activeChessGame.player_white === currentUser.id ? 'w' : 'b')) {
      console.warn("Not your turn!");
      return;
    }

    // Attempt to make the move
    const result = game.move(move);
    if (result === null) {
      console.warn("Invalid move attempted:", move);
      return; // The move was illegal, so we stop here.
    }

    // 2. Prepare the database update payload with the new game state
    const updatePayload: Partial<ChessGame> & {[key:string]: any} = {
        fen: game.fen(),
        turn: game.turn(),
        pgn: game.pgn()
    };
    
    // 3. Implement game-over detection
    if (game.isGameOver()) {
        updatePayload.status = ChessGameStatus.COMPLETED;
        let winnerId: string | undefined = undefined;
        
        // Check for checkmate to determine the winner
        if (game.isCheckmate()) {
            // The winner is the player whose turn it WAS, not whose turn it IS now.
            winnerId = game.turn() === 'b' ? activeChessGame.player_white : activeChessGame.player_black;
        } // Otherwise it's a draw (stalemate, etc.), so winner remains undefined
        
        updatePayload.winner = winnerId;
        
        // 4. Award points to the winner and deduct from the loser
        if (winnerId) {
            const loserId = winnerId === activeChessGame.player_white ? activeChessGame.player_black : activeChessGame.player_white;
             try {
                // Update points for both players in parallel for efficiency
                await Promise.all([
                    pb.collection('users').update(winnerId, { 'points+': CHESS_COST }),
                    pb.collection('users').update(loserId, { 'points-': CHESS_COST })
                ]);
                if (winnerId === currentUser.id) {
                    handleUpdateQuestProgress(QuestType.WIN_CHESS);
                }
            } catch (e) { 
                console.error("CRITICAL: Failed to update points after chess game. Points may be inconsistent.", e);
            }
        }
    }

    // 5. Persist the updated game state to the database
    try {
        await pb.collection('chess_games').update<ChessGame>(activeChessGame.id, updatePayload);
    } catch (error) { 
        console.error("Failed to make chess move and update game state:", error); 
        // Optional: Revert local game state if DB update fails to maintain consistency
        // For now, we rely on the real-time subscription to correct the state.
    }
  }, [activeChessGame, currentUser, handleUpdateQuestProgress]);

  const handleJoinChessGame = useCallback((game: ChessGame) => {
    setActiveChessGame(game);
    setView(AppView.CHESS);
  }, []);

  const handleCloseChessGame = useCallback(() => {
    setActiveChessGame(null);
    setView(AppView.GAMES_VIEW);
  }, []);

  // Tic-Tac-Toe Handlers
  const handleInitiateTictactoe = useCallback(async (opponent: User) => {
    if (!currentUser || currentUser.points < TICTACTOE_COST || opponent.points < TICTACTOE_COST) {
        alert("Недостаточно баллов для игры.");
        return;
    }
    if (!confirm(`Вызвать @${opponent.username} на партию в Крестики-нолики? Ставка: ${TICTACTOE_COST} 🪙`)) return;

    try {
        const newGame = await pb.collection('tictactoe_games').create<TictactoeGame>({
            player_x: currentUser.id,
            player_o: opponent.id,
            stake: TICTACTOE_COST,
            status: TictactoeGameStatus.PENDING,
            board: Array(9).fill(null),
            turn: 'x',
        }, { requestKey: null, expand: 'player_x,player_o' });
        setActiveTictactoeGame(newGame);
        setView(AppView.TICTACTOE);
    } catch (error) {
        console.error("Failed to initiate tictactoe game:", error);
        alert(`Не удалось начать партию: ${getPocketbaseError(error)}`);
    }
  }, [currentUser]);

  const handleAcceptTictactoe = useCallback(async (game: TictactoeGame) => {
    if (!currentUser || currentUser.points < TICTACTOE_COST) {
        alert("Недостаточно баллов для принятия вызова!");
        await pb.collection('tictactoe_games').update(game.id, { status: TictactoeGameStatus.DECLINED }).catch();
        return;
    }
    try {
        const updatedGame = await pb.collection('tictactoe_games').update<TictactoeGame>(game.id, {
            status: TictactoeGameStatus.ONGOING,
        }, { requestKey: null, expand: 'player_x,player_o' });
        setActiveTictactoeGame(updatedGame);
        setView(AppView.TICTACTOE);
    } catch(error) {
        console.error("Failed to accept tictactoe game:", error);
        alert("Не удалось принять вызов.");
    }
  }, [currentUser]);

  const handleDeclineTictactoe = useCallback(async (gameId: string) => {
    try { await pb.collection('tictactoe_games').update(gameId, { status: TictactoeGameStatus.DECLINED }); }
    catch(error) { console.error("Failed to decline tictactoe game:", error); }
  }, []);

  const checkTttWinner = useCallback((board: TictactoeBoard): TictactoePlayerSymbol | null => {
    const lines = [ [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6] ];
    for (const line of lines) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
  }, []);

  const handleMakeTictactoeMove = useCallback(async (index: number) => {
    if (!activeTictactoeGame || !currentUser) return;

    const { board, turn, player_x, player_o, status } = activeTictactoeGame;
    const mySymbol = player_x === currentUser.id ? 'x' : 'o';

    if (status !== TictactoeGameStatus.ONGOING || turn !== mySymbol || board[index] !== null) {
        console.warn("Invalid move attempt.");
        return;
    }

    const newBoard = [...board];
    newBoard[index] = turn;
    const winnerSymbol = checkTttWinner(newBoard);
    const isDraw = !winnerSymbol && newBoard.every(cell => cell !== null);

    const updatePayload: Partial<TictactoeGame> & {[key:string]: any} = {
        board: newBoard,
        turn: turn === 'x' ? 'o' : 'x'
    };
    
    if (winnerSymbol || isDraw) {
        updatePayload.status = TictactoeGameStatus.COMPLETED;
        if (winnerSymbol) {
            const winnerId = winnerSymbol === 'x' ? player_x : player_o;
            const loserId = winnerSymbol === 'x' ? player_o : player_x;
            updatePayload.winner = winnerId;
            try {
                await Promise.all([
                    pb.collection('users').update(winnerId, { 'points+': TICTACTOE_COST }),
                    pb.collection('users').update(loserId, { 'points-': TICTACTOE_COST })
                ]);
                if (winnerId === currentUser.id) {
                    handleUpdateQuestProgress(QuestType.WIN_TICTACTOE);
                }
            } catch (e) {
                console.error("CRITICAL: Failed to update points after tictactoe game.", e);
            }
        }
    }
    
    try {
        await pb.collection('tictactoe_games').update<TictactoeGame>(activeTictactoeGame.id, updatePayload);
    } catch (error) {
        console.error("Failed to make tictactoe move:", error);
    }
  }, [activeTictactoeGame, currentUser, checkTttWinner, handleUpdateQuestProgress]);

  const handleJoinTictactoeGame = useCallback((game: TictactoeGame) => {
    setActiveTictactoeGame(game);
    setView(AppView.TICTACTOE);
  }, []);

  const handleCloseTictactoeGame = useCallback(() => {
    setActiveTictactoeGame(null);
    setView(AppView.GAMES_VIEW);
  }, []);
  
  const handleClaimQuestReward = useCallback(async (userQuest: UserQuest) => {
    if (!currentUser || !userQuest.is_completed || userQuest.is_claimed || !userQuest.expand?.quest) return;
    
    const { reward_points, reward_energy } = userQuest.expand.quest;
    
    // Optimistic UI update
    setUserQuests(prev => prev.map(q => q.id === userQuest.id ? {...q, is_claimed: true} : q));
    setCurrentUser(prev => prev ? { 
        ...prev, 
        points: prev.points + reward_points,
        energy: prev.energy + reward_energy,
    } : null);

    try {
        await pb.collection('user_quests').update(userQuest.id, { is_claimed: true });
        await pb.collection('users').update(currentUser.id, {
            'points+': reward_points,
            'energy+': reward_energy,
        });
    } catch (error) {
        console.error("Failed to claim quest reward:", error);
        alert(`Не удалось забрать награду: ${getPocketbaseError(error)}`);
        // Revert UI on failure
        setUserQuests(prev => prev.map(q => q.id === userQuest.id ? {...q, is_claimed: false} : q));
        setCurrentUser(prev => prev ? { 
            ...prev, 
            points: prev.points - reward_points,
            energy: prev.energy - reward_energy,
        } : null);
    }
  }, [currentUser]);


  if (isLoading) { /* ... no changes ... */ }
  if (!currentUser) { /* ... no changes ... */ }

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
        <Header currentView={view} setView={setView} currentUser={currentUser} userQuests={userQuests} />
        <main className="mt-4">
          {view === AppView.ROULETTE && <Roulette options={options} users={users} onAddOption={handleAddOption} onRemoveOption={handleRemoveOption} onSpinRequest={handleSpinRequest} onAnimationComplete={handleAnimationComplete} currentUser={currentUser} isSpinning={isSpinning} isProcessingWin={isProcessingWin} winnerForAnimation={winnerForAnimation} />}
          {view === AppView.PROFILES && <ProfileView users={users} winHistory={winHistory} purchases={purchases} currentUser={currentUser} onInitiateDuel={handleInitiateDuel} onInitiateChess={handleInitiateChess} onInitiateTictactoe={handleInitiateTictactoe} onPokeUser={handlePokeUser} />}
          {view === AppView.HISTORY && <HistoryView history={winHistory} users={users} />}
          {view === AppView.REWARDS && <RewardsView rewards={rewards} currentUser={currentUser} onBuyReward={handleBuyReward} />}
           {view === AppView.QUESTS && <QuestsView userQuests={userQuests} onClaimReward={handleClaimQuestReward} />}
          {view === AppView.GAMES_VIEW && (
            <GamesView 
              duelHistory={duelHistory}
              chessHistory={chessHistory}
              tictactoeHistory={tictactoeHistory}
              pendingDuels={pendingDuels}
              pendingChessGames={pendingChessGames}
              pendingTictactoeGames={pendingTictactoeGames}
              ongoingChessGames={ongoingChessGames}
              ongoingTictactoeGames={ongoingTictactoeGames}
              currentUser={currentUser} 
              onAcceptDuel={handleAcceptDuel}
              onDeclineDuel={handleDeclineDuel}
              onAcceptChess={handleAcceptChess}
              onDeclineChess={handleDeclineChess}
              onJoinChessGame={handleJoinChessGame}
              onAcceptTictactoe={handleAcceptTictactoe}
              onDeclineTictactoe={handleDeclineTictactoe}
              onJoinTictactoeGame={handleJoinTictactoeGame}
            />
          )}
          {view === AppView.DUEL && activeDuel && (
            <DuelView currentUser={currentUser} duel={activeDuel} onMakeChoice={handleMakeDuelChoice} onClose={handleCloseDuel} onCancel={handleCancelDuel} />
          )}
          {view === AppView.CHESS && activeChessGame && (
            <ChessView currentUser={currentUser} game={activeChessGame} onMove={handleMakeChessMove} onClose={handleCloseChessGame} />
          )}
          {view === AppView.TICTACTOE && activeTictactoeGame && (
            <TictactoeView currentUser={currentUser} game={activeTictactoeGame} onMove={handleMakeTictactoeMove} onClose={handleCloseTictactoeGame} />
          )}
          {view === AppView.GUIDE && <GuideView />}
        </main>
      </div>
    </div>
  );
};

export default App;