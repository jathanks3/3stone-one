# Promotional shot list

## Vertical teaser · 15–30 seconds

1. Login hero and “Try the Live Demo” (2s)
2. Executive dashboard opening (3s)
3. Open My Businesses and switch Event Center → Hair Salon (6s)
4. Open AI and ask “What should I focus on first?” (6s)
5. Hold on the data-based answer (4s)
6. End card/portfolio view with: “One Login. One Platform. One AI.” (3s)

## Vertical walkthrough · 45–60 seconds

1. Problem caption: “Your business should not require six dashboards.”
2. Login and dashboard.
3. Switch to Northstar Events & Venue; show CRM and deposits in Finance.
4. Switch to Crown & Coil Salon; show appointments and rebooking.
5. Ask the AI what needs attention.
6. Switch to Northline Goods; show orders, fulfillment, and inventory context.
7. Return to Executive Overview.
8. CTA: “Explore the interactive demo.”

## LinkedIn · 60–90 seconds

Use the same sequence with slower holds. Narrate the business problem, explain the owner-level overview, show the full switcher, demonstrate Event Center CRM and Finance, show Salon and Clothing KPIs, ask the AI a specific question, and finish on the Executive Overview. Keep the cursor deliberate and allow 2–4 seconds for each value point to land.

## Recording commands

```bash
npx playwright install chromium
npm run video:teaser
npm run video:vertical
npm run video:linkedin
```

Set `PLAYWRIGHT_BASE_URL=https://3stone-one.vercel.app` before a command to record the deployed demo instead of starting the local app. Videos are written under `test-results/`; copy approved final cuts into `marketing/recordings/` if they should be retained outside Playwright’s generated output.
