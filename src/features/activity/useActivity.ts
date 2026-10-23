import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getActivity } from '../../lib/api/endpoints';
import { useRequiredToken } from '../token/TokenProvider';
import { mergeActivityPages } from './activityPages';

const PAGE_SIZE = 20;

export function useActivity() {
  const token = useRequiredToken();
  const query = useInfiniteQuery({
    queryKey: ['activity'],
    queryFn: ({ pageParam, signal }) => getActivity(token, { limit: PAGE_SIZE, cursor: pageParam }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!token,
  });
  const items = useMemo(() => mergeActivityPages(query.data?.pages ?? []), [query.data]);
  return { query, items };
}
