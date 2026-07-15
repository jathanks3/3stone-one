import type { IndustryProfileKey } from "@/types";

export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock" | "Discontinued";
export type MovementType = "Received" | "Sold" | "Used on a job" | "Returned" | "Damaged" | "Manual adjustment" | "Transferred" | "Reserved" | "Released from reservation";
export type PurchaseOrderStatus = "Draft" | "Submitted" | "Partially Received" | "Received" | "Delayed" | "Cancelled";

export interface InventoryProduct {
  id: string; name: string; description: string; sku: string; variant: string; category: string;
  onHand: number; reserved: number; reorderPoint: number; unitCost: number; sellingPrice: number;
  supplier: string; location: string; status?: StockStatus; unit?: string; lastMovedDays: number;
  suggestedReorder: number; notes: string[]; trend: number[];
}
export interface StockMovement { id: string; productId: string; quantity: number; date: string; type: MovementType; reason: string; source: string; location: string; reference: string }
export interface PurchaseOrder { id: string; number: string; supplier: string; orderDate: string; expectedDelivery: string; status: PurchaseOrderStatus; items: { productId: string; quantity: number; received: number; unitCost: number }[] }
export interface Supplier { id: string; name: string; contact: string; email: string; phone: string; leadTimeDays: number; reliability: number; totalSpend: number; lastDelivery: string; notes: string }
export interface InventoryDataset {
  label: string; noun: string; products: InventoryProduct[]; movements: StockMovement[]; purchaseOrders: PurchaseOrder[]; suppliers: Supplier[];
  terminology?: { catalog: string; onHand: string; reserved: string; reorder: string; receiving: string };
  analytics?: { turnoverLabel: string; turnoverDetail: string; riskLabel: string; riskDetail: string };
}

export const availableQuantity = (p: InventoryProduct) => Math.max(0, p.onHand - p.reserved);
export const productStatus = (p: InventoryProduct): StockStatus => p.status === "Discontinued" ? "Discontinued" : availableQuantity(p) <= 0 ? "Out of Stock" : availableQuantity(p) <= p.reorderPoint ? "Low Stock" : "In Stock";
export const estimatedMargin = (p: InventoryProduct) => p.sellingPrice ? ((p.sellingPrice - p.unitCost) / p.sellingPrice) * 100 : 0;
export const inventoryValue = (items: InventoryProduct[]) => items.reduce((sum, p) => sum + p.onHand * p.unitCost, 0);
export const purchaseOrderTotal = (po: PurchaseOrder) => po.items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0);

const suppliers: Supplier[] = [
  { id: "sup_north", name: "Northline Supply Co.", contact: "Maya Chen", email: "maya@northline.example", phone: "(555) 014-2201", leadTimeDays: 5, reliability: 96, totalSpend: 48200, lastDelivery: "Jul 12, 2026", notes: "Preferred terms; Tuesday and Friday delivery windows." },
  { id: "sup_harbor", name: "Harbor Wholesale", contact: "Eli Brooks", email: "eli@harbor.example", phone: "(555) 014-2288", leadTimeDays: 11, reliability: 88, totalSpend: 31940, lastDelivery: "Jul 8, 2026", notes: "Confirm substitutions before shipping." },
  { id: "sup_local", name: "Local Trade Partners", contact: "Sam Rivera", email: "sam@localtrade.example", phone: "(555) 014-2310", leadTimeDays: 2, reliability: 93, totalSpend: 17680, lastDelivery: "Jul 14, 2026", notes: "Best option for urgent replenishment." },
];

const supplierNames: Partial<Record<IndustryProfileKey, [string, string, string]>> = {
  clothing_brand: ["Evergreen Cut & Sew", "Pacific Blank Goods", "Threadline Trims"],
  restaurant: ["Green Valley Produce", "Coastal Foods Distribution", "Metro Restaurant Supply"],
  salon: ["Pro Beauty Distribution", "Lash Atelier Supply", "CleanTouch Consumables"],
  construction: ["Builders First Supply", "Allied Plumbing & HVAC", "TradePro Tool Depot"],
  event_center: ["Grand Event Furnishings", "Heritage Linen Co.", "VenueWorks Equipment"],
  security: ["Sentinel Equipment Group", "Uniform & PPE Direct", "FieldCom Systems"],
};

