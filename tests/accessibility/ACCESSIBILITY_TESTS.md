# Accessibility Testing Plan - KumoMTA UI

## WCAG 2.1 Level AA Compliance

---

## 1. Keyboard Navigation

### 1.1 Tab Order
**Test File**: `tests/accessibility/keyboard-navigation.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Keyboard Navigation', () => {
  describe('Login Form Tab Order', () => {
    it('should tab through form elements in correct order', async () => {
      render(<LoginForm />);

      // Start focus
      const emailInput = screen.getByLabelText(/email/i);
      emailInput.focus();
      expect(emailInput).toHaveFocus();

      // Tab to password
      await userEvent.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();

      // Tab to submit button
      await userEvent.tab();
      expect(screen.getByRole('button', { name: /login/i })).toHaveFocus();

      // Tab to forgot password link
      await userEvent.tab();
      expect(screen.getByRole('link', { name: /forgot password/i })).toHaveFocus();

      // Shift+Tab backwards
      await userEvent.tab({ shift: true });
      expect(screen.getByRole('button', { name: /login/i })).toHaveFocus();
    });
  });

  describe('Navigation Menu', () => {
    it('should navigate menu with arrow keys', async () => {
      render(<Layout />);

      // Focus first menu item
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      dashboardLink.focus();
      expect(dashboardLink).toHaveFocus();

      // Arrow down to next item
      await userEvent.keyboard('{ArrowDown}');
      expect(screen.getByRole('link', { name: /queue/i })).toHaveFocus();

      // Arrow down again
      await userEvent.keyboard('{ArrowDown}');
      expect(screen.getByRole('link', { name: /configuration/i })).toHaveFocus();

      // Arrow up to previous
      await userEvent.keyboard('{ArrowUp}');
      expect(screen.getByRole('link', { name: /queue/i })).toHaveFocus();

      // Home key to first item
      await userEvent.keyboard('{Home}');
      expect(dashboardLink).toHaveFocus();

      // End key to last item
      await userEvent.keyboard('{End}');
      expect(screen.getByRole('link', { name: /settings/i })).toHaveFocus();
    });
  });

  describe('Skip Navigation', () => {
    it('should provide skip to main content link', async () => {
      render(<Layout />);

      // Tab to skip link (should be first)
      await userEvent.tab();
      const skipLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(skipLink).toHaveFocus();

      // Activate skip link
      await userEvent.keyboard('{Enter}');

      // Focus should move to main content
      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveFocus();
    });
  });

  describe('Modal Focus Trap', () => {
    it('should trap focus within modal', async () => {
      render(<AddCustomerModal isOpen={true} />);

      // Get all focusable elements in modal
      const modal = screen.getByRole('dialog');
      const firstInput = screen.getByLabelText(/recipient/i);
      const closeButton = screen.getByRole('button', { name: /close/i });

      // Focus first element
      firstInput.focus();
      expect(firstInput).toHaveFocus();

      // Tab through modal elements
      await userEvent.tab();
      expect(screen.getByLabelText(/sender/i)).toHaveFocus();

      await userEvent.tab();
      expect(screen.getByLabelText(/subject/i)).toHaveFocus();

      await userEvent.tab();
      expect(screen.getByLabelText(/message/i)).toHaveFocus();

      await userEvent.tab();
      expect(screen.getByRole('button', { name: /submit/i })).toHaveFocus();

      await userEvent.tab();
      expect(closeButton).toHaveFocus();

      // Tab from last element should wrap to first
      await userEvent.tab();
      expect(firstInput).toHaveFocus();

      // Shift+Tab from first should wrap to last
      await userEvent.tab({ shift: true });
      expect(closeButton).toHaveFocus();
    });

    it('should return focus on modal close', async () => {
      const openButton = screen.getByRole('button', { name: /add customer/i });
      openButton.focus();

      await userEvent.click(openButton);

      // Modal opens
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      // Close modal with Escape
      await userEvent.keyboard('{Escape}');

      // Focus returns to open button
      expect(openButton).toHaveFocus();
    });
  });

  describe('Dropdown Navigation', () => {
    it('should navigate dropdown with keyboard', async () => {
      render(<FilterDropdown />);

      const trigger = screen.getByRole('button', { name: /filter/i });

      // Open dropdown with Enter
      await userEvent.click(trigger);

      // Arrow down through options
      await userEvent.keyboard('{ArrowDown}');
      expect(screen.getByRole('option', { name: /queued/i })).toHaveFocus();

      await userEvent.keyboard('{ArrowDown}');
      expect(screen.getByRole('option', { name: /sending/i })).toHaveFocus();

      // Select with Space
      await userEvent.keyboard(' ');
      expect(screen.getByRole('option', { name: /sending/i })).toHaveAttribute(
        'aria-selected',
        'true'
      );

      // Close with Escape
      await userEvent.keyboard('{Escape}');
      expect(trigger).toHaveFocus();
    });
  });

  describe('Button Activation', () => {
    it('should activate buttons with Enter and Space', async () => {
      const handleClick = jest.fn();
      render(<button onClick={handleClick}>Click Me</button>);

      const button = screen.getByRole('button');
      button.focus();

      // Activate with Enter
      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      // Activate with Space
      await userEvent.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });
});
```

