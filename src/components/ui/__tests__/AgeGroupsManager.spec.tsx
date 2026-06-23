import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { AgeGroupsManager, type AgeGroupFormData } from '../AgeGroupsManager';

function AgeGroupsManagerHarness() {
  const [ageGroups, setAgeGroups] = useState<AgeGroupFormData[]>([]);

  return <AgeGroupsManager ageGroups={ageGroups} onChange={setAgeGroups} />;
}

describe('AgeGroupsManager', () => {
  it('allows a newly added age group to select the 4+1 game system', async () => {
    const user = userEvent.setup();

    render(<AgeGroupsManagerHarness />);

    await user.click(screen.getByRole('button', { name: /tournaments\.ageGroups\.add/i }));

    const gameSystemSelect = screen
      .getAllByRole('combobox')
      .find((select) => within(select).queryByRole('option', { name: '4+1 (5-a-side)' }));

    expect(gameSystemSelect).toBeInTheDocument();

    await user.selectOptions(gameSystemSelect as HTMLSelectElement, '4+1');

    expect(gameSystemSelect).toHaveValue('4+1');
    expect(screen.getByText('4+1')).toBeInTheDocument();
  });
});
