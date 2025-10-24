import { http, HttpResponse } from 'msw';

const baseURL = 'http://localhost:8000';

export const handlers = [
  // KumoMTA metrics endpoint
  http.get(`${baseURL}/api/admin/metrics/v1`, () => {
    return HttpResponse.json({
      messages_sent: 12450,
      bounces: 125,
      delayed: 45,
      throughput: 350,
      active_connections: 28,
    });
  }),

  // Queue metrics endpoint
  http.get(`${baseURL}/api/admin/metrics/queue`, () => {
    return HttpResponse.json({
      totalWaiting: 234,
      totalProcessing: 15,
      totalCompleted: 10239,
    });
  }),

  // Bounce classifications
  http.get(`${baseURL}/api/admin/bounce/v1`, () => {
    return HttpResponse.json({
      hard_bounces: 85,
      soft_bounces: 40,
      classifications: [
        { code: '5.1.1', count: 45, description: 'Bad destination mailbox address' },
        { code: '5.7.1', count: 25, description: 'Delivery not authorized' },
      ],
    });
  }),

  // Scheduled queue
  http.get(`${baseURL}/api/admin/bounce-list/v1`, () => {
    return HttpResponse.json({
      domains: [
        { domain: 'example.com', scheduled: 125, ready: 45 },
        { domain: 'test.com', scheduled: 89, ready: 23 },
      ],
    });
  }),

  // Suspend queue
  http.post(`${baseURL}/api/admin/suspend/v1`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, domain: body.domain });
  }),

  // Resume queue
  http.post(`${baseURL}/api/admin/resume/v1`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, domain: body.domain });
  }),

  // Rebind messages
  http.post(`${baseURL}/api/admin/rebind/v1`, async () => {
    return HttpResponse.json({ success: true, rebounded: 150 });
  }),

  // Bounce messages
  http.post(`${baseURL}/api/admin/bounce/v1`, async () => {
    return HttpResponse.json({ success: true, bounced: 75 });
  }),

  // Trace logs
  http.get(`${baseURL}/api/admin/trace-smtp-server/v1`, () => {
    return HttpResponse.json({
      logs: [
        { timestamp: '2024-01-01T12:00:00Z', level: 'INFO', message: 'SMTP connection established' },
        { timestamp: '2024-01-01T12:01:00Z', level: 'DEBUG', message: 'Message received' },
      ],
    });
  }),

  // Set diagnostic log filter
  http.post(`${baseURL}/api/admin/set-diagnostic-log-filter/v1`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, filter: body.filter, duration: body.duration });
  }),

  // Suspend ready queue
  http.post(`${baseURL}/api/admin/suspend-ready-q/v1`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, domain: body.domain, reason: body.reason });
  }),

  // KumoMTA Prometheus metrics endpoint
  http.get(`${baseURL}/metrics.json`, () => {
    return HttpResponse.json({
      kumomta_connection_count: { service: 'smtp', value: 42 },
      kumomta_messages_sent_total: { value: 12450 },
      kumomta_bounce_total: { value: 125 },
      kumomta_delayed_total: { value: 45 },
      kumomta_throughput: { value: 350 },
      kumomta_active_connections: { value: 28 },
    });
  }),

  // Configuration endpoints
  http.get(`${baseURL}/api/admin/config/core`, () => {
    return HttpResponse.json({
      maxConcurrentDeliveries: 1000,
      messageRetention: 7,
      defaultDomain: 'example.com',
    });
  }),

  http.put(`${baseURL}/api/admin/config/core`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, config: body });
  }),
];
