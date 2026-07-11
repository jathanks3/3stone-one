import { expect, test, type Page } from "@playwright/test";

async function enterDemo(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Try the Live Demo" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("demo navigation, business switching, AI, and tour stay error-free", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await enterDemo(page);

  await page.locator("[data-tour='business-switcher']").click();
  await page.getByRole("button", { name: /Crown & Coil Salon/ }).click();
  await expect(page.getByText("Appointments Today")).toBeVisible();
  await expect(page.getByText("Rebooking Rate")).toBeVisible();

  await page.locator("[data-tour='ai-assistant']").click();
  await page.getByPlaceholder("Ask about your business…").fill("Which customers have not booked again?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/have not had recent contact/)).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();

  await page.getByRole("button", { name: "Start guided tour" }).click();
  await expect(page.getByRole("dialog")).toContainText("Executive Overview");
  const tour = page.getByRole("dialog");
  for (let i = 0; i < 9; i += 1) await tour.getByRole("button", { name: i === 8 ? "Finish" : "Next", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test("all public demo businesses expose distinct dashboard context", async ({ page }) => {
  await enterDemo(page);
  const businesses = [
    ["Red Oak Construction", "Jobs Behind Schedule"], ["Ember Table Restaurant Group", "Food Cost %"],
    ["Sentinel Security Services", "Guard Coverage %"], ["Northstar Events & Venue", "Deposits Outstanding"], ["Crown & Coil Salon", "Appointments Today"],
    ["Luna Lash Atelier", "Fills Due"], ["Serein Skin Studio", "Treatments Booked"], ["Northline Goods", "Orders Today"],
  ];
  for (const [business, kpi] of businesses) {
    await page.locator("[data-tour='business-switcher']").click();
    await page.getByRole("button", { name: new RegExp(business) }).click();
    await expect(page.getByText(kpi, { exact: true })).toBeVisible();
  }
});

test("every product route renders without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  await enterDemo(page);
  const routes = ["dashboard", "portfolio", "crm", "projects", "people", "communications", "meetings", "documents", "knowledge", "finance", "client-portal", "automation", "analytics", "integrations", "activity", "settings"];
  for (const route of routes) {
    await page.goto(`/${route}`);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("main")).not.toBeEmpty();
  }
  expect(errors).toEqual([]);
});
