import { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { useStore } from '../store/useStore';
import { Toast } from './Toast';

function Demo({ withAction = false }: { withAction?: boolean }) {
  useEffect(() => {
    useStore.setState({
      toast: {
        id: 'story',
        message: withAction ? "Marked as cancelled. You'll save €39.90/month." : '5 new subscriptions found',
        action: withAction ? { label: 'Undo', onAction: () => undefined } : undefined,
      },
    });
  }, [withAction]);
  return <Toast />;
}

const meta: Meta<typeof Demo> = { title: 'Foundations/Toast', component: Demo };
export default meta;
type Story = StoryObj<typeof Demo>;

export const Default: Story = {};
export const WithUndo: Story = { args: { withAction: true } };
export const Dark: Story = { args: { withAction: true }, globals: { theme: 'dark' } };
