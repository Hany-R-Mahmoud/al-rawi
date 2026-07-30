export type ThemePreference = "light" | "dark" | "system";

export type StoredFeed = {
  id: string;
  url: string;
  title: string;
  category: string | null;
};

export type ReaderFeed = StoredFeed & {
  status: "idle" | "loading" | "active" | "error";
  icon: string | null;
  lastError: string | null;
  _count: { articles: number };
};

export type Article = {
  id: string;
  feedId: string;
  title: string;
  url: string | null;
  author: string | null;
  summary: string | null;
  content: string | null;
  publishedAt: string | null;
  direction: "rtl" | "ltr";
  language: "ar" | "en" | "unknown";
  isRead: boolean;
  feed: { title: string; icon: string | null };
};

export type LocalReaderState = {
  feeds: StoredFeed[];
};
