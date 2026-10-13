import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import { upsertInboxItems } from "./inbox-store";
import type { InboxItem } from "./inbox-types";

export type GoogleSource = "gmail" | "youtube";
type GoogleStatus = { configured: boolean; gmail: boolean; youtube: boolean };
type GooglePlugin = {
  status(): Promise<GoogleStatus>;
  connect(options: { source: GoogleSource }): Promise<void>;
  disconnect(options: { source: GoogleSource }): Promise<void>;
  googleGet(options: { source: GoogleSource; url: string }): Promise<{ data: string }>;
  addListener(event: "sourcesChanged", callback: () => void): Promise<PluginListenerHandle>;
};
const plugin = registerPlugin<GooglePlugin>("GoogleSources");
const native = () => Capacitor.isNativePlatform();
const LAST_SYNC = "al-rawi:google-sync:";
const LABEL = "al-rawi:gmail-label:v1";
const INTERVAL = 6 * 60 * 60 * 1000;

export const sourceStatus = async (): Promise<GoogleStatus> =>
  native() ? plugin.status() : { configured: false, gmail: false, youtube: false };

export const connectSource = async (source: GoogleSource) => {
  if (!native()) throw Error("Android app required");
  await plugin.connect({ source });
};
export const disconnectSource = async (source: GoogleSource) => {
  if (!native()) return;
  await plugin.disconnect({ source });
  await Preferences.remove({ key: LAST_SYNC + source });
};
export const onSourcesChanged = async (callback: () => void): Promise<() => Promise<void>> => {
  if (!native()) return async () => {};
  const handle = await plugin.addListener("sourcesChanged", callback);
  return () => handle.remove();
};

async function getGoogle(source: GoogleSource, url: string): Promise<unknown> {
  if (!native()) throw Error("Android required");
  const response = await plugin.googleGet({ source, url });
  return JSON.parse(response.data) as unknown;
}

type LabelsResponse = { labels?: Array<{ id: string; name: string; type: string }> };
export type GmailLabel = { id: string; name: string };
export async function gmailLabels(): Promise<GmailLabel[]> {
  const result = await getGoogle("gmail", "https://gmail.googleapis.com/gmail/v1/users/me/labels") as LabelsResponse;
  return (result.labels ?? [])
    .filter((label) => typeof label.id === "string" && typeof label.name === "string" && label.type !== "system")
    .map(({ id, name }) => ({ id, name }));
}
export async function selectedGmailLabel(): Promise<string> {
  const result = await Preferences.get({ key: LABEL });
  return result.value || "";
}
export async function setSelectedGmailLabel(labelId: string) {
  await Preferences.set({ key: LABEL, value: labelId });
}

type GmailMessage = {
  id: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  payload?: { headers?: Array<{ name: string; value: string }> };
};
export async function importGmail(labelId: string): Promise<InboxItem[]> {
  if (!labelId) return [];
  const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  listUrl.searchParams.set("labelIds", labelId);
  listUrl.searchParams.set("maxResults", "40");
  listUrl.searchParams.set("q", "newer_than:30d");
  const listing = await getGoogle("gmail", listUrl.href) as { messages?: Array<{ id: string }> };
  const messages = listing.messages ?? [];
  const results: InboxItem[] = [];
  // Keep network usage modest; don't load full message bodies/attachments.
  for (const { id } of messages) {
    if (!/^[a-f0-9]+$/i.test(id)) continue;
    const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + id);
    url.searchParams.set("format", "metadata");
    for (const name of ["Subject", "From", "Date"]) url.searchParams.append("metadataHeaders", name);
    const mail = await getGoogle("gmail", url.href) as GmailMessage;
    const headers = mail.payload?.headers ?? [];
    const header = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
    const thread = mail.threadId || id;
    const receivedAt = Number(mail.internalDate) || Date.now();
    results.push({
      id: "gmail:" + id,
      source: "gmail",
      title: header("Subject") || "(No subject)",
      text: [header("From"), mail.snippet || ""].filter(Boolean).join(" · "),
      url: "https://mail.google.com/mail/u/0/#all/" + encodeURIComponent(thread),
      receivedAt,
      status: "new",
    });
  }
  return results;
}

