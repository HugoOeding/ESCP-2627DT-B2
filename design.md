# design.md — Smart Sub Tracker

> Design system and Storybook specification for the coding agent. This is the **Surface** layer on top of product.md (Skeleton). All values are defined as tokens in `tailwind.config.ts`; components must not use hard-coded colours or sizes.

---

## 1. Design Principles

1. **Calm, not alarming.** Money is stressful. Use neutral surfaces and reserve red for real urgency (deadlines, over budget). *(evidence.md: users feel they've "lost control")*
2. **The number first.** Every screen leads with the figure that matters: total, saving, days left.
3. **Trust is visible.** Privacy notes, clear "Sponsored" labels, no dark patterns, and cancel is always one tap away. *(Insight 5)*
4. **Readable for everyone.** Large tap targets, AA contrast, works at 200% text zoom. *(P7, Harold, 68)*
5. **One accent per view.** Only the main action uses the primary colour.

---

## 2. Brand

- **Name:** Smart Sub Tracker (short form: "SubTrack")
- **Logo:** wordmark "SubTrack" in the heading font, with a small circular-arrow mark (renewal symbol) in the primary colour
- **Personality:** a smart, honest friend: clear, warm, a little cheeky about wasted money, never preachy

---

## 3. Design Tokens

### 3.1 Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#F7F7FB` | `#121217` | Page background |
| `surface` | `#FFFFFF` | `#1C1C24` | Cards, sheets |
| `surface-muted` | `#EFEFF5` | `#26262F` | Inputs, chips, summary blocks |
| `border` | `#E2E2EA` | `#33333D` | Hairlines, card borders |
| `text` | `#16161D` | `#F2F2F7` | Primary text |
| `text-muted` | `#5C5C6B` | `#A3A3B2` | Secondary text, labels |
| `primary` | `#5B3FD9` | `#8F7BFF` | Primary button, active tab, links |
| `primary-soft` | `#ECE8FF` | `#2C2550` | Selected chips, primary tint |
| `on-primary` | `#FFFFFF` | `#121217` | Text on the primary colour |
| `success` | `#1E8E5A` | `#4CC38A` | Savings, "Paid", within budget |
| `success-soft` | `#E3F5EC` | `#163626` | Savings badge background |
| `warning` | `#B26A00` | `#F0B254` | Budget ≥ 80%, renewing soon |
| `warning-soft` | `#FFF1DB` | `#3A2A10` | Warning alert background |
| `danger` | `#C53030` | `#FF7A7A` | Deadline, over budget, price increase |
| `danger-soft` | `#FDE8E8` | `#3D1A1A` | Danger alert background |
| `sponsored` | `#5C5C6B` | `#A3A3B2` | "Sponsored" tag (deliberately neutral) |

**Rules**
- Text on a `*-soft` background uses the matching strong colour (e.g. `danger` on `danger-soft`).
- All text and background pairs meet WCAG AA (≥ 4.5:1 for body text, ≥ 3:1 for large text and icons).
- Never use colour alone to show meaning: always add an icon or a label (e.g. ↑ +9%).
- **Category colours** (icon backgrounds only): streaming `#E9E4FF`, music `#E0F2FE`, fitness `#E3F5EC`, sports `#FFF1DB`, software and cloud `#EFEFF5`, other `#F3E8EE`. In dark mode use the same hue at 20% opacity over `surface`.

### 3.2 Typography
System font stack, so no font download is needed (no network requests, see architecture.md):
`font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;`
Numbers use `font-variant-numeric: tabular-nums` so amounts line up.

| Token | Size / line height | Weight | Use |
|---|---|---|---|
| `display` | 32 / 40 px | 700 | Monthly total on the dashboard |
| `title` | 22 / 28 px | 700 | Screen titles |
| `heading` | 17 / 24 px | 600 | Section headings, card titles |
| `body` | 15 / 22 px | 400 | Default text |
| `label` | 13 / 18 px | 500 | Field labels, badges, metadata |
| `caption` | 12 / 16 px | 400 | Hints, legal notes, tab labels |

Sizes are in `rem` (base 16 px) so browser text zoom works. Text is in sentence case everywhere.

### 3.3 Spacing, radius, elevation

| Token | Value |
|---|---|
| `space-1` … `space-8` | 4, 8, 12, 16, 20, 24, 32, 40 px |
| Screen padding | 16 px left and right |
| Gap between cards | 12 px |
| `radius-sm` | 8 px (chips, inputs, badges) |
| `radius-md` | 12 px (buttons, list cards) |
| `radius-lg` | 20 px (summary card, overlays) |
| `radius-full` | 9999 px (FAB, pills, avatars) |
| `shadow-card` | none in light mode (border only); dark mode uses `border` too |
| `shadow-overlay` | `0 -8px 24px rgba(0,0,0,0.12)` (bottom sheets only) |

### 3.4 Sizing and touch
- Minimum touch target: **44 × 44 px**
- Button height 48 px (primary) and 40 px (secondary/small); input height 48 px
- Bottom nav height 64 px plus the safe area; the FAB is 56 px, 16 px from the edges

### 3.5 Motion
- Durations: `fast` 120 ms (press, toggle), `base` 200 ms (overlays, expand), `slow` 300 ms (page transition)
- Easing: `cubic-bezier(0.2, 0, 0, 1)`
- Respect `prefers-reduced-motion`: disable slide animations and use fades only

### 3.6 Iconography
- Icon set: **lucide-react**, 20 px (inline) and 24 px (nav, FAB), stroke 1.75
- Key icons: `home` (Dashboard), `tag` (New offers), `settings` (Settings), `plus` (FAB), `bell` (alerts), `upload` (statement import), `file-text` (letter), `users` (split), `trending-up` (price increase), `clock` (countdown), `lock` (privacy note), `copy`, `printer`, `download`, `mail`
- Service icons: a coloured category tile with the service's first letter. **No real brand logos.**

---

## 4. Tailwind Configuration

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-muted': 'rgb(var(--surface-muted) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-soft': 'rgb(var(--primary-soft) / <alpha-value>)',
        'on-primary': 'rgb(var(--on-primary) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        'success-soft': 'rgb(var(--success-soft) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        'warning-soft': 'rgb(var(--warning-soft) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        'danger-soft': 'rgb(var(--danger-soft) / <alpha-value>)',
      },
      fontSize: {
        display: ['2rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        title: ['1.375rem', { lineHeight: '1.75rem', fontWeight: '700' }],
        heading: ['1.0625rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        body: ['0.9375rem', { lineHeight: '1.375rem' }],
        label: ['0.8125rem', { lineHeight: '1.125rem', fontWeight: '500' }],
        caption: ['0.75rem', { lineHeight: '1rem' }],
      },
      borderRadius: { sm: '8px', md: '12px', lg: '20px' },
      boxShadow: { overlay: '0 -8px 24px rgba(0,0,0,0.12)' },
    },
  },
} satisfies Config;
```

The CSS variables are defined in `src/index.css` as RGB triplets for `:root` (light) and `.dark` (dark), using the values in §3.1. For example, `--primary: 91 63 217;` in light and `--primary: 143 123 255;` in dark.

---

## 5. Components (Storybook)

Every component lives in `src/components/` with a `*.stories.tsx` file. Each story file includes the listed stories plus a **Dark** variant (via a Storybook theme toggle) and an **A11y** check (`@storybook/addon-a11y`).

### 5.1 Foundations

**Button**
- Props: `variant: 'primary' | 'secondary' | 'ghost' | 'danger'`, `size: 'md' | 'sm'`, `icon?`, `fullWidth?`, `loading?`
- Look:
  - primary: `primary` background, `on-primary` text
  - secondary: `surface` background, `border` outline, `text` colour
  - ghost: no border, `primary` text
  - danger: `danger` text on `danger-soft`
- States: default, hover, pressed (scale 0.98), focus (2 px `primary` ring with 2 px offset), loading (spinner, label kept for width)
- Stories: Primary, Secondary, Ghost, Danger, WithIcon, Small, FullWidth, Loading

**Input**
- Props: `label`, `value`, `type: 'text' | 'number' | 'date' | 'email'`, `prefix?` (e.g. "€"), `hint?`, `error?`
- Label sits above the field. `error` shows red text below the field plus a red border; it never relies on the placeholder alone.
- Stories: Default, WithPrefix (price), Date, WithHint, Error, Disabled

**Toggle**
- Props: `label`, `checked`, `onChange`, `description?`
- Stories: Off, On, WithDescription

**SegmentedControl**
- Props: `options`, `value`. Used for Monthly/Yearly, EN/DE and the theme switch.
- Stories: TwoOptions, ThreeOptions

**Badge**
- Props: `tone: 'neutral' | 'primary' | 'success' | 'warning' | 'danger'`, `icon?`
- Stories: one per tone, plus "Trial", "Sponsored", "Shared 2/3 paid", "Paid"

**Overlay** (bottom sheet)
- Props: `title`, `open`, `onClose`, `children`
- Look: `surface` background, `radius-lg` top corners, `shadow-overlay`, drag handle, close button. Traps focus and closes on Esc.
- Stories: Short, LongScrolling

**EmptyState**
- Props: `icon`, `title`, `body`, `actions`
- Stories: NoSubscriptions, NoOffers

**BottomNav**
- Tabs: Dashboard (`home`), New offers (`tag`, with a count badge), Settings (`settings`)
- The active tab uses `primary` for the icon and label; inactive tabs use `text-muted`
- Stories: DashboardActive, OffersActiveWithBadge

### 5.2 Domain components

**SummaryCard**
- Shows the monthly total (`display`), yearly total and count (`label`, muted)
- Props: `monthlyTotal`, `yearlyTotal`, `count`
- Stories: Default, ZeroState, LargeAmount (€1,450.00 to check the layout)

**BudgetBar**
- Props: `spent`, `limit`
- Shows "€118 / €130" with a percentage. The bar fill is `success` below 80%, `warning` from 80% and `danger` from 100%; over budget shows "€6 over budget".
- Stories: Ok (50%), Warning (90%), Over (105%), NoBudget (shows "Set a budget" link)

**AlertBox** and **AlertItem**
- AlertBox: a card with a heading "Alerts" (`bell`), up to 3 AlertItems, and "Show all (n)"
- AlertItem props: `type`, `message`, `dueDate`, `onClick`
- Tone by type:

  | Type | Tone | Icon |
  |---|---|---|
  | cancel_deadline | danger | `file-text` |
  | trial_end | danger | `clock` |
  | price_change | warning | `trending-up` |
  | yearly_renewal | warning | `calendar` |
  | renewal | neutral | `repeat` |
  | budget | warning | `wallet` |

- Stories: Empty ("All clear"), Mixed (3 alerts), Overflow (7 alerts)

**SubscriptionCard**
- Props: `subscription`, `priceChange?`, `sharedStatus?`, `onClick`
- Layout: category icon tile · name (`heading`) and price per cycle (`label`) · `CountdownBadge` on the right, plus optional `PriceChangeTag`, "Trial" badge and "Shared 2/3 paid" badge
- Cancelled: shown at 60% emphasis (muted text, not opacity) with a "Cancelled" badge
- Stories: Monthly, Yearly, Trial, PriceIncreased, Shared, Cancelled, LongName

**CountdownBadge**
- Props: `date`, `label?` ("Renews", "Trial ends", "Cancel by")
- Tone: neutral above 7 days, warning at 3–7 days, danger at 2 days or less
- Text: "in 12 days", "in 3 days", "tomorrow", "today"
- Stories: Far, Soon, Tomorrow, Today

**PriceChangeTag**
- Props: `oldPrice`, `newPrice`
- Shows "↑ +9%" in danger (or "↓ −10%" in success) with the tooltip/aria-label "Price went up from €10.99 to €11.99"
- Stories: Increase, Decrease

**TipCard**
- Props: `text`, `saving?`, `action?`
- Look: `primary-soft` background with a lightbulb icon, and a saving shown in `success` text ("Save €10.99/month")
- Stories: Duplicate, MostExpensive, BackUnderBudget

**OfferCard**
- Props: `offer`, `saving`, `replaces`
- Layout: title · "Replaces TuneBox" (muted) · saving in `success` · "Sponsored" badge (neutral, always visible if sponsored) · "View" button (secondary)
- Stories: Alternative, Bundle, Sponsored, StudentDiscount

**DetectedPaymentRow** (statement import)
- Props: `payment`, `checked`, `onToggle`
- Shows a checkbox · merchant · "€13.99 · monthly · 3×". Already-tracked rows are disabled with an "Already tracked" label.
- Stories: Default, Checked, AlreadyTracked

**LetterPreview**
- Props: `letterText`, `language`, `onCopy`, `onPrint`, `onDownload`, `emailHref`
- Look: letter on a white "paper" surface (also white in dark mode, for print realism) in `body` size with a monospace-free layout. The action row has 4 icon buttons with labels.
- Print stylesheet: hide everything except the letter.
- Stories: English, German, MissingUserInfo (shows a hint linking to Settings)

**PrivacyNote**
- Shows a `lock` icon and the text "Your file is read on this device only and never uploaded." on `surface-muted`
- Stories: Default

### 5.3 Story checklist for the coding agent
- [ ] Every component above has a story file
- [ ] Each story file has a Dark variant
- [ ] The a11y addon shows no violations
- [ ] Stories use the mock data from `src/data/` (fictional brands only)

---

## 6. Screen Composition

How the components from §5 build the screens in product.md §4.

| Screen | Components (top to bottom) |
|---|---|
| S1 Dashboard | Header + family filter chip · SummaryCard · BudgetBar · AlertBox · Button (secondary, `upload`) "Import bank statement" · SubscriptionCard list · TipCard · FAB · BottomNav |
| S1.1 Statement import | Overlay · PrivacyNote · Button "Choose CSV file" · ghost link "Use sample statement" · DetectedPaymentRow list · Button (primary) "Add selected (n)" |
| S2 Add / edit | Header with back arrow · service search Input + Badge chips · Input (price, €) · SegmentedControl (Monthly/Yearly) · Input (date) · price-history chart · Toggle sections (Trial, Contract terms, Assign to, Split) · Button (primary) "Save" · Button (secondary, `file-text`) "Create cancellation letter" · Button (danger) "Mark as cancelled" |
| S2.1 Letter | Overlay · SegmentedControl EN/DE · LetterPreview |
| S3 New offers | Header · saving summary (`display` in `success`) · OfferCard list · "You might be paying twice" section · BottomNav |
| S4 Settings | Header · Input group (user info) · SegmentedControl (language) · SegmentedControl (theme) · reminder options · family members list · demo tools (date Input, Button danger "Reset demo data") · BottomNav |

**Price-history chart:** Recharts bar chart, 100 px tall, bars in `border`, with the current price bar in `primary` and labels in `caption`.

---

## 7. Content and Voice

- **Tone:** clear, friendly, a little cheeky; never guilt-tripping.
- **Mechanics:** sentence case, no exclamation marks in system text, contractions are fine, euro amounts as "€11.99" (EN) and "11,99 €" (DE).
- **Buttons:** verb first, 1–3 words ("Add subscription", "Create letter", "Add selected").

| Situation | Text (EN) |
|---|---|
| Empty dashboard | "Add your first subscription" · "Add one manually or import a bank statement." |
| Trial alert | "CloudVault trial ends in 2 days, then €2.99/month" |
| Deadline alert | "FitZone: last day to cancel is 30.11.2026" |
| Price alert | "TuneBox went up from €10.99 to €11.99 (+9%)" |
| Budget alert | "You've used 92% of your €130 budget" |
| Duplicate tip | "You pay for two music services. Keep one and save €10.99/month." |
| Import success | "4 new subscriptions found" |
| Cancelled | "Marked as cancelled. You'll save €40/month." |
| No offers | "No better offers right now" |
| Error (CSV) | "We couldn't read this file. Try a CSV export from your bank." |

All strings live in `i18n/en.json` and `i18n/de.json`.

---

## 8. Accessibility Checklist

- [ ] AA contrast in light and dark themes (checked with the Storybook a11y addon)
- [ ] All touch targets ≥ 44 × 44 px
- [ ] Visible focus ring on every interactive element
- [ ] Overlays trap focus, close on Esc and return focus to the trigger
- [ ] Icons that are the only content of a button have an `aria-label`
- [ ] Meaning never by colour alone (icons and text on all status badges)
- [ ] Layout works at 200% text zoom without horizontal scrolling
- [ ] `prefers-reduced-motion` respected
