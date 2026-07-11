import type { IndustryProfile, IndustryProfileKey } from "@/types";
import { constructionProfile } from "./construction";
import { restaurantProfile } from "./restaurant";
import { lawFirmProfile } from "./lawFirm";
import { securityProfile } from "./security";
import { eventCenterProfile } from "./eventCenter";
import { medicalProfile } from "./medical";
import { propertyManagementProfile } from "./propertyManagement";
import { hairSalonProfile } from "./hairSalon";
import { lashStudioProfile } from "./lashStudio";
import { estheticianProfile } from "./esthetician";
import { clothingBrandProfile } from "./clothingBrand";

export const industryProfiles: Record<IndustryProfileKey, IndustryProfile> = {
  construction: constructionProfile,
  restaurant: restaurantProfile,
  law_firm: lawFirmProfile,
  security: securityProfile,
  event_center: eventCenterProfile,
  medical: medicalProfile,
  property_management: propertyManagementProfile,
  hair_salon: hairSalonProfile,
  lash_studio: lashStudioProfile,
  esthetician: estheticianProfile,
  clothing_brand: clothingBrandProfile,
};

export const industryProfileList: IndustryProfile[] = [
  constructionProfile,
  restaurantProfile,
  lawFirmProfile,
  securityProfile,
  eventCenterProfile,
  medicalProfile,
  propertyManagementProfile,
  hairSalonProfile,
  lashStudioProfile,
  estheticianProfile,
  clothingBrandProfile,
];

export function getIndustryProfile(key: IndustryProfileKey): IndustryProfile {
  return industryProfiles[key] ?? constructionProfile;
}
