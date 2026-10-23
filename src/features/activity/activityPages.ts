import type { ActivityItemDto, ActivityPageDto } from '../../lib/api/endpoints';

/**
 * Flattens activity pages in order, keeping the first copy of each item.
 * The API's pages overlap (each page repeats the previous page's last item, and new accruals
 * shift offsets), so ids must be de-duplicated (spec §3.5).
 */
export function mergeActivityPages(pages: ActivityPageDto[]): ActivityItemDto[] {
  const seen = new Set<string>();
  const items: ActivityItemDto[] = [];
  for (const page of pages) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      items.push(item);
    }
  }
  return items;
}
