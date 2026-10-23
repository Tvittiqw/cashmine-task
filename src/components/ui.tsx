import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from './theme';

/** Phone-width column, centred on wide screens. */
export function Screen({
  children,
  refreshing,
  onRefresh,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
        }
      >
        <View style={styles.column}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading, compact }: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        inactive && styles.buttonDisabled,
        pressed && !inactive && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primaryText : colors.primary} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' ? styles.buttonTextPrimary : styles.buttonTextSecondary,
            variant === 'danger' && { color: colors.danger },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const bannerTone = {
  info: { bg: colors.infoBg, fg: colors.info },
  warn: { bg: colors.warnBg, fg: colors.warn },
  error: { bg: colors.dangerBg, fg: colors.danger },
  success: { bg: colors.successBg, fg: colors.success },
};

export function Banner({
  tone,
  children,
  action,
}: {
  tone: keyof typeof bannerTone;
  children: ReactNode;
  action?: { title: string; onPress: () => void; loading?: boolean };
}) {
  const t = bannerTone[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg }]} accessibilityRole="alert">
      <Text style={[styles.bannerText, { color: t.fg }]}>{children}</Text>
      {action ? (
        <Pressable onPress={action.onPress} disabled={action.loading} hitSlop={8}>
          <Text style={[styles.bannerAction, { color: t.fg }]}>
            {action.loading ? '…' : action.title}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry, retrying }: { message: string; onRetry: () => void; retrying?: boolean }) {
  return (
    <Card style={{ alignItems: 'center', gap: space.md }}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.muted}>{message}</Text>
      <Button title="Try again" onPress={onRetry} loading={retrying} />
    </Card>
  );
}

export function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.rowValueStrong]} selectable>
        {value}
      </Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, paddingVertical: space.lg },
  column: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: space.lg, gap: space.md },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: { minHeight: 40, paddingHorizontal: space.md },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  buttonDanger: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.danger },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { opacity: 0.8 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  buttonTextPrimary: { color: colors.primaryText },
  buttonTextSecondary: { color: colors.text },
  banner: { borderRadius: 12, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md },
  bannerText: { flex: 1, fontSize: 14, lineHeight: 20 },
  bannerAction: { fontSize: 14, fontWeight: '700' },
  errorTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  muted: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md, paddingVertical: 6 },
  rowLabel: { color: colors.muted, fontSize: 15 },
  rowValue: { color: colors.text, fontSize: 15, flexShrink: 1, textAlign: 'right' },
  rowValueStrong: { fontWeight: '700' },
});
