import type { InboxSource } from "./inbox-types";

/**
 * Source capabilities are declared instead of inferring support from a platform name.
 * New providers must implement their own authorized connector before being marked connected.
 */
export type SourceMethod = "feed" | "google-oauth" | "manual-share";
export type SourceDefinition = {
  id: InboxSource | "github-public" | "podcast";
  method: SourceMethod;
  automaticWhileOpen: boolean;
  worksOnWeb: boolean;
  requiresAccount: boolean;
};

export const SOURCE_CATALOG: readonly SourceDefinition[] = [
  { id: "rss", method: "feed", automaticWhileOpen: true, worksOnWeb: true, requiresAccount: false },
  { id: "github-public", method: "feed", automaticWhileOpen: true, worksOnWeb: true, requiresAccount: false },
  { id: "podcast", method: "feed", automaticWhileOpen: true, worksOnWeb: true, requiresAccount: false },
  { id: "gmail", method: "google-oauth", automaticWhileOpen: true, worksOnWeb: false, requiresAccount: true },
  { id: "youtube", method: "google-oauth", automaticWhileOpen: true, worksOnWeb: false, requiresAccount: true },
  { id: "shared", method: "manual-share", automaticWhileOpen: false, worksOnWeb: true, requiresAccount: false },
] as const;

export function githubReleasesFeed(owner: string, repo: string): string {
  const valid = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/;
  if (!valid.test(owner) || !valid.test(repo) || owner.includes("..") || repo.includes("..")) {
    throw Error("Invalid GitHub repository");
  }
  return "https://github.com/" + owner + "/" + repo + "/releases.atom";
}
