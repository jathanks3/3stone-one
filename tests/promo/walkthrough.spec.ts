import { expect, test, type Page } from "@playwright/test";

const pause = (page: Page, ms: number) => page.waitForTimeout(ms);
async function moveAndClick(page: Page, selector: string) {
  const target = page.locator(selector).first();
  const box = await target.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 24 });
  await target.click();
}
async function login(page: Page) {
  await page.goto("/login");
  await pause(page, 1200);
  await moveAndClick(page, "text=Try the Live Demo");
  await expect(page).toHaveURL(/\/dashboard/);
  await pause(page, 1400);
}
async function switchTo(page: Page, name: string) {
  await moveAndClick(page, "[data-tour='business-switcher']");
  await pause(page, 500);
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await pause(page, 1200);
}

test("record promotional walkthrough", async ({ page }, testInfo) => {
  await login(page);
  const teaser = testInfo.project.name === "vertical-teaser";
  const linkedin = testInfo.project.name === "linkedin";
  await switchTo(page, "Northstar Events & Venue");
  await switchTo(page, "Crown & Coil Salon");
  await moveAndClick(page, "[data-tour='ai-assistant']");
  await page.getByPlaceholder("Ask about your business…").fill("What should I focus on first?");
  await page.getByRole("button", { name: "Send" }).click();
  await pause(page, linkedin ? 3500 : 2200);
  if (!teaser) {
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await switchTo(page, "Northstar Events & Venue");
    await page.goto("/crm"); await pause(page, linkedin ? 2400 : 1600);
    await page.goto("/finance"); await pause(page, linkedin ? 2600 : 1700);
    await switchTo(page, "Northline Goods");
    await page.goto("/dashboard"); await pause(page, linkedin ? 2800 : 1800);
  }
  await page.goto("/portfolio");
  await pause(page, linkedin ? 4500 : 2500);
});
