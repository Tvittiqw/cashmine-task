import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ClaimDto, CreateClaimBody } from '../../lib/api/endpoints';
import { storage, storageKeys } from '../../lib/storage/storage';
import { useToken } from '../token/TokenProvider';

const MAX_TRACKED = 10;

export interface ClaimIntent {
  key: string;
  body: CreateClaimBody;
  createdAt: string;
  state: 'sending' | 'unknown';
}

interface Persisted {
  tracked: ClaimDto[];
  intent: ClaimIntent | null;
}

type ClaimsState = Persisted & {
  setIntent: (intent: ClaimIntent | null) => void;
  upsertClaim: (claim: ClaimDto) => void;
};

const empty: Persisted = { tracked: [], intent: null };
const ClaimsContext = createContext<ClaimsState | null>(null);

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const { status, token } = useToken();
  const [state, setState] = useState<Persisted>(empty);
  const loaded = useRef(false);
  const lastToken = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    storage
      .getJson<Persisted>(storageKeys.claims)
      .then((saved) => {
        if (saved) setState(saved);
      })
      .catch(() => undefined)
      .finally(() => {
        loaded.current = true;
      });
  }, []);

  // Claims belong to one token: switching or forgetting the token starts from scratch.
  useEffect(() => {
    if (status === 'loading') return;
    if (lastToken.current !== undefined && lastToken.current !== token) setState(empty);
    lastToken.current = token;
  }, [status, token]);

  useEffect(() => {
    if (!loaded.current) return;
    storage.setJson(storageKeys.claims, state).catch(() => undefined);
  }, [state]);

  const setIntent = useCallback((intent: ClaimIntent | null) => setState((s) => ({ ...s, intent })), []);

  const upsertClaim = useCallback(
    (claim: ClaimDto) =>
      setState((s) => {
        const others = s.tracked.filter((c) => c.id !== claim.id);
        const tracked = [claim, ...others]
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
          .slice(0, MAX_TRACKED);
        return { ...s, tracked };
      }),
    [],
  );

  const value = useMemo(() => ({ ...state, setIntent, upsertClaim }), [state, setIntent, upsertClaim]);
  return <ClaimsContext.Provider value={value}>{children}</ClaimsContext.Provider>;
}

export function useClaims() {
  const ctx = useContext(ClaimsContext);
  if (!ctx) throw new Error('useClaims must be used inside ClaimsProvider');
  return ctx;
}
