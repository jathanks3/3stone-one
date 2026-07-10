"use client";

import { Menu, Search } from "lucide-react";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import { NotificationsMenu } from "./NotificationsMenu";
import { AccountMenu } from "./AccountMenu";
import type { SessionUser } from "@/types";

export function TopBar({
  user,
  onOpenPalette,
  onOpenMobileNav,
}: {
  user: SessionUser;
  onOpenPalette: () => void;
  onOpenMobileNav: () => void;
}) {
  return (
    <header className="flex h-14 flex-shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          onClick={onOpenMobileNav}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] text-ink-2 hover:bg-surface-raised hover:text-ink-1 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
        <WorkspaceSwitcher />
      </div>

      <button
        onClick={onOpenPalette}
        className="hidden flex-1 items-center gap-2.5 rounded-[10px] border border-line bg-surface-raised px-3.5 py-2 text-[13.5px] text-ink-3 hover:border-line-strong sm:flex sm:max-w-xs"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded-[6px] border border-line bg-surface px-1.5 py-0.5 text-[11px]">⌘K</kbd>
      </button>

      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          onClick={onOpenPalette}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-2 hover:bg-surface-raised hover:text-ink-1 sm:hidden"
          aria-label="Search"
        >
          <Search size={17} strokeWidth={1.9} />
        </button>
        <NotificationsMenu />
        <AccountMenu user={user} />
      </div>
    </header>
  );
}
