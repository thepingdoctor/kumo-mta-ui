import { beforeAll, afterEach, afterAll } from 'vitest';

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState: number = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;

    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(data: string | ArrayBuffer | Blob | ArrayBufferView): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Simulate sending - data is intentionally unused in mock
    void data;
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new Event('close'));
    }
    // code and reason are intentionally unused in mock
    void code;
    void reason;
  }

  addEventListener(type: string, listener: EventListener): void {
    if (type === 'open') this.onopen = listener as (event: Event) => void;
    if (type === 'close') this.onclose = listener as (event: Event) => void;
    if (type === 'error') this.onerror = listener as (event: Event) => void;
    if (type === 'message') this.onmessage = listener as (event: MessageEvent) => void;
  }

  removeEventListener(type: string, listener: EventListener): void {
    if (type === 'open' && this.onopen === listener) this.onopen = null;
    if (type === 'close' && this.onclose === listener) this.onclose = null;
    if (type === 'error' && this.onerror === listener) this.onerror = null;
    if (type === 'message' && this.onmessage === listener) this.onmessage = null;
  }
}

beforeAll(() => {
  // Install WebSocket mock
  global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
});

afterEach(() => {
  // Clean up after each test
});

afterAll(() => {
  // Restore original WebSocket if needed
});

export { MockWebSocket };
