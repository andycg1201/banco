import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA_-WxMPUo_WOT9Cdr8l0jJEWqNm7MZch8",
  authDomain: "banco-bf50b.firebaseapp.com",
  projectId: "banco-bf50b",
  storageBucket: "banco-bf50b.firebasestorage.app",
  messagingSenderId: "955381125972",
  appId: "1:955381125972:web:b025764d9b24d7a08e2ec1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