const terminology: Partial<Record<IndustryProfileKey, InventoryDataset["terminology"]>> = {
  clothing_brand: { catalog: "Product variants", onHand: "Units in stock", reserved: "Allocated to orders", reorder: "Variants to replenish", receiving: "Production & inbound" },
  restaurant: { catalog: "Ingredients & supplies", onHand: "Usable quantity", reserved: "Committed to service", reorder: "Ingredients to order", receiving: "Vendor deliveries" },
  salon: { catalog: "Retail & backbar", onHand: "Products on hand", reserved: "Committed to appointments", reorder: "Supplies to replenish", receiving: "Distributor deliveries" },
  construction: { catalog: "Materials, parts & tools", onHand: "Warehouse & truck stock", reserved: "Reserved for jobs", reorder: "Materials to replenish", receiving: "Material deliveries" },
  event_center: { catalog: "Event assets & supplies", onHand: "Assets on hand", reserved: "Allocated to events", reorder: "Assets to replenish", receiving: "Equipment deliveries" },
};

const analytics: Partial<Record<IndustryProfileKey, InventoryDataset["analytics"]>> = {
  clothing_brand: { turnoverLabel: "Sell-through velocity", turnoverDetail: "Variant movement across recent sales periods", riskLabel: "Variant concentration", riskDetail: "Sizes and colors with the highest stock exposure" },
  restaurant: { turnoverLabel: "Ingredient usage velocity", turnoverDetail: "Consumption across recent service periods", riskLabel: "Spoilage & shortage risk", riskDetail: "Perishables and ingredients below par" },
  salon: { turnoverLabel: "Product consumption", turnoverDetail: "Retail sales and backbar usage", riskLabel: "Weekend service coverage", riskDetail: "Consumables needed for booked services" },
  construction: { turnoverLabel: "Material usage velocity", turnoverDetail: "Warehouse and truck movement", riskLabel: "Job readiness", riskDetail: "Materials reserved against upcoming jobs" },
  event_center: { turnoverLabel: "Asset utilization", turnoverDetail: "Equipment allocated across events", riskLabel: "Event availability", riskDetail: "Shortages and damaged assets affecting bookings" },
};

function product(id: string, name: string, sku: string, category: string, onHand: number, reserved: number, reorderPoint: number, unitCost: number, sellingPrice: number, variant: string, supplier: string, location: string, lastMovedDays: number, suggestedReorder: number, unit = "units"): InventoryProduct {
  return { id, name, description: `${name} tracked across purchasing, storage, and operational usage.`, sku, category, onHand, reserved, reorderPoint, unitCost, sellingPrice, variant, supplier, location, lastMovedDays, suggestedReorder, unit, notes: ["Cycle count verified July 12.", "Barcode / QR identifier can be added when scanning is enabled."], trend: [18, 22, 20, 27, 25, Math.max(1, onHand)] };
}

