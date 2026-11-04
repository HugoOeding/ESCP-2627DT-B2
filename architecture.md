# architecture.md — Smart Sub Tracker

> Technology stack and technical rules for the coding agent. The prototype must be a functional web app with **no external APIs and no real data**. Everything runs in the browser with mock data. Read together with product.md and design.md.

---

## 1. Overview

A single-page web app (SPA), mobile-first, running entirely on the client.

```
┌──────────────────────────── Browser ────────────────────────────┐
│  React UI: S1 Dashboard · S2 Add/edit · S3 New offers · S4 Settings │
│        │                                                         │
│        ▼                                                         │
│  State store (Zustand)  ──►  localStorage (persistence)          │
│        ▲                         ▲                               │
│        │ seed on first launch    │ user-selected CSV file        │
│  Mock data (JSON)          Statement parser (in browser only)    │
│  services, seed, offers,                                         │
│  letter templates                                                │
└──────────────────────────────────────────────────────────────────┘
```

No backend, no database server, no network calls. Uploaded statement files are read with the browser's FileReader and never leave the device.

---

## 2. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Types catch agent mistakes early; the data model is explicit |
| Framework | **React 18** | Widely known; coding agents are strong at it |
| Build tool | **Vite** | Fast dev server, zero config |
| Routing | **React Router v6** | Maps onto screens S1–S4 |
| State | **Zustand** with `persist` middleware | Tiny; stores state in localStorage automatically |
| Styling | **Tailwind CSS** | Design tokens from design.md map onto the Tailwind config; `dark:` variant for the colour theme |
| Charts | **Recharts** | Price-history chart |
| Icons | **lucide-react** | Consistent, free icon set |
| Dates | **date-fns** | Renewal, countdown and cancellation-deadline calculations |
| CSV parsing | **Papa Parse** | Parses bank statement CSV in the browser |
| Translations | Simple `i18n/en.json` + `i18n/de.json` with a `t()` helper | EN/DE without an extra library |
| Component library docs | **Storybook** | Required by the brief (design.md "storybook") |
| Testing | **Vitest** + React Testing Library | Unit tests for calculation, detection and letter logic |
| Hosting (optional) | **GitHub Pages** via GitHub Actions | Free; repo already on GitHub |

**Not used (deliberately):** backend frameworks, real bank APIs (no Open Banking), any AI/LLM features, user authentication, screen-time or usage tracking, AI token tracking, subscription comparison (see product.md §2.2).

---

## 3. Project Structure

```
smart-sub-tracker/
├── README.md
├── evidence.md
├── product.md
├── design.md
├── architecture.md
├── package.json
├── vite.config.ts
├── tailwind.config.ts            # tokens from design.md
├── .storybook/
├── public/
│   ├── icons/                    # generic service icons (no real brand logos)
│   └── sample-statement.csv      # demo bank statement for F2
└── src/
    ├── main.tsx
    ├── App.tsx                   # router + layout with bottom tab bar
    ├── types/
    │   └── index.ts              # data model (section 4)
    ├── data/
    │   ├── services.json         # catalogue of ~20 fictional services
    │   ├── seed.json             # demo user (Lena): subscriptions, price changes, family
    │   ├── offers.json           # ~10 mock sponsored offers (F8)
    │   └── letterTemplates.ts    # EN/DE cancellation letter templates (F5)
    ├── i18n/
    │   ├── en.json
    │   ├── de.json
    │   └── t.ts                  # translation helper
    ├── store/
    │   └── useStore.ts           # Zustand store + actions
    ├── lib/
    │   ├── calculations.ts       # totals, monthly equivalent, budget status
    │   ├── dates.ts              # today() (demo date aware), next renewal, countdown
    │   ├── contracts.ts          # last day to cancel, termination date
    │   ├── alerts.ts             # derive alerts from state
    │   ├── statementParser.ts    # CSV → recurring payments and likely trials (F2, F6)
    │   ├── letter.ts             # fill letter template (F5)
    │   ├── offers.ts             # match sponsored offers and duplicates (F8)
    │   └── tips.ts               # rule-based savings tips (F3)
    ├── components/               # reusable UI, each with *.stories.tsx
    │   ├── SummaryCard.tsx
    │   ├── BudgetBar.tsx
    │   ├── AlertBox.tsx
    │   ├── AlertItem.tsx
    │   ├── SubscriptionCard.tsx
    │   ├── CountdownBadge.tsx
    │   ├── PriceChangeTag.tsx
    │   ├── TipCard.tsx
    │   ├── OfferCard.tsx
    │   ├── LetterPreview.tsx
    │   ├── Overlay.tsx
    │   ├── BottomNav.tsx
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   ├── Toggle.tsx
    │   └── EmptyState.tsx
    └── pages/
        ├── Dashboard.tsx         # S1 (+ S1.1 StatementImport overlay)
        ├── SubscriptionEdit.tsx  # S2 (+ S2.1 CancellationLetter overlay)
        ├── Offers.tsx            # S3
        └── Settings.tsx          # S4
```

