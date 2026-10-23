import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors, space } from '../../../components/theme';
import { Banner, Button, Card, Row } from '../../../components/ui';
import type { ClaimIntent } from '../store';

type Props = {
  intent: ClaimIntent;
  submitting: boolean;
  onCheck: () => void;
  onDismiss: () => void;
};

/** A confirmed claim whose outcome isn't known yet (D3). Blocks new claims until resolved. */
export function PendingClaim({ intent, submitting, onCheck, onDismiss }: Props) {
  return (
    <Card style={{ gap: space.md }}>
      <Text style={s.title}>{submitting ? 'Submitting your claim…' : "We couldn't confirm your claim yet"}</Text>
      <Row label="Amount" value={`${intent.body.amount} ${intent.body.asset}`} />
      {submitting ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Banner tone="warn">
            {
              "The connection failed before CashMine answered, so the claim may or may not exist. Don't submit it again. Checking re-sends the same request and can never create a second claim."
            }
          </Banner>
          <Button title="Check status" onPress={onCheck} />
          <Button title="Dismiss" variant="secondary" onPress={onDismiss} />
          <Text style={s.muted}>
            If you dismiss and the claim did go through, it will appear under Claiming on your balances.
          </Text>
        </>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
});
