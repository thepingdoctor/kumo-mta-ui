# Dark Mode Implementation Guide

## Overview

This document describes the comprehensive dark mode implementation for the KumoMTA UI Dashboard. The implementation uses Tailwind CSS's dark mode feature with class-based toggling and Zustand for state management.

## Features

- **Three Theme Modes**: Light, Dark, and System (auto-detects OS preference)
- **Persistent Theme**: User preference is saved to localStorage
- **System Theme Detection**: Automatically responds to OS theme changes
- **Smooth Transitions**: All theme changes include smooth color transitions
- **Fully Accessible**: ARIA labels, keyboard navigation, and focus management
- **Two Toggle Variants**: Simple button toggle and dropdown with all options

## Architecture

### 1. Theme Store (`/src/stores/themeStore.ts`)

The theme store is built with Zustand and includes:

- **State Management**: Tracks both user preference (`theme`) and actual active theme (`actualTheme`)
- **Persistence**: Uses Zustand's persist middleware with localStorage
- **System Detection**: Listens to `prefers-color-scheme` media query
- **Auto-Application**: Automatically applies theme class to document root

```typescript
export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;                    // User preference
  actualTheme: 'light' | 'dark';  // Current active theme
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}
```

### 2. Theme Toggle Component (`/src/components/common/ThemeToggle.tsx`)

Two variants available:

- **Button Variant**: Simple toggle between light/dark (ignores system preference)
- **Dropdown Variant**: Full menu with Light, Dark, and System options

```tsx
<ThemeToggle variant="button" />
<ThemeToggle variant="dropdown" />
```

### 3. Tailwind Configuration

Updated `tailwind.config.js`:

```javascript
export default {
  darkMode: 'class',  // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f172a',      // Main background
          surface: '#1e293b', // Card/panel background
          border: '#334155',  // Border color
          text: '#e2e8f0',    // Primary text
        },
      },
    },
  },
};
```

## Implementation Pattern

### For Components

Use Tailwind's `dark:` prefix for dark mode styles:

```tsx
<div className="bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
    Title
  </h1>

  <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
    Action
  </button>

  <div className="border border-gray-200 dark:border-dark-border">
    Content
  </div>
</div>
```

### Common Patterns

#### Cards/Surfaces
```tsx
className="bg-white dark:bg-dark-surface shadow-md dark:shadow-xl"
```

#### Text
```tsx
className="text-gray-900 dark:text-dark-text"      // Primary text
className="text-gray-600 dark:text-gray-400"       // Secondary text
className="text-gray-500 dark:text-gray-500"       // Muted text
```

#### Borders
```tsx
className="border-gray-200 dark:border-dark-border"
```

#### Backgrounds
```tsx
className="bg-gray-50 dark:bg-dark-bg"              // Page background
className="bg-white dark:bg-dark-surface"           // Card background
className="bg-gray-100 dark:bg-gray-700"            // Hover states
```

#### Icons
```tsx
className="text-blue-500 dark:text-blue-400"        // Colored icons
className="text-gray-400 dark:text-gray-500"        // Neutral icons
```

#### States (Error, Success, Warning)
```tsx
// Error
className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300"

// Success
className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"

// Warning
className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300"
```

## Updated Components

The following components have been updated with dark mode support:

### Core Components
- ✅ **Layout** - Sidebar, navigation, mobile header
- ✅ **Dashboard** - Metrics cards, charts, server status
- ✅ **LoginPage** - Form fields, buttons, error states

### Common Components
- ✅ **ThemeToggle** - NEW: Theme switcher component
- ✅ **Toast** - Success/error/warning/info notifications
- ✅ **LoadingSkeleton** - All skeleton variants

### Store
- ✅ **themeStore** - NEW: Theme state management

## Testing

Comprehensive tests included:

### Theme Store Tests (`/src/tests/themeStore.test.ts`)
- ✅ Theme initialization
- ✅ Setting light/dark themes
- ✅ Toggle functionality
- ✅ LocalStorage persistence
- ✅ Theme restoration
- ✅ System theme detection

### Theme Toggle Tests (`/src/tests/ThemeToggle.test.tsx`)
- ✅ Button variant rendering and interaction
- ✅ Dropdown variant with all options
- ✅ Keyboard navigation (Escape key)
- ✅ Accessibility (ARIA attributes)
- ✅ Current theme highlighting
- ✅ Click outside to close

### Running Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

## Usage Examples

### Basic Implementation

```tsx
import { ThemeToggle } from '../components/common/ThemeToggle';

function Header() {
  return (
    <header className="bg-white dark:bg-dark-surface border-b dark:border-dark-border">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold dark:text-white">App Name</h1>
        <ThemeToggle variant="button" />
      </div>
    </header>
  );
}
```

### Accessing Theme in Components

```tsx
import { useThemeStore } from '../stores/themeStore';

function MyComponent() {
  const { theme, actualTheme, setTheme } = useThemeStore();

  return (
    <div>
      <p>Current preference: {theme}</p>
      <p>Active theme: {actualTheme}</p>
      <button onClick={() => setTheme('dark')}>Go Dark</button>
    </div>
  );
}
```

## Browser Support

- ✅ Chrome/Edge 76+
- ✅ Firefox 67+
- ✅ Safari 12.1+
- ✅ All modern mobile browsers

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support for theme toggle
- **ARIA Labels**: Descriptive labels for screen readers
- **Focus Management**: Clear focus indicators
- **Color Contrast**: WCAG AA compliant in both modes
- **Reduced Motion**: Respects `prefers-reduced-motion`

## Performance

- **Minimal Overhead**: <2KB additional bundle size
- **Instant Switching**: Theme changes are immediate (CSS-based)
- **Optimized Re-renders**: Zustand ensures minimal re-renders
- **Cached Detection**: System preference is cached

## Future Enhancements

Potential additions for future versions:

- [ ] Additional color themes (blue, purple, etc.)
- [ ] Per-component theme overrides
- [ ] Theme scheduling (auto-dark at night)
- [ ] High contrast mode
- [ ] Custom theme builder
- [ ] Theme preview/demo mode

## Troubleshooting

### Theme not persisting
- Check localStorage is enabled
- Verify browser supports localStorage
- Check for conflicting localStorage keys

### System theme not detected
- Ensure browser supports `prefers-color-scheme`
- Check OS settings for theme preference
- Verify media query listener is attached

### Dark mode not applying
- Ensure `darkMode: 'class'` in tailwind.config.js
- Verify `dark` class is on `<html>` element
- Check Tailwind build includes dark variants

## Contributing

When adding new components:

1. Add `dark:` variants for all color utilities
2. Test in both light and dark modes
3. Ensure sufficient color contrast
4. Add accessibility attributes
5. Update this documentation

## Resources

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [WCAG Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
