import { router } from 'expo-router';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import { colors, space } from '../../../components/theme';
import { Button, Card } from '../../../components/ui';
import type { DisplayBalance } from '../../claims/reconcile';
import {
  availableLabel,
  availableUsdLabel,
  claimAdjustmentNote,
  claimingLabel,
  pendingLabel,
} from '../balanceFormatting';

type Props = { balance: DisplayBalance; claimBlocked: boolean };

export function AssetCard({ balance, claimBlocked }: Props) {
  const openClaim = () => router.push({ pathname: '/claim', params: { asset: balance.asset } });
  return (
    <Card style={{ gap: space.sm }}>
      <View style={s.head}>
        <Text style={s.asset}>{balance.asset}</Text>
        <Text style={s.muted}>{availableUsdLabel(balance)}</Text>
      </View>
      <Text style={s.amount} selectable>
        {availableLabel(balance)} <Text style={s.unit}>available</Text>
      </Text>
      <OptionalLine text={pendingLabel(balance)} style={s.sub} />
      <OptionalLine text={claimingLabel(balance)} style={s.sub} />
      <OptionalLine text={claimAdjustmentNote(balance)} style={s.note} />
      <Button
        title={`Claim ${balance.asset}`}
        compact
        disabled={claimBlocked || balance.available === 0n}
        onPress={openClaim}
      />
    </Card>
  );
}

function OptionalLine({ text, style }: { text: string | null; style: TextStyle }) {
  return text ? <Text style={style}>{text}</Text> : null;
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  asset: { fontSize: 18, fontWeight: '700', color: colors.text },
  amount: { fontSize: 22, fontWeight: '600', color: colors.text },
  unit: { fontSize: 14, fontWeight: '400', color: colors.muted },
  sub: { fontSize: 14, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  note: { fontSize: 13, color: colors.info },
});
