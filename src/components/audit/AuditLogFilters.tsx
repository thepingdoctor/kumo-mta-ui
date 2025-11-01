/**
 * AuditLogFilters Component
 * Advanced filtering sidebar for audit logs
 */

import React, { useState } from 'react';
import type { AuditLogFilter } from '../../types/audit';
import { AuditEventCategory, AuditSeverity } from '../../types/audit';

interface AuditLogFiltersProps {
  onFilterChange: (filters: Partial<AuditLogFilter>) => void;
  onClearFilters: () => void;
}

const AuditLogFilters: React.FC<AuditLogFiltersProps> = ({
  onFilterChange,
  onClearFilters,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<AuditEventCategory[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<AuditSeverity[]>([]);
  const [successFilter, setSuccessFilter] = useState<boolean | undefined>(undefined);

  const handleCategoryToggle = (category: AuditEventCategory) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(updated);
    onFilterChange({ categories: updated.length > 0 ? updated : undefined });
  };

  const handleSeverityToggle = (severity: AuditSeverity) => {
    const updated = selectedSeverities.includes(severity)
      ? selectedSeverities.filter((s) => s !== severity)
      : [...selectedSeverities, severity];
    setSelectedSeverities(updated);
    onFilterChange({ severities: updated.length > 0 ? updated : undefined });
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartDate(value);
      onFilterChange({ startDate: value || undefined });
    } else {
      setEndDate(value);
      onFilterChange({ endDate: value || undefined });
    }
  };

  const handleSuccessFilterChange = (value: string) => {
    const filter = value === 'all' ? undefined : value === 'success';
    setSuccessFilter(filter);
    onFilterChange({ success: filter });
  };

  const handleClearAll = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCategories([]);
    setSelectedSeverities([]);
    setSuccessFilter(undefined);
    onClearFilters();
  };

  return (
    <div className="audit-log-filters">
      <div className="filters-header">
        <h3>Filters</h3>
        <button className="clear-all" onClick={handleClearAll}>
          Clear All
        </button>
      </div>

      {/* Date Range */}
      <div className="filter-section">
        <h4>Date Range</h4>
        <div className="date-inputs">
          <div className="date-input-group">
            <label htmlFor="start-date">From</label>
            <input
              id="start-date"
              type="datetime-local"
              value={startDate}
              onChange={(e) => handleDateChange('start', e.target.value)}
            />
          </div>
          <div className="date-input-group">
            <label htmlFor="end-date">To</label>
            <input
              id="end-date"
              type="datetime-local"
              value={endDate}
              onChange={(e) => handleDateChange('end', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="filter-section">
        <h4>Category</h4>
        <div className="checkbox-group">
          {Object.values(AuditEventCategory).map((category) => (
            <label key={category} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
              />
              <span>{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Severity Filter */}
      <div className="filter-section">
        <h4>Severity</h4>
        <div className="checkbox-group">
          {Object.values(AuditSeverity).map((severity) => (
            <label key={severity} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedSeverities.includes(severity)}
                onChange={() => handleSeverityToggle(severity)}
              />
              <span>{severity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div className="filter-section">
        <h4>Status</h4>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="success"
              value="all"
              checked={successFilter === undefined}
              onChange={(e) => handleSuccessFilterChange(e.target.value)}
            />
            <span>All</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="success"
              value="success"
              checked={successFilter === true}
              onChange={(e) => handleSuccessFilterChange(e.target.value)}
            />
            <span>Success Only</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="success"
              value="failure"
              checked={successFilter === false}
              onChange={(e) => handleSuccessFilterChange(e.target.value)}
            />
            <span>Failures Only</span>
          </label>
        </div>
      </div>

      <style jsx>{`
        .audit-log-filters {
          width: 280px;
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          max-height: calc(100vh - 200px);
          overflow-y: auto;
        }

        .filters-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .filters-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }

        .clear-all {
          padding: 4px 12px;
          border: none;
          background: transparent;
          color: #3182ce;
          font-size: 13px;
          cursor: pointer;
          transition: color 0.2s;
        }

        .clear-all:hover {
          color: #2c5282;
          text-decoration: underline;
        }

        .filter-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .filter-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .filter-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .date-inputs {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .date-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .date-input-group label {
          font-size: 12px;
          color: #718096;
          font-weight: 500;
        }

        .date-input-group input {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13px;
          transition: all 0.2s;
        }

        .date-input-group input:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .checkbox-group,
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .checkbox-label,
        .radio-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .checkbox-label:hover,
        .radio-label:hover {
          background: #f7fafc;
        }

        .checkbox-label input,
        .radio-label input {
          cursor: pointer;
        }

        .checkbox-label span,
        .radio-label span {
          font-size: 14px;
          color: #4a5568;
        }
      `}</style>
    </div>
  );
};

export default AuditLogFilters;
