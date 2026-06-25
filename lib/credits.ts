import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { auth } from './firebase';

export const getDb = () => getFirestore();

export const getUserCredits = async (userId: string): Promise<number> => {
  const db = getFirestore();
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data().credits || 0;
  } else {
    // New user, give 3 free credits
    await setDoc(userRef, { credits: 3 });
    return 3;
  }
};

export const deductCredit = async (userId: string): Promise<boolean> => {
  const db = getFirestore();
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists() && userSnap.data().credits > 0) {
    await updateDoc(userRef, {
      credits: increment(-1)
    });
    return true;
  }
  return false;
};

export const addCredits = async (userId: string, amount: number): Promise<void> => {
  const db = getFirestore();
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    await updateDoc(userRef, {
      credits: increment(amount)
    });
  } else {
    await setDoc(userRef, { credits: amount + 3 }); // 3 free + amount
  }
};
