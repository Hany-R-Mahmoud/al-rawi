import type { TranslationKey } from "@/lib/i18n";

export type FeedCatalogCategory = "technology" | "design" | "world" | "arabic";
export type FeedCatalogLanguage = "en" | "ar";

export type FeedCatalogItem = Readonly<{
  id: string;
  title: string;
  url: string;
  siteUrl: string;
  category: FeedCatalogCategory;
  language: FeedCatalogLanguage;
}>;

export type FeedPreset = Readonly<{
  id: string;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  feedIds: readonly string[];
}>;

export const FEED_CATALOG = [
  { id: "ars-technica", title: "Ars Technica", url: "https://feeds.arstechnica.com/arstechnica/index", siteUrl: "https://arstechnica.com", category: "technology", language: "en" },
  { id: "the-verge", title: "The Verge", url: "https://www.theverge.com/rss/index.xml", siteUrl: "https://www.theverge.com", category: "technology", language: "en" },
  { id: "smashing-magazine", title: "Smashing Magazine", url: "https://www.smashingmagazine.com/feed/", siteUrl: "https://www.smashingmagazine.com", category: "design", language: "en" },
  { id: "a-list-apart", title: "A List Apart", url: "https://alistapart.com/main/feed/", siteUrl: "https://alistapart.com", category: "design", language: "en" },
  { id: "bbc-world", title: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml", siteUrl: "https://www.bbc.com/news/world", category: "world", language: "en" },
  { id: "npr-news", title: "NPR News", url: "https://feeds.npr.org/1001/rss.xml", siteUrl: "https://www.npr.org/sections/news/", category: "world", language: "en" },
  { id: "bbc-arabic", title: "BBC عربي", url: "https://feeds.bbci.co.uk/arabic/rss.xml", siteUrl: "https://www.bbc.com/arabic", category: "arabic", language: "ar" },
  { id: "france24-arabic", title: "فرانس 24 عربي", url: "https://www.france24.com/ar/rss", siteUrl: "https://www.france24.com/ar/", category: "arabic", language: "ar" },
] as const satisfies readonly FeedCatalogItem[];

export const FEED_PRESETS = [
  { id: "technology", nameKey: "presetTechnologyName", descriptionKey: "presetTechnologyDescription", feedIds: ["ars-technica", "the-verge"] },
  { id: "design", nameKey: "presetDesignName", descriptionKey: "presetDesignDescription", feedIds: ["smashing-magazine", "a-list-apart"] },
  { id: "world", nameKey: "presetWorldName", descriptionKey: "presetWorldDescription", feedIds: ["bbc-world", "npr-news"] },
  { id: "arabic", nameKey: "presetArabicName", descriptionKey: "presetArabicDescription", feedIds: ["bbc-arabic", "france24-arabic"] },
] as const satisfies readonly FeedPreset[];

export function getCatalogFeed(id: string): FeedCatalogItem | undefined {
  return FEED_CATALOG.find((feed) => feed.id === id);
}