type Subscription = { snippet?: { resourceId?: { channelId?: string }; title?: string } };
type Playlist = { contentDetails?: { relatedPlaylists?: { uploads?: string } } };
type Video = {
  snippet?: { title?: string; description?: string; publishedAt?: string; videoOwnerChannelTitle?: string };
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
};
export async function importYouTube(): Promise<InboxItem[]> {
  const subscriptions: Subscription[] = [];
  let token: string | undefined;
  // All subscribed channels, but cap at 500 per sync to keep quota bounded.
  for (let i = 0; i < 10; i += 1) {
    const url = new URL("https://www.googleapis.com/youtube/v3/subscriptions");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("mine", "true");
    url.searchParams.set("maxResults", "50");
    if (token) url.searchParams.set("pageToken", token);
    const result = await getGoogle("youtube", url.href) as { items?: Subscription[]; nextPageToken?: string };
    subscriptions.push(...(result.items ?? []));
    if (!result.nextPageToken) break;
    token = result.nextPageToken;
  }
  const channelIds = Array.from(new Set(subscriptions
    .map((sub) => sub.snippet?.resourceId?.channelId)
    .filter((id): id is string => !!id && /^UC[A-Za-z0-9_-]+$/.test(id))));
  const playlists: string[] = [];
  for (let i = 0; i < channelIds.length; i += 50) {
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("id", channelIds.slice(i, i + 50).join(","));
    url.searchParams.set("maxResults", "50");
    const result = await getGoogle("youtube", url.href) as { items?: Playlist[] };
    for (const channel of result.items ?? []) {
      const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
      if (uploads && /^[A-Za-z0-9_-]+$/.test(uploads)) playlists.push(uploads);
    }
  }
  const articles: InboxItem[] = [];
  // One low-cost playlist-items query per subscription. Never use quota-heavy search.list.
  for (const playlistId of playlists) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("maxResults", "5");
    const data = await getGoogle("youtube", url.href) as { items?: Video[] };
    for (const video of data.items ?? []) {
      const id = video.contentDetails?.videoId;
      const title = video.snippet?.title;
      if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id) || !title || title === "Private video" || title === "Deleted video") continue;
      const receivedAt = Date.parse(video.contentDetails?.videoPublishedAt || video.snippet?.publishedAt || "") || Date.now();
      if (receivedAt < Date.now() - 30 * 24 * 60 * 60 * 1000) continue;
      articles.push({
        id: "youtube:" + id,
        source: "youtube",
        title,
        text: [video.snippet?.videoOwnerChannelTitle, video.snippet?.description].filter(Boolean).join(" · ").slice(0, 280),
        url: "https://www.youtube.com/watch?v=" + id,
        receivedAt,
        status: "new",
      });
    }
  }
  return articles;
}

export async function syncSource(source: GoogleSource, force = false): Promise<number> {
  if (!native()) return 0;
  const status = await sourceStatus();
  if (!status[source]) return 0;
  if (!force) {
    const stored = await Preferences.get({ key: LAST_SYNC + source });
    if (stored.value && Date.now() - Number(stored.value) < INTERVAL) return 0;
  }
  const items = source === "gmail" ? await importGmail(await selectedGmailLabel()) : await importYouTube();
  if (source === "gmail" && !(await selectedGmailLabel())) return 0;
  await upsertInboxItems(items);
  await Preferences.set({ key: LAST_SYNC + source, value: String(Date.now()) });
  return items.length;
}

export async function syncDueSources(): Promise<void> {
  if (!native()) return;
  const status = await sourceStatus();
  for (const source of ["gmail", "youtube"] as const) {
    if (!status[source]) continue;
    try { await syncSource(source); } catch { /* Show error on explicit manual refresh; try again later. */ }
  }
}
