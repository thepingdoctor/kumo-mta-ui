# Alert System Integration Guide

## Quick Start

### 1. Import Components

```typescript
// In your routing configuration
import {
  AlertDashboard,
  AlertRuleBuilder,
  AlertRuleList,
  AlertHistory,
  NotificationChannelConfig,
} from '@/components/alerts';

// Add routes
<Route path="/alerts" element={<AlertDashboard />} />
<Route path="/alerts/rules" element={<AlertRuleList />} />
<Route path="/alerts/rules/new" element={<AlertRuleBuilder />} />
<Route path="/alerts/history" element={<AlertHistory />} />
<Route path="/alerts/channels" element={<NotificationChannelConfig />} />
```

### 2. Environment Variables

Add to `.env`:
```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. Backend API Endpoints Required

The alert service expects these endpoints:

#### Alert Rules
```
GET    /api/alerts/rules              # List rules
POST   /api/alerts/rules              # Create rule
GET    /api/alerts/rules/:id          # Get rule
PATCH  /api/alerts/rules/:id          # Update rule
DELETE /api/alerts/rules/:id          # Delete rule
PATCH  /api/alerts/rules/:id/toggle   # Enable/disable
POST   /api/alerts/rules/:id/test     # Test rule
POST   /api/alerts/rules/:id/duplicate # Duplicate rule
```

#### Alerts (Instances)
```
GET    /api/alerts                    # List alerts
GET    /api/alerts/:id                # Get alert
POST   /api/alerts/:id/acknowledge    # Acknowledge
POST   /api/alerts/:id/snooze         # Snooze
POST   /api/alerts/:id/resolve        # Resolve
POST   /api/alerts/:id/dismiss        # Dismiss
POST   /api/alerts/bulk               # Bulk update
```

#### Notification Channels
```
GET    /api/alerts/channels           # List channels
POST   /api/alerts/channels           # Create channel
GET    /api/alerts/channels/:id       # Get channel
PATCH  /api/alerts/channels/:id       # Update channel
DELETE /api/alerts/channels/:id       # Delete channel
POST   /api/alerts/channels/:id/test  # Test channel
PATCH  /api/alerts/channels/:id/toggle # Enable/disable
```

#### Statistics
```
GET    /api/alerts/stats              # Alert statistics
GET    /api/alerts/trends             # Alert trends
GET    /api/alerts/export             # Export alerts
POST   /api/alerts/rules/import       # Import rules
```

### 4. WebSocket Integration (Optional)

For real-time alerts, implement WebSocket connection:

```typescript
// In your app root or alert dashboard
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

function AlertWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/alerts');

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);

      switch (update.type) {
        case 'alert_triggered':
          // Invalidate alerts query to refetch
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
          queryClient.invalidateQueries({ queryKey: ['alert-stats'] });

          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('New Alert', {
              body: update.alert.message,
              icon: '/alert-icon.png',
            });
          }
          break;

        case 'alert_resolved':
          queryClient.invalidateQueries({ queryKey: ['alerts'] });
          queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
          break;

        case 'rule_updated':
          queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
          break;
      }
    };

    return () => ws.close();
  }, [queryClient]);

  return null;
}
```

### 5. Browser Notifications Setup

```typescript
// Request permission on app load
useEffect(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}, []);
```

## API Request/Response Examples

### Create Alert Rule

**Request:**
```json
POST /api/alerts/rules
{
  "name": "High Queue Depth",
  "description": "Alert when queue exceeds 1000 messages",
  "severity": "warning",
  "metric": "queue_depth",
  "operator": ">",
  "threshold": 1000,
  "timeWindow": "15m",
  "notificationChannels": ["channel-id-1", "channel-id-2"],
  "cooldownMinutes": 15,
  "priority": 5,
  "tags": ["queue", "performance"]
}
```

**Response:**
```json
{
  "id": "rule-uuid",
  "name": "High Queue Depth",
  "description": "Alert when queue exceeds 1000 messages",
  "severity": "warning",
  "status": "enabled",
  "condition": {
    "id": "condition-uuid",
    "metric": "queue_depth",
    "operator": ">",
    "threshold": 1000,
    "timeWindow": "15m"
  },
  "notificationChannels": ["channel-id-1", "channel-id-2"],
  "cooldownMinutes": 15,
  "priority": 5,
  "tags": ["queue", "performance"],
  "createdAt": "2025-11-10T04:00:00Z",
  "updatedAt": "2025-11-10T04:00:00Z",
  "triggerCount": 0
}
```

### Test Alert Rule

**Request:**
```json
POST /api/alerts/rules/:id/test
{}
```

**Response:**
```json
{
  "success": true,
  "message": "Current queue depth (1250) exceeds threshold (1000)",
  "triggered": true,
  "currentValue": 1250,
  "threshold": 1000,
  "estimatedNotifications": 2,
  "testTimestamp": "2025-11-10T04:00:00Z"
}
```

### Create Notification Channel

**Email Example:**
```json
POST /api/alerts/channels
{
  "name": "Production Alerts",
  "type": "email",
  "config": {
    "recipients": ["admin@example.com", "team@example.com"],
    "subject": "Alert: {{ruleName}}",
    "bodyTemplate": "Alert triggered: {{message}}\nSeverity: {{severity}}\nTime: {{timestamp}}",
    "includeAttachment": false
  }
}
```

**Slack Example:**
```json
POST /api/alerts/channels
{
  "name": "Slack Alerts",
  "type": "slack",
  "config": {
    "webhookUrl": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    "channel": "#alerts",
    "username": "KumoMTA Alerts",
    "iconEmoji": ":warning:",
    "mentions": ["@channel"],
    "useMarkdown": true
  }
}
```

## Template Variables

Available in email subject/body and webhook templates:

- `{{ruleName}}` - Alert rule name
- `{{message}}` - Alert message
- `{{severity}}` - Alert severity (info/warning/critical)
- `{{status}}` - Alert status
- `{{timestamp}}` - Trigger timestamp
- `{{metric}}` - Metric name
- `{{currentValue}}` - Current metric value
- `{{threshold}}` - Configured threshold
- `{{details}}` - JSON of additional details

## Validation Rules

### Alert Rules
- **Name**: Required, 1-100 characters
- **Severity**: Required, one of: info, warning, critical
- **Metric**: Required, must be valid metric name
- **Operator**: Required, one of: >, <, >=, <=, ==, !=
- **Threshold**: Required, number within metric range
- **Notification Channels**: At least one required
- **Cooldown**: 0-1440 minutes (0-24 hours)
- **Priority**: 0-10

### Notification Channels
- **Name**: Required
- **Type**: Required, one of: email, slack, webhook, pagerduty
- **Email**: Valid email addresses, subject and body required
- **Slack**: Valid webhook URL required
- **Webhook**: Valid URL, method, and body template required
- **PagerDuty**: Integration key required

## Error Handling

All hooks include error handling with toast notifications:

```typescript
// Errors automatically shown via react-hot-toast
const { createRule } = useAlertRules();

