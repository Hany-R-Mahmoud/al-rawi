"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, BellRing, BookOpenText, BookmarkCheck, Check, Inbox, Languages, Mail, Moon, Rss, ShieldCheck, Smartphone, Sun, Tv } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { BrandLogo } from "@/components/brand-logo";
import { useLanguage } from "@/components/language-provider";
import StandaloneVisitorCounter from "@/components/StandaloneVisitorCounter";

const sources = [
  { icon: Rss, name: "revRssName", detail: "revRssDetail", availability: "revAllPlatforms" },
  { icon: BellRing, name: "revNotificationsName", detail: "revNotificationsDetail", availability: "revAndroidOnly" },
  { icon: Mail, name: "revGmailName", detail: "revGmailDetail", availability: "revAndroidOnly" },
  { icon: Tv, name: "revYoutubeName", detail: "revYoutubeDetail", availability: "revAndroidOnly" },
] as const;

const steps = [
  { icon: Inbox, name: "revStep1Name", detail: "revStep1Detail" },
  { icon: BookmarkCheck, name: "revStep2Name", detail: "revStep2Detail" },
  { icon: BookOpenText, name: "revStep3Name", detail: "revStep3Detail" },
] as const;

export default function LandingPage() {
  const { language, setLanguage, t } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const editorial = language === "ar" ? "font-arabic leading-[1.22] tracking-[-0.03em]" : "font-serif";
  return (
    <main className="min-h-screen bg-paper text-ink">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-paper focus:p-4">{t("revSkipToContent")}</a>
      <header className="relative z-10 border-b border-border">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:px-12">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={t("appName")}>
            <BrandLogo size="landing" priority className="h-14 w-14 sm:h-16 sm:w-16" /><span className="font-serif text-lg font-semibold text-ink sm:text-xl">Al-Rawi</span>
            <span className="hidden border-s border-border ps-3 font-mono text-[11px] tracking-[0.12em] text-ink-faint lg:inline">{t("revBrandCaption")}</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-ink-subtle md:flex" aria-label={t("revMainNav")}>
            <a className="transition-colors hover:text-ink" href="#sources">{t("revNavSources")}</a>
            <a className="transition-colors hover:text-ink" href="#how-it-works">{t("landingHowItWorks")}</a>
            <a className="transition-colors hover:text-ink" href="#privacy">{t("revNavPrivacy")}</a>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <button type="button" onClick={() => setLanguage(language === "ar" ? "en" : "ar")} aria-label={t("landingLanguageLabel")}
              className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-xs font-semibold text-ink-subtle transition hover:bg-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2">
              <Languages className="h-4 w-4" aria-hidden /><span className={language === "ar" ? "" : "font-arabic text-base"}>{language === "ar" ? "EN" : "عربي"}</span>
            </button>
            <button type="button" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label={t("landingThemeLabel")}
              className="flex h-10 w-10 items-center justify-center rounded-md text-ink-subtle transition hover:bg-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2">
              {ready && resolvedTheme === "dark" ? <Sun className="h-[18px] w-[18px]" aria-hidden /> : <Moon className="h-[18px] w-[18px]" aria-hidden />}
            </button>
            <Link href="/reader" className="ms-1 inline-flex min-h-10 items-center gap-2 rounded-md bg-ink px-3 py-2 text-xs font-semibold text-paper transition hover:bg-accent2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2 sm:px-5 sm:text-sm">
              {t("revOpenWorkspace")} <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <section id="content" className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[.9fr_1.1fr] lg:gap-12 lg:px-12 lg:pb-28 lg:pt-20">
        <div>
          <h1 className={"max-w-[760px] text-[clamp(3.2rem,5.8vw,6.6rem)] font-normal leading-[1.02] tracking-[-0.06em] text-balance " + editorial}>{t("revHeroTitle")}</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-ink-subtle sm:text-lg">{t("revHeroDescription")}</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/reader" className="inline-flex min-h-12 items-center gap-3 rounded-md bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-accent2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent2">
              {t("revPrimaryCta")} <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
            <a href="#sources" className="inline-flex min-h-12 items-center gap-2 rounded-md px-4 text-sm font-medium text-ink-subtle underline decoration-border underline-offset-4 transition hover:text-ink">{t("revSecondaryCta")} <ArrowDown className="h-4 w-4" aria-hidden /></a>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-xs leading-5 text-ink-faint">
            {[t("revNoAccount"), t("revLocalFirst"), t("revBilingual")].map((label) => <span key={label} className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent2" aria-hidden />{label}</span>)}
          </div>
        </div>
        <figure className="relative min-h-[350px] overflow-hidden border border-border bg-paper-raised sm:min-h-[490px] lg:min-h-[570px]">
          <Image src="/visuals/reading-desk.webp" alt={t("revHeroImageAlt")} fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover object-[65%_center]" />
          <figcaption className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 border border-paper/50 bg-paper/95 px-4 py-3 text-xs text-ink shadow-sm backdrop-blur-sm sm:inset-x-5 sm:bottom-5 sm:px-5 sm:py-4">
            <span className="font-serif text-base sm:text-lg">{t("revImageCaption")}</span><span className="font-mono text-[11px] uppercase tracking-wider text-ink-subtle">Al-Rawi / 01</span>
          </figcaption>
        </figure>
      </section>

      <section id="sources" className="border-y border-border bg-paper-raised">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="mb-10 grid gap-5 lg:grid-cols-[.65fr_1fr] lg:gap-12">
            <div><h2 className={editorial + " mt-4 max-w-lg text-4xl font-normal sm:text-5xl"}>{t("revSourcesTitle")}</h2></div>
            <p className="max-w-xl self-end text-sm leading-7 text-ink-subtle sm:text-base">{t("revSourcesDescription")}</p>
          </div>
          <div className="grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
            {sources.map((item, index) => {
              const Icon = item.icon;
              return <article key={item.name} className={"border-b border-border px-0 py-7 sm:px-6 lg:border-b-0 " + (index < 3 ? "lg:border-e " : "") + (index % 2 === 0 ? "sm:border-e " : "") + (index === 0 ? "sm:ps-0 " : "") + (index === 3 ? "lg:pe-0" : "")}>
                <div className="mb-9 flex items-center justify-between"><span className="font-mono text-[11px] tracking-widest text-ink-faint">0{index + 1} / 04</span><Icon className="h-6 w-6 text-accent2" strokeWidth={1.5} aria-hidden /></div>
                <h3 className={editorial + " text-2xl"}>{t(item.name)}</h3><p className="mt-3 min-h-[65px] text-sm leading-6 text-ink-subtle">{t(item.detail)}</p>
                <span className="mt-5 inline-flex items-center gap-2 border-s-2 border-accent2 ps-2.5 font-mono text-xs text-ink-subtle"><Smartphone className="h-3 w-3" aria-hidden />{t(item.availability)}</span>
              </article>;
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="grid gap-9 lg:grid-cols-[.74fr_1.26fr] lg:gap-16">
          <div>

            <h2 className={editorial + " mt-4 max-w-sm text-4xl sm:text-5xl"}>{t("revHowTitle")}</h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-ink-subtle">{t("revHowDescription")}</p>
            <Link href="/reader" className="mt-7 inline-flex items-center gap-2 border-b border-accent2 pb-1.5 text-sm font-semibold text-ink transition hover:text-accent2">{t("revOpenWorkspace")} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /></Link>
          </div>
          <ol className="border-t border-border">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return <li key={step.name} className="grid grid-cols-[3rem_1fr_auto] items-start gap-3 border-b border-border py-7 sm:grid-cols-[4rem_1fr_auto] sm:py-9">
                <span className="pt-1 font-mono text-xs text-accent2">0{index + 1}</span>
                <div><h3 className={editorial + " text-2xl"}>{t(step.name)}</h3><p className="mt-3 max-w-md text-sm leading-7 text-ink-subtle">{t(step.detail)}</p></div>
                <Icon className="h-6 w-6 text-accent2" strokeWidth={1.4} aria-hidden />
              </li>;
            })}
          </ol>
        </div>
      </section>

      <section id="privacy" className="bg-ink text-paper">
        <div className="mx-auto grid max-w-[1440px] gap-7 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-end lg:gap-16 lg:px-12 lg:py-24">
          <div><h2 className={editorial + " mt-5 max-w-xl text-4xl sm:text-5xl"}>{t("revPrivacyTitle")}</h2></div>
          <div><p className="max-w-xl text-sm leading-8 text-paper/75 sm:text-base">{t("revPrivacyDescription")}</p><p className="mt-4 inline-flex items-start gap-2 text-xs leading-6 text-paper/65"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#d0a18c]" aria-hidden />{t("revPermissionNote")}</p></div>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1440px] flex-col justify-between gap-7 px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-end lg:px-12">
        <div><h2 className={editorial + " mt-4 max-w-2xl text-4xl sm:text-5xl"}>{t("revFinalTitle")}</h2></div>
        <Link href="/reader" className="inline-flex min-h-12 shrink-0 items-center gap-3 self-start rounded-md bg-ink px-6 text-sm font-semibold text-paper transition hover:bg-accent2 hover:text-white lg:self-auto">{t("revPrimaryCta")} <ArrowUpRight className="h-4 w-4" aria-hidden /></Link>
      </section>
      <footer className="border-t border-border px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 text-[11px] text-ink-faint"><span className="font-serif text-sm text-ink">Al-Rawi</span><span>{t("revFooter")}</span></div>
        <StandaloneVisitorCounter />
      </footer>
    </main>
  );
}
