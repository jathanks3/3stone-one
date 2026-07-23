"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIndustry } from "@/lib/industry";
import { getNavSections } from "@/lib/nav";
import { NAV_ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile } = useIndustry();
  const pathname = usePathname();
  const sections = getNavSections(profile);

  return (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto px-3 py-4">
      {sections.map((section, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {section.title ? (
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              {section.title}
            </p>
          ) : null}
          {section.items.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.key}
                href={item.href}
                prefetch={false}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-colors",
                  active
                    ? "bg-accent-wash text-accent"
                    : "text-ink-2 hover:bg-surface-raised hover:text-ink-1"
                )}
              >
                {Icon ? <Icon size={17} strokeWidth={1.9} className="flex-shrink-0" /> : null}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
