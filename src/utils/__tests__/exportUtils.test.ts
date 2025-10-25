import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCSV, exportToPDF, exportQueueToPDF } from '../exportUtils';
import jsPDF from 'jspdf';

// Mock jsPDF
vi.mock('jspdf', () => {
  const mockDoc = {
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    line: vi.fn(),
    addImage: vi.fn(),
    addPage: vi.fn(),
    setPage: vi.fn(),
    save: vi.fn(),
    getNumberOfPages: vi.fn(() => 1),
    internal: {
      pageSize: {
        width: 210,
        height: 297,
      },
    },
  };

  return {
    default: vi.fn(() => mockDoc),
  };
});

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

// Mock papaparse
vi.mock('papaparse', () => ({
  default: {
    unparse: vi.fn((data) => {
      // Simple CSV generation mock
      const headers = Object.keys(data[0] || {}).join(',');
      const rows = data.map((row: any) => Object.values(row).join(',')).join('\n');
      return `${headers}\n${rows}`;
    }),
  },
}));

describe('exportUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock document methods
    document.createElement = vi.fn((tag) => {
      const element = {
        href: '',
        download: '',
        style: { visibility: '' },
        click: vi.fn(),
      };
      return element as any;
    });
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  describe('exportToCSV', () => {
    it('should export data to CSV with columns', () => {
      const data = [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com' },
      ];

      const columns = [
        { header: 'ID', dataKey: 'id' },
        { header: 'Name', dataKey: 'name' },
        { header: 'Email', dataKey: 'email' },
      ];

      exportToCSV(data, 'test.csv', columns);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should export data to CSV without columns', () => {
      const data = [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' },
      ];

      exportToCSV(data, 'test.csv');

      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('exportToPDF', () => {
    it('should create PDF with default options', () => {
      const data = [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' },
      ];

      const columns = [
        { header: 'ID', dataKey: 'id' },
        { header: 'Name', dataKey: 'name' },
      ];

      exportToPDF(data, 'test.pdf', columns);

      expect(jsPDF).toHaveBeenCalled();
    });

    it('should create PDF with custom options', () => {
      const data = [{ id: '1', name: 'John' }];
      const columns = [
        { header: 'ID', dataKey: 'id' },
        { header: 'Name', dataKey: 'name' },
      ];

      exportToPDF(data, 'test.pdf', columns, {
        title: 'Custom Title',
        orientation: 'landscape',
        includeDate: false,
        includeMetadata: true,
        metadata: { 'Total': '1' },
      });

      expect(jsPDF).toHaveBeenCalledWith({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
    });
  });

  describe('exportQueueToPDF', () => {
    it('should export queue items to PDF', () => {
      const queueItems = [
        {
          id: '1',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          recipient: 'recipient@example.com',
          sender: 'sender@example.com',
          status: 'waiting',
          serviceType: 'transactional',
          createdAt: '2025-01-01',
        },
        {
          id: '2',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          recipient: 'recipient2@example.com',
          sender: 'sender2@example.com',
          status: 'completed',
          serviceType: 'marketing',
          createdAt: '2025-01-02',
        },
      ];

      exportQueueToPDF(queueItems);

      expect(jsPDF).toHaveBeenCalled();
    });

    it('should handle empty queue items', () => {
      exportQueueToPDF([]);
      expect(jsPDF).toHaveBeenCalled();
    });
  });
});
