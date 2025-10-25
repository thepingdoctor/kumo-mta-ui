# Video Tutorial Script: Getting Started with KumoMTA UI Dashboard
**Duration**: 5 minutes
**Target Audience**: New users, System Administrators
**Prerequisites**: KumoMTA server installed and running

## Scene 1: Introduction (30 seconds)

### Visual
- Show KumoMTA UI Dashboard login screen
- Logo and branding visible

### Narration
> "Welcome to the KumoMTA UI Dashboard - a modern, intuitive interface for managing your email delivery infrastructure. In this 5-minute tutorial, we'll walk through the basics of getting started with the dashboard, from initial login to navigating the main features."

### On-Screen Text
- "KumoMTA UI Dashboard"
- "Your Email Infrastructure Control Center"

---

## Scene 2: First Login (45 seconds)

### Visual
- Zoom in on login form
- Show username and password fields
- Highlight login button

### Narration
> "Let's start by logging into the dashboard. If this is your first time, use the default credentials provided by your administrator. Enter your username and password, then click the Login button."

### On-Screen Actions
1. Type username: `admin`
2. Type password: `********`
3. Click "Login" button
4. Show loading spinner
5. Transition to dashboard

### On-Screen Text
- "Default credentials are set during KumoMTA installation"
- "Tip: Change your password immediately after first login"

---

## Scene 3: Dashboard Overview (60 seconds)

### Visual
- Pan across the main dashboard
- Highlight key metrics at the top
- Show real-time charts
- Display navigation menu

### Narration
> "After logging in, you'll see the main dashboard. This is your command center for monitoring email delivery. At the top, you'll find key performance indicators showing total emails sent, bounce rate, delayed messages, and current throughput. Below that, you'll see real-time charts displaying delivery metrics over the past 24 hours. Notice how the data refreshes automatically every 5 seconds, keeping you informed without manual intervention."

### On-Screen Highlights
1. Circle KPIs at top (Emails Sent, Bounce Rate, Delayed, Throughput)
2. Highlight auto-refresh indicator (5s timer)
3. Point to 24-hour throughput chart
4. Show navigation menu items

### On-Screen Text
- "Real-time Metrics: Updated every 5 seconds"
- "24-Hour View: Hourly aggregated data"

---

## Scene 4: Navigation Tour (60 seconds)

### Visual
- Click through navigation menu items
- Show each section briefly

### Narration
> "Let's explore the main sections of the dashboard. On the left sidebar, you'll find:

> **Dashboard** - Your real-time metrics overview
> **Queue Management** - Monitor and control email queues
> **Configuration** - Manage server settings
> **Analytics** - Deep dive into delivery statistics
> **Security** - Access control and audit logs
> **Health Check** - System diagnostics and monitoring"

### On-Screen Actions
1. Hover over "Dashboard" menu item
2. Click "Queue Management" - show preview
3. Click "Configuration" - show preview
4. Click "Analytics" - show preview
5. Click "Security" - show preview
6. Click "Health Check" - show preview
7. Return to Dashboard

### On-Screen Text
- Show tooltip for each menu item as you hover

---

## Scene 5: Understanding Key Metrics (45 seconds)

### Visual
- Focus on KPI cards
- Show metric animations
- Highlight trend indicators

### Narration
> "Understanding your metrics is crucial. The **Emails Sent** counter shows total delivered messages. The **Bounce Rate** indicates delivery issues - ideally, this should stay below 5%. **Delayed Messages** shows emails waiting in queue, and **Messages per Minute** displays current throughput. Green indicators show positive trends, while red indicates areas needing attention."

### On-Screen Highlights
1. Point to each metric card
2. Show tooltip explaining each metric
3. Highlight trend arrows (↑ green, ↓ red)
4. Circle percentage changes

### On-Screen Text
- "Emails Sent: Total successful deliveries"
- "Bounce Rate: Failed delivery percentage"
- "Delayed: Queued messages awaiting retry"
- "Throughput: Current delivery rate"

---

## Scene 6: Quick Settings Check (30 seconds)

### Visual
- Click user avatar/menu in top-right
- Show dropdown with user options
- Highlight theme toggle
- Show notification settings

### Narration
> "Before we wrap up, let's check the user settings. Click your profile icon in the top right to access account settings, theme preferences, and notification options. You can toggle between light and dark mode, adjust auto-refresh intervals, and configure alert preferences."

### On-Screen Actions
1. Click user avatar
2. Show settings dropdown
3. Toggle dark mode (show change)
4. Toggle back to light mode
5. Close dropdown

### On-Screen Text
- "Customize your experience"
- "Settings sync across sessions"

---

## Scene 7: Getting Help (30 seconds)

### Visual
- Show help icon in top navigation
- Display help panel
- Highlight contextual tooltips

