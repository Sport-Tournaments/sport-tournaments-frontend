import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '../Select';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

describe('Select Component', () => {
  describe('Rendering', () => {
    it('should render select element', () => {
      render(<Select options={mockOptions} name="test-select" />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<Select options={mockOptions} label="Select Option" name="test-select" />);
      expect(screen.getByText('Select Option')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Option')).toBeInTheDocument();
    });

    it('should render all options', () => {
      render(<Select options={mockOptions} name="test-select" />);
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
    });

    it('should render placeholder when provided', () => {
      render(<Select options={mockOptions} placeholder="Select an option" name="test-select" />);
      expect(screen.getByRole('option', { name: 'Select an option' })).toBeInTheDocument();
    });

    it('should render required indicator when required', () => {
      render(<Select options={mockOptions} label="Required Field" required name="test-select" />);
      const label = screen.getByText('Required Field');
      expect(label).toHaveClass("after:content-['*']");
    });
  });

  describe('Error State', () => {
    it('should render error message', () => {
      render(<Select options={mockOptions} error="This field is required" name="test-select" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should apply error styles', () => {
      render(<Select options={mockOptions} error="Error" name="test-select" />);
      expect(screen.getByRole('combobox')).toHaveClass('outline-red-500');
    });

    it('should set aria-invalid to true when error', () => {
      render(<Select options={mockOptions} error="Error" name="test-select" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should set aria-invalid to false when no error', () => {
      render(<Select options={mockOptions} name="test-select" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('should link error message with aria-describedby', () => {
      render(<Select options={mockOptions} error="Error" name="country" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-describedby', 'country-error');
    });
  });

  describe('Helper Text', () => {
    it('should render helper text', () => {
      render(<Select options={mockOptions} helperText="Select your preferred option" name="test-select" />);
      expect(screen.getByText('Select your preferred option')).toBeInTheDocument();
    });

    it('should not show helper text when error is present', () => {
      render(<Select options={mockOptions} error="Error" helperText="Helper" name="test-select" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });

    it('should link helper text with aria-describedby', () => {
      render(<Select options={mockOptions} helperText="Helper" name="country" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-describedby', 'country-helper');
    });
  });

  describe('Selection', () => {
    it('should call onChange when selection changes', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Select options={mockOptions} onChange={handleChange} name="test-select" />);

      await user.selectOptions(screen.getByRole('combobox'), 'option2');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should update value when selection changes', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} name="test-select" />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'option2');

      expect(select).toHaveValue('option2');
    });

    it('should render with default value', () => {
      render(<Select options={mockOptions} defaultValue="option2" name="test-select" />);
      expect(screen.getByRole('combobox')).toHaveValue('option2');
    });

    it('should render with controlled value', () => {
      render(<Select options={mockOptions} value="option3" onChange={() => {}} name="test-select" />);
      expect(screen.getByRole('combobox')).toHaveValue('option3');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is passed', () => {
      render(<Select options={mockOptions} disabled name="test-select" />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Select options={mockOptions} disabled name="test-select" />);
      expect(screen.getByRole('combobox')).toHaveClass('cursor-not-allowed');
    });

    it('should render disabled options', () => {
      const optionsWithDisabled = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2', disabled: true },
      ];
      render(<Select options={optionsWithDisabled} name="test-select" />);
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeDisabled();
    });
  });

  describe('Forwarding Ref', () => {
    it('should forward ref to select element', () => {
      const ref = vi.fn();
      render(<Select options={mockOptions} ref={ref} name="test-select" />);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Custom Classes', () => {
    it('should apply custom className to select', () => {
      render(<Select options={mockOptions} className="custom-class" name="test-select" />);
      expect(screen.getByRole('combobox')).toHaveClass('custom-class');
    });

    it('should apply containerClassName to container', () => {
      render(<Select options={mockOptions} containerClassName="container-class" name="test-select" />);
      expect(screen.getByRole('combobox').parentElement?.parentElement).toHaveClass('container-class');
    });
  });

  describe('ID and Name', () => {
    it('should use id for label association', () => {
      render(<Select options={mockOptions} id="custom-id" label="Label" />);
      expect(screen.getByLabelText('Label')).toHaveAttribute('id', 'custom-id');
    });

    it('should fallback to name for label association', () => {
      render(<Select options={mockOptions} name="country" label="Country" />);
      expect(screen.getByLabelText('Country')).toHaveAttribute('id', 'country');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', async () => {
      const user = userEvent.setup();
      render(<Select options={mockOptions} name="test-select" />);

      const select = screen.getByRole('combobox');
      await user.tab();

      expect(select).toHaveFocus();
    });

    it('should have proper label association', () => {
      render(<Select options={mockOptions} label="Country" id="country" />);
      const label = screen.getByText('Country');
      expect(label).toHaveAttribute('for', 'country');
    });

    it('should have dropdown indicator icon with aria-hidden', () => {
      render(<Select options={mockOptions} name="test-select" />);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
