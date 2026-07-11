# Launch-polish QA report

Date: 2026-07-10  
Scope: Public 3Stone One interactive demo only. No authentication, database, Supabase, Stripe, Workspace, contract, or backend architecture changes.

## Issues found and fixed

1. The public switcher covered four industries but omitted the four beauty/retail businesses required for outreach. Added Crown & Coil Salon, Luna Lash Atelier, Serein Skin Studio, and Northline Goods.
2. Beauty and retail could previously be previewed only as nonexistent/generic concepts. Added distinct customers, teams, work records, invoices, KPIs, charts, notifications, financial histories, and owner recommendations for each business.
3. The AI did not understand common owner questions about top employee revenue, lapsed/rebooking customers, low inventory, follow-up drafting, or first priority. Added data-derived intents with selected-business answers.
4. No guided demo mode existed. Added a ten-step, dismissible, restartable guided tour with keyboard controls and mobile-safe presentation.
5. The business switcher menu used a fixed width that could crowd narrow screens. Constrained it to the available viewport width.
6. No repeatable product QA or promotional recording automation existed. Added desktop/mobile Playwright coverage, all-route smoke coverage, all-eight-business switching coverage, AI/tour coverage, console-error capture, and three recording projects.
7. No launch copy package existed. Added social captions, LinkedIn posts, narration, SRT captions, shot lists, thumbnail ideas, and calls to action.
8. The brand monogram was rendered at a square ratio despite its 4:3 SVG view box, producing a Next.js browser warning. Corrected its rendered dimensions in login and shell locations.

## Issues reviewed but intentionally unchanged

- Demo authentication accepts any credentials. This is explicitly demo-grade and belongs to the separate production-readiness/backend scope.
- AI responses remain simulated from mock records. Copy and behavior stay consistent with the selected dataset and do not imply a live LLM or live integrations.
- Integrations, file actions, and other demo interactions remain simulated where already labeled or established. No backend work was introduced.
- The existing direct mock-data imports and simplified AI pattern remain intact. Documentation describes larger abstractions that are not present in current code; this branch does not silently introduce them.
- No full visual redesign, framework migration, or production dependency was introduced.

## Performance review

- Existing dashboard charts remain lazy-loaded.
- No new production dependency was added; Playwright is development-only.
- The guided tour uses the existing React/Next.js stack and adds no tour library.
- The optimized production build completed successfully. Generated static chunks totaled approximately 2.4 MB before compression across the application; no single new media asset is shipped in the app bundle.
- The switcher now remains within narrow mobile viewports and primary tour controls use at least 40px touch height.

## Automated verification

- TypeScript (`npx tsc --noEmit`): pass
- ESLint (`npm run lint`): pass
- Production build (`npm run build`): pass, 21 pages generated
- Playwright desktop/mobile: pass
- All 16 authenticated product routes render: pass
- Eight-business switching and distinct KPI checks: pass
- Selected-business AI response: pass
- Guided tour completion: pass
- Captured page/console errors: zero
- Promotional teaser recording: pass

## Remaining limitations

- The demo uses mock data, mock auth, simulated AI, and simulated third-party integrations.
- Automated tests validate route rendering and high-value workflows; they do not assert every secondary button mutation because many are intentionally simulated.
- Recordings are raw browser captures intended for editing with narration, on-screen captions, and a final branded end card.
- Playwright recordings are local artifacts and are gitignored to keep binary media out of source control.
- Dependency installation reported two moderate transitive audit findings. No forced dependency upgrades were applied during launch polish because that could introduce unrelated breaking changes.
