import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../Card';

describe('Card Component', () => {
  describe('Card', () => {
    it('should render card with children', () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    describe('Variants', () => {
      it('should render default variant', () => {
        render(<Card data-testid="card">Content</Card>);
        expect(screen.getByTestId('card')).toHaveClass('shadow-sm');
      });

      it('should render hover variant', () => {
        render(<Card variant="hover" data-testid="card">Content</Card>);
        const card = screen.getByTestId('card');
        expect(card).toHaveClass('hover:shadow-md');
        expect(card).toHaveClass('cursor-pointer');
      });

      it('should render flat variant', () => {
        render(<Card variant="flat" data-testid="card">Content</Card>);
        const card = screen.getByTestId('card');
        expect(card).not.toHaveClass('shadow-sm');
      });
    });

    describe('Padding', () => {
      it('should render with no padding', () => {
        render(<Card padding="none" data-testid="card">Content</Card>);
        const card = screen.getByTestId('card');
        expect(card).not.toHaveClass('p-4');
        expect(card).not.toHaveClass('p-8');
      });

      it('should render with small padding', () => {
        render(<Card padding="sm" data-testid="card">Content</Card>);
        expect(screen.getByTestId('card')).toHaveClass('p-4');
      });

      it('should render with medium padding (default)', () => {
        render(<Card data-testid="card">Content</Card>);
        expect(screen.getByTestId('card')).toHaveClass('px-4');
        expect(screen.getByTestId('card')).toHaveClass('py-5');
      });

      it('should render with large padding', () => {
        render(<Card padding="lg" data-testid="card">Content</Card>);
        expect(screen.getByTestId('card')).toHaveClass('p-8');
      });
    });

    it('should apply custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });

    it('should pass through additional props', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('CardHeader', () => {
    it('should render card header with children', () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('should have border styling', () => {
      render(<CardHeader data-testid="card-header">Header</CardHeader>);
      expect(screen.getByTestId('card-header')).toHaveClass('border-b');
    });

    it('should apply custom className', () => {
      render(<CardHeader className="custom-header" data-testid="card-header">Header</CardHeader>);
      expect(screen.getByTestId('card-header')).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('should render card title with children', () => {
      render(<CardTitle>Title text</CardTitle>);
      expect(screen.getByText('Title text')).toBeInTheDocument();
    });

    it('should render as h3 by default', () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should render as custom heading level', () => {
      render(<CardTitle as="h1">Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should render as h2', () => {
      render(<CardTitle as="h2">Title</CardTitle>);
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });

    it('should apply text styling', () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByText('Title')).toHaveClass('text-base');
      expect(screen.getByText('Title')).toHaveClass('font-semibold');
    });

    it('should apply custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      expect(screen.getByText('Title')).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('should render card description with children', () => {
      render(<CardDescription>Description text</CardDescription>);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('should apply text styling', () => {
      render(<CardDescription>Description</CardDescription>);
      expect(screen.getByText('Description')).toHaveClass('text-sm');
      expect(screen.getByText('Description')).toHaveClass('text-gray-500');
    });

    it('should apply custom className', () => {
      render(<CardDescription className="custom-desc">Description</CardDescription>);
      expect(screen.getByText('Description')).toHaveClass('custom-desc');
    });
  });

  describe('CardContent', () => {
    it('should render card content with children', () => {
      render(<CardContent>Content text</CardContent>);
      expect(screen.getByText('Content text')).toBeInTheDocument();
    });

    it('should apply padding', () => {
      render(<CardContent data-testid="card-content">Content</CardContent>);
      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toHaveClass('px-4');
      expect(cardContent).toHaveClass('py-5');
    });

    it('should apply custom className', () => {
      render(<CardContent data-testid="card-content" className="custom-content">Content</CardContent>);
      expect(screen.getByTestId('card-content')).toHaveClass('custom-content');
    });
  });

  describe('Card Composition', () => {
    it('should render complete card with all subcomponents', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card body content</CardContent>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Card body content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <Card>
          <CardTitle>Card Title</CardTitle>
        </Card>
      );
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });
});
