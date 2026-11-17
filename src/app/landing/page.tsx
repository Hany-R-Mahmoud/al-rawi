"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowDownRight, ArrowUpRight, Bell, Check, Languages, Menu, Moon, Rss, Share2, ShieldCheck, Smartphone, Sun, X } from "lucide-react";
import { AppRouteLink } from "@/components/app-route-link";
import { BrandLogo } from "@/components/brand-logo";
import { useLanguage } from "@/components/language-provider";
import StandaloneVisitorCounter from "@/components/StandaloneVisitorCounter";

const content = {
  en: {
    label: "A quiet place to return to",
    hero: "Keep the notifications you want to return to.",
    sub: "Choose which Android apps Al-Rawi may capture from. Read, save and organize their eligible notifications in one private Inbox.",
    open: "Open Inbox",
    learn: "How Android capture works",
    about: "About",
    captured: "Android notifications",
    saved: "Saved on your phone",
    notes: "Links & notes",
    reading: "RSS Reading",
    menu: "Open menu",
    close: "Close menu",
    how: "From a notification to something worth keeping.",
    steps: [
      { title: "Allow access", text: "Grant Notification Access yourself in Android settings. You stay in control." },
      { title: "Choose apps", text: "Pick the apps that matter to you. Only eligible notifications from those apps enter Al-Rawi." },
      { title: "Come back anytime", text: "Find a message, mark it read, save it or move it out of your way." },
    ],
    features: "More ways to keep things together.",
    featureIntro: "Notification capture is the main experience on Android. Sharing and RSS reading remain available when you need them.",
    captureTitle: "Selected-app capture",
    captureBody: "New eligible Android notifications can be kept on this device, even after you dismiss them from the notification shade. Pictures appear only when the notification supplies them.",
    shareTitle: "Save a link or note",
    shareBody: "Share directly from Android, or paste a link or note into the Inbox on the web or phone.",
    rssTitle: "Follow your feeds",
    rssBody: "Keep RSS, Atom and public GitHub release feeds in Reading, separate from your notification Inbox.",
    privacyTitle: "Your Inbox stays yours.",
    privacyBody: "Captured notification text and pictures stay in local storage on your device. Al-Rawi doesn't open your Gmail or YouTube account, ask for Google tokens to capture, or upload notifications for cloud sync.",
    webNote: "Android capture requires the native Android app and explicit system permission. The web and PWA can save links and use RSS, but cannot read other apps' notifications.",
    footerTitle: "Keep what matters. Return when you need it.",
    noAccount: "No account needed for your local Inbox",
    bilingual: "Arabic & English",
    theme: "Change theme",
    language: "Change language",
    imageAlt: "Warm reading desk, a quiet place to revisit saved information",
    photoCaption: "An Inbox for the moments you want to keep.",
  },
  ar: {
    label: "مكان هادي ترجع له",
    hero: "الإشعارات اللي تهمّك، ارجعلها وقت ما تحب.",
    sub: "اختار تطبيقات أندرويد اللي تحب تحتفظ بإشعاراتها. اقراها واحفظ المهم ورتّبها في وارد واحد على جهازك.",
    open: "افتح الوارد",
    learn: "إزاي التقاط الإشعارات بيشتغل",
    about: "عن الراوي",
    captured: "إشعارات أندرويد",
    saved: "محفوظة على جهازك",
    notes: "روابط وملاحظات",
    reading: "قراءة RSS",
    menu: "افتح القائمة",
    close: "اقفل القائمة",
    how: "من إشعار عابر لحاجة تقدر ترجع لها.",
    steps: [
      { title: "اسمح بالوصول", text: "فعّل الوصول للإشعارات بنفسك من إعدادات أندرويد. القرار دايمًا بإيدك." },
      { title: "اختار التطبيقات", text: "حدّد التطبيقات اللي تهمّك. الراوي بيحتفظ بالإشعارات المؤهلة منها بس." },
      { title: "ارجع وقت ما تحب", text: "دوّر على إشعار، علّمه كمقروء، احفظه أو خلّص منه." },
    ],
    features: "طرق تانية تحتفظ بيها بالمهم.",
    featureIntro: "التقاط الإشعارات هو الأساس على أندرويد. والمشاركة وقراءة RSS موجودين وقت ما تحتاجهم.",
    captureTitle: "التقاط التطبيقات المختارة",
    captureBody: "الإشعارات الجديدة والمؤهلة ممكن تفضل محفوظة على جهازك حتى بعد مسحها من شريط الإشعارات. الصورة بتظهر لو الإشعار نفسه فيه صورة.",
    shareTitle: "احفظ رابط أو ملاحظة",
    shareBody: "شارك من تطبيق أندرويد، أو ضيف رابط أو ملاحظة بنفسك من الويب أو الموبايل.",
    rssTitle: "تابع خلاصاتك",
    rssBody: "تابع RSS وAtom وإصدارات GitHub العامة في قسم القراءة، بعيد عن الوارد.",
    privacyTitle: "الوارد بتاعك، على جهازك.",
    privacyBody: "نصوص وصور الإشعارات بتفضل محفوظة محليًا على جهازك. الراوي مش بيدخل حساب Gmail أو YouTube ومش بياخد Google tokens عشان يلتقط الإشعارات، ومفيش مزامنة سحابية ليها.",
    webNote: "التقاط إشعارات التطبيقات متاح في نسخة أندرويد الأصلية بعد إذن واضح منك. نسخة الويب والـPWA تقدر تحفظ روابط وتقرأ RSS، لكن ما تقدرش تقرأ إشعارات التطبيقات التانية.",
    footerTitle: "احفظ المهم. وارجع له وقت ما تحتاجه.",
    noAccount: "مش محتاج حساب للوارد المحلي",
    bilingual: "عربي وإنجليزي",
    theme: "غيّر المظهر",
    language: "غيّر اللغة",
    imageAlt: "مكتب قراءة دافئ وهادي للاحتفاظ بالمعلومات المهمة",
    photoCaption: "وارد ترجع له على مهلك.",
  },
} as const;

