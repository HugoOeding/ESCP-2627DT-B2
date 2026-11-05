import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../test/utils';
import { BudgetBar } from './BudgetBar';

describe('BudgetBar', () => {
  it('shows the ok state', () => {
    renderWithApp(<BudgetBar spent={65} limit={130} />);
    expect(screen.getByText('Within budget')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('€65.00 left')).toBeInTheDocument();
  });
  it('shows the warning state at 90%', () => {
    renderWithApp(<BudgetBar spent={116.84} limit={130} />);
    expect(screen.getByText('€116.84 / €130.00')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('Close to your budget')).toBeInTheDocument();
  });
  it('shows the over state', () => {
    renderWithApp(<BudgetBar spent={136.5} limit={130} />);
    expect(screen.getByText('Over budget')).toBeInTheDocument();
    expect(screen.getByText('€6.50 over budget')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
  it('offers to set a budget without one', async () => {
    const onEdit = vi.fn();
    const { user } = renderWithApp(<BudgetBar spent={50} limit={0} onEdit={onEdit} />);
    await user.click(screen.getByRole('button', { name: 'Set a budget' }));
    expect(onEdit).toHaveBeenCalled();
  });
  it('is a button when editable', async () => {
    const onEdit = vi.fn();
    const { user } = renderWithApp(<BudgetBar spent={50} limit={100} onEdit={onEdit} />);
    await user.click(screen.getByRole('button', { name: /Edit budget/ }));
    expect(onEdit).toHaveBeenCalled();
  });
});
