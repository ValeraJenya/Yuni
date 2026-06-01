import {
  CursorPaginationQueryDto,
  DEFAULT_PAGE_LIMIT,
  MAX_PAGE_LIMIT,
} from './cursor-pagination.dto';

export interface NormalizedCursorPagination {
  cursor?: string;
  limit: number;
  take: number;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

export function normalizeCursorPagination(
  query: CursorPaginationQueryDto,
): NormalizedCursorPagination {
  const limit = Math.min(
    Math.max(query.limit ?? DEFAULT_PAGE_LIMIT, 1),
    MAX_PAGE_LIMIT,
  );
  const cursor = query.cursor?.trim() || undefined;

  return {
    cursor,
    limit,
    take: limit + 1,
  };
}

export function buildCursorPage<T>(
  items: T[],
  limit: number,
  getCursor: (item: T) => string,
): CursorPage<T> {
  const hasNextPage = items.length > limit;
  const pageItems = hasNextPage ? items.slice(0, limit) : items;
  const lastItem = pageItems.at(-1);

  return {
    items: pageItems,
    nextCursor: hasNextPage && lastItem ? getCursor(lastItem) : null,
  };
}
