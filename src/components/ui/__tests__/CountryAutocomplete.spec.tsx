import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const searchLocations = vi.fn();
vi.mock('@/services/location.service', () => ({
  searchLocations: (...args: unknown[]) => searchLocations(...args),
}));

import CountryAutocomplete from '../CountryAutocomplete';

describe('CountryAutocomplete', () => {
  it('suggests countries from the local list without calling the locations API', () => {
    render(<CountryAutocomplete name="country" />);
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.change(input, { target: { value: 'Roma' } });

    expect(screen.getByText('Romania')).toBeInTheDocument();
    expect(searchLocations).not.toHaveBeenCalled();
  });
});
