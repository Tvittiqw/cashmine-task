import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '../components/theme';
import { Button, ErrorState } from '../components/ui';
import { ActivityRow } from '../features/activity/components/ActivityRow';
import { useActivity } from '../features/activity/useActivity';
import { userMessage } from '../lib/api/apiClient';

export default function ActivityScreen() {
  const { query, items } = useActivity();

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError) void query.fetchNextPage();
  };

  if (!query.data) {
    return (
      <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
        <View style={s.center}>
          {query.isError ? (
            <ErrorState message={userMessage(query.error)} onRetry={() => void query.refetch()} retrying={query.isFetching} />
          ) : (
            <ActivityIndicator color={colors.primary} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['bottom', 'left', 'right']}>
      <FlatList
        style={s.list}
        contentContainerStyle={s.content}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ActivityRow item={item} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} />}
        ListEmptyComponent={<Text style={s.muted}>No activity yet.</Text>}
        ListFooterComponent={<ListFooter query={query} onLoadMore={loadMore} />}
      />
    </SafeAreaView>
  );
}

type FooterProps = {
  query: ReturnType<typeof useActivity>['query'];
  onLoadMore: () => void;
};

function ListFooter({ query, onLoadMore }: FooterProps) {
  if (query.isFetchingNextPage) return <ActivityIndicator style={s.footer} color={colors.primary} />;
  if (query.isFetchNextPageError) {
    return (
      <View style={s.footer}>
        <Text style={s.error}>{`Couldn't load more: ${userMessage(query.error)}`}</Text>
        <Button title="Try again" variant="secondary" compact onPress={() => void query.fetchNextPage()} />
      </View>
    );
  }
  if (query.hasNextPage) {
    // Web has no reliable momentum scroll end, so offer an explicit button too.
    return (
      <View style={s.footer}>
        <Button title="Load more" variant="secondary" compact onPress={onLoadMore} />
      </View>
    );
  }
  return <Text style={[s.muted, s.footer]}>{"That's everything."}</Text>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', padding: space.lg },
  list: { width: '100%', maxWidth: 480, alignSelf: 'center' },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xl, backgroundColor: colors.card },
  footer: { paddingVertical: space.lg, gap: space.sm, alignItems: 'center' },
  muted: { color: colors.muted, fontSize: 14, textAlign: 'center', paddingVertical: space.lg },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center' },
});
