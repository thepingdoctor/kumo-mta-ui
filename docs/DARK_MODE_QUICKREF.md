# Dark Mode Quick Reference Card

## Quick Start

```tsx
// 1. Import the theme toggle
import { ThemeToggle } from './components/common/ThemeToggle';

// 2. Add to your header/nav
<ThemeToggle variant="button" />  // Simple toggle
<ThemeToggle variant="dropdown" /> // Full menu

// 3. Use dark mode classes
<div className="bg-white dark:bg-dark-surface">
  <h1 className="text-gray-900 dark:text-white">Title</h1>
</div>
```

## Common Class Patterns

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| **Page Background** | `bg-gray-50` | `dark:bg-dark-bg` |
| **Card/Panel** | `bg-white` | `dark:bg-dark-surface` |
| **Primary Text** | `text-gray-900` | `dark:text-dark-text` |
| **Secondary Text** | `text-gray-600` | `dark:text-gray-400` |
| **Borders** | `border-gray-200` | `dark:border-dark-border` |
| **Hover BG** | `hover:bg-gray-100` | `dark:hover:bg-gray-700` |

## Component Snippets

### Card
```tsx
<div className="bg-white dark:bg-dark-surface rounded-lg shadow-md dark:shadow-xl p-6">
  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
    Card Title
  </h2>
  <p className="text-gray-600 dark:text-gray-400">
    Card content
  </p>
</div>
```

### Button
```tsx
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg">
  Click Me
</button>
```

### Input
```tsx
<input
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
  placeholder="Enter text"
/>
```

### Alert (Error)
```tsx
<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-lg">
  Error message
</div>
```

### Alert (Success)
```tsx
<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 p-4 rounded-lg">
  Success message
</div>
```

### Icon
```tsx
<Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
<Activity className="h-5 w-5 text-blue-500 dark:text-blue-400" />
```

## Color Palette

### Custom Dark Colors (from tailwind.config.js)
```js
{
  dark: {
    bg: '#0f172a',      // Slate 900
    surface: '#1e293b', // Slate 800
    border: '#334155',  // Slate 700
    text: '#e2e8f0',    // Slate 200
  }
}
```

### Usage
```tsx
className="bg-dark-bg"       // #0f172a
className="bg-dark-surface"  // #1e293b
className="border-dark-border" // #334155
className="text-dark-text"   // #e2e8f0
```

## State Management

### Access Theme Store
```tsx
import { useThemeStore } from '../stores/themeStore';

function MyComponent() {
  const { theme, actualTheme, setTheme, toggleTheme } = useThemeStore();

  // theme: 'light' | 'dark' | 'system' (user preference)
  // actualTheme: 'light' | 'dark' (actual active theme)

  return (
    <div>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('system')}>System</button>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  );
}
```

## Testing

```tsx
import { render, screen } from '@testing-library/react';
import { useThemeStore } from '../stores/themeStore';

// Mock the store
vi.mock('../stores/themeStore');

test('component renders in dark mode', () => {
  useThemeStore.mockReturnValue({
    theme: 'dark',
    actualTheme: 'dark',
    setTheme: vi.fn(),
  });

  render(<MyComponent />);
  // Test dark mode specific behavior
});
```

## Checklist for New Components

- [ ] Add `dark:` variants for all backgrounds
- [ ] Add `dark:` variants for all text colors
- [ ] Add `dark:` variants for all borders
- [ ] Add `dark:` variants for hover/focus states
- [ ] Test in both light and dark modes
- [ ] Verify color contrast meets WCAG AA
- [ ] Add dark mode tests

## Browser DevTools

### Force Dark Mode (Chrome/Edge)
1. Open DevTools (F12)
2. Open Command Menu (Ctrl+Shift+P / Cmd+Shift+P)
3. Type "Render"
4. Select "Show Rendering"
5. Find "Emulate CSS media feature prefers-color-scheme"
6. Select "dark"

### Inspect Dark Mode Classes
```js
// Check if dark mode is active
document.documentElement.classList.contains('dark')

// Force dark mode
document.documentElement.classList.add('dark')

// Force light mode
document.documentElement.classList.remove('dark')
```

## Common Issues

### Issue: Dark mode not applying
**Solution**: Ensure `darkMode: 'class'` in `tailwind.config.js`

### Issue: Theme not persisting
**Solution**: Check localStorage is enabled and not full

### Issue: System theme not detected
**Solution**: Verify browser supports `prefers-color-scheme`

### Issue: Flashing on page load
**Solution**: Theme is initialized in `themeStore.ts` on module load

## Files Modified/Created

```
✅ Created:
  - /src/stores/themeStore.ts
  - /src/components/common/ThemeToggle.tsx
  - /src/tests/themeStore.test.ts
  - /src/tests/ThemeToggle.test.tsx
  - /docs/DARK_MODE_GUIDE.md
  - /docs/DARK_MODE_QUICKREF.md

✅ Updated:
  - /tailwind.config.js (added darkMode: 'class')
  - /src/components/Layout.tsx
  - /src/components/Dashboard.tsx
  - /src/components/auth/LoginPage.tsx
  - /src/components/common/LoadingSkeleton.tsx
  - /src/components/common/Toast.tsx
```

## Next Steps

Apply the same patterns to remaining components:
- QueueManager & related queue components
- ConfigEditor & SecurityPage
- AdvancedAnalytics & HealthCheck
- Any custom modals and forms

Pattern to follow:
```tsx
// Before
<div className="bg-white text-gray-900 border-gray-200">

// After
<div className="bg-white dark:bg-dark-surface text-gray-900 dark:text-white border-gray-200 dark:border-dark-border">
```