createRule(data, {
  onSuccess: () => {
    // Success toast shown automatically
    navigate('/alerts/rules');
  },
  onError: (error) => {
    // Error toast shown automatically
    // Error details available in error.response.data
  }
});
```

## Performance Considerations

### Caching Strategy
- Alert rules: No automatic refetch (manual only)
- Active alerts: 30-second auto-refetch
- Statistics: 60-second auto-refetch
- History: 5-minute stale time

### Optimization Tips
1. Use pagination for large alert lists
2. Filter alerts by date range to reduce data
3. Enable/disable auto-refresh as needed
4. Use WebSocket for real-time instead of polling
5. Implement virtual scrolling for very long lists

## Testing Checklist

### Frontend Testing
- [ ] Create alert rule with all field types
- [ ] Test rule validation errors
- [ ] Create notification channels of each type
- [ ] Test notification channel validation
- [ ] Test alert acknowledgment workflow
- [ ] Test alert snooze/resolve/dismiss
- [ ] Verify real-time updates (WebSocket)
- [ ] Test browser notifications
- [ ] Verify responsive design on mobile
- [ ] Test keyboard navigation
- [ ] Verify screen reader compatibility

### Integration Testing
- [ ] Verify API endpoints return correct data
- [ ] Test authentication/authorization
- [ ] Test error responses
- [ ] Verify WebSocket connection
- [ ] Test notification delivery
- [ ] Verify metric data accuracy
- [ ] Test concurrent alert triggers
- [ ] Verify cooldown periods
- [ ] Test rule priority ordering

## Troubleshooting

### Common Issues

**Issue: Alerts not showing**
- Check API_BASE_URL in .env
- Verify backend is running
- Check browser console for errors
- Verify authentication token

**Issue: WebSocket not connecting**
- Check WebSocket URL
- Verify backend WebSocket support
- Check for proxy/firewall blocking

**Issue: Notifications not sending**
- Verify channel configuration
- Test channel with test button
- Check backend logs
- Verify webhook/API credentials

**Issue: Form validation errors**
- Check metric ranges in alertRuleValidator
- Verify all required fields
- Check email/URL format

## Next Steps

1. **Backend Integration**: Coordinate with Backend Developer agent for API implementation
2. **WebSocket Setup**: Implement real-time alert streaming
3. **Testing**: Run comprehensive E2E tests
4. **Documentation**: Update API documentation with examples
5. **Monitoring**: Add logging and error tracking

## Support

For implementation questions:
- Review component README: `/src/components/alerts/README.md`
- Check type definitions: `/src/types/alert.ts`
- Test with AlertPreview component
- Contact Backend Developer agent for API issues

---

**Status**: ✅ Frontend implementation complete, ready for backend integration
**Last Updated**: 2025-11-10
**Agent**: Frontend Developer (Hive Mind Coordination)
