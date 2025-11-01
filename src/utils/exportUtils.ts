import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';

interface PDFOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  includeDate?: boolean;
  includeMetadata?: boolean;
  metadata?: Record<string, string>;
}

interface TableColumn {
  header: string;
  dataKey: string;
}

/**
 * Add KumoMTA branded header to PDF
 */
const addPDFHeader = (doc: jsPDF, title: string, includeDate: boolean = true) => {
  // Company branding
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text('KumoMTA Dashboard', 14, 22);

  doc.setFontSize(14);
  doc.setTextColor(55, 65, 81); // Gray-700
  doc.text(title, 14, 32);

  // Date and time
  if (includeDate) {
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray-500
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    doc.text(`Generated: ${now}`, 14, 40);
  }

  // Horizontal line
  doc.setDrawColor(229, 231, 235); // Gray-200
  doc.setLineWidth(0.5);
  doc.line(14, 45, doc.internal.pageSize.width - 14, 45);

  return 50; // Return Y position for next content
};

/**
 * Add metadata section to PDF
 */
const addPDFMetadata = (doc: jsPDF, metadata: Record<string, string>, startY: number) => {
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99); // Gray-600

  let yPos = startY;
  Object.entries(metadata).forEach(([key, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(`${key}:`, 14, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(value, 50, yPos);
    yPos += 6;
  });

  return yPos + 5; // Return Y position for next content
};

/**
 * Export data to PDF with formatted tables
 */
export const exportToPDF = (
  data: Record<string, unknown>[],
  filename: string,
  columns: TableColumn[],
  options: PDFOptions = {}
): void => {
  const {
    title = 'Data Export',
    orientation = 'portrait',
    includeDate = true,
    includeMetadata = false,
    metadata = {},
  } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Add header
  let yPos = addPDFHeader(doc, title, includeDate);

  // Add metadata if provided
  if (includeMetadata && Object.keys(metadata).length > 0) {
    yPos = addPDFMetadata(doc, metadata, yPos);
  }

  // Add table
  autoTable(doc, {
    startY: yPos,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] || '')),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [37, 99, 235], // Blue-600
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // Gray-50
    },
    margin: { left: 14, right: 14 },
  });

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // Gray-400
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(filename);
};

/**
 * Export data to CSV format
 */
