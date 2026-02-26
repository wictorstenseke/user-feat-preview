import { useMemo, useState } from "react";

import { usePostsQuery } from "@/hooks/usePosts";

type SortOrder = "last-updated" | "alphabetical";

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "last-updated", label: "Last Updated" },
  { value: "alphabetical", label: "Alphabetical" },
];

export function FeedbackList() {
  const [sortOrder, setSortOrder] = useState<SortOrder>("last-updated");
  const { data: posts, isLoading, isError } = usePostsQuery();

  const sortedPosts = useMemo(() => {
    if (!posts) return [];

    const sorted = [...posts];

    if (sortOrder === "alphabetical") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      sorted.sort((a, b) => b.id - a.id);
    }

    return sorted;
  }, [posts, sortOrder]);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(event.target.value as SortOrder);
  };

  if (isLoading) {
    return (
      <p className="text-muted-foreground" aria-live="polite">
        Loading feedback items…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-destructive" role="alert">
        Failed to load feedback items. Please try again.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {sortedPosts.length} item{sortedPosts.length !== 1 ? "s" : ""}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Sort by</span>
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Sort feedback items"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul className="flex flex-col gap-3" aria-label="Feedback items">
        {sortedPosts.map((post) => (
          <li key={post.id}>
            <article className="rounded-lg border bg-card p-5 text-card-foreground shadow-sm">
              <h3 className="scroll-m-20 text-base font-semibold tracking-tight">
                {post.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{post.body}</p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
