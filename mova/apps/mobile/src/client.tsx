import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Exercise, Program, Preferences } from '@mova/domain';
export type Me = {
  id: string;
  role: string;
  profile: { nickname: string; bio: string };
  preferences: Preferences | null;
  points: number;
  ledger: { amount: number; reason: string; created_at: string }[];
};
export type SetLog = { exerciseId: string; index: number; reps: number; weight: number };
export type Workout = {
  id: string;
  program_id: string;
  snapshot: Program & {
    week?: number;
    ordinal?: number;
    totalSessions?: number;
    maintenance?: boolean;
  };
  revision: number;
  started_at: string;
  completed_at: string | null;
  sets: SetLog[];
};
export type Stats = {
  sessions: number;
  sets: number;
  activeDays: number;
  calendar: { day: string; sessions: number }[];
  previous: { id: string; completed_at: string; performance: SetLog }[];
};
export type Challenge = {
  id: string;
  title: string;
  description: string;
  weeks: number;
  weekly_goal: number;
  joined_at: string | null;
  progress: { periods: number[]; currentPeriod: number; complete: boolean; ended: boolean } | null;
};
export type ProgramProgress = {
  completed: number;
  total: number;
  week: number;
  ordinal: number;
  maintenance: boolean;
  reps: number;
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export type Catalog = { exercises: Exercise[]; programs: Program[] };
export type Post = {
  group_id?: string | null;
  id: string;
  user_id: string;
  body: string;
  nickname: string;
  created_at: string;
  likes: number;
  liked: boolean;
  following: boolean;
};
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 15000 }, mutations: { retry: 0 } },
});
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
const Context = createContext<{
  token: string | null;
  ready: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  request: <T>(path: string, body?: unknown, method?: string) => Promise<T>;
}>(null!);
const vault = {
  get: async () => (Platform.OS === 'web' ? null : SecureStore.getItemAsync('mova-session')),
  set: async (t: string) => {
    if (Platform.OS !== 'web') await SecureStore.setItemAsync('mova-session', t);
  },
  clear: async () => {
    if (Platform.OS !== 'web') await SecureStore.deleteItemAsync('mova-session');
  },
};
export function Providers({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null),
    [ready, setReady] = useState(false);
  useEffect(() => {
    vault
      .get()
      .then(setToken)
      .finally(() => setReady(true));
  }, []);
  async function signIn(t: string) {
    await vault.set(t);
    queryClient.clear();
    setToken(t);
  }
  async function signOut() {
    await vault.clear();
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('mova-draft:'));
    if (keys.length) await AsyncStorage.multiRemove(keys);
    setToken(null);
    queryClient.clear();
  }
  async function request<T>(
    path: string,
    body?: unknown,
    method = body === undefined ? 'GET' : 'POST',
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${apiUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      });
    } catch {
      throw new Error(
        'Connexion interrompue. Tes séries locales sont conservées ; réessaie lorsque le réseau revient.',
      );
    }
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && path === '/me' && method === 'GET') await signOut();
      throw new ApiError(data.message ?? 'Une erreur est survenue.', response.status);
    }
    return data as T;
  }
  return (
    <QueryClientProvider client={queryClient}>
      <Context.Provider value={{ token, ready, signIn, signOut, request }}>
        {children}
      </Context.Provider>
    </QueryClientProvider>
  );
}
export const useApi = () => useContext(Context);
