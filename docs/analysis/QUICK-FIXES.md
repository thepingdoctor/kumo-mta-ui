# Quick Fix Guide - KumoMTA UI

**Priority-ordered bug fixes for immediate action**

---

## ⚡ Priority 1: IMMEDIATE (30 minutes)

### Fix 1: Export Tests DOM Mocking
**File**: `src/utils/__tests__/exportUtils.test.ts`

```typescript
// Add at the top of the test file, in beforeEach():
beforeEach(() => {
  // Create proper mock for DOM createElement
  const mockLink = {
    setAttribute: vi.fn(),
    click: vi.fn(),
    style: { visibility: '' }
  };

  vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();
});
```

**Verify**: `npm test -- exportUtils.test.ts`

---

### Fix 2: Clear ESLint Cache
**Issue**: RoleGuard.tsx shows React Hooks error but code is already fixed

```bash
rm -rf node_modules/.cache .eslintcache
npm run lint
```

**Expected**: No errors should remain

---

### Fix 3: Add Error Logging
**File**: `src/stores/themeStore.ts` (line 108)

```typescript
// BEFORE:
} catch (e) {
  // Silent fail
}

// AFTER:
} catch (error) {
  console.error('Failed to persist theme to localStorage:', error);
}
```

---

## 🔧 Priority 2: SHORT-TERM (2-3 hours)

### Fix 4: Remove Unused Variables

**Quick wins with ESLint autofix:**
```bash
npm run lint -- --fix
```

**Manual fixes needed:**

1. **AuditLogFilters.tsx** (line 23)
```typescript
// Remove this line:
const [selectedActions, setSelectedActions] = useState<string[]>([]);
```

2. **AuditLogTable.tsx** (lines 6, 23-26)
```typescript
// Remove useMemo from imports:
import React from 'react';

// Remove unused props from destructuring:
const AuditLogTable: React.FC<AuditLogTableProps> = ({
  events,
  onEventClick,
  pageSize,
  onPageSizeChange,
  // Remove: currentPage, totalPages, onPageChange
}) => {
```

3. **AuditLogViewer.tsx** (lines 8-9, 20)
```typescript
// Remove unused type imports:
import type { AuditLogFilter } from '../../types/audit';
// Removed: AuditEventCategory, AuditSeverity, AuditAction, AuditEvent

// Remove unused destructuring:
const {
  // Remove: events,
  filteredEvents,
  // ... rest
} = useAuditStore();
```

4. **RoleManagement.tsx** (lines 17, 21)
```typescript
// Remove unused icon imports:
import { Shield, Users, Lock, Eye, EyeOff, Check, X } from 'lucide-react';
// Removed: Settings, Plus
```

5. **useOfflineSync.ts** (line 2)
```typescript
// Remove unused type:
import { useState, useEffect, useCallback } from 'react';
// Removed: PendingRequest import
```

---

### Fix 5: TypeScript Type Improvements

**Create new file**: `src/types/charts.ts`
```typescript
import type { ChartData, ChartOptions } from 'chart.js';

export interface MetricChartData extends ChartData<'line' | 'bar'> {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
  }>;
}

export interface ChartMetricOptions extends ChartOptions<'line' | 'bar'> {
  responsive: boolean;
  maintainAspectRatio: boolean;
}
```

**Update**: `src/components/analytics/AdvancedAnalytics.tsx`
```typescript
import type { MetricChartData, ChartMetricOptions } from '../../types/charts';

// Replace line 12-14:
const [deliveryChart, setDeliveryChart] = useState<MetricChartData | null>(null);
const [bounceChart, setBounceChart] = useState<MetricChartData | null>(null);
const chartOptions: ChartMetricOptions = {
  // ... existing options
};
```

---

### Fix 6: Remove Unused Dependencies

```bash
npm uninstall react-window-infinite-loader axios-mock-adapter
```

---

## 🚀 Priority 3: MEDIUM-TERM (Next Sprint)

### Fix 7: Dependency Security Upgrades

**Test first in a branch:**
```bash
git checkout -b chore/security-dependency-upgrades

# Upgrade packages
npm install -D vite@latest vitest@latest @vitest/ui@latest @vitest/coverage-v8@latest
npm update eslint

# Test everything
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e

# If all passes:
git commit -m "chore: upgrade dev dependencies for security fixes"
```

**Breaking changes to watch:**
- Vite 5 → 7: Check vite.config.ts compatibility
- Vitest 1 → 4: Check test configuration

---

## 📝 Verification Checklist

After each fix, verify:

- [ ] `npm run typecheck` - No TypeScript errors
- [ ] `npm run lint` - No ESLint errors
- [ ] `npm test` - All tests passing
- [ ] `npm run build` - Build succeeds
- [ ] No runtime errors in browser console

---

## 🎯 Success Metrics

**Before Fixes:**
- ESLint Errors: 50
- Test Failures: 2
- Security Vulns: 6
- Unused Deps: 5

**After Priority 1:**
- ESLint Errors: ~45
- Test Failures: 0 ✅
- Security Vulns: 6
- Unused Deps: 5

**After Priority 2:**
- ESLint Errors: 0 ✅
- Test Failures: 0 ✅
- Security Vulns: 6
- Unused Deps: 0 ✅

**After Priority 3:**
- ESLint Errors: 0 ✅
- Test Failures: 0 ✅
- Security Vulns: 0 ✅
- Unused Deps: 0 ✅

---

## 📚 Full Analysis

See `bug-analysis-report.md` for comprehensive details including:
- Root cause analysis
- Impact assessments
- Affected component maps
- Risk assessment
- Timeline and effort estimates

---

**Last Updated**: 2025-11-01
**Analyst**: Hive Mind ANALYST Agent