### Narration
> "Need assistance? Click the help icon at any time to access contextual help, keyboard shortcuts, and documentation. Hover over any feature to see quick tooltips explaining its purpose. You can also press F1 to open the help panel from anywhere in the dashboard."

### On-Screen Actions
1. Click help icon (?)
2. Show help panel sliding in
3. Demonstrate hovering over a feature to show tooltip
4. Show "Press F1 for Help" notification
5. Close help panel

### On-Screen Text
- "Help Icon: Context-sensitive assistance"
- "F1: Quick help access"
- "Tooltips: Hover for details"

---

## Scene 8: Next Steps (30 seconds)

### Visual
- Show dashboard with all features visible
- Display links to next tutorials

### Narration
> "Congratulations! You're now familiar with the KumoMTA UI Dashboard basics. In our next tutorial, we'll dive deep into Queue Management, where you'll learn to monitor, filter, and control email queues effectively. Thanks for watching!"

### On-Screen Text
- "Next Tutorial: Queue Management"
- "Resources:"
  - "📚 Full Documentation: /docs"
  - "❓ FAQ: /docs/FAQ.md"
  - "🚀 Quick Reference: /docs/QUICK_REFERENCE.md"

### Call to Action
> "Ready to master queue management? Watch Tutorial 2 now!"

---

## Screenshots Needed

1. **Login Screen** - Clean login form with branding
2. **Dashboard Overview** - Full dashboard with metrics and charts
3. **KPI Cards** - Close-up of metric cards with trend indicators
4. **Navigation Menu** - Highlighted sidebar with menu items
5. **Chart View** - 24-hour throughput chart with data points
6. **User Settings** - Settings dropdown with theme toggle
7. **Help Panel** - Help sidebar with contextual assistance
8. **Mobile View** - Responsive dashboard on tablet/mobile

---

## Diagrams Required

### Dashboard Layout Diagram
```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo | Navigation | User Menu | Help           │
├──────────┬──────────────────────────────────────────────┤
│          │  KPI Cards Row                               │
│ Sidebar  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│          │  │Sent  │ │Bounce│ │Delay │ │Through│       │
│ - Dash   │  │12.5K │ │ 2.3% │ │ 450  │ │125/min│       │
│ - Queue  │  └──────┘ └──────┘ └──────┘ └──────┘       │
│ - Config │                                              │
│ - Analytics│  Chart: 24-Hour Throughput                │
│ - Security│  ┌──────────────────────────────────┐      │
│ - Health │  │ [Line graph showing email volume]│      │
│          │  └──────────────────────────────────┘      │
└──────────┴──────────────────────────────────────────────┘
```

### Navigation Flow Diagram
```
Login → Dashboard → Choose Section:
                    ├─ Queue Management
                    ├─ Configuration
                    ├─ Analytics
                    ├─ Security
                    └─ Health Check
```

---

## Interactive Elements

### Quiz Questions (End of Tutorial)
1. **How often does the dashboard refresh metrics automatically?**
   - a) Every 1 second
   - b) Every 5 seconds ✓
   - c) Every 30 seconds
   - d) Manual refresh only

2. **What does the Bounce Rate metric indicate?**
   - a) Emails waiting in queue
   - b) Successful deliveries
   - c) Failed delivery percentage ✓
   - d) Server uptime

3. **How can you access help from anywhere in the dashboard?**
   - a) Click Settings
   - b) Press F1 ✓
   - c) Restart the dashboard
   - d) Contact support

---

## Production Notes

### Camera Movements
- Smooth zoom transitions between sections
- Highlight cursor movements for clarity
- Use slow pans for overview shots
- Quick cuts for menu navigation

### Audio
- Clear, professional voice-over
- Background music: Subtle, corporate/tech style (low volume)
- Sound effects: Subtle clicks for button presses
- Audio levels: Voice at -3dB, music at -20dB

### Graphics
- Use callout boxes for important information
- Animate arrows pointing to UI elements
- Fade in/out for on-screen text
- Progress bar showing tutorial completion

### Accessibility
- Include closed captions for all narration
- Audio description track for screen readers
- High contrast mode demonstration
- Keyboard navigation showcase

---

## Follow-Up Actions

After watching this tutorial, users should be able to:
✓ Log into the KumoMTA UI Dashboard
✓ Navigate the main sections
✓ Understand key performance metrics
✓ Access help and documentation
✓ Customize basic settings
✓ Be ready for advanced queue management training

---

## Additional Resources Referenced
- User Guide: `/docs/USER_GUIDE.md`
- API Documentation: `/docs/API.md`
- Troubleshooting: `/docs/TROUBLESHOOTING.md`
- Quick Reference: `/docs/QUICK_REFERENCE.md` (to be created)
