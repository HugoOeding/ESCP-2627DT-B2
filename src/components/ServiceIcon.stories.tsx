import type { Meta, StoryObj } from '@storybook/react';
import services from '../data/services.json';
import type { Service } from '../types';
import { ServiceIcon } from './ServiceIcon';

const all = services as Service[];

const meta: Meta<typeof ServiceIcon> = { title: 'Domain/ServiceIcon', component: ServiceIcon, args: { name: 'StreamFlix', category: 'streaming' } };
export default meta;
type Story = StoryObj<typeof ServiceIcon>;

export const Small: Story = { args: { size: 32 } };
export const Medium: Story = { args: { size: 40 } };
export const Large: Story = { args: { size: 48 } };
const Catalogue = () => (
  <div className="flex flex-wrap gap-2">
    {all.map((s) => (
      <ServiceIcon key={s.id} name={s.name} category={s.category} />
    ))}
  </div>
);
export const AllCategories: Story = { render: Catalogue };
export const Dark: Story = { render: Catalogue, globals: { theme: 'dark' } };
