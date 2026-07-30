import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Amiri, Geist, Geist_Mono, Noto_Naskh_Arabic } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { AppToaster } from "@/components/app-toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const naskh = Noto_Naskh_Arabic({
  variable: "--font-naskh",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

const metadataBase = new URL(
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"
);

export const metadata: Metadata = {
  metadataBase,
  title: "Al-Rawi",
  description:
    "A calm bilingual RSS reader with RTL support and distraction-free reading.",
  applicationName: "Al-Rawi",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    title: "Al-Rawi",
    description:
      "A calm bilingual RSS reader with RTL support and distraction-free reading.",
    siteName: "Al-Rawi",
  },
  twitter: {
    card: "summary_large_image",
    title: "Al-Rawi",
    description:
      "A calm bilingual RSS reader with RTL support and distraction-free reading.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Al-Rawi",
  },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ed" },
    { media: "(prefers-color-scheme: dark)", color: "#2d2a25" },
  ],
};

const languageInitScript = `(() => { try { const language = localStorage.getItem("al-rawi-language"); if (language === "ar") { document.documentElement.lang = "ar"; document.documentElement.dir = "rtl"; } } catch {} })()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${amiri.variable} ${naskh.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: languageInitScript }} />
        {process.env.NODE_ENV === "development" && (
          <Script src="https://unpkg.com/react-scan/dist/auto.global.js" crossOrigin="anonymous" strategy="afterInteractive" />
        )}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LanguageProvider>
          <ThemeProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
            <AppToaster />
            {process.env.VERCEL && <Analytics />}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
