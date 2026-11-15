import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Address, Order, User } from '@/lib/types';

export type { Address, Order, OrderLine, User, OrderStatus } from '@/lib/types';

type Result = { error?: string };

type AccountValue = {
  user: User | null;
  ready: boolean;
  signUp: (name: string, email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  updateProfile: (patch: { name: string }) => Promise<Result>;
  saveAddress: (address: Address) => Promise<Result>;
  removeAddress: (id: string) => Promise<Result>;
  refresh: () => Promise<void>;
};

const AccountContext = createContext<AccountValue | null>(null);

type ApiResponse = { user?: User | null; error?: string };

async function call(
  url: string,
  init?: RequestInit
): Promise<ApiResponse & { ok: boolean }> {
  try {
    const response = await fetch(url, {
      credentials: 'same-origin',
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      ...init,
    });
    const data = (await response.json().catch(() => ({}))) as ApiResponse;
    return { ...data, ok: response.ok };
  } catch {
    return { ok: false, error: 'We could not reach the server. Check your connection.' };
  }
}

export function displayName(user: User): string {
  return user.name.trim().split(/\s+/)[0] || user.email;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const result = await call('/api/auth/me');
    if (result.ok) setUser(result.user ?? null);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signUp = useCallback(async (name: string, email: string, password: string): Promise<Result> => {
    const result = await call('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (!result.ok || !result.user) return { error: result.error ?? 'Could not create your account.' };
    setUser(result.user);
    setReady(true);
    return {};
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<Result> => {
    const result = await call('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!result.ok || !result.user) return { error: result.error ?? 'Could not sign you in.' };
    setUser(result.user);
    setReady(true);
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await call('/api/auth/signout', { method: 'POST' });
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch: { name: string }): Promise<Result> => {
    const result = await call('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (!result.ok || !result.user) return { error: result.error ?? 'Could not save your name.' };
    setUser(result.user);
    return {};
  }, []);

  const saveAddress = useCallback(async (address: Address): Promise<Result> => {
    const result = await call('/api/account/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });
    if (!result.ok || !result.user) return { error: result.error ?? 'Could not save that address.' };
    setUser(result.user);
    return {};
  }, []);

  const removeAddress = useCallback(async (id: string): Promise<Result> => {
    const result = await call(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!result.ok || !result.user) return { error: result.error ?? 'Could not remove that address.' };
    setUser(result.user);
    return {};
  }, []);

  const value = useMemo<AccountValue>(
    () => ({ user, ready, signUp, signIn, signOut, updateProfile, saveAddress, removeAddress, refresh }),
    [user, ready, signUp, signIn, signOut, updateProfile, saveAddress, removeAddress, refresh]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountValue {
  const context = useContext(AccountContext);
  if (!context) throw new Error('useAccount must be used inside AccountProvider');
  return context;
}