---

## 2. Screen Reader Support

### 2.1 ARIA Labels and Roles
**Test File**: `tests/accessibility/screen-reader.test.tsx`

```typescript
describe('Screen Reader Support', () => {
  describe('Semantic HTML', () => {
    it('should use proper heading hierarchy', () => {
      render(<Dashboard />);

      // Main heading
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Dashboard');

      // Section headings
      const h2s = screen.getAllByRole('heading', { level: 2 });
      expect(h2s.length).toBeGreaterThan(0);

      // Subsection headings
      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('should use landmark roles', () => {
      render(<Layout />);

      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
      expect(screen.getByRole('main')).toBeInTheDocument(); // main
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
    });
  });

  describe('ARIA Labels', () => {
    it('should label icon buttons', () => {
      render(<QueueManager />);

      // Filter button with icon
      const filterButton = screen.getByRole('button', { name: /filter/i });
      expect(filterButton).toHaveAttribute('aria-label', 'Filter queue items');

      // Delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      expect(deleteButton).toHaveAttribute('aria-label');
    });

    it('should label form inputs', () => {
      render(<ConfigEditor />);

      // All inputs should have labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        const label = input.getAttribute('aria-label') ||
                     input.getAttribute('aria-labelledby');
        expect(label).toBeTruthy();
      });
    });

    it('should use aria-describedby for help text', () => {
      render(<ConfigEditor />);

      const hostnameInput = screen.getByLabelText(/hostname/i);
      const describedById = hostnameInput.getAttribute('aria-describedby');

      expect(describedById).toBeTruthy();
      const description = document.getElementById(describedById);
      expect(description).toHaveTextContent(/fully qualified domain name/i);
    });
  });

  describe('Live Regions', () => {
    it('should announce status updates', async () => {
      render(<QueueManager />);

      // Update queue item status
      const updateButton = screen.getByRole('button', { name: /update status/i });
      await userEvent.click(updateButton);

      // Check for live region announcement
      const liveRegion = screen.getByRole('status');
      await waitFor(() => {
        expect(liveRegion).toHaveTextContent(/status updated successfully/i);
      });
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce errors assertively', async () => {
      server.use(
        http.put('/api/queue/1/status', () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      render(<QueueManager />);

      const updateButton = screen.getByRole('button', { name: /update/i });
      await userEvent.click(updateButton);

      const alertRegion = screen.getByRole('alert');
      await waitFor(() => {
        expect(alertRegion).toHaveTextContent(/failed to update/i);
      });
      expect(alertRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('should announce loading states', async () => {
      render(<QueueManager />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent(/loading queue items/i);

      await waitFor(() => {
        expect(liveRegion).toHaveTextContent(/loaded \d+ items/i);
      });
    });
  });

  describe('Image Alt Text', () => {
    it('should provide alt text for images', () => {
      render(<Dashboard />);

      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        const alt = img.getAttribute('alt');
        expect(alt.length).toBeGreaterThan(0);
      });
    });

    it('should mark decorative images as aria-hidden', () => {
      render(<Dashboard />);

      // Decorative icons should be hidden from screen readers
      const icons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Link Descriptions', () => {
    it('should provide descriptive link text', () => {
      render(<Navigation />);

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        const text = link.textContent;
        // Avoid generic text like "click here"
        expect(text).not.toMatch(/^click here$/i);
        expect(text).not.toMatch(/^read more$/i);
        expect(text.length).toBeGreaterThan(2);
      });
    });

    it('should indicate external links', () => {
      render(<Footer />);

      const externalLink = screen.getByRole('link', { name: /documentation/i });
      expect(externalLink).toHaveAttribute('aria-label',
        expect.stringContaining('opens in new tab')
      );
    });
  });

  describe('Table Accessibility', () => {
    it('should have table headers', () => {
      render(<QueueManager />);

      const table = screen.getByRole('table');
      const headers = within(table).getAllByRole('columnheader');

      expect(headers).toHaveLength(6); // id, recipient, sender, status, timestamp, actions
      headers.forEach(header => {
        expect(header.textContent.length).toBeGreaterThan(0);
      });
    });

    it('should have caption', () => {
      render(<QueueManager />);

      const caption = screen.getByText(/queue items/i);
      expect(caption.closest('caption')).toBeInTheDocument();
    });

    it('should associate data cells with headers', () => {
      render(<QueueManager />);

      const cells = screen.getAllByRole('cell');
      cells.forEach(cell => {
        // Each cell should be in a row
        expect(cell.closest('tr')).toBeInTheDocument();
      });
    });
  });

  describe('Form Accessibility', () => {
    it('should associate labels with inputs', () => {
      render(<ConfigEditor />);

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        const labelId = input.getAttribute('aria-labelledby') ||
                       input.getAttribute('id');
        const label = document.querySelector(`label[for="${input.getAttribute('id')}"]`);
        expect(label || labelId).toBeTruthy();
      });
    });

    it('should indicate required fields', () => {
      render(<AddCustomerModal />);

      const requiredInput = screen.getByLabelText(/recipient/i);
      expect(requiredInput).toHaveAttribute('required');
      expect(requiredInput).toHaveAttribute('aria-required', 'true');

      // Visual indicator
      const label = screen.getByText(/recipient/i);
      expect(label.textContent).toContain('*');
    });

    it('should announce validation errors', async () => {
      render(<ConfigEditor />);

      const input = screen.getByLabelText(/hostname/i);
      await userEvent.type(input, 'invalid!');
      await userEvent.tab();

      // Error message associated with input
      const errorId = input.getAttribute('aria-describedby');
      const error = document.getElementById(errorId);
      expect(error).toHaveTextContent(/invalid hostname/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
```

