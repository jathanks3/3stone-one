"use client";

import { useCallback, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useOnClickOutside } from "@/lib/useOnClickOutside";
import { useEscapeKey } from "@/lib/useEscapeKey";
import { DEMO_NOTIFICATIONS } from "@/server/mock-data";
import { cn } from "@/lib/utils";

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOnClickOutside(ref, close);
  useEscapeKey(open, close);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-ink-2 hover:bg-surface-raised hover:text-ink-1"
        aria-label="Notifications"
      >
        <Bell size={17} strokeWidth={1.9} />
        {unreadCount > 0 ? (
          <span className="absolute right-[7px] top-[7px] h-[7px] w-[7px] rounded-full bg-critical" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-80 rounded-[14px] border border-line bg-surface shadow-[var(--shadow)]">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[13.5px] font-semibold text-ink-1">Notifications</p>
            {unreadCount > 0 ? (
              <button
                onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))}
                className="text-[12px] font-medium text-accent hover:text-accent-strong"
              >
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto border-t border-line">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex gap-2.5 border-b border-line px-4 py-3 last:border-b-0",
                  !n.read && "bg-accent-wash"
                )}
              >
                <span
                  className={cn(
                    "mt-1.5 h-[6px] w-[6px] flex-shrink-0 rounded-full",
                    n.read ? "bg-transparent" : "bg-accent"
                  )}
                />
                <div>
                  <p className="text-[13px] font-semibold text-ink-1">{n.title}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-2">{n.body}</p>
                  <p className="mt-1 text-[11px] text-ink-3">{n.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
