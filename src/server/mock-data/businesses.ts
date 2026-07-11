import type { Business, PortfolioCompany } from "@/types";
import { getIndustryDataset } from "./industries";
import { getIndustryProfile } from "@/config/industry-profiles";

export const DEFAULT_BUSINESS_ID = "biz_acme";

export const DEMO_BUSINESSES: Business[] = [
  { id: "biz_acme", industryProfileKey: "construction", ownerRole: "Owner" },
  { id: "biz_thornbury", industryProfileKey: "restaurant", ownerRole: "Owner" },
  { id: "biz_vantage", industryProfileKey: "security", ownerRole: "Owner" },
  { id: "biz_willowmere", industryProfileKey: "event_center", ownerRole: "Owner" },
  { id: "biz_crowncoil", industryProfileKey: "hair_salon", ownerRole: "Owner" },
  { id: "biz_lunalash", industryProfileKey: "lash_studio", ownerRole: "Owner" },
  { id: "biz_serein", industryProfileKey: "esthetician", ownerRole: "Owner" },
  { id: "biz_northline", industryProfileKey: "clothing_brand", ownerRole: "Owner" },
];

export function getBusinessById(id: string): Business {
  return DEMO_BUSINESSES.find((b) => b.id === id) ?? DEMO_BUSINESSES[0];
}

export function getBusinessName(business: Business): string {
  return getIndustryDataset(business.industryProfileKey).orgName;
}

/**
 * Real, live-computed portfolio cards — every number is read straight from
 * each business's own IndustryDataset, so this can never drift out of sync
 * with what that business's own Dashboard/Finance shows.
 */
export function getPortfolioCompanies(currentBusinessId: string): PortfolioCompany[] {
  return DEMO_BUSINESSES.map((business) => {
    const dataset = getIndustryDataset(business.industryProfileKey);
    const profile = getIndustryProfile(business.industryProfileKey);
    const months = dataset.monthlyChart.months;
    const latest = months[months.length - 1];
    const prior = months[months.length - 2];
    const revenueDeltaPct =
      prior && prior.primary > 0 ? Math.round(((latest.primary - prior.primary) / prior.primary) * 100) : 0;

    return {
      id: business.id,
      name: dataset.orgName,
      industryKey: business.industryProfileKey,
      industryLabel: profile.label,
      revenue: latest.primary,
      revenueDeltaPct,
      overdueCount: dataset.jobs.filter((j) => j.overdue).length,
      isCurrent: business.id === currentBusinessId,
    };
  });
}