---

## 3. Visual Accessibility

### 3.1 Color Contrast
**Test File**: `tests/accessibility/color-contrast.test.tsx`

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Color Contrast', () => {
  describe('WCAG AA Compliance', () => {
    it('should meet 4.5:1 contrast for normal text', async () => {
      const { container } = render(<Dashboard />);

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should meet 3:1 contrast for large text', async () => {
      const { container } = render(<Dashboard />);

      // Large text (18pt+ or 14pt+ bold)
      const headings = container.querySelectorAll('h1, h2, h3');

      for (const heading of headings) {
        const results = await axe(heading, {
          rules: { 'color-contrast': { enabled: true } }
        });
        expect(results).toHaveNoViolations();
      }
    });
  });

  describe('Focus Indicators', () => {
    it('should have visible focus outline', () => {
      render(<LoginForm />);

      const input = screen.getByLabelText(/email/i);
      input.focus();

      const styles = window.getComputedStyle(input);
      expect(styles.outline).not.toBe('none');
      expect(styles.outline).not.toBe('0');
    });

    it('should have 3:1 contrast for focus indicator', async () => {
      const { container } = render(<Navigation />);

      const link = screen.getByRole('link', { name: /dashboard/i });
      link.focus();

      const results = await axe(container, {
        rules: { 'focus-visible': { enabled: true } }
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Independence', () => {
    it('should not convey information by color alone', () => {
      render(<QueueManager />);

      // Error status should have icon + text, not just red color
      const errorItem = screen.getByTestId('queue-item-error');
      expect(within(errorItem).getByRole('img', { name: /error/i })).toBeInTheDocument();
      expect(within(errorItem).getByText(/failed/i)).toBeInTheDocument();

      // Success status
      const successItem = screen.getByTestId('queue-item-success');
      expect(within(successItem).getByRole('img', { name: /success/i })).toBeInTheDocument();
    });

    it('should be usable in high contrast mode', () => {
      // Simulate high contrast mode
      document.body.classList.add('high-contrast');

      render(<Dashboard />);

      // Elements should still be visible and functional
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        expect(styles.borderWidth).not.toBe('0');
      });

      document.body.classList.remove('high-contrast');
    });
  });

  describe('Text Resize', () => {
    it('should support 200% zoom without loss of content', () => {
      const { container } = render(<Dashboard />);

      // Set zoom to 200%
      document.documentElement.style.fontSize = '200%';

      // Content should still be visible
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeVisible();

      // No horizontal scrolling required
      expect(container.scrollWidth).toBeLessThanOrEqual(
        window.innerWidth
      );

      // Reset zoom
      document.documentElement.style.fontSize = '';
    });
  });

  describe('Dark Mode', () => {
    it('should maintain contrast in dark mode', async () => {
      document.body.classList.add('dark');

      const { container } = render(<Dashboard />);

      const results = await axe(container, {
        rules: { 'color-contrast': { enabled: true } }
      });

      expect(results).toHaveNoViolations();

      document.body.classList.remove('dark');
    });
  });
});
```

---

## 4. Automated Accessibility Testing

### 4.1 jest-axe Integration
**Test File**: `tests/accessibility/automated-checks.test.tsx`

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Automated Accessibility Checks', () => {
  it('Dashboard has no a11y violations', async () => {
    const { container } = render(<Dashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('QueueManager has no a11y violations', async () => {
    const { container } = render(<QueueManager />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ConfigEditor has no a11y violations', async () => {
    const { container } = render(<ConfigEditor />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('LoginForm has no a11y violations', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Modal has no a11y violations', async () => {
    const { container } = render(<AddCustomerModal isOpen={true} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Navigation has no a11y violations', async () => {
    const { container } = render(<Navigation />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 4.2 Custom Axe Rules
**File**: `tests/accessibility/custom-rules.ts`

```typescript
import { axe, configureAxe } from 'jest-axe';

