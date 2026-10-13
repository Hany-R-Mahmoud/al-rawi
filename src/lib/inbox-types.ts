export type InboxSource = "notification" | "rss" | "gmail" | "youtube";
export type InboxStatus = "new" | "saved" | "done" | "archived";
export type InboxView = "today" | "missed" | "saved" | "archived" | "all";
export type InboxItem = {
  id: string;
  source: InboxSource;
  packageName?: string;
  title: string;
  text: string;
  url?: string;
  receivedAt: number;
  status: InboxStatus;
};
