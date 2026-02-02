import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Input from '../Input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render basic input', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render input with label', () => {
      render(<Input label="Email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
      // Input is rendered alongside label
      expect(document.querySelector('input')).toBeInTheDocument();
    });

    it('should render input with placeholder', () => {
      render(<Input placeholder="Enter your email" />);
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    it('should render required indicator when required', () => {
      render(<Input label="Email" required />);
      const label = screen.getByText('Email');
      expect(label).toHaveClass("after:content-['*']");
    });

    it('should render with correct input type', () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render with left icon', () => {
      render(
        <Input
          leftIcon={<span data-testid="left-icon">🔍</span>}
        />
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render with right icon', () => {
      render(
        <Input
          rightIcon={<span data-testid="right-icon">👁️</span>}
        />
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should render with both icons', () => {
      render(
        <Input
          leftIcon={<span data-testid="left-icon">🔍</span>}
          rightIcon={<span data-testid="right-icon">👁️</span>}
        />
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should add padding for left icon', () => {
      render(
        <Input leftIcon={<span>🔍</span>} />
      );
      expect(screen.getByRole('textbox')).toHaveClass('pl-10');
    });

    it('should add padding for right icon', () => {
      render(
        <Input rightIcon={<span>👁️</span>} />
      );
      expect(screen.getByRole('textbox')).toHaveClass('pr-10');
    });
  });

  describe('Error State', () => {
    it('should render error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should apply error styles', () => {
      render(<Input error="Error" name="test" />);
      expect(screen.getByRole('textbox')).toHaveClass('border-red-300');
    });

    it('should set aria-invalid to true when error', () => {
      render(<Input error="Error" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should set aria-invalid to false when no error', () => {
      render(<Input />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('should link error message with aria-describedby', () => {
      render(<Input error="Error message" name="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'email-error');
    });
  });

  describe('Helper Text', () => {
    it('should render helperText', () => {
      render(<Input helperText="This is helpful information" />);
      expect(screen.getByText('This is helpful information')).toBeInTheDocument();
    });

    it('should render hint as alias for helperText', () => {
      render(<Input hint="This is a hint" />);
      expect(screen.getByText('This is a hint')).toBeInTheDocument();
    });

    it('should prioritize helperText over hint', () => {
      render(<Input helperText="Helper" hint="Hint" />);
      expect(screen.getByText('Helper')).toBeInTheDocument();
      expect(screen.queryByText('Hint')).not.toBeInTheDocument();
    });

    it('should not show helperText when error is present', () => {
      render(<Input error="Error" helperText="Helper" />);
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    });

    it('should link helper text with aria-describedby', () => {
      render(<Input helperText="Helper" name="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-describedby', 'email-helper');
    });
  });

  describe('Input Interactions', () => {
    it('should accept user input', async () => {
      const user = userEvent.setup();
      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Hello World');

      expect(input).toHaveValue('Hello World');
    });

    it('should call onChange handler', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'a');

      expect(handleChange).toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is passed', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should be read-only when readOnly prop is passed', () => {
      render(<Input readOnly />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });
  });

  describe('Forwarding Ref', () => {
    it('should forward ref to input element', () => {
      const ref = vi.fn();
      render(<Input ref={ref} />);
      expect(ref).toHaveBeenCalled();
    });
  });

  describe('Custom Classes', () => {
    it('should apply custom className to input', () => {
      render(<Input className="custom-class" />);
      expect(screen.getByRole('textbox')).toHaveClass('custom-class');
    });

    it('should apply containerClassName to container', () => {
      render(<Input containerClassName="container-class" />);
      expect(screen.getByRole('textbox').parentElement?.parentElement).toHaveClass('container-class');
    });
  });

  describe('ID and Name', () => {
    it('should use id for label association', () => {
      render(<Input id="custom-id" label="Label" />);
      expect(screen.getByLabelText('Label')).toHaveAttribute('id', 'custom-id');
    });

    it('should fallback to name for label association', () => {
      render(<Input name="email" label="Email" />);
      expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email');
    });
  });

  describe('Accessibility', () => {
    it('should be focusable', async () => {
      const user = userEvent.setup();
      render(<Input />);

      const input = screen.getByRole('textbox');
      await user.tab();

      expect(input).toHaveFocus();
    });

    it('should have proper label association', () => {
      render(<Input label="Email Address" id="email" />);
      const label = screen.getByText('Email Address');
      expect(label).toHaveAttribute('for', 'email');
    });
  });
});
