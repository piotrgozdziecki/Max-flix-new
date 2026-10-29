import { initializeApp, getApps, getApp } from 'firebase/app';
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

// Singleton Pattern for Firebase Services
class FirebaseServicesSingleton {
  private static instance: FirebaseServicesSingleton;
  public app: ReturnType<typeof initializeApp>;
  public db: ReturnType<typeof initializeFirestore>;
  public auth: ReturnType<typeof getAuth>;

  private constructor() {
    const existingApps = getApps();
    this.app = existingApps.length ? getApp() : initializeApp(firebaseConfig);

    const firestoreSettings = {
      experimentalForceLongPolling: true,
      useFetchStreams: false,
    };

    const databaseId = (firebaseConfig as any).firestoreDatabaseId;
    if (databaseId) {
      this.db = initializeFirestore(this.app, firestoreSettings, databaseId);
    } else {
      this.db = initializeFirestore(this.app, firestoreSettings);
    }

    this.auth = getAuth(this.app);
  }

  public static getInstance(): FirebaseServicesSingleton {
    if (!FirebaseServicesSingleton.instance) {
      FirebaseServicesSingleton.instance = new FirebaseServicesSingleton();
    }
    return FirebaseServicesSingleton.instance;
  }
}

const firebaseServices = FirebaseServicesSingleton.getInstance();

export const app = firebaseServices.app;
export const db = firebaseServices.db;
export const auth = firebaseServices.auth;
export const getFirebaseInstance = () => FirebaseServicesSingleton.getInstance();



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
  const errCode = (error as { code?: string })?.code || 'unknown_code';
  const errMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  console.error(
    `%c[Firebase:Firestore:ERROR] ❌ Błąd operacji [${operationType.toUpperCase()}] na ścieżce '${path || 'root'}':\n` +
      `  • Kod błędu: ${errCode}\n` +
      `  • Komunikat: ${errMessage}\n` +
      `  • Użytkownik: ${errInfo.authInfo.userId ? `${errInfo.authInfo.userId} (Anonimowy: ${errInfo.authInfo.isAnonymous})` : 'Gość / Niezalogowany'}\n` +
      `  • Czas: ${new Date().toLocaleString('pl-PL')}`,
    'color: #ef4444; font-weight: bold;',
    { details: errInfo, stack }
  );

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
      if (user) {
        console.log(`[Firebase:Auth] 🟢 Zalogowano użytkownika Firestore (UID: ${user.uid}, Anonimowy: ${user.isAnonymous}).`);
      } else {
        console.warn('[Firebase:Auth] ⚠️ Rejestracja anonimowa pominięta - aktywny tryb gościa.');
      }
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
              '[Firebase:Auth] ⚠️ UWAGA: Logowanie anonimowe jest wyłączone w Twoim projekcie Firebase (auth/admin-restricted-operation). ' +
              'Aktywowano płynny tryb gościa.'
            );
          } else {
            console.warn('[Firebase:Auth] ⚠️ Błąd logowania anonimowego:', err);
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
    console.warn('[Firebase:Init] ⚠️ Podgrzewanie połączenia pominięte:', error);
  }
}

// Test connection on boot per guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  const targetDoc = 'test/connection';
  const startTime = performance.now();

  try {
    const probeDoc = doc(db, 'test', 'connection');
    await getDocFromServer(probeDoc);
    const duration = Math.round(performance.now() - startTime);
    console.log(`[Firebase:Firestore] 🟢 Próba połączenia z bazą zakończona sukcesem (${duration} ms). Target: '${targetDoc}'.`);
    return true;
  } catch (error: unknown) {
    const duration = Math.round(performance.now() - startTime);
    const errCode = (error as { code?: string })?.code || 'unknown_code';
    const errMessage = error instanceof Error ? error.message : String(error);

    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn(`[Firebase:Firestore] ⚠️ Klient jest offline (${duration} ms). Brak odpowiedzi od serwera.`);
      return false;
    }
    if (errCode === 'not-found' || errCode === 'permission-denied') {
      console.log(`[Firebase:Firestore] 🟢 Odpowiedź serwera Firestore odebrana ('${errCode}', ${duration} ms) -> Połączenie aktywne.`);
      return true;
    }
    console.error(
      `[Firebase:Firestore] ❌ Błąd próby połączenia (${duration} ms):\n` +
      `  • Kod: ${errCode}\n` +
      `  • Komunikat: ${errMessage}\n` +
      `  • Czas: ${new Date().toLocaleString('pl-PL')}`
    );
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

  console.log(`[Firebase:Leaderboard] 📤 Wysyłanie wyniku '${payload.playerName}' (${payload.score} pkt) do '${collectionPath}/${cleanId}'...`);

  try {
    const cached = parseCachedLeaderboard();
    const nextList = [...cached, { ...payload, id: cleanId }]
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 20);

    safeStorage.setItem('maxfliz_cached_leaderboard', JSON.stringify(nextList));
  } catch (err) {
    console.warn('[Firebase:Cache] ⚠️ Błąd buforowania wyniku lokalnego:', err);
  }

  try {
    const docRef = doc(db, collectionPath, cleanId);
    await setDoc(docRef, payload);
    console.log(`[Firebase:Leaderboard] ✅ Wynik gracza '${payload.playerName}' zapisan pomyślnie w Firestore!`);
    return cleanId;
  } catch (err) {
    console.error(`[Firebase:Leaderboard] ❌ Nie udało się zapisać wyniku w Firestore. Logowanie diagnostyczne...`);
    handleFirestoreError(err, OperationType.WRITE, `${collectionPath}/${cleanId}`);
    return `local_${Date.now()}`;
  }
}

/**
 * Fetch top shift high scores from Firebase with graceful local cache fallback
 */
export async function getTopLeaderboard(maxEntries = 10): Promise<LeaderboardEntry[]> {
  const collectionPath = 'leaderboard';
  console.log(`[Firebase:Leaderboard] 📥 Pobieranie TOP ${maxEntries} wyników z kolekcji '${collectionPath}'...`);

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

    console.log(`[Firebase:Leaderboard] ✅ Pobrano ${results.length} wyników bezpośrednio z Firestore.`);

    if (results.length > 0) {
      safeStorage.setItem('maxfliz_cached_leaderboard', JSON.stringify(results));
      return results;
    }
  } catch (err) {
    console.error(`[Firebase:Leaderboard] ❌ Błąd pobierania rankingu z Firestore (przełączanie na lokalny bufor)...`);
    handleFirestoreError(err, OperationType.LIST, collectionPath);
  }

  const cached = parseCachedLeaderboard();
  if (cached.length > 0) {
    console.log(`[Firebase:Leaderboard] ℹ️ Odczytano ${cached.length} zapamiętanych wyników z lokalnej pamięci (offline mode).`);
    return cached
      .map((item) => normalizeLeaderboardEntry(item, item.id))
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, maxEntries);
  }

  return [];
}
