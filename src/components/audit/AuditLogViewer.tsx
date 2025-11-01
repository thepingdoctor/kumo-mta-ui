/**
 * AuditLogViewer Component for KumoMTA UI Dashboard
 * Comprehensive audit log viewer with filtering, search, and export
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuditStore } from '../../stores/auditStore';
import type { AuditLogFilter } from '../../types/audit';
import AuditLogTable from './AuditLogTable';
import AuditLogFilters from './AuditLogFilters';
import AuditEventDetails from './AuditEventDetails';
import AuditLogTimeline from './AuditLogTimeline';
import AuditLogStats from './AuditLogStats';

type ViewMode = 'table' | 'timeline';

const AuditLogViewer: React.FC = () => {
  const {
    filteredEvents,
    selectedEvent,
    stats,
    isLoading,
    error,
    totalEvents,
    currentPage,
    pageSize,
    realtimeEnabled,
    fetchAuditLogs,
    fetchAuditStats,
    searchLogs,
    setFilters,
    clearFilters,
    selectEvent,
    exportLogs,
    toggleRealtime,
    setPage,
    setPageSize,
    clearError,
  } = useAuditStore();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [showStats, setShowStats] = useState(true);

  // Initialize audit logs
  useEffect(() => {
    fetchAuditLogs();
    fetchAuditStats();
  }, [fetchAuditLogs, fetchAuditStats]);

  // Setup WebSocket for realtime updates
  useEffect(() => {
    if (!realtimeEnabled) return;

    const ws = new WebSocket(
      `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/audit`
    );

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_event') {
          useAuditStore.getState().addRealtimeEvent(data.payload);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [realtimeEnabled]);

  // Handle search
  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (value.trim()) {
        searchLogs(value);
      } else {
        fetchAuditLogs();
      }
    },
    [searchLogs, fetchAuditLogs]
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (filters: Partial<AuditLogFilter>) => {
      setFilters(filters);
    },
    [setFilters]
  );

  // Handle export
  const handleExport = useCallback(
    async (format: 'csv' | 'json' | 'pdf') => {
      try {
        await exportLogs(format);
      } catch (error) {
        console.error('Export failed:', error);
      }
    },
    [exportLogs]
  );

  // Handle pagination
  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
    },
    [setPage]
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
    },
    [setPageSize]
  );

  // Calculate pagination info
  const totalPages = useMemo(
    () => Math.ceil(totalEvents / pageSize),
    [totalEvents, pageSize]
  );

  return (
    <div className="audit-log-viewer">
      {/* Header */}
      <div className="audit-header">
        <div className="header-left">
          <h1>Audit Log</h1>
          <span className="event-count">
            {totalEvents.toLocaleString()} events
          </span>
        </div>

        <div className="header-right">
          {/* View mode toggle */}
          <div className="view-mode-toggle">
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1zm1 2v2h12V6H4zm0 4v2h12v-2H4zm0 4v2h12v-2H4z" />
              </svg>
            </button>
            <button
              className={viewMode === 'timeline' ? 'active' : ''}
              onClick={() => setViewMode('timeline')}
              aria-label="Timeline view"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 10V6h4v4H8z" />
              </svg>
            </button>
          </div>

          {/* Realtime toggle */}
          <button
            className={`realtime-toggle ${realtimeEnabled ? 'active' : ''}`}
            onClick={toggleRealtime}
            title={realtimeEnabled ? 'Disable realtime updates' : 'Enable realtime updates'}
          >
            <span className={`indicator ${realtimeEnabled ? 'live' : ''}`} />
            {realtimeEnabled ? 'Live' : 'Paused'}
          </button>

          {/* Export dropdown */}
          <div className="export-dropdown">
            <button className="export-button">
              Export
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 6l4 4 4-4H4z" />
              </svg>
            </button>
            <div className="export-menu">
              <button onClick={() => handleExport('csv')}>Export as CSV</button>
              <button onClick={() => handleExport('json')}>Export as JSON</button>
              <button onClick={() => handleExport('pdf')}>Export as PDF</button>
            </div>
          </div>

          {/* Filter toggle */}
          <button
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 4h14a1 1 0 010 2H3a1 1 0 010-2zm2 5h10a1 1 0 010 2H5a1 1 0 010-2zm2 5h6a1 1 0 010 2H7a1 1 0 010-2z" />
            </svg>
          </button>

          {/* Stats toggle */}
          <button
            className="stats-toggle"
            onClick={() => setShowStats(!showStats)}
            aria-label="Toggle statistics"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11h4v7H2v-7zm6-9h4v16H8V2zm6 5h4v11h-4V7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="search-bar">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="text"
          placeholder="Search audit logs..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button
            className="clear-search"
            onClick={() => handleSearch('')}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
            </svg>
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="error-banner">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
          <button onClick={clearError} aria-label="Dismiss error">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
            </svg>
          </button>
        </div>
      )}

      {/* Statistics */}
      {showStats && stats && <AuditLogStats stats={stats} />}

      <div className="audit-content">
        {/* Filters sidebar */}
        {showFilters && (
          <AuditLogFilters
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />
        )}

        {/* Main content */}
        <div className="audit-main">
          {isLoading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              <p>Loading audit logs...</p>
            </div>
          ) : viewMode === 'table' ? (
            <AuditLogTable
              events={filteredEvents}
              onEventClick={selectEvent}
              currentPage={currentPage}
              pageSize={pageSize}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          ) : (
            <AuditLogTimeline events={filteredEvents} onEventClick={selectEvent} />
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                Previous
              </button>
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Event details modal */}
      {selectedEvent && (
        <AuditEventDetails event={selectedEvent} onClose={() => selectEvent(null)} />
      )}

      <style jsx>{`
        .audit-log-viewer {
          padding: 24px;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .audit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-left h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
          color: #1a202c;
        }

        .event-count {
          padding: 4px 12px;
          background: #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          color: #4a5568;
        }

        .header-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .view-mode-toggle {
          display: flex;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }

        .view-mode-toggle button {
          padding: 8px 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #718096;
          transition: all 0.2s;
        }

        .view-mode-toggle button:hover {
          background: #f7fafc;
        }

        .view-mode-toggle button.active {
          background: #3182ce;
          color: white;
        }

        .realtime-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #4a5568;
          transition: all 0.2s;
        }

        .realtime-toggle:hover {
          border-color: #cbd5e0;
        }

        .realtime-toggle.active {
          border-color: #48bb78;
          background: #f0fff4;
          color: #22543d;
        }

        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #cbd5e0;
        }

        .indicator.live {
          background: #48bb78;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .export-dropdown {
          position: relative;
        }

        .export-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #4a5568;
          transition: all 0.2s;
        }

        .export-button:hover {
          border-color: #cbd5e0;
        }

        .export-menu {
          display: none;
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 4px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          min-width: 160px;
          z-index: 10;
        }

        .export-dropdown:hover .export-menu {
          display: block;
        }

        .export-menu button {
          display: block;
          width: 100%;
          padding: 10px 16px;
          border: none;
          background: transparent;
          text-align: left;
          cursor: pointer;
          color: #4a5568;
          transition: background 0.2s;
        }

        .export-menu button:hover {
          background: #f7fafc;
        }

        .filter-toggle,
        .stats-toggle {
          padding: 8px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          color: #718096;
          transition: all 0.2s;
        }

        .filter-toggle:hover,
        .stats-toggle:hover {
          border-color: #cbd5e0;
          color: #4a5568;
        }

        .search-bar {
          position: relative;
          margin-bottom: 24px;
        }

        .search-bar svg {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #a0aec0;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 48px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
        }

        .clear-search {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          padding: 4px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #a0aec0;
        }

        .clear-search:hover {
          color: #718096;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: #fff5f5;
          border: 1px solid #fc8181;
          border-radius: 8px;
          margin-bottom: 24px;
          color: #c53030;
        }

        .error-banner button {
          margin-left: auto;
          padding: 4px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #c53030;
        }

        .audit-content {
          display: flex;
          gap: 24px;
        }

        .audit-main {
          flex: 1;
          min-width: 0;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
          background: white;
          border-radius: 12px;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: #3182ce;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-spinner p {
          margin-top: 16px;
          color: #718096;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding: 16px;
          background: white;
          border-radius: 8px;
        }

        .pagination button {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          color: #4a5568;
          transition: all 0.2s;
        }

        .pagination button:hover:not(:disabled) {
          border-color: #cbd5e0;
          background: #f7fafc;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 14px;
          color: #718096;
        }
      `}</style>
    </div>
  );
};

export default AuditLogViewer;