export default function LandingPage() {
  const { language, setLanguage } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const c = content[language];
  const serif = language === "ar" ? "font-arabic leading-[1.25]" : "font-serif leading-[1.08]";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); menuButtonRef.current?.focus(); }
    };
    const onOutside = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onOutside); };
  }, [menuOpen]);

  const switchLanguage = () => { setLanguage(language === "ar" ? "en" : "ar"); setMenuOpen(false); };
  const switchTheme = () => { setTheme(resolvedTheme === "dark" ? "light" : "dark"); setMenuOpen(false); };
  return <main className="min-h-screen min-w-0 bg-paper text-ink">
    <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-paper focus:p-3">{language === "ar" ? "انتقل للمحتوى" : "Skip to content"}</a>
    <header className="relative z-30 border-b border-border bg-paper">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2 px-3 py-2.5 sm:px-8 lg:px-12">
        <AppRouteLink page="home" aria-label="Al-Rawi" className="flex min-w-0 shrink items-center gap-1.5 rounded-md focus-visible:outline-2 focus-visible:outline-accent2 sm:gap-2">
          <BrandLogo size="landing" priority className="h-11 w-11 shrink-0 sm:h-14 sm:w-14" />
          <span className="hidden font-serif text-base font-semibold text-ink min-[370px]:inline sm:text-xl">Al-Rawi</span>
        </AppRouteLink>
        <nav aria-label={language === "ar" ? "القائمة الرئيسية" : "Main navigation"} className="hidden items-center gap-5 text-sm text-ink-subtle lg:flex">
          <a href="#how-it-works" className="hover:text-ink">{c.learn}</a>
          <a href="#features" className="hover:text-ink">{c.features}</a>
          <a href="#privacy" className="hover:text-ink">{language === "ar" ? "الخصوصية" : "Privacy"}</a>
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden items-center gap-1 lg:flex">
            <button disabled={!ready} type="button" aria-label={c.language} onClick={switchLanguage} className="flex h-11 min-w-11 items-center justify-center rounded-md px-2 text-sm text-ink-subtle hover:bg-muted"><Languages className="me-1 h-4 w-4" />{language === "ar" ? "EN" : "ع"}</button>
            <button disabled={!ready} type="button" aria-label={c.theme} onClick={switchTheme} className="flex h-11 w-11 items-center justify-center rounded-md text-ink-subtle hover:bg-muted">{ready && resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
          </div>
          <AppRouteLink page="reader" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md bg-ink px-3 text-xs font-semibold text-paper transition hover:bg-accent2 hover:text-white focus-visible:outline-2 focus-visible:outline-accent2 sm:gap-2 sm:px-5 sm:text-sm">
            {c.open}<ArrowUpRight className="hidden h-4 w-4 sm:inline" aria-hidden />
          </AppRouteLink>
          <div ref={menuRef} className="relative lg:hidden">
            <button ref={menuButtonRef} type="button" aria-label={menuOpen ? c.close : c.menu} aria-expanded={menuOpen} aria-controls="landing-menu"
              onClick={() => setMenuOpen((open) => !open)} className="flex h-11 w-11 items-center justify-center rounded-md border border-border text-ink hover:bg-muted focus-visible:outline-2 focus-visible:outline-accent2">
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            {menuOpen && <nav id="landing-menu" aria-label={c.menu} className="absolute end-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-24px)] rounded-md border border-border bg-paper-raised p-2 shadow-lg">
              {[["#how-it-works",c.learn],["#features",c.features],["#privacy",language === "ar" ? "الخصوصية" : "Privacy"]].map(([href,label]) =>
                <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block rounded-md px-3 py-3 text-sm text-ink hover:bg-muted">{label}</a>)}
              <div className="my-1 border-t border-border" />
              <button type="button" disabled={!ready} onClick={switchLanguage} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-start text-sm hover:bg-muted"><Languages className="h-4 w-4" />{c.language}</button>
              <button type="button" disabled={!ready} onClick={switchTheme} className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-start text-sm hover:bg-muted">{ready && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{c.theme}</button>
            </nav>}
          </div>
        </div>
      </div>
    </header>

    <section id="content" className="mx-auto grid max-w-[1440px] items-center gap-9 px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1fr_1.04fr] lg:gap-14 lg:px-12 lg:pb-28 lg:pt-20">
      <div className="min-w-0">
        <p className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-accent2"><span className="h-1.5 w-1.5 rounded-full bg-accent2" />{c.label}</p>
        <h1 className={serif + " max-w-[770px] text-balance text-[clamp(2.55rem,5vw,5.75rem)] font-normal tracking-tight"}>{c.hero}</h1>
        <p className="mt-6 max-w-[550px] text-base leading-8 text-ink-subtle sm:text-lg">{c.sub}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <AppRouteLink page="reader" className="inline-flex min-h-12 items-center gap-2 rounded-md bg-ink px-6 text-sm font-semibold text-paper hover:bg-accent2 hover:text-white">{c.open}<ArrowUpRight className="h-4 w-4" aria-hidden /></AppRouteLink>
          <a href="#how-it-works" className="inline-flex min-h-12 items-center gap-2 rounded-md px-2 text-sm text-ink-subtle underline decoration-border underline-offset-4 hover:text-ink">{c.learn}<ArrowDownRight className="h-4 w-4" aria-hidden /></a>
        </div>
        <div className="mt-10 flex flex-wrap gap-4 border-t border-border pt-5 text-xs text-ink-subtle">
          <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-accent2" />{c.noAccount}</span>
          <span className="inline-flex items-center gap-1.5"><Languages className="h-4 w-4 text-accent2" />{c.bilingual}</span>
        </div>
      </div>
      <figure className="relative h-[360px] min-w-0 overflow-hidden rounded-sm border border-border bg-paper-raised sm:h-[530px] lg:h-[640px]">
        <picture>
          <source media="(max-width:639px)" srcSet="/visuals/reading-desk-mobile-v2.webp" type="image/webp" />
          <Image src="/visuals/reading-desk-v2.webp" alt={c.imageAlt} fill priority sizes="(max-width:1024px) 100vw, 55vw" className="object-cover object-center" />
        </picture>
        <figcaption className="absolute inset-x-3 bottom-3 border border-paper/50 bg-paper/95 px-4 py-3 text-sm text-ink backdrop-blur sm:inset-x-6 sm:bottom-6 sm:px-6 sm:py-4"><span className={serif + " text-lg sm:text-xl"}>{c.photoCaption}</span></figcaption>
      </figure>
    </section>

    <section id="how-it-works" className="border-y border-border bg-paper-raised">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-6">
          <h2 className={serif + " max-w-[700px] text-balance text-3xl sm:text-5xl"}>{c.how}</h2>
          <span className="inline-flex items-center gap-2 text-xs font-semibold text-accent2"><Smartphone className="h-4 w-4" />Android</span>
        </div>
        <ol className="grid gap-0 border-t border-border md:grid-cols-3">
          {c.steps.map((step, index) => <li key={step.title} className="border-b border-border py-7 md:border-e md:px-6 md:first:ps-0 md:last:border-e-0">
            <span className="font-mono text-xs text-accent2">0{index + 1}</span>
            <h3 className={serif + " mt-5 text-2xl"}>{step.title}</h3>
            <p className="mt-3 max-w-sm text-sm leading-7 text-ink-subtle">{step.text}</p>
          </li>)}
        </ol>
      </div>
    </section>

    <section id="features" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
      <div className="grid gap-4 lg:grid-cols-[.65fr_1fr] lg:gap-12">
        <h2 className={serif + " max-w-[480px] text-4xl sm:text-5xl"}>{c.features}</h2>
        <p className="max-w-lg text-sm leading-8 text-ink-subtle sm:text-base">{c.featureIntro}</p>
      </div>
      <div className="mt-10 divide-y divide-border border-t border-border">
        {[
          { icon: Bell, title: c.captureTitle, body: c.captureBody, tag: "Android" },
          { icon: Share2, title: c.shareTitle, body: c.shareBody, tag: language === "ar" ? "أندرويد والويب" : "Android + Web" },
          { icon: Rss, title: c.rssTitle, body: c.rssBody, tag: language === "ar" ? "أندرويد والويب" : "Android + Web" },
        ].map(({ icon: Icon, title, body, tag }) =>
          <article key={title} className="grid gap-4 py-7 sm:grid-cols-[3rem_1fr_auto] sm:items-start sm:gap-6 sm:py-9">
            <Icon className="h-7 w-7 text-accent2" strokeWidth={1.5} aria-hidden />
            <div><h3 className={serif + " text-2xl"}>{title}</h3><p className="mt-2 max-w-2xl text-sm leading-7 text-ink-subtle">{body}</p></div>
            <span className="text-xs text-ink-faint">{tag}</span>
          </article>)}
      </div>
    </section>

    <section id="privacy" className="bg-ink text-paper">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[.85fr_1fr] lg:items-start lg:gap-16 lg:px-12">
        <div className="space-y-6"><ShieldCheck className="h-8 w-8 text-[#d0a18c]" aria-hidden /><h2 className={serif + " text-balance text-4xl sm:text-5xl"}>{c.privacyTitle}</h2></div>
        <div><p className="text-base leading-8 text-paper/85">{c.privacyBody}</p><p className="mt-7 border-s-2 border-paper/40 ps-4 text-sm leading-7 text-paper/75">{c.webNote}</p></div>
      </div>
    </section>

    <section className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:flex-row lg:items-end lg:px-12">
      <h2 className={serif + " max-w-[760px] text-balance text-4xl sm:text-5xl"}>{c.footerTitle}</h2>
      <AppRouteLink page="reader" className="inline-flex min-h-12 shrink-0 items-center gap-2 self-start rounded-md bg-ink px-6 text-sm font-semibold text-paper hover:bg-accent2 hover:text-white">{c.open}<ArrowUpRight className="h-4 w-4" /></AppRouteLink>
    </section>
    <footer className="border-t border-border px-5 py-8 text-xs text-ink-faint sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
        <span>Al-Rawi · {c.label}</span>
        <StandaloneVisitorCounter />
        <a href="#content" className="underline underline-offset-4">{language === "ar" ? "فوق" : "Back to top"}</a>
      </div>
    </footer>
  </main>;
}
