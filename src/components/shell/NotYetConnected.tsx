import { Construction } from "lucide-react";

// Shown to a real (non-demo) session on any module that hasn't been
// converted from mock data to a real service yet. This is the direct
// consequence of "production users must never silently fall back to
// demo data" (docs/15 / the founder's production charter): every one of
// these modules' *page* still unconditionally rendered its mock Client
// component regardless of session until this existed — a real customer
// hitting /crm would have seen the demo's fabricated "Red Oak
// Construction" data as if it were their own. The Client components
// themselves are untouched (still exactly what the demo renders); only
// the page decides which one a given session sees.
export function NotYetConnected({ moduleName }: { moduleName: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-wash text-accent">
        <Construction size={22} />
      </div>
      <h1 className="text-[16px] font-bold text-ink-1">{moduleName} isn&rsquo;t connected yet</h1>
      <p className="text-[13.5px] text-ink-2">
        This part of your workspace is still being built out with real data. It&rsquo;ll be ready soon
        — nothing here reflects your actual business yet.
      </p>
    </div>
  );
}
