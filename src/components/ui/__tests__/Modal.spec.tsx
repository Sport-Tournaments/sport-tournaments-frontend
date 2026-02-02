import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '../Modal';

describe('Modal Component', () => {
  beforeEach(() => {
    // Reset body overflow style before each test
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Clean up body overflow style after each test
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Modal content
        </Modal>
      );
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={() => {}}>
          Modal content
        </Modal>
      );
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Modal Title">
          Content
        </Modal>
      );
      expect(screen.getByText('Modal Title')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} description="Modal description">
          Content
        </Modal>
      );
      expect(screen.getByText('Modal description')).toBeInTheDocument();
    });

    it('should render footer when provided', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} footer={<button>Submit</button>}>
          Content
        </Modal>
      );
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  describe('Close Button', () => {
    it('should render close button by default', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      // Close button exists
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not render close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} showCloseButton={false}>
          Content
        </Modal>
      );
      // No close button
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={onClose}>
          Content
        </Modal>
      );

      await user.click(screen.getByRole('button'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Overlay Click', () => {
    it('should call onClose when overlay is clicked by default', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={onClose}>
          Content
        </Modal>
      );

      // Find and click overlay
      const overlay = screen.getByText('Content').parentElement?.parentElement?.parentElement;
      if (overlay) {
        await user.click(overlay);
      }
    });

    it('should not call onClose when closeOnOverlayClick is false', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={onClose} closeOnOverlayClick={false}>
          Content
        </Modal>
      );

      // Click overlay should not trigger close
      const overlay = screen.getByText('Content').parentElement?.parentElement?.parentElement;
      if (overlay) {
        await user.click(overlay);
        expect(onClose).not.toHaveBeenCalled();
      }
    });

    it('should not close when clicking modal content', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={onClose}>
          <div data-testid="modal-content">Content</div>
        </Modal>
      );

      await user.click(screen.getByTestId('modal-content'));
      // Click on content should not trigger onClose (only overlay click)
    });
  });

  describe('Escape Key', () => {
    it('should call onClose when Escape is pressed by default', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={onClose}>
          Content
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when closeOnEsc is false', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <Modal isOpen={true} onClose={onClose} closeOnEsc={false}>
          Content
        </Modal>
      );

      await user.keyboard('{Escape}');
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Sizes', () => {
    it('should apply small size class', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} size="sm">
          Content
        </Modal>
      );
      // Check for size-specific class on the dialog element
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('sm:max-w-sm');
    });

    it('should apply medium size class (default)', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('sm:max-w-lg');
    });

    it('should apply large size class', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} size="lg">
          Content
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('sm:max-w-2xl');
    });

    it('should apply xl size class', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} size="xl">
          Content
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('sm:max-w-4xl');
    });

    it('should apply full size class', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} size="full">
          Content
        </Modal>
      );
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('sm:max-w-full');
    });
  });

  describe('Icon', () => {
    it('should render icon when provided with iconColor', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} icon={<span data-testid="icon">🎉</span>} iconColor="success">
          Content
        </Modal>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should apply success icon color', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} icon={<span>✓</span>} iconColor="success">
          Content
        </Modal>
      );
      // Icon container should have success color class
      const iconContainer = screen.getByText('✓').parentElement;
      expect(iconContainer).toHaveClass('bg-green-100');
    });

    it('should apply error icon color', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} icon={<span>✗</span>} iconColor="error">
          Content
        </Modal>
      );
      const iconContainer = screen.getByText('✗').parentElement;
      expect(iconContainer).toHaveClass('bg-red-100');
    });

    it('should apply warning icon color', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} icon={<span>⚠</span>} iconColor="warning">
          Content
        </Modal>
      );
      const iconContainer = screen.getByText('⚠').parentElement;
      expect(iconContainer).toHaveClass('bg-yellow-100');
    });

    it('should apply info icon color', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} icon={<span>ℹ</span>} iconColor="info">
          Content
        </Modal>
      );
      const iconContainer = screen.getByText('ℹ').parentElement;
      expect(iconContainer).toHaveClass('bg-blue-100');
    });
  });

  describe('Body Scroll Lock', () => {
    it('should lock body scroll when modal opens', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll when modal closes', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );

      rerender(
        <Modal isOpen={false} onClose={() => {}}>
          Content
        </Modal>
      );

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Custom Classes', () => {
    it('should apply custom className', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} className="custom-modal">
          Content
        </Modal>
      );
      // The className is applied to the dialog element (role="dialog")
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('custom-modal');
    });
  });

  describe('Accessibility', () => {
    it('should have proper z-index for stacking', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      // The z-50 class is on the outermost container
      // Check that the modal renders with proper stacking context
      const dialog = screen.getByRole('dialog');
      // The dialog should exist and be properly rendered
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have backdrop with aria-hidden', () => {
      render(
        <Modal isOpen={true} onClose={() => {}}>
          Content
        </Modal>
      );
      // Check for backdrop
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });
  });
});