export const customAxe = configureAxe({
  rules: {
    // Enforce stricter color contrast
    'color-contrast': {
      enabled: true,
      options: { contrastRatio: { normal: 4.5, large: 3.0 } }
    },
    // Require alt text on all images
    'image-alt': { enabled: true },
    // Ensure proper heading hierarchy
    'heading-order': { enabled: true },
    // Require labels on all form inputs
    'label': { enabled: true },
    // Check for duplicate IDs
    'duplicate-id': { enabled: true },
    // Ensure links have discernible text
    'link-name': { enabled: true },
    // Check button names
    'button-name': { enabled: true },
    // Validate ARIA usage
    'aria-valid-attr-value': { enabled: true },
    'aria-required-attr': { enabled: true },
    // Ensure landmark regions
    'region': { enabled: true }
  }
});
```

---

## 5. Manual Testing Checklist

### 5.1 Screen Reader Testing
**File**: `tests/accessibility/MANUAL_TESTING.md`

```markdown
## Screen Reader Testing Checklist

### NVDA (Windows)
- [ ] All interactive elements announced
- [ ] Heading navigation works (H key)
- [ ] Form fields properly labeled
- [ ] Status updates announced
- [ ] Table navigation functional
- [ ] Modal focus management correct
- [ ] Error messages announced

### JAWS (Windows)
- [ ] Navigation landmarks work
- [ ] All text readable
- [ ] Links descriptive
- [ ] Buttons clearly identified
- [ ] Form instructions clear
- [ ] Virtual cursor navigation smooth

### VoiceOver (macOS)
- [ ] Rotor navigation works
- [ ] Quick nav functional
- [ ] All content accessible
- [ ] Gestures supported (iOS)
- [ ] Chart data accessible

### Testing Procedure
1. Load page with screen reader active
2. Navigate entire page using only screen reader
3. Attempt all user tasks
4. Verify all content announced
5. Test form completion
6. Test error scenarios
7. Document any issues
```

### 5.2 Keyboard Testing
```markdown
## Keyboard Navigation Checklist