const datasets: Partial<Record<IndustryProfileKey, InventoryDataset>> = {
  clothing_brand: { label: "Products, variants & collections", noun: "Variant", products: [
    product("app_hoodie", "Core Fleece Hoodie", "HD-COR-BLK-M", "Fall Core", 42, 17, 18, 24, 72, "Black · Medium", "Northline Supply Co.", "Warehouse · Apparel A2", 1, 48),
    product("app_tee", "Heavyweight Logo Tee", "TE-HVY-WHT-L", "Essentials", 11, 6, 10, 11, 34, "White · Large", "Harbor Wholesale", "Warehouse · Apparel B1", 3, 60),
    product("app_jacket", "Quilted Field Jacket", "JK-FLD-OLV-S", "Fall 2026", 0, 0, 8, 48, 128, "Olive · Small", "Northline Supply Co.", "Warehouse · Apparel A4", 5, 24),
    product("app_cap", "Embroidered Canvas Cap", "AC-CAP-NVY", "Accessories", 68, 22, 20, 9, 28, "Navy · One size", "Local Trade Partners", "Warehouse · Accessories C1", 67, 36),
  ], movements: [], purchaseOrders: [], suppliers },
  salon: { label: "Retail products & professional supplies", noun: "Product", products: [
    product("sal_shampoo", "Hydrating Retail Shampoo", "RTL-SHM-250", "Retail", 14, 3, 12, 12, 32, "250 ml", "Northline Supply Co.", "Front retail wall", 2, 24),
    product("sal_adhesive", "Lash Extension Adhesive", "PRO-ADH-005", "Professional use", 3, 1, 4, 21, 0, "5 ml", "Harbor Wholesale", "Lash room cabinet", 1, 12),
    product("sal_gloves", "Nitrile Gloves", "DSP-GLV-S", "Disposables", 0, 0, 5, 8.5, 0, "Small · box of 100", "Local Trade Partners", "Backbar storage", 4, 10, "boxes"),
    product("sal_serum", "Aftercare Brow Serum", "RTL-SER-030", "Retail", 21, 4, 8, 14, 39, "30 ml", "Northline Supply Co.", "Front retail wall", 61, 12),
  ], movements: [], purchaseOrders: [], suppliers },
  construction: { label: "Materials & field inventory", noun: "Item", products: [
    product("con_pipe", "3/4 in. Copper Pipe", "MAT-COP-075", "Job materials", 84, 24, 30, 18.5, 31, "10 ft length", "Northline Supply Co.", "Main warehouse · A-12", 2, 80),
    product("con_valve", "Pressure Relief Valve", "PRT-VAL-210", "Parts", 9, 7, 8, 42, 76, "210°F", "Harbor Wholesale", "Service truck 3", 5, 24),
    product("con_drill", "Cordless Hammer Drill", "TOL-DRL-18V", "Tools", 12, 4, 3, 159, 0, "18V kit", "Local Trade Partners", "Tool cage", 14, 0),
    product("con_filter", "HVAC Pleated Filter", "PRT-FLT-1625", "Parts", 0, 0, 12, 8.4, 19, "16×25×1", "Northline Supply Co.", "Main warehouse · B-04", 9, 48),
    product("con_wire", "12/2 NM-B Electrical Wire", "MAT-WIR-122", "Job materials", 21, 15, 10, 86, 124, "250 ft roll", "Harbor Wholesale", "Main warehouse · C-02", 64, 20),
  ], movements: [], purchaseOrders: [], suppliers },
  restaurant: { label: "Ingredients & restaurant supplies", noun: "Ingredient", products: [
    product("rst_salmon", "Atlantic Salmon Fillet", "ING-SAL-001", "Proteins", 18, 8, 12, 9.8, 28, "6 oz portion", "Harbor Wholesale", "Uptown walk-in", 1, 36, "portions"),
    product("rst_oil", "Extra Virgin Olive Oil", "ING-OIL-5L", "Pantry", 6, 1, 6, 31, 0, "5 L tin", "Northline Supply Co.", "Central dry storage", 3, 12, "tins"),
    product("rst_boxes", "Compostable Takeout Box", "PKG-BOX-9", "Packaging", 240, 80, 100, 0.42, 0, "9 in.", "Local Trade Partners", "Riverside storage", 2, 500),
    product("rst_lime", "Fresh Limes", "ING-LIM-040", "Produce", 0, 0, 24, 0.38, 0, "Each", "Local Trade Partners", "Lakeside walk-in", 1, 120, "each"),
    product("rst_wine", "House Cabernet", "BEV-CAB-750", "Beverage", 42, 12, 18, 11.5, 38, "750 ml", "Harbor Wholesale", "Uptown cellar", 71, 24, "bottles"),
  ], movements: [], purchaseOrders: [], suppliers },
  event_center: { label: "Event equipment & supplies", noun: "Asset", products: [
    product("evt_chair", "Walnut Cross-Back Chair", "FUR-CHR-WAL", "Furniture", 320, 190, 40, 62, 9, "Walnut", "Northline Supply Co.", "Warehouse · Bay 1", 1, 60),
    product("evt_linen", "Ivory Round Linen", "LIN-RND-IVR", "Linens", 46, 40, 18, 24, 18, "120 in.", "Harbor Wholesale", "Linen room", 2, 36),
    product("evt_glass", "Stemless Wine Glass", "BAR-GLS-015", "Bar supplies", 0, 0, 72, 2.1, 0, "15 oz", "Local Trade Partners", "Bar storage", 4, 144),
    product("evt_uplight", "Wireless LED Uplight", "AV-LGT-RGB", "Equipment", 28, 20, 8, 185, 45, "RGBWA+UV", "Northline Supply Co.", "AV cage", 17, 8),
  ], movements: [], purchaseOrders: [], suppliers },
  security: { label: "Operational supplies", noun: "Supply", products: [
    product("sec_radio", "Digital Two-Way Radio", "OPS-RAD-DMR", "Field equipment", 38, 24, 8, 118, 0, "DMR", "Northline Supply Co.", "Equipment room", 3, 12),
    product("sec_vest", "High-Visibility Safety Vest", "PPE-VST-HV", "PPE", 14, 8, 12, 14, 0, "L/XL", "Local Trade Partners", "Uniform cage", 8, 36),
    product("sec_battery", "Radio Battery Pack", "OPS-BAT-2200", "Parts", 0, 0, 10, 29, 0, "2200 mAh", "Harbor Wholesale", "Equipment room", 6, 24),
  ], movements: [], purchaseOrders: [], suppliers },
};

