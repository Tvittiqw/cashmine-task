import { useEffect, useState } from 'react';

/** Current time, refreshed every `intervalMs`, for "updated 12s ago"-style labels. */
export function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
