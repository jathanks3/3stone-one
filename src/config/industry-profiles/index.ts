import type { IndustryProfile, IndustryProfileKey } from "@/types";
import { constructionProfile } from "./construction";
import { restaurantProfile } from "./restaurant";
import { lawFirmProfile } from "./lawFirm";
import { securityProfile } from "./security";
import { eventCenterProfile } from "./eventCenter";
import { medicalProfile } from "./medical";
import { propertyManagementProfile } from "./propertyManagement";
import { clothingBrandProfile } from "./clothingBrand";
import { salonProfile } from "./salon";
import { workplaceProfile } from "./workplace";
import { studentProfile } from "./student";
import { nonprofitProfile } from "./nonprofit";

export const industryProfiles: Record<IndustryProfileKey, IndustryProfile> = {
  construction: constructionProfile,
  restaurant: restaurantProfile,
  law_firm: lawFirmProfile,
  security: securityProfile,
  event_center: eventCenterProfile,
  medical: medicalProfile,
  property_management: propertyManagementProfile,
  clothing_brand: clothingBrandProfile,
  salon: salonProfile,
  workplace: workplaceProfile,
  student: studentProfile,
  nonprofit: nonprofitProfile,
};

// Real bug found here: workplaceProfile/studentProfile were in the
// `industryProfiles` record above (what the app actually reads from at
// runtime via getIndustryProfile) but missing from this list - the one
// prisma/seed.ts iterates to create real IndustryProfile rows.
// Workspace.industryProfileKey is a foreign key into that table, so any
// environment seeded from this list (a fresh database, a reset, a new
// preview env) had no "workplace"/"student" row to satisfy it -
// choosing either edition during signup threw a foreign-key violation
// ("A server error occurred"), reproduced against the real production
// database before this fix.
export const industryProfileList: IndustryProfile[] = [
  constructionProfile,
  restaurantProfile,
  lawFirmProfile,
  securityProfile,
  eventCenterProfile,
  medicalProfile,
  propertyManagementProfile,
  clothingBrandProfile,
  salonProfile,
  workplaceProfile,
  studentProfile,
  nonprofitProfile,
];

export function getIndustryProfile(key: IndustryProfileKey): IndustryProfile {
  return industryProfiles[key] ?? constructionProfile;
}
