"use client";

import { ArrowUpRight, BookOpen, Globe2, Layers3, Newspaper, Rss, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";

type TimelineStatus = "completed" | "in-progress" | "pending";

type TimelineItem = {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: LucideIcon;
  relatedIds: number[];
  status: TimelineStatus;
  statusLabel: string;
  energy: number;
};

function getStatusStyles(status: TimelineStatus) {
  if (status === "completed") return "border-accent2 bg-accent2 text-paper";
  if (status === "in-progress") return "border-accent2 bg-paper-raised text-accent2";
  return "border-border bg-paper text-ink-faint";
}

export function LandingOrbitalHero() {
  const { t } = useLanguage();
  const timelineData: TimelineItem[] = [
    { id: 1, title: t("landingNodeBriefing"), date: t("landingTimelineNow"), content: t("landingFreshDescription"), category: t("landingFreshTitle"), icon: Newspaper, relatedIds: [2, 5], status: "completed", statusLabel: t("landingTimelineNow"), energy: 92 },
    { id: 2, title: t("landingNodeSources"), date: t("landingTimelineReady"), content: t("landingLocalDescription"), category: t("landingLocalTitle"), icon: Rss, relatedIds: [1, 4], status: "in-progress", statusLabel: t("landingTimelineReady"), energy: 76 },
    { id: 3, title: t("landingNodeWorld"), date: t("landingTimelineWaiting"), content: t("landingFocusedDescription"), category: t("landingFocusedTitle"), icon: Globe2, relatedIds: [1, 5], status: "pending", statusLabel: t("landingTimelineWaiting"), energy: 48 },
    { id: 4, title: t("landingNodeDesign"), date: t("landingTimelineReading"), content: t("landingBilingualDescription"), category: t("landingBilingualTitle"), icon: Layers3, relatedIds: [2, 5], status: "in-progress", statusLabel: t("landingTimelineReading"), energy: 68 },
    { id: 5, title: t("landingFocusedTitle"), date: t("landingTimelineReady"), content: t("landingFocusedDescription"), category: t("landingFocusedTitle"), icon: BookOpen, relatedIds: [1, 3, 4], status: "completed", statusLabel: t("landingTimelineReady"), energy: 86 },
  ];

  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [radius, setRadius] = useState(132);
  const [pointerInside, setPointerInside] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const updateRadius = () => setRadius(Math.min(154, Math.max(104, element.clientWidth * 0.27)));
    updateRadius();
    const observer = new ResizeObserver(updateRadius);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHydrated(true);
      setAutoRotate(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!autoRotate || pointerInside) return;
    const rotationTimer = window.setInterval(() => {
      setRotationAngle((previous) => Number(((previous + 0.3) % 360).toFixed(3)));
    }, 50);
    return () => window.clearInterval(rotationTimer);
  }, [autoRotate, pointerInside]);

  const getRelatedItems = (itemId: number) => timelineData.find((item) => item.id === itemId)?.relatedIds || [];

  const centerViewOnNode = (nodeId: number) => {
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    setRotationAngle(270 - (nodeIndex / timelineData.length) * 360);
  };

  const toggleItem = (id: number) => {
    const wasExpanded = Boolean(expandedItems[id]);
    const nextExpanded = Object.fromEntries(timelineData.map((item) => [item.id, item.id === id && !wasExpanded]));
    setExpandedItems(nextExpanded);
    if (!wasExpanded) {
      setActiveNodeId(id);
      setAutoRotate(false);
      setPulseEffect(Object.fromEntries(getRelatedItems(id).map((relatedId) => [relatedId, true])));
      centerViewOnNode(id);
      return;
    }
    setActiveNodeId(null);
    setAutoRotate(true);
    setPulseEffect({});
  };

  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === containerRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  return (
    <div ref={containerRef} className="relative mx-auto aspect-square w-full max-w-[540px] overflow-hidden border border-border bg-paper-raised shadow-[0_20px_70px_-36px_hsl(20_14%_8%_/_0.45)]" onClick={handleContainerClick} onPointerEnter={() => setPointerInside(true)} onPointerLeave={() => setPointerInside(false)} aria-label={t("landingOrbitalAriaLabel")}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(15_80%_45%_/_0.09),transparent_42%)]" />
      <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-border pb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-faint sm:text-[10px]">
          <span>{t("landingDeskLabel")}</span>
          <span className="flex items-center gap-2 text-accent2"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent2 motion-reduce:animate-none" />{t("landingDeskStatus")}</span>
        </div>
        <div className="relative flex-1" style={{ perspective: "1000px" }}>
          <div className="absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border" />
          <div className="absolute left-1/2 top-1/2 h-[82%] w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border/80" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent2 bg-paper-raised text-accent2 sm:h-20 sm:w-20">
              <div className="absolute -inset-2 rounded-full border border-accent2/20 motion-safe:animate-ping motion-reduce:animate-none" />
              <BookOpen className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="absolute mt-32 text-center sm:mt-36"><span className="block font-serif text-lg font-semibold tracking-tight">Al-Rawi</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint">local reading desk</span></div>
          </div>
          {hydrated && timelineData.map((item, index) => {
            const angle = ((index / timelineData.length) * 360 + rotationAngle) % 360;
            const radians = (angle * Math.PI) / 180;
            const x = radius * Math.cos(radians);
            const y = radius * Math.sin(radians);
            const xOffset = x >= 0 ? `+ ${x}px` : `- ${Math.abs(x)}px`;
            const yOffset = y >= 0 ? `+ ${y}px` : `- ${Math.abs(y)}px`;
            const opacity = Math.max(0.42, Math.min(1, 0.42 + 0.58 * ((1 + Math.sin(radians)) / 2)));
            const isExpanded = Boolean(expandedItems[item.id]);
            const isRelated = activeNodeId !== null && getRelatedItems(activeNodeId).includes(item.id);
            const isPulsing = Boolean(pulseEffect[item.id]);
            const Icon = item.icon;
            return (
              <div key={item.id} className="absolute left-1/2 top-1/2 cursor-pointer transition-all duration-700" style={{ transform: `translate(calc(-50% ${xOffset}), calc(-50% ${yOffset}))`, zIndex: isExpanded ? 20 : Math.round(100 + 50 * Math.cos(radians)), opacity: isExpanded ? 1 : opacity }} onClick={(event) => { event.stopPropagation(); toggleItem(item.id); }}>
                <div className={`absolute -inset-2 rounded-full ${isPulsing ? "animate-pulse" : ""}`} style={{ background: "radial-gradient(circle, hsl(15 80% 45% / 0.18) 0%, transparent 70%)" }} />
                <button type="button" aria-pressed={isExpanded} aria-label={item.title} className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${isExpanded ? "scale-150 border-accent2 bg-accent2 text-paper shadow-lg shadow-accent2/30" : isRelated ? "border-accent2 bg-accent2/20 text-accent2" : "border-border bg-ink text-paper hover:border-accent2"}`}><Icon className="h-4 w-4" aria-hidden="true" /></button>
                <div className={`absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] font-semibold uppercase tracking-wider transition-all duration-300 sm:text-[10px] ${isExpanded ? "scale-110 text-accent2" : "text-ink-subtle"}`}>{item.title}</div>
                {isExpanded && <div className="absolute left-1/2 top-12 w-[min(268px,calc(100vw-48px))] -translate-x-1/2 border border-border bg-paper-raised p-3 text-start shadow-xl shadow-ink/10 sm:top-20 sm:w-72 sm:p-4">
                  <div className="absolute -top-3 left-1/2 h-3 w-px -translate-x-1/2 bg-accent2/60" />
                  <div className="flex items-center justify-between gap-3"><span className={`border px-2 py-1 font-mono text-[9px] uppercase tracking-wider ${getStatusStyles(item.status)}`}>{item.statusLabel}</span><span className="font-mono text-[9px] text-ink-faint">{item.date}</span></div>
                  <h3 className="mt-3 font-serif text-base font-semibold text-ink">{item.category}</h3>
                  <p className="mt-2 text-xs leading-5 text-ink-subtle">{item.content}</p>
                  <div className="mt-4 border-t border-border pt-3"><div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-ink-faint"><span>{t("landingTimelineSignal")}</span><span>{item.energy}%</span></div><div className="h-1 w-full bg-muted"><div className="h-full bg-accent2" style={{ width: `${item.energy}%` }} /></div></div>
                  {item.relatedIds.length > 0 && <div className="mt-4 border-t border-border pt-3"><div className="mb-2 flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-ink-faint"><Rss className="h-3 w-3 text-accent2" />{t("landingTimelineConnected")}</div><div className="flex flex-wrap gap-1">{item.relatedIds.map((relatedId) => { const relatedItem = timelineData.find((candidate) => candidate.id === relatedId); return relatedItem ? <button key={relatedId} type="button" className="inline-flex items-center gap-1 border border-border bg-transparent px-2 py-1 text-[10px] text-ink-subtle transition-colors hover:border-accent2 hover:text-accent2" onClick={(event) => { event.stopPropagation(); toggleItem(relatedId); }}>{relatedItem.title}<ArrowUpRight className="h-3 w-3" /></button> : null; })}</div></div>}
                </div>}
              </div>
            );
          })}
        </div>
        <div className="border-t border-border pt-3 sm:pt-4"><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent2">{t("landingActiveStory")}</p><p className="mt-1 max-w-[270px] font-serif text-base leading-snug text-ink sm:text-lg">{t("landingStoryTitle")}</p></div><span className="shrink-0 text-end font-mono text-[9px] uppercase tracking-wider text-ink-faint">{activeNodeId ? timelineData.find((item) => item.id === activeNodeId)?.title : t("landingNodeBriefing")}<br />{t("landingStoryMeta")}</span></div></div>
      </div>
    </div>
  );
}
