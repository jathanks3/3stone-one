"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronsUpDown, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useOnClickOutside } from "@/lib/useOnClickOutside";
import { useEscapeKey } from "@/lib/useEscapeKey";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { logoutAction } from "@/lib/actions";
import { Avatar } from "@/ui/Avatar";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/types";

const THEME_OPTIONS: { key: ThemeMode; icon: typeof Sun; label: string }[] = [
  { key: "light", icon: Sun, label: "Light" },
  { key: "dark", icon: Moon, label: "Dark" },
  { key: "system", icon: Monitor, label: "System" },
];

export function AccountMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOnClickOutside(ref, close);
  useEscapeKey(open, close);
  const { theme, setTheme } = useTheme();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-[10px] p-1 hover:bg-surface-raised"
        aria-label="Account menu"
      >
        <Avatar initials={user.initials} size={30} />
        <ChevronsUpDown size={14} className="text-ink-3" />
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-64 rounded-[14px] border border-line bg-surface p-1.5 shadow-[var(--shadow)]">
          <div className="px-2.5 py-2">
            <p className="text-[13.5px] font-semibold text-ink-1">{user.name}</p>
            <p className="text-[12px] text-ink-3">{user.email}</p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-accent">{user.role}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <p className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-3">Theme</p>
          <div className="mx-2.5 mb-1.5 flex gap-1 rounded-[10px] border border-line bg-surface-raised p-1">
            {THEME_OPTIONS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                aria-label={label}
                title={label}
                className={cn(
                  "flex flex-1 items-center justify-center rounded-[7px] py-1.5 transition-colors",
                  theme === key
                    ? "bg-surface text-accent shadow-[var(--shadow)]"
                    : "text-ink-3 hover:text-ink-1"
                )}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
          <div className="my-1 h-px bg-line" />
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-[13.5px] font-medium text-critical hover:bg-critical-wash"
            >
              <LogOut size={15} />
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
