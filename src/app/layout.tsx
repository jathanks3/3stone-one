import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { ThemeProvider, THEME_NO_FLASH_SCRIPT } from "@/lib/theme";
import { FontSizeProvider, FONT_SIZE_NO_FLASH_SCRIPT } from "@/lib/fontSize";
import { ReducedMotionProvider, REDUCED_MOTION_NO_FLASH_SCRIPT } from "@/lib/reducedMotion";
import { AccentColorProvider } from "@/lib/accentColor";
import { ToastProvider } from "@/lib/toast";
import { PageTracker } from "@/components/shared/PageTracker";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://one.3stoneai.com"),
  title: "3Stone One — One place to run your business",
  description:
    "The operating system for a business: CRM, projects, finance, and your team, in one place.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "3Stone One — One place to run your business",
    description:
      "The operating system for a business: CRM, projects, finance, and your team, in one place.",
    url: "/",
    siteName: "3Stone One",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${plexMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_NO_FLASH_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: FONT_SIZE_NO_FLASH_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: REDUCED_MOTION_NO_FLASH_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <FontSizeProvider>
            <ReducedMotionProvider>
              <AccentColorProvider>
                <ToastProvider>
                  <PageTracker />
                  {children}
                </ToastProvider>
              </AccentColorProvider>
            </ReducedMotionProvider>
          </FontSizeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
