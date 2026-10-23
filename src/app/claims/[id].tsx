import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, space } from '../../components/theme';
import { Banner, Button, Card, ErrorState, Row, Screen } from '../../components/ui';
import { failureMessage } from '../../features/claims/claimFormatting';
import { CLAIM_PENDING_HINT, CLAIM_STATUS_LABEL, RECEIVE_ROW_LABEL } from '../../features/claims/claimLabels';
import { useClaimOptions } from '../../features/claims/useClaimOptions';
import { useClaimStatus } from '../../features/claims/useClaimStatus';
import { useNow } from '../../hooks/useNow';
import { userMessage } from '../../lib/api/apiClient';
import type { ClaimStatus } from '../../lib/api/endpoints';

const SLOW_AFTER_MS = 60_000;

const STATUS_DISPLAY: Record<ClaimStatus, { title: string; bg: string; fg: string }> = {
  pending: { title: `${CLAIM_STATUS_LABEL.pending} — ${CLAIM_PENDING_HINT}`, bg: colors.infoBg, fg: colors.info },
  completed: { title: CLAIM_STATUS_LABEL.completed, bg: colors.successBg, fg: colors.success },
  failed: { title: CLAIM_STATUS_LABEL.failed, bg: colors.dangerBg, fg: colors.danger },
};

export default function ClaimStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useClaimStatus(id ?? '');
  const claim = query.data;
  const now = useNow(5_000);

  const options = useClaimOptions(claim?.asset);

  if (!claim) {
    return (
      <Screen>
        {query.isError ? (
          <ErrorState message={userMessage(query.error)} onRetry={() => void query.refetch()} retrying={query.isFetching} />
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </Screen>
    );
  }

  const st = STATUS_DISPLAY[claim.status];
  const destination = options.data?.destinations.find((d) => d.id === claim.destinationId)?.label ?? claim.destinationId;
  const slow = claim.status === 'pending' && now - Date.parse(claim.createdAt) > SLOW_AFTER_MS;

  return (
    <Screen>
      <Card style={{ gap: space.md, backgroundColor: st.bg, borderColor: st.bg }}>
        <Text style={[s.status, { color: st.fg }]}>{st.title}</Text>
        {claim.status === 'pending' ? <ActivityIndicator color={st.fg} /> : null}
        {claim.status === 'failed' ? (
          <Text style={{ color: st.fg }}>{failureMessage(claim)}</Text>
        ) : null}
      </Card>
      {slow ? <Banner tone="warn">This is taking longer than usual. We keep checking.</Banner> : null}
      {query.isRefetchError ? (
        <Banner tone="warn" action={{ title: 'Retry', onPress: () => void query.refetch(), loading: query.isFetching }}>
          {`Couldn't refresh the status: ${userMessage(query.error)} Showing the last known status.`}
        </Banner>
      ) : null}
      <Card style={{ gap: space.xs }}>
        <Row label="Amount" value={`${claim.amount} ${claim.asset}`} />
        <Row label="Fee" value={`− ${claim.fee} ${claim.asset}`} />
        <Row
          label={RECEIVE_ROW_LABEL[claim.status]}
          value={`${claim.receiveAmount} ${claim.asset}`}
          strong
        />
        <Row label="To" value={destination} />
        <Row label="Created" value={new Date(claim.createdAt).toLocaleString()} />
        <Row label="Updated" value={new Date(claim.updatedAt).toLocaleString()} />
        <Row label="Claim ID" value={claim.id} />
      </Card>
      <Button title="Back to balances" variant="secondary" onPress={() => router.dismissTo('/')} />
    </Screen>
  );
}

const s = StyleSheet.create({
  status: { fontSize: 20, fontWeight: '700' },
});
