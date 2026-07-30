"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, Languages, Moon, RefreshCw, ShieldCheck, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { BrandLogo } from "@/components/brand-logo";
import { LandingOrbitalHero } from "@/components/landing-orbital-hero";
import { useLanguage } from "@/components/language-provider";

const features = [
  { icon: RefreshCw, title: "landingFreshTitle" as const, description: "landingFreshDescription" as const },
  { icon: ShieldCheck, title: "landingLocalTitle" as const, description: "landingLocalDescription" as const },
  { icon: Languages, title: "landingBilingualTitle" as const, description: "landingBilingualDescription" as const },
  { icon: BookOpen, title: "landingFocusedTitle" as const, description: "landingFocusedDescription" as const },
];

export default function LandingPage() {
  const { language, setLanguage, t } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setThemeReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-paper text-ink">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center text-ink" aria-label="Al-Rawi home">
          <BrandLogo size="landing" priority className="h-[4.5rem] w-[4.5rem]" />
        </Link>
        <nav className="hidden items-center gap-7 text-xs text-ink-subtle md:flex" aria-label="Main navigation">
          <a className="transition-colors hover:text-accent2" href="#features">{t("landingFeatures")}</a>
          <a className="transition-colors hover:text-accent2" href="#how-it-works">{t("landingHowItWorks")}</a>
        </nav>
        <div className="flex items-center gap-1">
          <button type="button" className="rounded-md px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-subtle transition-colors hover:bg-accent hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setLanguage(language === "ar" ? "en" : "ar")} aria-label={t("landingLanguageLabel")}>
            {language === "ar" ? "EN" : "ع"}
          </button>
          <button type="button" className="rounded-md p-2 text-ink-subtle transition-colors hover:bg-accent hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label={t("landingThemeLabel")}>
            {themeReady && resolvedTheme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
          <Link href="/reader" className="ms-1 hidden items-center gap-1 border border-ink px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-ink hover:text-paper sm:flex">
            {t("landingOpenReader")} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 sm:pb-28 sm:pt-16 lg:grid-cols-[1fr_.92fr] lg:gap-16 lg:px-10 lg:pb-36 lg:pt-24">
        <div className="max-w-2xl text-start">
          <p className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-accent2 sm:text-xs"><span className="h-px w-8 bg-accent2" />{t("landingEyebrow")}</p>
          <h1 className={`max-w-xl text-[clamp(2.9rem,7vw,6.6rem)] font-semibold leading-[0.96] tracking-[-0.06em] text-balance ${language === "ar" ? "font-arabic leading-[1.15] tracking-[-0.03em]" : "font-serif"}`}>{t("landingTitle")}</h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-ink-subtle sm:text-lg sm:leading-8">{t("landingDescription")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/reader" className="inline-flex items-center gap-2 bg-ink px-4 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {t("landingStartReading")} <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a href="#features" className="inline-flex items-center gap-2 px-3 py-3 text-sm text-ink-subtle underline decoration-border underline-offset-4 transition-colors hover:text-accent2 hover:decoration-accent2">{t("landingExploreFeatures")}</a>
          </div>
        </div>
        <LandingOrbitalHero />
      </section>

      <section id="features" className="border-y border-border bg-paper-raised">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent2 sm:text-xs">{t("landingFeaturesEyebrow")}</p>
              <h2 className={`mt-4 max-w-sm text-3xl font-semibold leading-tight tracking-tight sm:text-4xl ${language === "ar" ? "font-arabic leading-[1.25]" : "font-serif"}`}>{t("landingFeaturesTitle")}</h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-ink-subtle">{t("landingFeaturesDescription")}</p>
            </div>
            <div className="grid border-t border-border sm:grid-cols-2 sm:border-s-0 sm:border-t-0">
              {features.map(({ icon: Icon, title, description }, index) => (
                <article key={title} className={`border-b border-border py-6 sm:px-6 sm:py-7 ${index % 2 === 0 ? "sm:border-e" : ""} ${index > 1 ? "sm:border-b-0" : ""}`}>
                  <div className="mb-8 flex items-center justify-between"><span className="font-mono text-[10px] text-ink-faint">0{index + 1}</span><Icon className="h-4 w-4 text-accent2" strokeWidth={1.5} aria-hidden="true" /></div>
                  <h3 className={`text-lg font-semibold tracking-tight ${language === "ar" ? "font-arabic text-xl" : "font-serif"}`}>{t(title)}</h3>
                  <p className="mt-3 text-sm leading-6 text-ink-subtle">{t(description)}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-ink text-paper">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent2 sm:text-xs">{t("landingHowEyebrow")}</p>
            <h2 className={`mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl ${language === "ar" ? "font-arabic leading-[1.25]" : "font-serif"}`}>{t("landingHowTitle")}</h2>
          </div>
          <div className="mt-14 grid gap-0 border-t border-paper/20 md:grid-cols-3">
            {[1, 2, 3].map((step) => (
              <article key={step} className="border-b border-paper/20 py-7 md:border-b-0 md:border-e md:px-7 md:first:ps-0 md:last:border-e-0 md:last:pe-0">
                <span className="font-mono text-xs text-accent2">{t(`landingStep${step === 1 ? "One" : step === 2 ? "Two" : "Three"}Label` as "landingStepOneLabel" | "landingStepTwoLabel" | "landingStepThreeLabel")}</span>
                <h3 className={`mt-12 text-xl font-semibold ${language === "ar" ? "font-arabic text-2xl" : "font-serif"}`}>{t(`landingStep${step === 1 ? "One" : step === 2 ? "Two" : "Three"}Title` as "landingStepOneTitle" | "landingStepTwoTitle" | "landingStepThreeTitle")}</h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-paper/65">{t(`landingStep${step === 1 ? "One" : step === 2 ? "Two" : "Three"}Description` as "landingStepOneDescription" | "landingStepTwoDescription" | "landingStepThreeDescription")}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
        <div className="flex flex-col justify-between gap-8 border-t-2 border-accent2 pt-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl"><h2 className={`text-4xl font-semibold leading-tight tracking-tight sm:text-6xl ${language === "ar" ? "font-arabic leading-[1.2]" : "font-serif"}`}>{t("landingCtaTitle")}</h2><p className="mt-5 max-w-lg text-base leading-7 text-ink-subtle">{t("landingCtaDescription")}</p></div>
          <Link href="/reader" className="inline-flex shrink-0 items-center gap-2 border border-ink px-4 py-3 text-sm font-medium transition-colors hover:bg-ink hover:text-paper">{t("landingCtaButton")} <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
      </section>

      <footer className="border-t border-border px-5 py-5 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-7xl items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-ink-faint"><span>Al-Rawi</span><span>{t("landingFooterNote")}</span></div></footer>
    </main>
  );
}