export const exportToCSV = (
  data: Record<string, unknown>[],
  filename: string,
  columns?: TableColumn[]
): void => {
  let csvData: Record<string, unknown>[] = data;

  // If columns are specified, transform data to match column structure
  if (columns) {
    csvData = data.map(row => {
      const transformedRow: Record<string, unknown> = {};
      columns.forEach(col => {
        transformedRow[col.header] = row[col.dataKey] || '';
      });
      return transformedRow;
    });
  }

  const csv = Papa.unparse(csvData, {
    quotes: true,
    header: true,
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export queue items to PDF
 */
interface QueueItem {
  id: string;
  domain: string;
  size: number;
  age: string;
  [key: string]: unknown;
}

export const exportQueueToPDF = (queueItems: QueueItem[]): void => {
  const columns: TableColumn[] = [
    { header: 'Customer', dataKey: 'customerName' },
    { header: 'Email', dataKey: 'customerEmail' },
    { header: 'Recipient', dataKey: 'recipient' },
    { header: 'Sender', dataKey: 'sender' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Service', dataKey: 'serviceType' },
    { header: 'Created', dataKey: 'createdAt' },
  ];

  const metadata = {
    'Total Items': queueItems.length.toString(),
    'Waiting': queueItems.filter(i => i.status === 'waiting').length.toString(),
    'Processing': queueItems.filter(i => ['sending', 'in-progress'].includes(i.status)).length.toString(),
    'Completed': queueItems.filter(i => i.status === 'completed').length.toString(),
  };

  exportToPDF(queueItems, `queue-export-${Date.now()}.pdf`, columns, {
    title: 'Queue Management Report',
    orientation: 'landscape',
    includeDate: true,
    includeMetadata: true,
    metadata,
  });
};

/**
 * Export analytics data to PDF with charts
 */
interface AnalyticsMetrics {
  successRate: number;
  bounces?: {
    hard_bounces?: number;
    soft_bounces?: number;
    classifications?: Array<{
      code: string;
      description: string;
      count: number;
    }>;
  };
  queueEfficiency: number;
  throughput: number;
  [key: string]: unknown;
}

export const exportAnalyticsToPDF = (
  metrics: AnalyticsMetrics,
  chartImages: { [key: string]: string } = {}
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Add header
  let yPos = addPDFHeader(doc, 'Analytics Report', true);

  // Add KPI metrics
  const kpiMetadata = {
    'Success Rate': metrics.successRate ? `${metrics.successRate.toFixed(2)}%` : 'N/A',
    'Total Bounces': ((metrics.bounces?.hard_bounces || 0) + (metrics.bounces?.soft_bounces || 0)).toString(),
    'Queue Efficiency': metrics.queueEfficiency ? `${metrics.queueEfficiency.toFixed(1)}%` : 'N/A',
    'Throughput': metrics.throughput ? `${metrics.throughput}/min` : 'N/A',
  };

  yPos = addPDFMetadata(doc, kpiMetadata, yPos);
  yPos += 5;

  // Add charts as images if provided
  const pageWidth = doc.internal.pageSize.width;
  const imageWidth = pageWidth - 28; // 14mm margin on each side
  const imageHeight = 80;

  Object.entries(chartImages).forEach(([chartName, imageData]) => {
    // Add new page if needed
    if (yPos + imageHeight + 20 > doc.internal.pageSize.height - 20) {
      doc.addPage();
      yPos = 20;
    }

    // Add chart title
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81); // Gray-700
    doc.text(chartName, 14, yPos);
    yPos += 8;

    // Add chart image
    if (imageData) {
      doc.addImage(imageData, 'PNG', 14, yPos, imageWidth, imageHeight);
      yPos += imageHeight + 10;
    }
  });

  // Add bounce classifications table if available
  if (metrics.bounces?.classifications && metrics.bounces.classifications.length > 0) {
    const totalBounces = (metrics.bounces.hard_bounces || 0) + (metrics.bounces.soft_bounces || 0);

    if (yPos + 40 > doc.internal.pageSize.height - 20) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text('Bounce Classifications', 14, yPos);
    yPos += 8;

    const bounceData = metrics.bounces.classifications.map((c) => ({
      code: c.code,
      description: c.description,
      count: c.count,
      percentage: ((c.count / totalBounces) * 100).toFixed(2) + '%',
    }));

    autoTable(doc, {
      startY: yPos,
      head: [['Code', 'Description', 'Count', 'Percentage']],
      body: bounceData.map((b) => [b.code, b.description, b.count, b.percentage]),
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`analytics-report-${Date.now()}.pdf`);
};

/**
 * Export security audit data to PDF
 */
export const exportSecurityAuditToPDF = (
  tlsConfig: TLSConfig,
  dkimConfig: DKIMConfig,
  ipRules: IPRule[]
): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPos = addPDFHeader(doc, 'Security Audit Report', true);

  // TLS Configuration
  doc.setFontSize(14);
  doc.setTextColor(55, 65, 81);
  doc.text('TLS/SSL Configuration', 14, yPos);
  yPos += 8;

  const tlsMetadata = {
    'Status': tlsConfig.enabled ? 'Enabled' : 'Disabled',
    'Certificate Path': tlsConfig.certificatePath || 'Not configured',
    'Private Key Path': tlsConfig.privateKeyPath || 'Not configured',
    'Cipher Suites': tlsConfig.cipherSuites || 'Default',
  };

  yPos = addPDFMetadata(doc, tlsMetadata, yPos);
  yPos += 10;

  // DKIM Configuration
  doc.setFontSize(14);
  doc.setTextColor(55, 65, 81);
  doc.text('DKIM Configuration', 14, yPos);
  yPos += 8;

  const dkimMetadata = {
    'Status': dkimConfig.enabled ? 'Enabled' : 'Disabled',
    'Domain': dkimConfig.domain || 'Not configured',
    'Selector': dkimConfig.selector || 'Not configured',
    'Private Key Path': dkimConfig.privateKeyPath || 'Not configured',
  };

  yPos = addPDFMetadata(doc, dkimMetadata, yPos);
  yPos += 10;

  // IP Rules
  if (ipRules.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(55, 65, 81);
    doc.text('IP Access Rules', 14, yPos);
    yPos += 8;

    autoTable(doc, {
      startY: yPos,
      head: [['IP Address', 'Type', 'Description']],
      body: ipRules.map(rule => [
        rule.ip,
        rule.type.charAt(0).toUpperCase() + rule.type.slice(1),
        rule.description,
      ]),
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`security-audit-${Date.now()}.pdf`);
};
