import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space } from '../../../components/theme';
import type { ActivityItemDto } from '../../../lib/api/endpoints';
import {
  activityAmountLabel,
  activityStatusLabel,
  activityTitle,
  amountTone,
  claimLink,
  type AmountTone,
} from '../activityFormatting';

const toneStyle: Record<AmountTone, object> = {
  credit: { color: colors.success },
  debit: { color: colors.text },
  void: { color: colors.muted, textDecorationLine: 'line-through' },
};

export function ActivityRow({ item }: { item: ActivityItemDto }) {
  const href = claimLink(item);
  const openClaim = () => {
    if (href) router.push(href);
  };
  return (
    <Pressable onPress={openClaim} disabled={!href} style={s.row} accessibilityRole={href ? 'link' : undefined}>
      <View style={s.main}>
        <Text style={s.title}>{activityTitle(item)}</Text>
        <Text style={s.meta}>
          {new Date(item.createdAt).toLocaleString()} · {activityStatusLabel(item)}
        </Text>
      </View>
      <Text style={[s.amount, toneStyle[amountTone(item)]]} selectable>
        {activityAmountLabel(item)}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  main: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  amount: { fontSize: 15, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
});
