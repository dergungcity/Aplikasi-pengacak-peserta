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
  limit,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Tournament, UserAuth } from '../types';
import { generateShareCode } from './presets';

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
const ACCESSED_TOURNAMENTS_KEY = 'pengacak_synced_tournament_ids';

export function getOrCreateLocalUid(): string {
  let uid = localStorage.getItem(LOCAL_SESSION_UID_KEY);
  if (!uid) {
    uid = 'local_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem(LOCAL_SESSION_UID_KEY, uid);
  }
  return uid;
}

export function getAccessedTournamentIds(): string[] {
  try {
    const raw = localStorage.getItem(ACCESSED_TOURNAMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Could not read accessed tournaments:', e);
  }
  return [];
}

export function addAccessedTournamentId(id: string): void {
  if (!id) return;
  try {
    const current = getAccessedTournamentIds();
    if (!current.includes(id)) {
      const updated = [id, ...current].slice(0, 30);
      localStorage.setItem(ACCESSED_TOURNAMENTS_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.warn('Could not persist accessed tournament id:', e);
  }
}

export function removeAccessedTournamentId(id: string): void {
  try {
    const current = getAccessedTournamentIds();
    const updated = current.filter(item => item !== id);
    localStorage.setItem(ACCESSED_TOURNAMENTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not remove accessed tournament id:', e);
  }
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
    const dataToSave: Tournament = {
      ...tournament,
      shareCode: tournament.shareCode || generateShareCode(),
      panitiaName: tournament.panitiaName || localStorage.getItem(USER_DISPLAY_NAME_KEY) || 'Panitia',
      updatedAt: new Date().toISOString()
    };
    await setDoc(tournamentRef, dataToSave, { merge: true });
    addAccessedTournamentId(tournament.id);
  } catch (error) {
    console.warn('Firestore sync note (persisted locally):', error);
  }
}

export async function deleteTournamentFromFirestore(tournamentId: string): Promise<void> {
  try {
    removeAccessedTournamentId(tournamentId);
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    await deleteDoc(tournamentRef);
  } catch (error) {
    console.warn('Firestore delete note:', error);
  }
}

/**
 * Fetch a tournament directly by its Document ID (cross-device)
 */
export async function fetchTournamentById(tournamentId: string): Promise<Tournament | null> {
  if (!tournamentId) return null;
  try {
    const tournamentRef = doc(db, 'tournaments', tournamentId.trim());
    const snap = await getDoc(tournamentRef);
    if (snap.exists()) {
      const data = snap.data() as Tournament;
      addAccessedTournamentId(data.id);
      return data;
    }
  } catch (e) {
    console.warn('Error fetching tournament by ID:', e);
  }
  return null;
}

/**
 * Fetch a tournament by its 6-digit Share/Sync Code (e.g. TRN-8921)
 */
export async function fetchTournamentByCode(code: string): Promise<Tournament | null> {
  const cleanCode = code.trim().toUpperCase();
  if (!cleanCode) return null;

  try {
    // 1. Try finding by shareCode field
    const q = query(collection(db, 'tournaments'), where('shareCode', '==', cleanCode), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const data = querySnapshot.docs[0].data() as Tournament;
      addAccessedTournamentId(data.id);
      return data;
    }

    // 2. Try direct ID match if user pasted an ID
    const directDoc = await fetchTournamentById(cleanCode);
    if (directDoc) return directDoc;
    const lowerDoc = await fetchTournamentById(code.trim());
    if (lowerDoc) return lowerDoc;

  } catch (e) {
    console.warn('Error fetching tournament by code:', e);
  }
  return null;
}

/**
 * Search cloud database for tournaments by keyword (title, category, panitia)
 */
export async function searchTournamentsInCloud(searchTerm: string): Promise<Tournament[]> {
  const clean = searchTerm.trim().toLowerCase();
  if (!clean) return [];

  try {
    const q = query(collection(db, 'tournaments'), limit(50));
    const querySnapshot = await getDocs(q);
    const results: Tournament[] = [];
    querySnapshot.forEach((docSnap) => {
      const t = docSnap.data() as Tournament;
      if (
        t.name?.toLowerCase().includes(clean) ||
        t.shareCode?.toLowerCase().includes(clean) ||
        t.category?.toLowerCase().includes(clean) ||
        t.panitiaName?.toLowerCase().includes(clean) ||
        t.id?.toLowerCase().includes(clean)
      ) {
        results.push(t);
      }
    });
    return results;
  } catch (e) {
    console.warn('Error searching tournaments in cloud:', e);
    return [];
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

/**
 * Real-time subscription across devices:
 * Listens to tournaments owned by the user, matching the panitia name, OR listed in accessed IDs.
 */
export function subscribeToUserTournaments(
  userId: string, 
  panitiaName: string | null | undefined,
  callback: (tournaments: Tournament[]) => void
) {
  try {
    // 1. Listen to userId queries
    const qUser = query(collection(db, 'tournaments'), where('userId', '==', userId));
    
    // Also listen to general tournament updates
    const unsubscribe = onSnapshot(collection(db, 'tournaments'), (snapshot) => {
      const accessedIds = getAccessedTournamentIds();
      const cleanPanitia = panitiaName?.trim().toLowerCase();
      const tournamentsMap = new Map<string, Tournament>();

      snapshot.forEach((docSnap) => {
        const t = docSnap.data() as Tournament;
        const matchesUser = t.userId === userId;
        const matchesAccessed = accessedIds.includes(t.id);
        const matchesPanitia = cleanPanitia && t.panitiaName?.toLowerCase() === cleanPanitia;

        if (matchesUser || matchesAccessed || matchesPanitia) {
          tournamentsMap.set(t.id, t);
        }
      });

      const tournamentsList = Array.from(tournamentsMap.values());
      tournamentsList.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      
      callback(tournamentsList);
    }, (err) => {
      console.warn('Firestore snapshot subscription warning:', err);
    });

    return unsubscribe;
  } catch (e) {
    console.warn('Firestore subscribe initialization notice:', e);
    return () => {};
  }
}
