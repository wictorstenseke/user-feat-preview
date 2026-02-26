import { QueryClient } from "@tanstack/react-query";

/**
 * Global QueryClient configuration
 *
 * Default settings:
 * - staleTime: 5 minutes - data is considered fresh for this duration
 * - gcTime: 30 minutes - unused data stays in cache for this duration (previously cacheTime)
 * - retry: 1 - queries will retry once on failure
 * - refetchOnWindowFocus: true - refetch when user returns to the window
 * - refetchOnReconnect: true - refetch when network reconnects
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (renamed from cacheTime in v5)
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
