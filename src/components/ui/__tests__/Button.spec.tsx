import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@/components/ui/Button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should render with default variant (primary)', () => {
      render(<Button>Primary Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-indigo-600');
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('should render primary variant correctly', () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-indigo-600');
      expect(button).toHaveClass('text-white');
    });

    it('should render secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white');
      expect(button).toHaveClass('text-gray-900');
    });

    it('should render outline variant correctly', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2');
      expect(button).toHaveClass('border-indigo-600');
    });

    it('should render ghost variant correctly', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-gray-700');
    });

    it('should render danger variant correctly', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });

    it('should render success variant correctly', () => {
      render(<Button variant="success">Success</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-600');
    });

    it('should render soft variant correctly', () => {
      render(<Button variant="soft">Soft</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-indigo-50');
      expect(button).toHaveClass('text-indigo-600');
    });
  });

  describe('Sizes', () => {
    it('should render xs size correctly', () => {
      render(<Button size="xs">Extra Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('should render sm size correctly', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-2.5', 'py-1.5', 'text-sm');
    });

    it('should render md size (default) correctly', () => {
      render(<Button size="md">Medium</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-3', 'py-2', 'text-sm');
    });

    it('should render lg size correctly', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-3.5', 'py-2.5', 'text-sm');
    });

    it('should render xl size correctly', () => {
      render(<Button size="xl">Extra Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-4', 'py-3', 'text-base');
    });

    it('should render icon size correctly', () => {
      render(<Button size="icon">🔍</Button>);
      expect(screen.getByRole('button')).toHaveClass('p-2', 'aspect-square');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveClass('cursor-wait');
    });

    it('should disable button when loading', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not show children when loading', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should have disabled styles', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
    });
  });

  describe('Full Width', () => {
    it('should have full width when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByRole('button')).toHaveClass('w-full');
    });
  });

  describe('Icons', () => {
    it('should render left icon', () => {
      render(<Button leftIcon={<span data-testid="left-icon">←</span>}>With Icon</Button>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
      render(<Button rightIcon={<span data-testid="right-icon">→</span>}>With Icon</Button>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should render both icons', () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Both Icons
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Events', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick} disabled>Click me</Button>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();
      
      render(<Button onClick={handleClick} isLoading>Click me</Button>);
      await user.click(screen.getByRole('button'));
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct role', () => {
      render(<Button>Accessible Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should be focusable', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should support type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">×</Button>);
      expect(screen.getByRole('button', { name: /close dialog/i })).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('should pass through HTML button attributes', () => {
      render(
        <Button
          data-testid="test-button"
          id="my-button"
          name="submit-btn"
        >
          Button
        </Button>
      );
      
      const button = screen.getByTestId('test-button');
      expect(button).toHaveAttribute('id', 'my-button');
      expect(button).toHaveAttribute('name', 'submit-btn');
    });
  });
});
