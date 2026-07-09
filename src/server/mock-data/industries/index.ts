import type { IndustryDataset, IndustryProfileKey } from "@/types";
import { CONSTRUCTION_DATASET } from "./construction";
import { RESTAURANT_DATASET } from "./restaurant";
import { LAW_FIRM_DATASET } from "./lawFirm";
import { SECURITY_DATASET } from "./security";
import { EVENT_CENTER_DATASET } from "./eventCenter";
import { MEDICAL_DATASET } from "./medical";
import { PROPERTY_MANAGEMENT_DATASET } from "./propertyManagement";

const REGISTRY: Record<IndustryProfileKey, IndustryDataset> = {
  construction: CONSTRUCTION_DATASET,
  restaurant: RESTAURANT_DATASET,
  law_firm: LAW_FIRM_DATASET,
  security: SECURITY_DATASET,
  event_center: EVENT_CENTER_DATASET,
  medical: MEDICAL_DATASET,
  property_management: PROPERTY_MANAGEMENT_DATASET,
};

export function getIndustryDataset(key: IndustryProfileKey): IndustryDataset {
  return REGISTRY[key];
}

export function getDatasetEmployeeName(id: string, dataset: IndustryDataset) {
  return dataset.employees.find((e) => e.id === id)?.name ?? "Unknown";
}

export function getDatasetOrgName(id: string | null, dataset: IndustryDataset) {
  if (!id) return null;
  return dataset.organizations.find((o) => o.id === id)?.name ?? null;
}
