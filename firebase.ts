import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// =================================================================
// ВАЖНО: СКОПИРУЙТЕ СЮДА ВАШ ОБЪЕКТ firebaseConfig 
// ИЗ КОНСОЛИ FIREBASE (Настройки проекта -> Общие -> Ваши приложения)
// =================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR-PROJECT-ID.firebaseapp.com",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-PROJECT-ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Экспорт инстанса Firestore для использования в приложении
export const db = getFirestore(app);
