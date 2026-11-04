# Smart Sub Tracker (SubTrack)

SubTrack is a mobile-first web app prototype that shows every subscription in one place: the real monthly and yearly total, a budget bar, and reminders before free trials end, plans renew or cancellation deadlines pass. It writes a ready-to-send cancellation letter (English or German), finds recurring payments and likely free trials in a bank statement CSV, splits shared plans, and points out cheaper offers and duplicate services. It runs entirely in the browser with fictional demo data.

## The three hard constraints

1. **No external APIs or runtime network requests.** No backend, CDN fonts, analytics or web images. The only request is "Use sample statement", which loads `sample-statement.csv` from the app's own origin.
2. **No real data or brands.** Every service, person and address is fictional; email domains end in `.example`; there are no logos (services get a coloured tile with their initial).
3. **Nothing personal leaves the device.** State lives in `localStorage` (`sst-store-v2`). An uploaded statement is parsed in memory and discarded; only the subscriptions you confirm are kept.

## Run it

Requires Node 20 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on port 5173 |
| `npm run build` | Type-check (`tsc -b`) and production build to `dist/` |
| `npm run preview` | Serve the production build (port 4173) |
| `npm run test` | Vitest in watch mode (`npm run test -- --run` for a single run) |
| `npm run test:coverage` | Single run with coverage for `src/lib` (fails below 90% lines) |
| `npm run storybook` | Component library on port 6006, with light/dark themes and the a11y panel |
| `npm run build-storybook` | Static Storybook in `storybook-static/` |

## Project structure

```
├── product.md · architecture.md · design.md · evidence.md   source documents (unchanged)
├── DECISIONS.md            gap decisions and judgement calls
├── index.html              applies the stored theme before React mounts (no flash)
├── public/                 favicon.svg, sample-statement.csv
├── .storybook/             Storybook config (themes, a11y, router + seeded store decorator)
├── .github/workflows/      deploy.yml (test, build, GitHub Pages)
└── src/
    ├── App.tsx             HashRouter, onboarding guard, theme + language effects, bottom nav
    ├── index.css           design tokens (light/dark), print and reduced-motion rules
    ├── types/              data model (architecture.md §4 plus additions)
    ├── data/               services.json (20), seed.json (Lena), offers.json (10), letterTemplates.ts
    ├── i18n/               en.json, de.json, t.ts (interpolation and plurals)
    ├── store/              useStore.ts (zustand persist), selectors.ts
    ├── lib/                pure, tested logic: dates, calculations, contracts, alerts,
    │                       statementParser, letter, offers, tips, subscriptionForm, format, …
    ├── components/         UI components, each with a *.stories.tsx (and a test where there is logic)
    └── pages/              Welcome, Dashboard (S1 + import + budget), SubscriptionEdit (S2 + letter),
                            Offers (S3), Settings (S4)
```

## Demo walkthrough

The demo date is 20.11.2026 (Settings › Demo tools), so the numbers below are stable.

1. Start with clean storage: the Welcome screen appears. Choose **Explore the demo**.
2. **Dashboard:** €116.84 per month, €1,402.07 per year, 9 subscriptions. Budget €116.84 / €130.00, 90%, in the warning state. Alerts: CloudVault trial ends in 2 days, FitZone's last day to cancel is 30.11.2026, TuneBox went up 9%, and **Show all (6)** for the rest.
3. Tap the **FitZone** alert. S2 leads with "Last day to cancel: 30.11.2026" and the contract details. **Create cancellation letter** shows Lena's name and address, FitZone's address, customer no. KD-20488 and the termination date 28.02.2027. Switch to **DE**, then try Copy, Download, Print and Email provider.
4. **Mark as cancelled** and confirm. The toast says "You'll save €39.90/month"; the dashboard shows €76.94, FitZone under "Cancelled", and "Saving €39.90/month from cancellations".
5. **Import bank statement › Use sample statement:** 7 rows. StreamFlix and TuneBox are "Already tracked", MovieMax is a "Likely free trial". **Add selected (5)** → "5 new subscriptions found".
6. **New offers:** "Save up to €50.00/month", Sponsored labels, and "You might be paying twice" for the two music services. **View** an offer, then **Switch**: S2 opens with the cancel actions highlighted.
7. **Settings:** choose **Deutsch** and the whole app is German ("116,84 €"). **Dark** stays readable. Set the demo date to 23.11.2026 and the CloudVault trial alert disappears; CloudVault now counts €2.99.
8. Open **StreamFlix** and tick Jonas as paid: the card shows "Shared 3/3 paid".
9. **Reset demo data** brings back the numbers from step 2.

## Tests

- 194 tests: unit tests for every `src/lib` module, the store, i18n key parity, data-shape checks, component tests (React Testing Library) and page tests for the walkthrough.
- `src/lib` coverage: 99.9% lines, 97.6% branches, 100% functions.
- The brief's expected numbers are asserted directly (totals, the six alerts in order, offers, statement detection, letter snapshots in EN and DE).

## Deploy to GitHub Pages

1. In the repository on GitHub, go to **Settings › Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. The workflow in `.github/workflows/deploy.yml` runs the tests, builds, and publishes `dist/`.

The app uses hash routes and relative asset paths, so it works under `https://<user>.github.io/<repo>/` without extra configuration.

## Credits

ESCP Digital Transformation group project. All brands, people and addresses are fictional.
