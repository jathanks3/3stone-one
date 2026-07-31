"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIndustry } from "@/lib/industry";
import { getNavSections } from "@/lib/nav";
import { getAllowedModuleKeys } from "@/lib/editionModules";
import { NAV_ICONS } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, editionKey } = useIndustry();
  const pathname = usePathname();
  const sections = getNavSections(profile, getAllowedModuleKeys(editionKey));

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
            // Workspace/Student get a more distinct active/hover treatment
            // (gradient fill, left accent bar, hover shift) than the
            // flagship's plain flat highlight - same level of polish as
            // 3Stone Admin's Cleat Man sub-product shell. Business
            // edition is untouched - exact same classes as before.
            const themed = editionKey !== "business";
            return (
              <Link
                key={item.key}
                href={item.href}
                prefetch={false}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-all duration-150",
                  active
                    ? themed
                      ? "bg-[linear-gradient(135deg,var(--accent-wash-strong),var(--accent-wash))] text-accent"
                      : "bg-accent-wash text-accent"
                    : themed
                      ? "text-ink-2 hover:translate-x-0.5 hover:bg-surface-raised hover:text-ink-1"
                      : "text-ink-2 hover:bg-surface-raised hover:text-ink-1"
                )}
              >
                {active && themed ? (
                  <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
                ) : null}
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
