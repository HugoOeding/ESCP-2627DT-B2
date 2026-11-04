import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PersistedState } from '../types';
import { AppRoutes } from '../App';
import { emptyState, resetStore, seedState, useStore } from '../store/useStore';
import { statementSource } from './statementSource';
import { routerFuture } from '../routerFuture';

const sampleCsv = readFileSync(resolve(__dirname, '../../public/sample-statement.csv'), 'utf8');
const originalLoadSample = statementSource.loadSample;

function renderApp(route = '/', state: PersistedState = seedState()) {
  resetStore(state);
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[route]} future={routerFuture}>
      <AppRoutes />
    </MemoryRouter>,
  );
  return { user };
}

const monthly = () => screen.getByTestId('monthly-total').textContent?.replace(/ /g, ' ');

afterEach(() => {
  statementSource.loadSample = originalLoadSample;
  vi.restoreAllMocks();
});

describe('first launch', () => {
  it('shows Welcome and loads the demo', async () => {
    const { user } = renderApp('/', emptyState());
    expect(screen.getByRole('heading', { level: 1, name: 'See every subscription in one place' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Explore the demo' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Your subscriptions' })).toBeInTheDocument();
    expect(monthly()).toBe('€116.84');
  });

  it('starts empty and opens the add screen', async () => {
    const { user } = renderApp('/settings', emptyState());
    await user.click(screen.getByRole('button', { name: 'Add manually' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Add subscription' })).toBeInTheDocument();
    expect(useStore.getState()).toMatchObject({ onboarded: true, subscriptions: [] });
  });

  it('starts empty with the import sheet open, then offers a budget once', async () => {
    const { user } = renderApp('/', emptyState());
    await user.click(screen.getByRole('button', { name: 'Import bank statement' }));
    const dialog = screen.getByRole('dialog', { name: 'Import bank statement' });
    expect(within(dialog).getByText(/read on this device only/)).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('heading', { name: 'Add your first subscription' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Set a monthly budget?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('heading', { name: 'Set a monthly budget?' })).toBeNull();
    expect(useStore.getState().budgetPromptDismissed).toBe(true);
  });

  it('redirects unknown routes and guards routes before onboarding', () => {
    renderApp('/nowhere');
    expect(screen.getByRole('heading', { level: 1, name: 'Your subscriptions' })).toBeInTheDocument();
  });
});

describe('S1 dashboard', () => {
  it('shows the seed totals, budget and the 3 most urgent alerts', async () => {
    const { user } = renderApp('/');
    expect(monthly()).toBe('€116.84');
    expect(screen.getByTestId('yearly-total')).toHaveTextContent('€1,402.07 per year');
    expect(screen.getByTestId('sub-count')).toHaveTextContent('9 subscriptions');
    expect(screen.getByText('€116.84 / €130.00')).toBeInTheDocument();
    expect(screen.getByText('Close to your budget')).toBeInTheDocument();
    const alerts = screen.getByRole('region', { name: 'Alerts' });
    const items = within(alerts).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('CloudVault trial ends in 2 days, then €2.99/month');
    expect(items[1]).toHaveTextContent('FitZone: last day to cancel is 30.11.2026');
    expect(items[2]).toHaveTextContent('TuneBox went up from €10.99 to €11.99 (+9%)');
    await user.click(within(alerts).getByRole('button', { name: 'Show all (6)' }));
    expect(within(alerts).getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByText('You pay for two music services. Keep one and save €10.99/month.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /New offers/ })).toHaveTextContent('8');
  });

  it('filters by family member', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('button', { name: 'Show subscriptions for: Everyone' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Max' }));
    expect(monthly()).toBe('€4.99');
    expect(screen.getAllByRole('button', { name: /GemsClub/ })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /StreamFlix/ })).toBeNull();
    expect(within(screen.getByRole('region', { name: 'Alerts' })).getAllByRole('listitem')).toHaveLength(3);
  });

  it('sorts by renewal date', async () => {
    const { user } = renderApp('/');
    const list = () => within(screen.getByRole('region', { name: 'Subscriptions' })).getAllByRole('listitem');
    expect(list()[0]).toHaveTextContent('FitZone');
    await user.click(screen.getByRole('radio', { name: 'Renewal' }));
    expect(list()[0]).toHaveTextContent('DailyLedger');
  });

  it('sets a budget from the budget bar and shows the back-under-budget tip', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('button', { name: /Edit budget/ }));
    const input = screen.getByLabelText('Limit per month');
    expect(input).toHaveFocus();
    await user.clear(input);
    await user.type(input, '100');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Over budget')).toBeInTheDocument();
    expect(screen.getByText('Cancelling KickPass would bring you back under your €100 budget.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Budget saved');
  });

  it('shows the budget error and removes a budget', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('button', { name: /Edit budget/ }));
    const input = screen.getByLabelText('Limit per month');
    await user.clear(input);
    await user.type(input, 'abc{Enter}');
    expect(screen.getByText('Enter an amount of €0 or more')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove budget' }));
    expect(screen.getByText('No budget set')).toBeInTheDocument();
    expect(useStore.getState().budget.monthlyLimit).toBe(0);
  });

  it('opens the budget sheet from the budget alert', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('button', { name: 'Show all (6)' }));
    await user.click(screen.getByRole('button', { name: /You've used 90% of your €130 budget/ }));
    expect(screen.getByRole('dialog', { name: 'Monthly budget' })).toBeInTheDocument();
  });
});

describe('S1.1 statement import', () => {
  it('detects 7 payments, skips tracked ones and imports 5', async () => {
    statementSource.loadSample = vi.fn(async () => sampleCsv);
    const { user } = renderApp('/');
    await user.click(screen.getByRole('button', { name: 'Import bank statement' }));
    const dialog = screen.getByRole('dialog', { name: 'Import bank statement' });
    await user.click(within(dialog).getByRole('button', { name: 'Use sample statement' }));
    expect(await within(dialog).findByText('We found 7 recurring payments')).toBeInTheDocument();
    expect(within(dialog).getAllByText('Already tracked')).toHaveLength(2);
    expect(within(dialog).getByRole('checkbox', { name: 'StreamFlix' })).toBeDisabled();
    expect(within(dialog).getByRole('checkbox', { name: 'TuneBox' })).toBeDisabled();
    expect(within(dialog).getByText('Likely free trial')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('checkbox', { name: 'SnackBox' }));
    expect(screen.getByRole('button', { name: 'Add selected (4)' })).toBeEnabled();
    await user.click(within(dialog).getByRole('checkbox', { name: 'SnackBox' }));
    await user.click(screen.getByRole('button', { name: 'Add selected (5)' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('5 new subscriptions found');
    expect(monthly()).toBe('€173.70');
    expect(useStore.getState().subscriptions.filter((s) => s.source === 'statement')).toHaveLength(5);
  });

  it('reads a chosen file and reports unreadable files', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('button', { name: 'Import bank statement' }));
    const input = screen.getByLabelText('Choose CSV file');
    await user.upload(input, new File(['hello,world\n1,2\n'], 'bad.csv', { type: 'text/csv' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't read this file. Try a CSV export from your bank.");
    await user.upload(input, new File([sampleCsv], 'statement.csv', { type: 'text/csv' }));
    expect(await screen.findByText('We found 7 recurring payments')).toBeInTheDocument();
  });

  it('rejects files over 2 MB and clears everything on close', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('button', { name: 'Import bank statement' }));
    const big = new File(['x'], 'big.csv', { type: 'text/csv' });
    Object.defineProperty(big, 'size', { value: 3 * 1024 * 1024 });
    await user.upload(screen.getByLabelText('Choose CSV file'), big);
    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't read this file. Try a CSV export from your bank.");
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(screen.getByRole('button', { name: 'Import bank statement' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});

describe('S2 add and edit', () => {
  it('adds a catalogue service and updates the S1 total', async () => {
    const { user } = renderApp('/subscription/new');
    await user.type(screen.getByLabelText('Search services'), 'docs');
    await user.click(screen.getByRole('button', { name: 'DocsPro' }));
    expect(screen.getByLabelText('Name *')).toHaveValue('DocsPro');
    expect(screen.getByLabelText('Price *')).toHaveValue('6.99');
    expect(screen.getByText('Next renewal: 20.12.2026')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Your subscriptions' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Added');
    expect(monthly()).toBe('€123.83');
  });

  it('validates and focuses the first invalid field', async () => {
    const { user } = renderApp('/subscription/new');
    await user.click(screen.getByRole('button', { name: 'Custom' }));
    await user.clear(screen.getByLabelText('Start date *'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Enter a name')).toBeInTheDocument();
    expect(screen.getByText('Enter a price above €0')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid date')).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toHaveFocus();
    await user.type(screen.getByLabelText('Name *'), 'Local paper');
    expect(screen.queryByText('Enter a name')).toBeNull();
  });

  it('adds a custom yearly subscription with a free trial', async () => {
    const { user } = renderApp('/subscription/new');
    await user.type(screen.getByLabelText('Search services'), 'zzz');
    expect(screen.getByText('No matching service. Use Custom to add your own.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Custom' }));
    expect(screen.getByLabelText('Name *')).toHaveValue('zzz');
    await user.type(screen.getByLabelText('Price *'), '24,00');
    await user.click(screen.getByRole('radio', { name: 'Yearly' }));
    await user.click(screen.getByRole('switch', { name: 'Free trial' }));
    expect(screen.getByLabelText('Price after trial')).toHaveValue('24,00');
    fireEvent.change(screen.getByLabelText('Trial end date'), { target: { value: '2026-12-01' } });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const added = useStore.getState().subscriptions.find((s) => s.name === 'zzz');
    expect(added).toMatchObject({ price: 24, billingCycle: 'yearly', status: 'trial', trialEndDate: '2026-12-01', priceAfterTrial: 24 });
  });

  it('records a price change when editing the price', async () => {
    const { user } = renderApp('/subscription/sub-3');
    const price = screen.getByLabelText('Price *');
    await user.clear(price);
    await user.type(price, '12.49');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
    expect(useStore.getState().priceChanges.at(-1)).toMatchObject({ subscriptionId: 'sub-3', oldPrice: 10.99, newPrice: 12.49 });
  });

  it('shows the price history for TuneBox', async () => {
    renderApp('/subscription/sub-2');
    expect(screen.getByText('Price went up from €10.99 to €11.99 on 01.11.2026')).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: /Price history: 05.09.2024: €9.99, 05.09.2025: €10.99, 01.11.2026: €11.99/ })).toBeInTheDocument();
  });

  it('shows the deadline and the letter with the termination date (EN and DE)', async () => {
    const { user } = renderApp('/subscription/sub-4');
    // Defined after userEvent.setup(), which installs its own clipboard stub.
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);
    const createObjectURL = vi.fn(() => 'blob:letter');
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    expect(screen.getByText('Last day to cancel: 30.11.2026', { selector: 'p.text-heading' })).toHaveClass('text-danger');
    await user.click(screen.getByRole('button', { name: 'Create cancellation letter' }));
    const dialog = screen.getByRole('dialog', { name: 'Cancellation letter' });
    expect(within(dialog).getByText('Termination date: 28.02.2027')).toBeInTheDocument();
    const letter = within(dialog).getByRole('document', { name: 'Letter preview' });
    expect(letter).toHaveTextContent('I hereby cancel my contract for FitZone (customer no. KD-20488) with effect from 28.02.2027');
    expect(letter).toHaveTextContent('Musterstraße 12, 10115 Berlin');
    expect(within(dialog).getByRole('link', { name: 'Email provider' }).getAttribute('href')).toMatch(/^mailto:cancel@fitzone\.example\?subject=/);
    await user.click(within(dialog).getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Dear Sir or Madam,'));
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
    await user.click(within(dialog).getByRole('button', { name: 'Print' }));
    expect(print).toHaveBeenCalled();
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('cancellation-FitZone-2026-11-20.txt');
    });
    await user.click(within(dialog).getByRole('button', { name: 'Download' }));
    expect(createObjectURL).toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalledTimes(1);
    await user.click(within(dialog).getByRole('radio', { name: 'Deutsch' }));
    expect(letter).toHaveTextContent('hiermit kündige ich meinen Vertrag über FitZone (Kundennummer KD-20488) fristgerecht zum 28.02.2027');
    expect(document.querySelector('[data-print-root]')?.textContent).toContain('Mit freundlichen Grüßen');
  });

  it('falls back to execCommand when the Clipboard API fails', async () => {
    const { user } = renderApp('/subscription/sub-4');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(async () => Promise.reject(new Error('denied'))) } });
    const exec = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: exec });
    await user.click(screen.getByRole('button', { name: 'Create cancellation letter' }));
    await user.click(screen.getByRole('button', { name: 'Copy' }));
    expect(exec).toHaveBeenCalledWith('copy');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
  });

  it('hints at missing profile data in the letter', async () => {
    const state = seedState();
    state.profile = { ...state.profile, name: '', address: '' };
    const { user } = renderApp('/subscription/sub-4', state);
    await user.click(screen.getByRole('button', { name: 'Create cancellation letter' }));
    expect(screen.getByText(/Add your name and address in Settings/)).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Open settings' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
  });

  it('marks as cancelled with undo and the saved line', async () => {
    const { user } = renderApp('/subscription/sub-4');
    await user.click(screen.getByRole('button', { name: 'Mark as cancelled' }));
    const dialog = screen.getByRole('dialog', { name: 'Mark FitZone as cancelled?' });
    await user.click(within(dialog).getByRole('button', { name: 'Mark as cancelled' }));
    expect(screen.getByRole('status')).toHaveTextContent("Marked as cancelled. You'll save €39.90/month.");
    expect(monthly()).toBe('€76.94');
    expect(screen.getByText('Saving €39.90/month from cancellations')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Cancelled' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(monthly()).toBe('€116.84');
  });

  it('reactivates and deletes', async () => {
    const state = seedState();
    state.subscriptions = state.subscriptions.map((s) => (s.id === 'sub-8' ? { ...s, status: 'cancelled' as const, cancelledAt: '2026-11-10' } : s));
    const { user } = renderApp('/subscription/sub-8', state);
    expect(screen.getByText('Cancelled on 10.11.2026')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create cancellation letter' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Reactivate' }));
    expect(useStore.getState().subscriptions.find((s) => s.id === 'sub-8')?.status).toBe('active');
    await user.click(screen.getByRole('button', { name: 'Delete subscription' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Delete DailyLedger?' })).getByRole('button', { name: 'Delete' }));
    expect(useStore.getState().subscriptions.some((s) => s.id === 'sub-8')).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent('Deleted');
  });

  it('keeps paid ticks for a shared plan and edits members', async () => {
    const { user } = renderApp('/subscription/sub-1');
    expect(screen.getByText('2 of 3 paid · Your share €4.67')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Jonas has paid' }));
    expect(screen.getByText('3 of 3 paid · Your share €4.67')).toBeInTheDocument();
    expect(useStore.getState().sharedPlans[0].members[2].paid).toBe(true);
    await user.type(screen.getByLabelText('Name of the new person'), 'Ana{Enter}');
    expect(screen.getByText('3 of 4 paid · Your share €3.52')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Custom' }));
    const lena = screen.getByLabelText('Share of Lena');
    await user.clear(lena);
    await user.type(lena, '5');
    expect(screen.getByText('€1.48 too much assigned')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText(/Shares must add up to €13.99/)).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Remove Ana' }));
    await user.clear(lena);
    await user.type(lena, '4.67');
    expect(screen.getByText('€2.34 left to assign')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Equal' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Shared 3/3 paid')).toBeInTheDocument();
  });

  it('assigns to a family member and removes a split', async () => {
    const { user } = renderApp('/subscription/sub-1');
    await user.click(screen.getByRole('switch', { name: 'Assign to' }));
    await user.selectOptions(screen.getByLabelText('Family member'), 'max');
    await user.click(screen.getByRole('switch', { name: 'Split costs' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(useStore.getState().subscriptions.find((s) => s.id === 'sub-1')).toMatchObject({ assignedTo: 'max', sharedPlanId: undefined });
    expect(useStore.getState().sharedPlans).toHaveLength(0);
  });

  it('shows "Cancel any time" without a notice period and a not-found state', async () => {
    renderApp('/subscription/sub-8');
    expect(screen.getByText('Cancel any time before 22.11.2026', { selector: 'p.text-body' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cancel online/ })).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a not-found state for unknown ids', async () => {
    const { user } = renderApp('/subscription/missing');
    expect(screen.getByRole('heading', { level: 1, name: 'This subscription no longer exists.' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Back to dashboard' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Your subscriptions' })).toBeInTheDocument();
  });
});

describe('S3 offers', () => {
  it('lists 7 offers worth €50.00/month, the duplicate group, and switches with highlighted cancel actions', async () => {
    const { user } = renderApp('/offers');
    expect(screen.getByText('Save up to €50.00/month')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^View / })).toHaveLength(7);
    expect(screen.getAllByText('Sponsored').length).toBeGreaterThan(0);
    const dup = screen.getByRole('region', { name: 'You might be paying twice' });
    expect(within(dup).getByText('You pay for two music services:')).toBeInTheDocument();
    expect(within(dup).getByText('Keep one and save €10.99/month')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View FitZone Flex, no minimum term' }));
    const dialog = screen.getByRole('dialog', { name: 'FitZone Flex, no minimum term' });
    expect(within(dialog).getByText('Replaces FitZone')).toBeInTheDocument();
    expect(within(dialog).getByText('Save €15.00/month')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Switch' }));
    expect(screen.getByRole('heading', { level: 1, name: 'FitZone' })).toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: 'Cancel this subscription' });
    expect(heading).toHaveFocus();
    expect(heading.closest('section')).toHaveClass('ring-2');
  });

  it('shows the empty state without matches', () => {
    renderApp('/offers', { ...seedState(), subscriptions: [] });
    expect(screen.getByText('No better offers right now')).toBeInTheDocument();
  });
});

describe('S4 settings', () => {
  it('switches to German everywhere', async () => {
    const { user } = renderApp('/settings');
    await user.click(screen.getByRole('radio', { name: 'Deutsch' }));
    expect(document.documentElement.lang).toBe('de');
    await user.click(screen.getByRole('link', { name: 'Übersicht' }));
    expect(monthly()).toBe('116,84 €');
    expect(screen.getByText('11,99 €/Monat')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Deine Abos' })).toBeInTheDocument();
  });

  it('applies the dark theme', async () => {
    const { user } = renderApp('/settings');
    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    await user.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('moves the demo date: the trial alert goes and CloudVault counts €2.99', async () => {
    const { user } = renderApp('/settings');
    fireEvent.change(screen.getByLabelText('Demo date'), { target: { value: '2026-11-23' } });
    await user.click(screen.getByRole('link', { name: 'Dashboard' }));
    expect(monthly()).toBe('€119.83');
    expect(screen.queryByText(/CloudVault trial ends/)).toBeNull();
  });

  it('saves the profile, reminders, budget and family members', async () => {
    const { user } = renderApp('/settings');
    const email = screen.getByLabelText('Email');
    await user.clear(email);
    await user.type(email, 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Save details' }));
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    await user.clear(email);
    await user.type(email, 'lena@example.com');
    await user.click(screen.getByRole('button', { name: 'Save details' }));
    expect(useStore.getState().profile.email).toBe('lena@example.com');
    await user.click(screen.getByRole('radio', { name: '7 days' }));
    expect(useStore.getState().settings.reminderDaysBefore).toBe(7);
    const budget = screen.getByLabelText('Monthly budget');
    await user.clear(budget);
    await user.type(budget, '150{Enter}');
    expect(useStore.getState().budget.monthlyLimit).toBe(150);
    await user.type(screen.getByLabelText('New member’s name'), 'Ella');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByText('Ella')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Max' }));
    expect(useStore.getState().familyMembers.map((m) => m.name)).toEqual(['Me', 'Ella']);
    expect(screen.queryByRole('button', { name: 'Remove Me' })).toBeNull();
  });

  it('resets the demo data and starts over', async () => {
    const { user } = renderApp('/settings');
    await act(async () => useStore.getState().markCancelled('sub-4'));
    await user.click(screen.getByRole('button', { name: 'Reset demo data' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Reset demo data?' })).getByRole('button', { name: 'Reset demo data' }));
    expect(screen.getByRole('status')).toHaveTextContent('Demo data reset');
    expect(useStore.getState().subscriptions.find((s) => s.id === 'sub-4')?.status).toBe('active');
    await user.click(screen.getByRole('button', { name: 'Use real date' }));
    expect(useStore.getState().settings.demoDate).toBeUndefined();
    await user.click(screen.getByRole('button', { name: 'Start over' }));
    await user.click(within(screen.getByRole('dialog', { name: 'Start over?' })).getByRole('button', { name: 'Start over' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: 'See every subscription in one place' })).toBeInTheDocument());
    expect(useStore.getState().onboarded).toBe(false);
  });
});

describe('onboarding guard', () => {
  it('sends onboarded users from Welcome to the dashboard', () => {
    renderApp('/welcome');
    expect(screen.getByRole('heading', { level: 1, name: 'Your subscriptions' })).toBeInTheDocument();
  });
  it('sends new users from any route to Welcome', () => {
    renderApp('/offers', emptyState());
    expect(screen.getByRole('heading', { level: 1, name: 'See every subscription in one place' })).toBeInTheDocument();
  });
});
