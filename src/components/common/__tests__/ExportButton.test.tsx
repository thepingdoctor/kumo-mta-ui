import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '../ExportButton';

describe('ExportButton', () => {
  it('should render with default props', () => {
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} />);

    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('should show dropdown when clicked', () => {
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} formats={['pdf', 'csv']} />);

    const button = screen.getByText('Export');
    fireEvent.click(button);

    expect(screen.getByText('Export as PDF')).toBeInTheDocument();
    expect(screen.getByText('Export as CSV')).toBeInTheDocument();
  });

  it('should call onExport with PDF format', () => {
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} formats={['pdf', 'csv']} />);

    const button = screen.getByText('Export');
    fireEvent.click(button);

    const pdfOption = screen.getByText('Export as PDF');
    fireEvent.click(pdfOption);

    expect(onExport).toHaveBeenCalledWith('pdf');
  });

  it('should call onExport with CSV format', () => {
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} formats={['pdf', 'csv']} />);

    const button = screen.getByText('Export');
    fireEvent.click(button);

    const csvOption = screen.getByText('Export as CSV');
    fireEvent.click(csvOption);

    expect(onExport).toHaveBeenCalledWith('csv');
  });

  it('should render simple button when only one format', () => {
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} formats={['pdf']} />);

    const button = screen.getByText('Export PDF');
    fireEvent.click(button);

    expect(onExport).toHaveBeenCalledWith('pdf');
    expect(screen.queryByText('Export as PDF')).not.toBeInTheDocument();
  });

  it('should render simple button when showDropdown is false', () => {
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} formats={['pdf', 'csv']} showDropdown={false} />);

    const button = screen.getByText('Export');
    fireEvent.click(button);

    expect(onExport).toHaveBeenCalledWith('pdf');
    expect(screen.queryByText('Export as PDF')).not.toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} disabled={true} />);

    const button = screen.getByText('Export');
    expect(button).toBeDisabled();
  });

  it('should close dropdown when backdrop is clicked', () => {
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} formats={['pdf', 'csv']} />);

    const button = screen.getByText('Export');
    fireEvent.click(button);

    expect(screen.getByText('Export as PDF')).toBeInTheDocument();

    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);

    // Dropdown should be closed
    expect(screen.queryByText('Export as PDF')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const onExport = vi.fn();
    const { container } = render(
      <ExportButton onExport={onExport} className="custom-class" />
    );

    const button = container.querySelector('.custom-class');
    expect(button).toBeInTheDocument();
  });

  it('should use custom label', () => {
    const onExport = vi.fn();
    render(<ExportButton onExport={onExport} label="Download Report" />);

    expect(screen.getByText('Download Report')).toBeInTheDocument();
  });
});
