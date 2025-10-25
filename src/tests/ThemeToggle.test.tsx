import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { useThemeStore } from '../stores/themeStore';

// Mock the theme store
vi.mock('../stores/themeStore', () => ({
  useThemeStore: vi.fn(),
}));

describe('ThemeToggle', () => {
  const mockSetTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      theme: 'light',
      actualTheme: 'light',
      setTheme: mockSetTheme,
    });
  });

  describe('Button variant', () => {
    it('should render theme toggle button', () => {
      render(<ThemeToggle variant="button" />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should toggle theme when clicked', () => {
      render(<ThemeToggle variant="button" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should toggle from dark to light', () => {
      (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        theme: 'dark',
        actualTheme: 'dark',
        setTheme: mockSetTheme,
      });

      render(<ThemeToggle variant="button" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('should have accessible label', () => {
      render(<ThemeToggle variant="button" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
    });
  });

  describe('Dropdown variant', () => {
    it('should render dropdown toggle', () => {
      render(<ThemeToggle variant="dropdown" />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should open dropdown when clicked', () => {
      render(<ThemeToggle variant="dropdown" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should show all theme options', () => {
      render(<ThemeToggle variant="dropdown" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });

    it('should set theme when option is clicked', () => {
      render(<ThemeToggle variant="dropdown" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const darkOption = screen.getByText('Dark');
      fireEvent.click(darkOption);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should close dropdown after selecting option', () => {
      render(<ThemeToggle variant="dropdown" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const darkOption = screen.getByText('Dark');
      fireEvent.click(darkOption);

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should close dropdown on Escape key', () => {
      render(<ThemeToggle variant="dropdown" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(screen.getByRole('menu')).toBeInTheDocument();

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('should highlight current theme', () => {
      (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
        theme: 'dark',
        actualTheme: 'dark',
        setTheme: mockSetTheme,
      });

      render(<ThemeToggle variant="dropdown" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const darkOption = screen.getByText('Dark').closest('button');
      expect(darkOption).toHaveClass('bg-blue-50');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for button variant', () => {
      render(<ThemeToggle variant="button" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
    });

    it('should have proper ARIA attributes for dropdown variant', () => {
      render(<ThemeToggle variant="dropdown" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-haspopup', 'true');
    });

    it('should update aria-expanded when dropdown opens', () => {
      render(<ThemeToggle variant="dropdown" />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should have role="menu" for dropdown options', () => {
      render(<ThemeToggle variant="dropdown" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const menu = screen.getByRole('menu');
      expect(menu).toHaveAttribute('role', 'menu');
    });

    it('should have role="menuitem" for each option', () => {
      render(<ThemeToggle variant="dropdown" />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);
    });
  });
});
