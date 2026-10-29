import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  getDocFromServer,
  DocumentData,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const safeStorage = {
  getItem(key: string): string | null {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore storage quota or private-mode errors
    }
  },
};

const parseCachedLeaderboard = (): LeaderboardEntry[] => {
  try {
    const raw = safeStorage.getItem('maxfliz_cached_leaderboard');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const normalizeLeaderboardEntry = (
  data: Partial<LeaderboardEntry> & { id?: string },
  fallbackId?: string
): LeaderboardEntry => ({
  id: data.id || fallbackId,
  playerName: String(data.playerName || 'Magazynier').slice(0, 32),
  hero: String(data.hero || 'Marcin'),
  score: Number(data.score) || 0,
  coins: Number(data.coins) || 0,
  timeSeconds: Number(data.timeSeconds) || 0,
  bossDefeated: Boolean(data.bossDefeated),
  createdAt: String(data.createdAt || new Date().toISOString()),
});

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting the specific provisioned database ID with forced long polling & disabled fetch streams.
// This prevents the 10-second backend timeout error in iframe, sandbox, and Cloud Run proxy environments.
const firestoreSettings = {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
};

export const db = (firebaseConfig as any).firestoreDatabaseId
  ? initializeFirestore(
      app,
      firestoreSettings,
      (firebaseConfig as any).firestoreDatabaseId
    )
  : initializeFirestore(app, firestoreSettings);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export interface LeaderboardEntry {
  id?: string;
  playerName: string;
  hero: string;
  score: number;
  coins: number;
  timeSeconds: number;
  bossDefeated: boolean;
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.warn('Firestore Error Handled:', JSON.stringify(errInfo));
  return errInfo;
}

let currentUser: User | null = null;
let isAuthInitialized = false;
let authPromise: Promise<User | null> | null = null;

// Ensure anonymous sign-in for seamless leaderboard attribution
export function initAuth(): Promise<User | null> {
  if (authPromise) return authPromise;

  authPromise = new Promise((resolve) => {
    if (isAuthInitialized && currentUser) {
      resolve(currentUser);
      return;
    }

    const finish = (user: User | null) => {
      currentUser = user;
      isAuthInitialized = true;
      resolve(user);
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
        finish(user);
        return;
      }

      signInAnonymously(auth)
        .then((cred) => finish(cred.user))
        .catch((err) => {
          if (err?.code === 'auth/admin-restricted-operation') {
            console.warn(
              'CRITICAL: Anonymous Authentication is disabled in your Firebase project. ' +
              'Please enable it in the Firebase Console (Authentication > Sign-in method) ' +
              'to allow leaderboard tracking. Fallback to guest mode active.'
            );
          } else {
            console.warn('Anonymous auth note (fallback to guest mode):', err);
          }
          finish(null);
        });
    });
  });

  return authPromise;
}

export async function ensureLeaderboardServices(): Promise<void> {
  try {
    await initAuth();
    await testFirestoreConnection();
  } catch (error) {
    console.warn('Leaderboard service warm-up skipped:', error);
  }
}

// Test connection on boot per guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const probeDoc = doc(db, 'test', 'connection');
    await getDocFromServer(probeDoc);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline fallback active: Please check your Firebase configuration or internet connection.');
      return false;
    }
    const err = error as { code?: string; message?: string };
    if (err && (err.code === 'not-found' || err.code === 'permission-denied')) {
      return true;
    }
    console.warn('Firestore probe note:', err?.message || error);
    return false;
  }
}

/**
 * Submit high score to Max-Fliz public leaderboard
 */
export async function submitScore(entry: Omit<LeaderboardEntry, 'createdAt'>): Promise<string> {
  const collectionPath = 'leaderboard';
  const cleanId = `mf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const payload: LeaderboardEntry = {
    playerName: String(entry.playerName || 'Pracownik Magazynu').trim().slice(0, 32) || 'Pracownik Magazynu',
    hero: String(entry.hero || 'Marcin'),
    score: Math.max(0, Math.floor(entry.score)),
    coins: Math.max(0, Math.floor(entry.coins)),
    timeSeconds: Math.max(0, Math.floor(entry.timeSeconds)),
    bossDefeated: Boolean(entry.bossDefeated),
    createdAt: new Date().toISOString(),
  };

  try {
    const cached = parseCachedLeaderboard();
    const nextList = [...cached, { ...payload, id: cleanId }]
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 20);

    safeStorage.setItem('maxfliz_cached_leaderboard', JSON.stringify(nextList));
  } catch {
    // ignore caching errors
  }

  try {
    const docRef = doc(db, collectionPath, cleanId);
    await setDoc(docRef, payload);
    return cleanId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionPath}/${cleanId}`);
    return `local_${Date.now()}`;
  }
}

/**
 * Fetch top shift high scores from Firebase with graceful local cache fallback
 */
export async function getTopLeaderboard(maxEntries = 10): Promise<LeaderboardEntry[]> {
  const collectionPath = 'leaderboard';

  try {
    const q = query(collection(db, collectionPath), orderBy('score', 'desc'), limit(maxEntries));
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((d) => {
      const data = d.data() as DocumentData;
      return normalizeLeaderboardEntry(
        {
          id: d.id,
          playerName: data.playerName,
          hero: data.hero,
          score: data.score,
          coins: data.coins,
          timeSeconds: data.timeSeconds,
          bossDefeated: data.bossDefeated,
          createdAt: data.createdAt,
        },
        d.id
      );
    });

    if (results.length > 0) {
      safeStorage.setItem('maxfliz_cached_leaderboard', JSON.stringify(results));
      return results;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, collectionPath);
  }

  const cached = parseCachedLeaderboard();
  if (cached.length > 0) {
    return cached
      .map((item) => normalizeLeaderboardEntry(item, item.id))
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, maxEntries);
  }

  return [];
}
