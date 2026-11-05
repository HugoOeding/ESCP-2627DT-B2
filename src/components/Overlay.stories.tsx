import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Overlay } from './Overlay';

function Demo({ long = false }: { long?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open overlay</Button>
      <Overlay title="Monthly budget" open={open} onClose={() => setOpen(false)} footer={<Button fullWidth onClick={() => setOpen(false)}>Save</Button>}>
        {long ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 30 }, (_, i) => (
              <p key={i}>Paragraph {i + 1}: a long scrolling sheet keeps its header and footer in view.</p>
            ))}
          </div>
        ) : (
          <p>Set a limit per month and we will warn you when you get close.</p>
        )}
      </Overlay>
    </>
  );
}

const meta: Meta<typeof Demo> = { title: 'Foundations/Overlay', component: Demo, parameters: { a11y: { element: 'body' } } };
export default meta;
type Story = StoryObj<typeof Demo>;

export const Short: Story = {};
export const LongScrolling: Story = { args: { long: true } };
export const Dark: Story = { globals: { theme: 'dark' } };
