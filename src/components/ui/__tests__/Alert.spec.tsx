import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Alert from '../Alert';

describe('Alert Component', () => {
  describe('Rendering', () => {
    it('should render alert with children', () => {
      render(<Alert>Alert message</Alert>);
      expect(screen.getByText('Alert message')).toBeInTheDocument();
    });

    it('should render with title', () => {
      render(<Alert title="Alert Title">Alert message</Alert>);
      expect(screen.getByText('Alert Title')).toBeInTheDocument();
    });

    it('should render with role alert', () => {
      render(<Alert>Alert message</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render success variant', () => {
      render(<Alert variant="success">Success message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-green-50');
    });

    it('should render error variant', () => {
      render(<Alert variant="error">Error message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-red-50');
    });

    it('should render warning variant', () => {
      render(<Alert variant="warning">Warning message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-yellow-50');
    });

    it('should render info variant (default)', () => {
      render(<Alert variant="info">Info message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-blue-50');
    });

    it('should default to info variant', () => {
      render(<Alert>Default message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-blue-50');
    });
  });

  describe('Accent Border', () => {
    it('should render with accent border when enabled', () => {
      render(<Alert accentBorder variant="success">Message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-l-4');
    });

    it('should render rounded corners without accent border', () => {
      render(<Alert variant="success">Message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('rounded-md');
    });

    it('should apply correct border color for success', () => {
      render(<Alert accentBorder variant="success">Message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-green-400');
    });

    it('should apply correct border color for error', () => {
      render(<Alert accentBorder variant="error">Message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-red-400');
    });

    it('should apply correct border color for warning', () => {
      render(<Alert accentBorder variant="warning">Message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-yellow-400');
    });

    it('should apply correct border color for info', () => {
      render(<Alert accentBorder variant="info">Message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-blue-400');
    });
  });

  describe('Close Button', () => {
    it('should render close button when onClose is provided', () => {
      const onClose = vi.fn();
      render(<Alert onClose={onClose}>Message</Alert>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not render close button when onClose is not provided', () => {
      render(<Alert>Message</Alert>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<Alert onClose={onClose}>Message</Alert>);

      await user.click(screen.getByRole('button'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should have accessible name for close button', () => {
      const onClose = vi.fn();
      render(<Alert onClose={onClose}>Message</Alert>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Dismiss');
    });
  });

  describe('Icons', () => {
    it('should render success icon for success variant', () => {
      render(<Alert variant="success">Message</Alert>);
      // Check for SVG icon presence
      const alert = screen.getByRole('alert');
      expect(alert.querySelector('svg')).toBeInTheDocument();
    });

    it('should render error icon for error variant', () => {
      render(<Alert variant="error">Message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert.querySelector('svg')).toBeInTheDocument();
    });

    it('should render warning icon for warning variant', () => {
      render(<Alert variant="warning">Message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert.querySelector('svg')).toBeInTheDocument();
    });

    it('should render info icon for info variant', () => {
      render(<Alert variant="info">Message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Custom Classes', () => {
    it('should apply custom className', () => {
      render(<Alert className="custom-class">Message</Alert>);
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('custom-class');
    });
  });

  describe('Text Colors', () => {
    it('should apply success text colors', () => {
      render(<Alert variant="success" title="Title">Message</Alert>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-green-800');
    });

    it('should apply error text colors', () => {
      render(<Alert variant="error" title="Title">Message</Alert>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-red-800');
    });

    it('should apply warning text colors', () => {
      render(<Alert variant="warning" title="Title">Message</Alert>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-yellow-800');
    });

    it('should apply info text colors', () => {
      render(<Alert variant="info" title="Title">Message</Alert>);
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-blue-800');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      render(<Alert>Message</Alert>);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have hidden decorative icons', () => {
      render(<Alert variant="success">Message</Alert>);
      const alert = screen.getByRole('alert');
      const svg = alert.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
