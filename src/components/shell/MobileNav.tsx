"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { Sidebar } from "./Sidebar";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative flex h-full w-[280px] flex-col border-r border-line bg-surface">
        <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-line px-4">
          <div className="flex items-center gap-2">
            <Image src="/branding/monogram.svg" alt="" width={24} height={24} />
            <span className="text-[14px] font-bold text-ink-1">3Stone One</span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-ink-2 hover:bg-surface-raised"
            aria-label="Close navigation"
          >
            <X size={17} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
