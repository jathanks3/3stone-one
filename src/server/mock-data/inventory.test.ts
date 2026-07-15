import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { availableQuantity, getInventoryDataset, inventoryValue, productStatus, purchaseOrderTotal } from "./inventory.ts";

describe("inventory calculations and industry datasets", () => {
  it("calculates available quantity without going negative", () => {
    const product = getInventoryDataset("clothing_brand").products[0];
    assert.equal(availableQuantity(product), product.onHand - product.reserved);
    assert.equal(availableQuantity({ ...product, onHand: 2, reserved: 4 }), 0);
  });

  it("calculates inventory value from on-hand cost", () => {
    const products = getInventoryDataset("restaurant").products;
    assert.equal(inventoryValue(products), products.reduce((sum, product) => sum + product.onHand * product.unitCost, 0));
  });

  it("derives low and out-of-stock states", () => {
    const products = getInventoryDataset("restaurant").products;
    assert.ok(products.some((product) => productStatus(product) === "Low Stock"));
    assert.ok(products.some((product) => productStatus(product) === "Out of Stock"));
  });

  it("calculates purchase-order totals", () => {
    const order = getInventoryDataset("construction").purchaseOrders[0];
    assert.equal(purchaseOrderTotal(order), order.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0));
  });

  it("provides distinct datasets for key inventory industries", () => {
    const clothing = getInventoryDataset("clothing_brand");
    const salon = getInventoryDataset("salon");
    const restaurant = getInventoryDataset("restaurant");
    const construction = getInventoryDataset("construction");
    const events = getInventoryDataset("event_center");
    assert.match(clothing.products[0].variant, /Black/);
    assert.equal(salon.noun, "Product");
    assert.equal(restaurant.noun, "Ingredient");
    assert.equal(events.noun, "Asset");
    assert.notEqual(clothing.suppliers[0].name, restaurant.suppliers[0].name);
    assert.notEqual(salon.purchaseOrders[0].supplier, construction.purchaseOrders[0].supplier);
    assert.match(restaurant.analytics!.riskLabel, /Spoilage/);
    assert.match(construction.terminology!.reserved, /jobs/);
  });
});
