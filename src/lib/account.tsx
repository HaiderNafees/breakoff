import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type OrderLine = {
  slug: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  image?: string;
};

export type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postal: string;
};

export type Order = {
  id: string;
  placedAt: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  email: string;
  address: Address;
  delivery: string;
  payment: 'Card' | 'Cash on delivery';
  status: 'Confirmed' | 'Packed' | 'Delivered';
};

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  orders: Order[];
  addresses: Address[];
};

type Result = { error?: string };

type AccountValue = {
  user: User | null;
  ready: boolean;
  signUp: (name: string, email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => void;
  updateProfile: (patch: { name?: string }) => Result;
  saveAddress: (address: Address) => Result;
  removeAddress: (id: string) => void;
  addOrder: (order: Order) => void;
};

const USERS_KEY = 'breakoff:users:v1';
const SESSION_KEY = 'breakoff:session:v1';
const AccountContext = createContext<AccountValue | null>(null);

type UserRecord = Record<string, User>;

function readUsers(): UserRecord {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as UserRecord;
  } catch {
    // ignore corrupted storage
  }
  return {};
}

function writeUsers(users: UserRecord) {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // storage unavailable
  }
}

/** Demo-only credential digest. A real deployment must hash server-side. */
async function digest(value: string): Promise<string> {
  const data = new TextEncoder().encode(`breakoff:${value.toLowerCase()}`);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  let acc = 0;
  for (const byte of data) acc = (acc * 31 + byte) >>> 0;
  return `fallback-${acc.toString(16)}`;
}

export function displayName(user: User): string {
  return user.name.trim().split(/\s+/)[0] || user.email;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const email = window.localStorage.getItem(SESSION_KEY);
      if (email) {
        const users = readUsers();
        if (users[email.toLowerCase()]) setUser(users[email.toLowerCase()]);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: User) => {
    const users = readUsers();
    users[next.email.toLowerCase()] = next;
    writeUsers(users);
    try {
      window.localStorage.setItem(SESSION_KEY, next.email.toLowerCase());
    } catch {
      // ignore
    }
    setUser(next);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<Result> => {
      const cleanEmail = email.trim().toLowerCase();
      if (!name.trim()) return { error: 'Please add your name.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
        return { error: 'Enter a valid email address.' };
      }
      if (password.length < 6) return { error: 'Use at least 6 characters for your password.' };
      const users = readUsers();
      if (users[cleanEmail]) return { error: 'An account with this email already exists.' };
      const next: User = {
        id: `u_${Date.now().toString(36)}`,
        name: name.trim(),
        email: cleanEmail,
        passwordHash: await digest(password),
        createdAt: new Date().toISOString(),
        orders: [],
        addresses: [],
      };
      persist(next);
      return {};
    },
    [persist]
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<Result> => {
      const cleanEmail = email.trim().toLowerCase();
      const users = readUsers();
      const found = users[cleanEmail];
      if (!found) return { error: 'No account found with that email.' };
      const hash = await digest(password);
      if (found.passwordHash !== hash) return { error: 'That password does not match.' };
      try {
        window.localStorage.setItem(SESSION_KEY, cleanEmail);
      } catch {
        // ignore
      }
      setUser(found);
      return {};
    },
    []
  );

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    (patch: { name?: string }): Result => {
      if (!user) return { error: 'You are not signed in.' };
      if (patch.name !== undefined && !patch.name.trim()) return { error: 'Name cannot be empty.' };
      const next: User = { ...user, ...patch };
      persist(next);
      return {};
    },
    [user, persist]
  );

  const saveAddress = useCallback(
    (address: Address): Result => {
      if (!user) return { error: 'Sign in to save an address.' };
      const exists = user.addresses.some((item) => item.id === address.id);
      const addresses = exists
        ? user.addresses.map((item) => (item.id === address.id ? address : item))
        : [...user.addresses, address];
      const next: User = { ...user, addresses };
      persist(next);
      return {};
    },
    [user, persist]
  );

  const removeAddress = useCallback(
    (id: string) => {
      if (!user) return;
      persist({ ...user, addresses: user.addresses.filter((item) => item.id !== id) });
    },
    [user, persist]
  );

  const addOrder = useCallback(
    (order: Order) => {
      if (!user) return;
      persist({ ...user, orders: [order, ...user.orders] });
    },
    [user, persist]
  );

  const value = useMemo<AccountValue>(
    () => ({ user, ready, signUp, signIn, signOut, updateProfile, saveAddress, removeAddress, addOrder }),
    [user, ready, signUp, signIn, signOut, updateProfile, saveAddress, removeAddress, addOrder]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountValue {
  const context = useContext(AccountContext);
  if (!context) throw new Error('useAccount must be used inside AccountProvider');
  return context;
}
