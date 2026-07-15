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
};

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
];

export function getIndustryProfile(key: IndustryProfileKey): IndustryProfile {
  return industryProfiles[key] ?? constructionProfile;
}
