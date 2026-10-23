import { useQueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { storage, storageKeys } from '../../lib/storage/storage';

type TokenState = {
  status: 'loading' | 'missing' | 'ready';
  token: string | null;
  notice: string | null;
  setToken: (token: string) => Promise<void>;
  forgetToken: (notice?: string) => Promise<void>;
};

const TokenContext = createContext<TokenState | null>(null);

let onUnauthorized: (() => void) | null = null;
export function reportUnauthorized() {
  onUnauthorized?.();
}

export function TokenProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(null);
  const [status, setStatus] = useState<TokenState['status']>('loading');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    storage
      .getString(storageKeys.token)
      .then((stored) => {
        setTokenState(stored);
        setStatus(stored ? 'ready' : 'missing');
      })
      .catch(() => setStatus('missing'));
  }, []);

  const setToken = useCallback(
    async (next: string) => {
      queryClient.clear();
      await storage.setString(storageKeys.token, next);
      setNotice(null);
      setTokenState(next);
      setStatus('ready');
    },
    [queryClient],
  );

  const forgetToken = useCallback(
    async (why?: string) => {
      queryClient.clear();
      await storage.remove(storageKeys.token).catch(() => undefined);
      setNotice(why ?? null);
      setTokenState(null);
      setStatus('missing');
    },
    [queryClient],
  );

  useEffect(() => {
    onUnauthorized = () => void forgetToken('Your token was rejected or has expired. Enter a valid token.');
    return () => {
      onUnauthorized = null;
    };
  }, [forgetToken]);

  const value = useMemo(
    () => ({ status, token, notice, setToken, forgetToken }),
    [status, token, notice, setToken, forgetToken],
  );
  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
}

export function useToken() {
  const ctx = useContext(TokenContext);
  if (!ctx) throw new Error('useToken must be used inside TokenProvider');
  return ctx;
}

export function useRequiredToken(): string {
  return useToken().token ?? '';
}