Routes: `/` (S1), `/subscription/new` and `/subscription/:id` (S2), `/offers` (S3), `/settings` (S4).

---

## 4. Data Model (TypeScript)

```ts
export type BillingCycle = 'monthly' | 'yearly';
export type SubStatus = 'active' | 'trial' | 'cancelled';
export type Category = 'streaming' | 'music' | 'software' | 'cloud' | 'fitness' | 'sports' | 'news' | 'gaming' | 'food' | 'other';

export interface Service {             // catalogue entry
  id: string;
  name: string;                        // fictional, e.g. "StreamFlix"
  category: Category;
  defaultPrice: number;
  noticePeriodDays: number;            // e.g. 0, 30, 90
  providerAddress: string;             // fictional address
  providerEmail: string;               // e.g. cancel@streamflix.example
  cancelUrl: string;                   // e.g. https://streamflix.example/cancel
}

export interface Subscription {
  id: string;
  serviceId?: string;                  // undefined = custom
  name: string;
  category: Category;
  price: number;                       // current price in EUR
  billingCycle: BillingCycle;
  startDate: string;                   // ISO date
  nextRenewal: string;                 // ISO date, calculated
  status: SubStatus;
  trialEndDate?: string;
  priceAfterTrial?: number;
  minimumTermEnd?: string;             // ISO date, for fixed-term contracts
  noticePeriodDays: number;            // 0 = cancel any time
  providerName: string;
  providerAddress?: string;
  providerEmail?: string;
  cancelUrl?: string;
  customerNumber?: string;
  assignedTo?: string;                 // FamilyMember id
  sharedPlanId?: string;
  source: 'manual' | 'statement';
}

export interface PriceChange {
  id: string;
  subscriptionId: string;
  oldPrice: number;
  newPrice: number;
  date: string;
}

export interface SharedPlan {
  id: string;
  subscriptionId: string;
  members: { name: string; share: number; paid: boolean }[];
}

export interface FamilyMember { id: string; name: string; }

export interface Budget { monthlyLimit: number; }

export interface Offer {
  id: string;
  title: string;                       // e.g. "Student plan for TuneBox"
  description: string;
  matchesCategory: Category;
  matchesServiceId?: string;
  monthlyPrice: number;
  sponsored: boolean;
}

export interface UserProfile {
  name: string;
  address: string;
  email: string;
  language: 'en' | 'de';
  theme: 'light' | 'dark' | 'system';
}

export interface Settings {
  reminderDaysBefore: number;          // default 3
  yearlyReminderDays: number;          // default 30
  demoDate?: string;                   // overrides today() for presentations
}

export interface Transaction {         // parsed from CSV, not persisted
  date: string;
  merchant: string;
  amount: number;
}

export interface DetectedPayment {
  merchant: string;
  amount: number;
  interval: 'monthly' | 'yearly';
  occurrences: number;
  likelyTrial: boolean;                // €0/€1 charge followed by a full-price charge
  alreadyTracked: boolean;
}

export type AlertType = 'trial_end' | 'renewal' | 'yearly_renewal' | 'price_change' | 'cancel_deadline' | 'budget';
export interface Alert {               // derived, never stored
  id: string;
  type: AlertType;
  subscriptionId?: string;
  message: string;
  dueDate: string;
  urgency: number;                     // lower = more urgent, for sorting
}
```

---

## 5. Core Logic Rules

- **Monthly equivalent:** yearly price ÷ 12. Totals include *active and trial* subscriptions. Trials count at €0 until `trialEndDate`, then at `priceAfterTrial`.
- **Next renewal:** advance `startDate` by the billing cycle until it's after `today()`.
- **Last day to cancel** (`contracts.ts`):
  - If `minimumTermEnd` is set and in the future: `minimumTermEnd − noticePeriodDays`
  - Otherwise: `nextRenewal − noticePeriodDays`
  - If `noticePeriodDays` = 0: "Cancel any time before `nextRenewal`"
- **Termination date in the letter:** `minimumTermEnd` if it's still reachable, otherwise the next possible renewal end after the notice period.
- **Alerts** (`alerts.ts`) are derived on every render from state and `today()`, sorted by urgency:
  - `trial_end`: `trialEndDate` within `reminderDaysBefore` days
  - `cancel_deadline`: last day to cancel within 14 days
  - `yearly_renewal`: a yearly plan renews within `yearlyReminderDays` days
  - `renewal`: a monthly plan renews within `reminderDaysBefore` days
  - `price_change`: a `PriceChange` in the last 30 days
  - `budget`: monthly total ≥ 80% of `monthlyLimit`