- [ ] All functionality accessible via keyboard
- [ ] Tab order logical
- [ ] Focus visible at all times
- [ ] No keyboard traps
- [ ] Skip navigation available
- [ ] Shortcuts documented
- [ ] Escape closes modals
- [ ] Arrow keys work in menus/lists
- [ ] Enter/Space activates buttons
- [ ] Custom controls keyboard accessible
```

### 5.3 Visual Testing
```markdown
## Visual Accessibility Checklist

- [ ] 200% zoom without horizontal scroll
- [ ] Text resizable to 200%
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] No information by color alone
- [ ] High contrast mode functional
- [ ] Dark mode accessible
- [ ] Reduced motion respected
```

---

## 6. Accessibility Features

### 6.1 Skip Links
```typescript
export const SkipLinks: React.FC = () => {
  return (
    <div className="skip-links">
      <a href="#main-content" className="sr-only focus:not-sr-only">
        Skip to main content
      </a>
      <a href="#navigation" className="sr-only focus:not-sr-only">
        Skip to navigation
      </a>
    </div>
  );
};
```

### 6.2 Focus Management
```typescript
export const useFocusManagement = (isOpen: boolean) => {
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocus.current = document.activeElement as HTMLElement;

      // Move focus to modal
      const firstInput = document.querySelector('[role="dialog"] input');
      (firstInput as HTMLElement)?.focus();
    } else if (previousFocus.current) {
      // Restore focus
      previousFocus.current.focus();
    }
  }, [isOpen]);
};
```

### 6.3 Live Regions
```typescript
export const LiveRegion: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
}> = ({ message, priority = 'polite' }) => {
  return (
    <div
      role={priority === 'assertive' ? 'alert' : 'status'}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
};
```

### 6.4 Reduced Motion
```typescript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

export const AnimatedComponent = () => {
  return (
    <motion.div
      animate={!prefersReducedMotion ? { opacity: 1 } : {}}
      transition={!prefersReducedMotion ? { duration: 0.3 } : { duration: 0 }}
    >
      Content
    </motion.div>
  );
};
```

---

## 7. Test Execution

### 7.1 Commands
```bash
# Run all accessibility tests
npm run test:a11y

# Run with axe-core
npm run test -- --testPathPattern=accessibility

# Generate accessibility report
npm run test:a11y -- --coverage

# Run specific tests
npm run test:a11y keyboard-navigation
```

### 7.2 CI Integration
```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests
on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:a11y
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: a11y-results
          path: a11y-results/
```

---

## 8. Compliance Checklist

### 8.1 WCAG 2.1 Level AA Requirements

**Perceivable:**
- [ ] Text alternatives for non-text content
- [ ] Captions for multimedia
- [ ] Content can be presented in different ways
- [ ] Color contrast minimum 4.5:1
- [ ] Text resizable to 200%
- [ ] Images of text avoided

**Operable:**
- [ ] All functionality keyboard accessible
- [ ] No keyboard traps
- [ ] Adjustable time limits
- [ ] Pause, stop, hide for moving content
- [ ] No content flashes more than 3 times/second
- [ ] Skip navigation links
- [ ] Page titles descriptive
- [ ] Focus order logical
- [ ] Link purpose clear from text
- [ ] Multiple ways to navigate
- [ ] Headings and labels descriptive
- [ ] Focus visible

**Understandable:**
- [ ] Language of page identified
- [ ] Language of parts identified
- [ ] On focus doesn't change context
- [ ] On input doesn't change context
- [ ] Consistent navigation
- [ ] Consistent identification
- [ ] Error identification
- [ ] Labels or instructions provided
- [ ] Error suggestions provided
- [ ] Error prevention (legal/financial/data)

**Robust:**
- [ ] Valid HTML
- [ ] Name, role, value programmatically determinable
- [ ] Status messages programmatically determinable

---

**Total Accessibility Tests**: 40+
**WCAG Compliance**: Level AA
**Automated Tools**: jest-axe, eslint-plugin-jsx-a11y
**Manual Testing**: Screen readers, keyboard, visual
**Coverage**: 100% of components
