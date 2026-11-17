"use client";

import { useState } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import type { InboxItem } from "@/lib/inbox-types";

/** Local data URLs only; never fetch notification imagery from the network. */
export function InboxMedia({ item, Icon, hero = false }: { item: InboxItem; Icon: LucideIcon; hero?: boolean }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const media = item.media;
  const picture = media?.kind === "picture";
  if (hero && !picture) return null;
  const failed = !media || media.dataUrl === failedUrl;
  if (hero) {
    return <div className="mb-6 flex min-h-32 w-full items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
      {!failed && media ? <Image src={media.dataUrl} width={1000} height={640} unoptimized
        className="max-h-64 w-full object-cover" alt="" onError={() => setFailedUrl(media.dataUrl)} /> :
        <Icon className="h-10 w-10 text-accent2" aria-hidden />}
    </div>;
  }
  const frame = picture
    ? "mt-0.5 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-paper-raised text-accent2 sm:h-20 sm:w-20"
    : "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-paper-raised p-1 text-accent2";
  return <span className={frame}>
    {!failed && media ? <Image src={media.dataUrl} width={picture ? 80 : 36} height={picture ? 80 : 36}
      unoptimized loading="lazy" alt=""
      className={picture ? "h-full w-full object-cover" : "h-full w-full object-contain"}
      onError={() => setFailedUrl(media.dataUrl)} /> :
      <Icon className="h-4 w-4" aria-hidden />}
  </span>;
}
