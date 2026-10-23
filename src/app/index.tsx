import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space } from '../components/theme';
import { Banner, Button, Card, ErrorState, Screen } from '../components/ui';
import { AssetCard } from '../features/balances/components/AssetCard';
import { usdTotals } from '../features/balances/model';
import { useDisplayBalances } from '../features/balances/useDisplayBalances';
import { useClaims } from '../features/claims/store';
import { useClaimStatus } from '../features/claims/useClaimStatus';
import { useNow } from '../hooks/useNow';
import type { ClaimDto } from '../lib/api/endpoints';
import { userMessage } from '../lib/api/apiClient';
import { formatUsd } from '../lib/money';

const STALE_AFTER_MS = 60_000;
const FAILED_NOTICE_MS = 10 * 60_000;

function ago(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.floor(m / 60)} h ago`;
}

export default function HomeScreen() {
  const { query, balances, asOf } = useDisplayBalances();
  const { tracked, intent } = useClaims();
  const now = useNow(1000);
  const [pulling, setPulling] = useState(false);

  const view = useMemo(
    () => (balances && asOf ? { balances, totals: usdTotals(balances), asOf } : null),
    [balances, asOf],
  );

  const refresh = async () => {
    setPulling(true);
    await query.refetch();
    setPulling(false);
  };

  if (!view) {
    return (
      <Screen>
        {query.isError ? (
          <ErrorState message={userMessage(query.error)} onRetry={() => void query.refetch()} retrying={query.isFetching} />
        ) : (
          <Card style={{ alignItems: 'center', gap: space.sm }}>
            <ActivityIndicator color={colors.primary} />
            <Text style={s.muted}>Loading balances…</Text>
          </Card>
        )}
      </Screen>
    );
  }

  const age = now - Date.parse(view.asOf);
  const stale = query.isRefetchError || now - query.dataUpdatedAt > STALE_AFTER_MS;
  const pending = tracked.filter((c) => c.status === 'pending');
  const recentlyFailed = tracked.filter((c) => c.status === 'failed' && now - Date.parse(c.updatedAt) < FAILED_NOTICE_MS);

  return (
    <Screen refreshing={pulling} onRefresh={refresh}>
      {intent?.state === 'unknown' ? (
        <Banner tone="warn" action={{ title: 'Check status', onPress: () => router.push('/claim') }}>
          {`We couldn't confirm your claim of ${intent.body.amount} ${intent.body.asset} yet. Don't submit it again.`}
        </Banner>
      ) : null}
      {recentlyFailed.map((c) => (
        <Banner key={c.id} tone="error" action={{ title: 'Details', onPress: () => router.push(`/claims/${c.id}`) }}>
          Claim of {c.amount} {c.asset} failed{c.failureReason ? ` (${c.failureReason})` : ''}. The amount is back in your
          available balance.
        </Banner>
      ))}
      {stale ? (
        <Banner tone="warn" action={{ title: 'Retry', onPress: () => void refresh(), loading: query.isFetching }}>
          {query.isRefetchError ? `Couldn't refresh: ${userMessage(query.error)} ` : ''}Showing balances from {ago(age)}.
        </Banner>
      ) : null}

      <Card style={{ gap: space.xs }}>
        <Text style={s.label}>Total payback</Text>
        <Text style={s.total}>≈ {formatUsd(view.totals.total)}</Text>
        <Text style={s.sub}>Available to claim ≈ {formatUsd(view.totals.available)}</Text>
        {view.totals.unpriced.length ? (
          <Text style={s.warn}>Excludes {view.totals.unpriced.join(', ')} (no price available)</Text>
        ) : null}
        <View style={s.freshRow}>
          <Text style={s.muted}>
            Updated {ago(age)}
            {query.isFetching ? ' · refreshing…' : ''}
          </Text>
          <Pressable onPress={() => void refresh()} disabled={query.isFetching} hitSlop={8}>
            <Text style={s.link}>Refresh</Text>
          </Pressable>
        </View>
      </Card>

      {pending.length ? (
        <Card style={{ gap: space.sm }}>
          <Text style={s.label}>Claims in progress</Text>
          {pending.map((c) => (
            <PendingClaimRow key={c.id} claim={c} />
          ))}
        </Card>
      ) : null}

      {view.balances.length === 0 ? (
        <Card>
          <Text style={s.muted}>No balances yet. Payback appears here once you trade on a connected exchange.</Text>
        </Card>
      ) : (
        view.balances.map((b) => <AssetCard key={b.asset} balance={b} claimBlocked={!!intent} />)
      )}

      <Button title="Change token" variant="secondary" onPress={() => router.push('/token')} />
    </Screen>
  );
}

function PendingClaimRow({ claim }: { claim: ClaimDto }) {
  const { data } = useClaimStatus(claim.id);
  const c = data ?? claim;
  return (
    <Pressable onPress={() => router.push(`/claims/${c.id}`)} style={s.pendingRow}>
      <Text style={s.sub}>
        {c.amount} {c.asset} · {c.status === 'pending' ? 'processing…' : c.status}
      </Text>
      <Text style={s.link}>View</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, color: colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  total: { fontSize: 32, fontWeight: '700', color: colors.text },
  sub: { fontSize: 14, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  warn: { fontSize: 13, color: colors.warn },
  link: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  freshRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm },
  pendingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: space.xs },
});