- **Price change:** editing a subscription's price automatically creates a `PriceChange` record.
- **Budget status:** `ok` < 80% ≤ `warning` < 100% ≤ `over`.

### 5.1 Statement detection (`statementParser.ts`)
1. Parse the CSV with Papa Parse. Expected columns are `date, description, amount` (German exports with `Buchungstag, Verwendungszweck, Betrag` are also mapped). Amounts use a comma or dot as decimal separator.
2. Keep only outgoing payments (amount < 0).
3. Normalise merchant names: lowercase, strip reference numbers and dates.
4. Group by merchant. A group is **recurring** if it has ≥ 2 payments with an amount within ±5% and intervals of 28–33 days (monthly) or 360–370 days (yearly).
5. Mark `alreadyTracked` if a subscription has a similar name.
6. **Trial detection:** a merchant with a first charge of €0–€1 followed by a full-price charge 7–31 days later → `likelyTrial: true`; added as a trial-type subscription.
7. Return a `DetectedPayment[]`. Nothing is persisted until the user confirms; afterwards the file contents and transactions are dropped from memory (product.md O1).

### 5.2 Cancellation letter (`letter.ts`)
- Fills `letterTemplates.ts` (EN/DE) with: user name and address, provider name and address, today's date, customer number, subject line, termination date, and the request for written confirmation.
- Output is plain text, used by `LetterPreview` for:
  - Copy (Clipboard API)
  - Print (`window.print()` with a print stylesheet)
  - Download (a `.txt` Blob)
  - Email (a `mailto:` link to `providerEmail`, with subject and body filled in)

### 5.3 Offers and tips (`offers.ts`, `tips.ts`)
- **Offers:** an offer matches when its `matchesServiceId` or `matchesCategory` fits an active subscription and its `monthlyPrice` is lower. The saving is the current monthly equivalent minus the offer price.
- **Duplicates:** 2 or more active subscriptions in the same category (music, streaming) → "You might be paying twice".
- **Tips:** most expensive subscription; duplicates; the subscription whose cancellation would bring the total back under budget.

## 6. Simulated Features (No APIs)

| Feature | How it works in the prototype |
|---|---|
| F2 Bank statement import | Real CSV parsing in the browser. "Use sample statement" loads `public/sample-statement.csv`. No bank connection. The parsed file and transactions are discarded after import (product.md O1). |
| F5 Cancellation letter + link | Real letter generation. The "Email provider" link and the "Cancel online" link point to fictional `.example` addresses, so nothing is actually sent. |
| F8 Sponsored offers | Matched from `offers.json`; offers and sponsors are fictional. |
| F4 Reminders | In-app only (dashboard alert box). No push or email. |
| Today's date | `today()` returns `settings.demoDate` if set. Presenters can jump forward to show alerts and deadlines firing. |

**Mock data rules:** fictional brand names only (e.g. "StreamFlix", "TuneBox", "WaveMusic", "FitZone", "CloudVault"), fictional addresses, `.example` email domains, no real people and no real account numbers.

## 7. Persistence

- Zustand `persist` saves the store to localStorage key `sst-store-v2`.
- On first launch (no key found), the store is seeded from `seed.json`.
- "Reset demo data" in Settings clears the key and reseeds.
- The colour theme is applied by setting a `dark` class on `<html>`. `system` follows `prefers-color-scheme`.

## 8. Non-Functional Requirements

- Mobile-first layout: design for 390 px width; on desktop, content is centred at max-width 480 px.
- WCAG AA colour contrast in both themes; all controls reachable by keyboard; inputs have labels; supports browser text zoom up to 200%.
- All UI strings go through `t()`; no hard-coded text in components.
- Lighthouse performance score ≥ 90.
- No console errors in the browser.
- No network requests at runtime (check the browser's Network tab).

## 9. Scripts (for the README)

```bash
npm install          # install dependencies
npm run dev          # start dev server at http://localhost:5173
npm run build        # production build to /dist
npm run test         # run Vitest unit tests
npm run storybook    # component library at http://localhost:6006
```

## 10. Rules for the Coding Agent

1. Read `product.md`, `design.md` and this file before writing code.
2. Build in this order:
   1. types
   2. mock data and the sample CSV
   3. `lib/` logic with unit tests (dates, contracts, statement parser, letter)
   4. store
   5. components with stories
   6. pages
   7. routing
3. Use only the libraries listed in section 2; ask before adding others.
4. Never call external URLs or APIs. All data comes from `src/data/`, `public/` or the user's selected file.
5. Use design tokens from `tailwind.config.ts`; no hard-coded colours.
6. Each component in `components/` gets a `*.stories.tsx` file.
7. Keep business logic in `lib/`, not inside components.
8. After each step, run `npm run build` and `npm run test` and fix errors before continuing.
