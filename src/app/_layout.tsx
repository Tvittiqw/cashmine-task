import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError, isRetryableRead, isUnauthorized } from '../lib/api/apiClient';
import { colors } from '../components/theme';
import { ClaimsProvider } from '../features/claims/store';
import { reportUnauthorized, TokenProvider, useToken } from '../features/token/TokenProvider';

const MAX_READ_RETRIES = 3;

function createQueryClient() {
  const onError = (error: unknown) => {
    if (isUnauthorized(error)) reportUnauthorized();
  };
  return new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => isRetryableRead(error) && failureCount < MAX_READ_RETRIES,
        retryDelay: (attempt, error) => {
          if (error instanceof ApiError && error.retryAfterMs) return error.retryAfterMs;
          return Math.min(1000 * 2 ** attempt, 8000) + Math.random() * 300;
        },
      },
      mutations: { retry: false },
    },
  });
}

function AppStack() {
  const { status } = useToken();
  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: colors.bg }, headerTitleStyle: { fontWeight: '600' } }}>
      <Stack.Screen name="token" options={{ title: 'API token' }} />
      <Stack.Protected guard={status === 'ready'}>
        <Stack.Screen name="index" options={{ title: 'Payback' }} />
        <Stack.Screen name="claim" options={{ title: 'Claim payback' }} />
        <Stack.Screen name="claims/[id]" options={{ title: 'Claim status' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <TokenProvider>
          <ClaimsProvider>
            <StatusBar style="dark" />
            <AppStack />
          </ClaimsProvider>
        </TokenProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
