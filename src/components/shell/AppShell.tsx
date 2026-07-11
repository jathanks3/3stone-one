"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "./CommandPalette";
import { AiAssistant } from "@/components/assistant/AiAssistant";
import { GuidedTour } from "@/components/tour/GuidedTour";
import type { SessionUser } from "@/types";

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        user={user}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenMobileNav={() => setMobileNavOpen(true)}
        onStartTour={() => setTourOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 flex-shrink-0 border-r border-line bg-surface lg:flex lg:flex-col">
          <div className="flex h-14 flex-shrink-0 items-center gap-2 border-b border-line px-4">
            <Image src="/branding/monogram.svg" alt="" width={24} height={18} />
            <span className="text-[14px] font-bold text-ink-1">3Stone One</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-bg pb-24 lg:pb-6">{children}</main>
      </div>
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <AiAssistant />
      {tourOpen ? <GuidedTour onClose={() => setTourOpen(false)} /> : null}
    </div>
  );
}
