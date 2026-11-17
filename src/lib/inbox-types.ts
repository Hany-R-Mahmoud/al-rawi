export type InboxSource = "rss" | "gmail" | "youtube" | "shared" | "notification";
export type InboxStatus = "new" | "saved" | "done" | "archived";
export type InboxView = "all" | "unread" | "read" | "saved" | "done" | "archived";

/**
 * Reading state and organization state are independent:
 * A saved item can be unread or read; a done item remains in the archive.
 */
export type InboxItem = {
  id: string;
  source: InboxSource;
  title: string;
  text: string;
  url?: string;
  receivedAt: number;
  status: InboxStatus;
  readAt?: number | null;
  author?: string;
  feedTitle?: string;
  packageName?: string;
  /** Device-local image captured from a user-selected Android app. */
  media?: { kind: "picture" | "largeIcon" | "appIcon"; dataUrl: string };
};
