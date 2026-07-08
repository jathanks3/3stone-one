"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "./CommandPalette";
import type { SessionUser, Workspace } from "@/types";

export function AppShell({
  workspace,
  user,
  children,
}: {
  workspace: Workspace;
  user: SessionUser;
  children: ReactNode;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <TopBar
        workspace={workspace}
        user={user}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenMobileNav={() => setMobileNavOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 flex-shrink-0 border-r border-line bg-surface lg:flex lg:flex-col">
          <div className="flex h-14 flex-shrink-0 items-center gap-2 border-b border-line px-4">
            <Image src="/branding/monogram.svg" alt="" width={24} height={24} />
            <span className="text-[14px] font-bold text-ink-1">3Stone One</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto bg-bg">{children}</main>
      </div>
      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
