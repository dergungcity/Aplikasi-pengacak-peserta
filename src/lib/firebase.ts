import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Tournament, UserAuth } from '../types';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with custom databaseId if configured
let dbInstance: Firestore;
if (firebaseConfig.firestoreDatabaseId) {
  dbInstance = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
} else {
  dbInstance = getFirestore(app);
}
export const db = dbInstance;

const USER_DISPLAY_NAME_KEY = 'pengacak_user_display_name';
const LOCAL_SESSION_UID_KEY = 'pengacak_local_session_uid';

export function getOrCreateLocalUid(): string {
  let uid = localStorage.getItem(LOCAL_SESSION_UID_KEY);
  if (!uid) {
    uid = 'local_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem(LOCAL_SESSION_UID_KEY, uid);
  }
  return uid;
}

export function mapFirebaseUser(user: User | null): UserAuth | null {
  if (!user) {
    const savedName = localStorage.getItem(USER_DISPLAY_NAME_KEY);
    if (savedName) {
      return {
        uid: getOrCreateLocalUid(),
        email: null,
        displayName: savedName,
        photoURL: null,
        isAnonymous: true
      };
    }
    return null;
  }
  const savedName = localStorage.getItem(USER_DISPLAY_NAME_KEY);
  const displayName = user.displayName || savedName || (user.isAnonymous ? 'Panitia Sesi' : (user.email?.split('@')[0] || 'Pengguna'));
  return {
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous
  };
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return mapFirebaseUser(result.user);
  } catch (error) {
    console.warn('Google Sign-In Notice:', error);
    throw error;
  }
}

/**
 * Login Tanpa Email: Masuk menggunakan Nama Pengguna / Nama Panitia / Juri
 * Tanpa perlu repot mengetik alamat email atau verifikasi.
 */
export async function loginWithUsername(username: string, pin?: string): Promise<UserAuth | null> {
  const cleanName = username.trim() || 'Panitia Acara';
  localStorage.setItem(USER_DISPLAY_NAME_KEY, cleanName);
  if (pin) {
    localStorage.setItem(`pengacak_pin_${cleanName.toLowerCase()}`, pin);
  }

  try {
    let currentUser = auth.currentUser;
    if (!currentUser) {
      const res = await signInAnonymously(auth);
      currentUser = res.user;
    }

    if (currentUser) {
      try {
        await updateProfile(currentUser, { displayName: cleanName });
      } catch (e) {
        console.warn('Could not update displayName on auth object:', e);
      }
      return mapFirebaseUser(currentUser);
    }
  } catch (authError) {
    console.warn('Firebase Anonymous Auth fallback to local session:', authError);
  }

  // Fallback to resilient local session
  return {
    uid: getOrCreateLocalUid(),
    email: null,
    displayName: cleanName,
    photoURL: null,
    isAnonymous: true
  };
}

export async function loginWithEmail(email: string, pass: string) {
  const res = await signInWithEmailAndPassword(auth, email, pass);
  return mapFirebaseUser(res.user);
}

export async function registerWithEmail(email: string, pass: string) {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  return mapFirebaseUser(res.user);
}

export async function loginAsGuest(customName?: string): Promise<UserAuth | null> {
  const cleanName = customName?.trim() || localStorage.getItem(USER_DISPLAY_NAME_KEY) || 'Panitia Sesi';
  localStorage.setItem(USER_DISPLAY_NAME_KEY, cleanName);

  try {
    let currentUser = auth.currentUser;
    if (!currentUser) {
      const res = await signInAnonymously(auth);
      currentUser = res.user;
    }

    if (currentUser) {
      try {
        await updateProfile(currentUser, { displayName: cleanName });
      } catch (e) {
        console.warn('Could not update displayName:', e);
      }
      return mapFirebaseUser(currentUser);
    }
  } catch (authError) {
    console.warn('Firebase Anonymous Auth fallback to local session:', authError);
  }

  // Fallback to local session
  return {
    uid: getOrCreateLocalUid(),
    email: null,
    displayName: cleanName,
    photoURL: null,
    isAnonymous: true
  };
}

export async function logoutUser() {
  localStorage.removeItem(USER_DISPLAY_NAME_KEY);
  try {
    await fbSignOut(auth);
  } catch (e) {
    console.warn('Sign out warning:', e);
  }
}

// Firestore operations with resilient fallback
export async function saveTournamentToFirestore(tournament: Tournament): Promise<void> {
  if (!tournament.id) return;
  try {
    const tournamentRef = doc(db, 'tournaments', tournament.id);
    const dataToSave = {
      ...tournament,
      updatedAt: new Date().toISOString()
    };
    await setDoc(tournamentRef, dataToSave, { merge: true });
  } catch (error) {
    console.warn('Firestore sync note (persisted locally):', error);
  }
}

export async function deleteTournamentFromFirestore(tournamentId: string): Promise<void> {
  try {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    await deleteDoc(tournamentRef);
  } catch (error) {
    console.warn('Firestore delete note:', error);
  }
}

export async function fetchUserTournaments(userId: string): Promise<Tournament[]> {
  try {
    const q = query(collection(db, 'tournaments'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const results: Tournament[] = [];
    querySnapshot.forEach((docSnap) => {
      results.push(docSnap.data() as Tournament);
    });
    return results;
  } catch (error) {
    console.warn('Firestore fetch note:', error);
    return [];
  }
}

export function subscribeToUserTournaments(userId: string, callback: (tournaments: Tournament[]) => void) {
  try {
    const q = query(collection(db, 'tournaments'), where('userId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const tournaments: Tournament[] = [];
      snapshot.forEach((docSnap) => {
        tournaments.push(docSnap.data() as Tournament);
      });
      tournaments.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      callback(tournaments);
    }, (err) => {
      console.warn('Firestore subscription fallback:', err);
    });
  } catch (e) {
    console.warn('Firestore subscribe initialization notice:', e);
    return () => {};
  }
}
