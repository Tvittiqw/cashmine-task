import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, space } from '../../components/theme';
import { Banner, Button, Card, ErrorState, Row, Screen } from '../../components/ui';
import { useClaimOptions } from '../../features/claims/useClaimOptions';
import { useClaimStatus } from '../../features/claims/useClaimStatus';
import { useNow } from '../../hooks/useNow';
import { userMessage } from '../../lib/api/apiClient';

const SLOW_AFTER_MS = 60_000;

const statusCopy = {
  pending: { text: 'Processing — usually under 20 seconds', bg: colors.infoBg, fg: colors.info },
  completed: { text: 'Completed', bg: colors.successBg, fg: colors.success },
  failed: { text: 'Failed', bg: colors.dangerBg, fg: colors.danger },
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

  const st = statusCopy[claim.status];
  const destination = options.data?.destinations.find((d) => d.id === claim.destinationId)?.label ?? claim.destinationId;
  const slow = claim.status === 'pending' && now - Date.parse(claim.createdAt) > SLOW_AFTER_MS;

  return (
    <Screen>
      <Card style={{ gap: space.md, backgroundColor: st.bg, borderColor: st.bg }}>
        <Text style={[s.status, { color: st.fg }]}>{st.text}</Text>
        {claim.status === 'pending' ? <ActivityIndicator color={st.fg} /> : null}
        {claim.status === 'failed' ? (
          <Text style={{ color: st.fg }}>
            {claim.failureReason ? `${claim.failureReason}. ` : ''}
            {claim.amount} {claim.asset} is back in your available balance.
          </Text>
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
          label={claim.status === 'completed' ? 'Received' : 'To receive'}
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
