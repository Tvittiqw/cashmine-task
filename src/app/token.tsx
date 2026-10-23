import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { isUnauthorized, userMessage } from '../lib/api/apiClient';
import { getBalances, type BalancesDto } from '../lib/api/endpoints';
import { colors, space } from '../components/theme';
import { Banner, Button, Card, Screen } from '../components/ui';
import { balancesQueryKey } from '../features/balances/useBalances';
import { useToken } from '../features/token/TokenProvider';

// fetch refuses header values outside printable ASCII (e.g. a pasted zero-width space).
const TOKEN_RE = /^[\x21-\x7E]+$/;

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function TokenScreen() {
  const queryClient = useQueryClient();
  const { token, notice, setToken, forgetToken } = useToken();
  const [value, setValue] = useState('');
  const [reveal, setReveal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const save = async () => {
    if (savingRef.current) return;
    const next = value.trim();
    if (!next) return setError('Paste your token first.');
    if (!TOKEN_RE.test(next)) {
      return setError('The token contains spaces or unsupported characters. Copy it again from the email.');
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      let balances: BalancesDto;
      try {
        balances = await getBalances(next);
      } catch (e) {
        setError(isUnauthorized(e) ? 'This token was rejected or has expired.' : `Couldn't check the token. ${userMessage(e)}`);
        return;
      }
      try {
        await setToken(next);
      } catch {
        setError("Couldn't save the token in this browser. Check that site storage is allowed.");
        return;
      }
      // Reuse the check's response so Home doesn't fetch the same snapshot again.
      queryClient.setQueryData(balancesQueryKey, balances);
      leave();
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Card style={{ gap: space.md }}>
        <Text style={s.title}>{token ? 'Change your API token' : 'Enter your API token'}</Text>
        <Text style={s.help}>
          The token from your CashMine task email. It is stored only in this browser.
        </Text>
        {notice ? <Banner tone="error">{notice}</Banner> : null}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={value}
            onChangeText={(t) => {
              setValue(t);
              setError(null);
            }}
            placeholder="ct1.…"
            placeholderTextColor={colors.muted}
            secureTextEntry={!reveal}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            onSubmitEditing={save}
            accessibilityLabel="API token"
          />
          <Pressable onPress={() => setReveal((r) => !r)} hitSlop={8}>
            <Text style={s.toggle}>{reveal ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Button title="Save token" onPress={save} loading={saving} />
        {token ? (
          <>
            <Button title="Cancel" variant="secondary" onPress={leave} disabled={saving} />
            <Button title="Forget token" variant="danger" onPress={() => void forgetToken()} disabled={saving} />
          </>
        ) : null}
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  help: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: space.md,
    backgroundColor: colors.card,
  },
  input: { flex: 1, minHeight: 48, fontSize: 16, color: colors.text },
  toggle: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  error: { color: colors.danger, fontSize: 14 },
});
