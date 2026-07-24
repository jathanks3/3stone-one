"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useOnClickOutside } from "@/lib/useOnClickOutside";
import { useEscapeKey } from "@/lib/useEscapeKey";
import { useIndustry } from "@/lib/industry";
import { DEMO_NOTIFICATIONS } from "@/server/mock-data";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types";

// Fixed a real bug found while building the notifications framework:
// this component always rendered DEMO_NOTIFICATIONS regardless of
// session — the same class of demo-data-leak bug WorkspaceSwitcher had
// earlier (see docs/17-production-readiness-checklist.md). isDemo (from
// IndustryProvider, the same source WorkspaceSwitcher itself now reads)
// decides which data source this component uses; a real session never
// touches the mock array.
export function NotificationsMenu() {
  const { isDemo } = useIndustry();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(isDemo ? DEMO_NOTIFICATIONS : []);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useOnClickOutside(ref, close);
  useEscapeKey(open, close);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (isDemo) return;
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications ?? []))
      .catch(() => {});
  }, [isDemo]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!isDemo) {
      fetch("/api/notifications/mark-read", { method: "POST" }).catch(() => {});
    }
  }

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
              <button onClick={markAllRead} className="text-[12px] font-medium text-accent hover:text-accent-strong">
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto border-t border-line">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-ink-3">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
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
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
