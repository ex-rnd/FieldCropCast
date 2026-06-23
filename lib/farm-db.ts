import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { FarmState } from './types';

export async function loadFarmFromFirebase(email: string): Promise<FarmState | null> {
  try {
    const snap = await getDoc(doc(db, 'farmers', email));
    return snap.exists() ? (snap.data() as FarmState) : null;
  } catch {
    return null;
  }
}

export async function saveFarmToFirebase(email: string, farm: FarmState): Promise<void> {
  await setDoc(doc(db, 'farmers', email), farm, { merge: true });
}
