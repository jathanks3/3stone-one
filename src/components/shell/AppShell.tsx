"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "./CommandPalette";
import { DemoBanner } from "./DemoBanner";
import { AiAssistant } from "@/components/assistant/AiAssistant";
import { EDITION_BRAND } from "./EditionMark";
import { useIndustry } from "@/lib/industry";
import { useAccentColor } from "@/lib/accentColor";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

// Edition-scoped accent classes (see globals.css) - Workspace/Student
// read as their own product in the actual app, not the flagship
// re-skinned. Business edition gets no class, so it's pixel-identical
// to before this existed.
const EDITION_CLASS: Record<string, string | undefined> = {
  workspace: "edition-workspace",
  student: "edition-student",
};

// User-chosen accent override (Settings -> Appearance) - reuses the
// exact same palette already designed for each edition above, just
// applied at the same DOM node so whichever class is present wins
// outright instead of fighting CSS specificity against the edition
// class it replaces.
const ACCENT_CLASS: Record<string, string> = {
  blue: "accent-blue",
  green: "accent-green",
  purple: "accent-purple",
};

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { editionKey, demoAccentColor, demoAiEnabled } = useIndustry();
  const { accentColor } = useAccentColor();
  const brand = EDITION_BRAND[editionKey];
  const Mark = brand?.Mark;
  // A founder-authored DemoProfile's color (see /3stone-ai/demo-profiles)
  // always wins over the viewer's own personal preference - a prospect's
  // demo should show up already colored for them, not whatever the
  // founder last picked for themselves on this same browser.
  const customHexAccent = demoAccentColor?.match(/^#[0-9a-f]{6}$/i) ? demoAccentColor : null;
  const effectiveAccentColor = demoAccentColor && demoAccentColor in ACCENT_CLASS ? (demoAccentColor as keyof typeof ACCENT_CLASS) : accentColor;
  const accentClass = effectiveAccentColor === "default" ? EDITION_CLASS[editionKey] : ACCENT_CLASS[effectiveAccentColor];
  const customAccentStyle = customHexAccent ? ({ "--accent": customHexAccent, "--accent-strong": customHexAccent, "--accent-wash": `color-mix(in srgb, ${customHexAccent} 10%, transparent)`, "--accent-wash-strong": `color-mix(in srgb, ${customHexAccent} 18%, transparent)` } as CSSProperties) : undefined;
  const shellStyle = {
    ...customAccentStyle,
    "--universe-x": "0px",
    "--universe-y": "0px",
  } as CSSProperties;

  return (
    <div
      className={cn("app-universe-shell flex h-screen flex-col", accentClass)}
      style={shellStyle}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty(
          "--universe-x",
          `${((event.clientX - rect.left) / rect.width - 0.5) * 28}px`,
        );
        event.currentTarget.style.setProperty(
          "--universe-y",
          `${((event.clientY - rect.top) / rect.height - 0.5) * 22}px`,
        );
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--universe-x", "0px");
        event.currentTarget.style.setProperty("--universe-y", "0px");
      }}
    >
      <DemoBanner />
      <TopBar
        user={user}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={cn(
            "app-universe-sidebar hidden w-64 flex-shrink-0 border-r border-line lg:flex lg:flex-col",
            brand ? "bg-[linear-gradient(180deg,var(--surface)_0%,var(--bg)_140%)]" : "bg-surface"
          )}
        >
          <div className="flex h-14 flex-shrink-0 items-center gap-2 border-b border-line px-4">
            {Mark ? <Mark size={24} /> : <Image src="/branding/monogram.svg" alt="" width={24} height={24} />}
            <span className="truncate text-[14px] font-bold text-ink-1">{brand?.label ?? "3Stone One"}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </aside>
        <main className="app-universe-main flex-1 overflow-y-auto bg-bg pb-24 lg:pb-6">
          <div className="app-universe-field" aria-hidden="true">
            <span className="app-universe-orbit app-universe-orbit-outer"><i /></span>
            <span className="app-universe-orbit app-universe-orbit-middle"><i /></span>
            <span className="app-universe-orbit app-universe-orbit-inner"><i /></span>
            <span className="app-universe-core" />
          </div>
          <div className="app-universe-content">{children}</div>
        </main>
      </div>
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      {demoAiEnabled ? <AiAssistant /> : null}
    </div>
  );
}
