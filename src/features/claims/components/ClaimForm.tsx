import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, space } from '../../../components/theme';
import { Banner, Button, Card, ErrorState, Row } from '../../../components/ui';
import type { ClaimOptionsDto } from '../../../lib/api/endpoints';
import { formatUnits, maxInput } from '../../../lib/money';
import { claimAmountErrorMessage, type ClaimCheck } from '../claimValidation';
import type { DisplayBalance } from '../reconcile';

type Props = {
  balances: DisplayBalance[];
  selected: DisplayBalance;
  onSelectAsset: (asset: string) => void;
  options: ClaimOptionsDto | undefined;
  optionsError: { message: string; retrying: boolean; onRetry: () => void } | null;
  destinationId: string | null;
  onSelectDestination: (id: string) => void;
  input: string;
  onChangeInput: (value: string) => void;
  check: ClaimCheck | null;
  serverError: string | null;
  canReview: boolean;
  onReview: () => void;
};

export function ClaimForm(p: Props) {
  const { selected, options, check } = p;
  const available = formatUnits(selected.available, selected.decimals);
  const valid = check?.result?.ok ? check.result : null;

  return (
    <>
      {p.serverError ? <Banner tone="error">{p.serverError}</Banner> : null}
      <Card style={{ gap: space.md }}>
        <Text style={s.label}>Asset</Text>
        <View style={s.chips}>
          {p.balances.map((b) => (
            <Chip key={b.asset} label={b.asset} active={b.asset === selected.asset} onPress={() => p.onSelectAsset(b.asset)} />
          ))}
        </View>
        <Text style={s.muted}>
          Available: {available} {selected.asset}
          {selected.adjustedBy.length ? ' (includes your recent claim)' : ''}
        </Text>
      </Card>

      {p.optionsError ? (
        <ErrorState message={p.optionsError.message} onRetry={p.optionsError.onRetry} retrying={p.optionsError.retrying} />
      ) : !options || !check ? (
        <ActivityIndicator color={colors.primary} />
      ) : check.optionsBroken ? (
        <Banner tone="error">{"CashMine sent claim settings we can't read. Try again later."}</Banner>
      ) : (
        <>
          <Card style={{ gap: space.md }}>
            <Text style={s.label}>Send to</Text>
            {options.destinations.map((d) => (
              <Chip key={d.id} label={d.label} active={p.destinationId === d.id} onPress={() => p.onSelectDestination(d.id)} />
            ))}
            {!p.destinationId ? <Text style={s.muted}>Choose where to receive the payback.</Text> : null}
          </Card>

          <Card style={{ gap: space.sm }}>
            <Text style={s.label}>Amount</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                value={p.input}
                // Shows the comma→dot conversion as you type, so "10,000" visibly becomes "10.000".
                onChangeText={(t) => p.onChangeInput(t.replace(/,/g, '.'))}
                placeholder={`Min ${options.minAmount}`}
                placeholderTextColor={colors.muted}
                inputMode="decimal"
                keyboardType="decimal-pad"
                autoCorrect={false}
                accessibilityLabel={`Amount in ${selected.asset}`}
              />
              <Text style={s.unit}>{selected.asset}</Text>
              {check.canMax ? (
                <Pressable onPress={() => p.onChangeInput(maxInput(selected.available, selected.decimals))} hitSlop={8}>
                  <Text style={s.max}>Max</Text>
                </Pressable>
              ) : null}
            </View>
            {!check.canMax ? (
              <Text style={s.error}>
                You need at least {options.minAmount} {selected.asset} to claim.
              </Text>
            ) : p.input && check.result && !check.result.ok ? (
              <Text style={s.error}>
                {claimAmountErrorMessage(check.result.error, {
                  asset: selected.asset,
                  decimals: selected.decimals,
                  minAmount: options.minAmount,
                  fee: options.fee,
                  available,
                })}
              </Text>
            ) : null}
            <Row label="Fee" value={`${options.fee} ${selected.asset}`} />
            <Row
              label="You receive"
              value={valid ? `${formatUnits(valid.receive, selected.decimals)} ${selected.asset}` : '—'}
              strong
            />
          </Card>

          <Button title="Review claim" disabled={!p.canReview} onPress={p.onReview} />
        </>
      )}
    </>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: active }} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, color: colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  muted: { fontSize: 13, color: colors.muted },
  error: { fontSize: 14, color: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.successBg },
  chipText: { fontSize: 15, color: colors.text },
  chipTextActive: { color: colors.primary, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: space.md,
  },
  input: { flex: 1, minHeight: 52, fontSize: 20, color: colors.text, minWidth: 0 },
  unit: { fontSize: 15, color: colors.muted },
  max: { fontSize: 15, color: colors.primary, fontWeight: '700' },
});
