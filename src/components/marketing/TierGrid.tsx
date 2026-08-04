import Link from "next/link";
import { wholesaleAnnualPrice, type PlanTier } from "@/config/pricing";

// Shared by /pricing (all three editions) and the dedicated /workspace
// and /student marketing pages — same tier card markup, just a different
// signupHref per edition so "Get started" can preselect the right
// product on the signup flow's product step (see
// (marketing)/signup/product/ProductForm.tsx).
export function TierGrid({ tiers, signupHref, editionKey = "business" }: { tiers: PlanTier[]; signupHref: string; editionKey?: string }) {
  return (
    <div className="grid gap-5">
      {tiers.map((tier, idx) => (
        <div
          key={tier.key}
          className={`spotlight-card flex flex-col rounded-[16px] border p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_-25px_rgba(0,0,0,0.7)] ${
            idx === 1 ? "border-accent bg-accent-wash" : "border-line bg-surface hover:border-line-strong"
          }`}
        >
          <h3 className="text-[18px] font-bold text-ink-1">{tier.label}</h3>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-[32px] font-extrabold text-ink-1">${tier.priceMonthly}</span>
            <span className="text-[13px] text-ink-3">/month</span>
          </p>
          <p className="mt-1 text-[12.5px] text-ink-3">Up to {tier.maxEmployees} seats</p>
          <p className="mt-1 text-[12.5px] font-medium text-accent">+$5/month for each additional seat</p>
          <p className="mt-4 flex-1 text-[13.5px] leading-relaxed text-ink-2">{tier.blurb}</p>
          <Link
            href={`${signupHref}?edition=${editionKey}`}
            className={`mt-6 inline-flex h-10 items-center justify-center rounded-[10px] text-[13.5px] font-semibold ${
              idx === 1
                ? "bg-accent text-on-accent hover:opacity-90"
                : "border border-line-strong text-ink-1 hover:bg-surface-raised"
            }`}
          >
            Choose base plan
          </Link>
          <a
            href={`https://www.3stoneai.com/workspace/pricing?edition=${editionKey}`}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-[10px] border border-line-strong text-[13.5px] font-semibold text-ink-1 hover:bg-surface-raised"
          >
            Custom Build
          </a>
          <Link
            href={`${signupHref}?edition=${editionKey}&billing=wholesale-annual`}
            className="mt-2 inline-flex min-h-10 items-center justify-center rounded-[10px] border border-line-strong px-3 text-center text-[13px] font-semibold text-ink-1 hover:bg-surface-raised"
          >
            Wholesale · ${wholesaleAnnualPrice(tier)}/year
          </Link>
        </div>
      ))}
    </div>
  );
}
