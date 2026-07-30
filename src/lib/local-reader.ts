import type { LocalReaderState, StoredFeed } from "./reader-types";

const STORAGE_KEY = "al-rawi:reader:v1";

const EMPTY_STATE: LocalReaderState = { feeds: [] };

export function makeFeedId(url: string): string {
  return `feed:${url}`;
}

export function readLocalReaderState(): LocalReaderState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (!isLocalReaderState(parsed)) return EMPTY_STATE;
    return parsed;
  } catch {
    return EMPTY_STATE;
  }
}

export function writeLocalReaderState(feeds: StoredFeed[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ feeds } satisfies LocalReaderState));
}

function isLocalReaderState(value: unknown): value is LocalReaderState {
  if (!value || typeof value !== "object" || !("feeds" in value)) return false;
  const feeds = value.feeds;
  return Array.isArray(feeds) && feeds.every(isStoredFeed);
}

function isStoredFeed(value: unknown): value is StoredFeed {
  if (!value || typeof value !== "object") return false;
  const feed = value as Record<string, unknown>;
  return typeof feed.id === "string" && typeof feed.url === "string" && typeof feed.title === "string" && (typeof feed.category === "string" || feed.category === null);
}
