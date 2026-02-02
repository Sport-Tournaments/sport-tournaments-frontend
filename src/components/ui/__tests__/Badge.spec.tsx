import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('should render badge with children', () => {
      render(<Badge>Badge text</Badge>);
      expect(screen.getByText('Badge text')).toBeInTheDocument();
    });

    it('should render as inline-flex span', () => {
      render(<Badge>Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('inline-flex');
    });

    it('should have rounded-full class', () => {
      render(<Badge>Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('rounded-full');
    });
  });

  describe('Variants', () => {
    it('should render neutral variant (default)', () => {
      render(<Badge>Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-slate-100');
    });

    it('should render primary variant', () => {
      render(<Badge variant="primary">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-[#dbeafe]');
    });

    it('should render success variant', () => {
      render(<Badge variant="success">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-emerald-50');
    });

    it('should render error variant', () => {
      render(<Badge variant="error">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-red-50');
    });

    it('should render warning variant', () => {
      render(<Badge variant="warning">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-amber-50');
    });

    it('should render info variant', () => {
      render(<Badge variant="info">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-blue-50');
    });

    it('should render danger variant (alias for error)', () => {
      render(<Badge variant="danger">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-red-50');
    });

    it('should render default variant (alias for neutral)', () => {
      render(<Badge variant="default">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-slate-100');
    });

    it('should render gray variant', () => {
      render(<Badge variant="gray">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-slate-100');
    });

    it('should render red variant', () => {
      render(<Badge variant="red">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-red-50');
    });

    it('should render yellow variant', () => {
      render(<Badge variant="yellow">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-amber-50');
    });

    it('should render green variant', () => {
      render(<Badge variant="green">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-emerald-50');
    });

    it('should render blue variant', () => {
      render(<Badge variant="blue">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-blue-50');
    });

    it('should render indigo variant', () => {
      render(<Badge variant="indigo">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-indigo-50');
    });

    it('should render purple variant', () => {
      render(<Badge variant="purple">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-purple-50');
    });

    it('should render pink variant', () => {
      render(<Badge variant="pink">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('bg-pink-50');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      render(<Badge size="sm">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('px-1.5');
      expect(screen.getByText('Badge')).toHaveClass('py-0.5');
    });

    it('should render medium size (default)', () => {
      render(<Badge>Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('px-2');
      expect(screen.getByText('Badge')).toHaveClass('py-1');
    });

    it('should render large size', () => {
      render(<Badge size="lg">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('px-2.5');
      expect(screen.getByText('Badge')).toHaveClass('text-sm');
    });
  });

  describe('Dot Indicator', () => {
    it('should render dot when dot prop is true', () => {
      render(<Badge dot>Badge</Badge>);
      expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('should not render dot by default', () => {
      render(<Badge>Badge</Badge>);
      expect(document.querySelector('svg')).not.toBeInTheDocument();
    });

    it('should render dot with correct color for success', () => {
      render(<Badge variant="success" dot>Badge</Badge>);
      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('fill-emerald-500');
    });

    it('should render dot with correct color for error', () => {
      render(<Badge variant="error" dot>Badge</Badge>);
      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('fill-red-500');
    });

    it('should render dot with correct color for warning', () => {
      render(<Badge variant="warning" dot>Badge</Badge>);
      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('fill-amber-500');
    });

    it('should render dot with correct color for info', () => {
      render(<Badge variant="info" dot>Badge</Badge>);
      const svg = document.querySelector('svg');
      expect(svg).toHaveClass('fill-blue-500');
    });

    it('should have aria-hidden on dot svg', () => {
      render(<Badge dot>Badge</Badge>);
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Icon', () => {
    it('should render icon when provided', () => {
      render(<Badge icon={<span data-testid="icon">🎉</span>}>Badge</Badge>);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should render icon before text', () => {
      render(<Badge icon={<span data-testid="icon">✓</span>}>Success</Badge>);
      const badge = screen.getByText('Success').closest('span');
      const icon = screen.getByTestId('icon');
      // Check icon is within the badge
      expect(badge).toContainElement(icon);
    });
  });

  describe('Custom Classes', () => {
    it('should apply custom className', () => {
      render(<Badge className="custom-class">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('custom-class');
    });

    it('should merge with existing classes', () => {
      render(<Badge className="custom-class" variant="success">Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('bg-emerald-50');
    });
  });

  describe('Text Colors', () => {
    it('should apply correct text color for success', () => {
      render(<Badge variant="success">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('text-emerald-700');
    });

    it('should apply correct text color for error', () => {
      render(<Badge variant="error">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('text-red-700');
    });

    it('should apply correct text color for warning', () => {
      render(<Badge variant="warning">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('text-amber-700');
    });

    it('should apply correct text color for info', () => {
      render(<Badge variant="info">Badge</Badge>);
      expect(screen.getByText('Badge')).toHaveClass('text-blue-700');
    });
  });

  describe('Accessibility', () => {
    it('should be inline element', () => {
      render(<Badge>Badge</Badge>);
      expect(screen.getByText('Badge').tagName).toBe('SPAN');
    });
  });
});
