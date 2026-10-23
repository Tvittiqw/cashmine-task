import { StyleSheet, Text } from 'react-native';
import { colors, space } from '../../../components/theme';
import { Button, Card, Row } from '../../../components/ui';
import { formatUnits, formatUsd, toUsd } from '../../../lib/money';

type Props = {
  asset: string;
  decimals: number;
  usdPrice: string;
  amount: bigint;
  receive: bigint;
  fee: string;
  destinationLabel: string;
  submitting: boolean;
  onConfirm: () => void;
  onBack: () => void;
};

export function ClaimReview({ asset, decimals, usdPrice, amount, receive, fee, destinationLabel, submitting, onConfirm, onBack }: Props) {
  const usd = toUsd(amount, decimals, usdPrice);
  return (
    <>
      <Card style={{ gap: space.xs }}>
        <Text style={s.title}>Review your claim</Text>
        <Row label="Amount" value={`${formatUnits(amount, decimals)} ${asset}`} />
        <Row label="Fee" value={`− ${fee} ${asset}`} />
        <Row label="You receive" value={`${formatUnits(receive, decimals)} ${asset}`} strong />
        <Row label="To" value={destinationLabel} />
        {usd ? <Text style={s.muted}>Claim value ≈ {formatUsd(usd)}</Text> : null}
      </Card>
      <Text style={s.muted}>The fee is taken from the amount. The final figures come from CashMine once submitted.</Text>
      <Button title="Confirm claim" onPress={onConfirm} loading={submitting} />
      <Button title="Back" variant="secondary" onPress={onBack} disabled={submitting} />
    </>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
});