for (const [key, dataset] of Object.entries(datasets) as [IndustryProfileKey, InventoryDataset][]) {
  if (!dataset) continue;
  const names = supplierNames[key];
  if (names) {
    dataset.suppliers = suppliers.map((supplier, index) => ({ ...supplier, id: `${key}_${supplier.id}`, name: names[index] }));
    dataset.products = dataset.products.map((item) => ({ ...item, supplier: names[Math.max(0, suppliers.findIndex((supplier) => supplier.name === item.supplier))] }));
  }
  dataset.terminology = terminology[key] ?? { catalog: "Inventory catalog", onHand: "Units on hand", reserved: "Units reserved", reorder: "Items to replenish", receiving: "Receiving pipeline" };
  dataset.analytics = analytics[key] ?? { turnoverLabel: "Inventory turnover", turnoverDetail: "Movement across recent periods", riskLabel: "Operational coverage", riskDetail: "Stock availability against demand" };
  const [a, b, c] = dataset.products;
  dataset.movements = [
    { id: `${a.id}_m1`, productId: a.id, quantity: 24, date: "2026-07-14", type: "Received", reason: "Scheduled replenishment", source: "Jordan Lee", location: a.location, reference: "RCV-1048" },
    { id: `${b.id}_m2`, productId: b.id, quantity: -4, date: "2026-07-13", type: key === "clothing_brand" || key === "restaurant" ? "Sold" : "Used on a job", reason: key === "salon" ? "Consumed during booked services" : key === "event_center" ? "Allocated to weekend event" : "Operational usage", source: "3Stone workflow", location: b.location, reference: key === "clothing_brand" ? "ORD-2841" : "JOB-2841" },
    { id: `${c.id}_m3`, productId: c.id, quantity: -1, date: "2026-07-11", type: "Damaged", reason: key === "restaurant" ? "Spoilage recorded during close" : "Removed during cycle count", source: "Alex Morgan", location: c.location, reference: "ADJ-0391" },
    { id: `${a.id}_m4`, productId: a.id, quantity: -6, date: "2026-07-10", type: "Reserved", reason: "Upcoming confirmed work", source: "Scheduling automation", location: a.location, reference: "RSV-1172" },
  ];
  dataset.purchaseOrders = [
    { id: `${key}_po_1048`, number: key === "clothing_brand" ? "PO-APP-1048" : key === "restaurant" ? "VD-1048" : "PO-1048", supplier: a.supplier, orderDate: "2026-07-10", expectedDelivery: "2026-07-17", status: "Submitted", items: [{ productId: a.id, quantity: a.suggestedReorder || 24, received: 0, unitCost: a.unitCost }, { productId: b.id, quantity: b.suggestedReorder || 12, received: 0, unitCost: b.unitCost }] },
    { id: `${key}_po_1042`, number: key === "restaurant" ? "VD-1042" : "PO-1042", supplier: c.supplier, orderDate: "2026-07-04", expectedDelivery: "2026-07-15", status: "Partially Received", items: [{ productId: c.id, quantity: c.suggestedReorder || 16, received: Math.round((c.suggestedReorder || 16) / 2), unitCost: c.unitCost }] },
    { id: `${key}_po_1037`, number: key === "restaurant" ? "VD-1037" : "PO-1037", supplier: a.supplier, orderDate: "2026-06-27", expectedDelivery: "2026-07-02", status: "Received", items: [{ productId: a.id, quantity: 20, received: 20, unitCost: a.unitCost }] },
  ];
}

const lightDataset = (label: string): InventoryDataset => ({ ...datasets.security!, label });
export function getInventoryDataset(key: IndustryProfileKey): InventoryDataset {
  return datasets[key] ?? lightDataset("Operational supplies");
}
