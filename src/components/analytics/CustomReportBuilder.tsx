import React, { useState } from 'react';
import { Download, Plus, Trash2, GripVertical } from 'lucide-react';

interface ReportWidget {
  id: string;
  type: 'metric' | 'chart' | 'table';
  title: string;
  config: Record<string, unknown>;
}

/**
 * Drag-and-drop custom report builder
 */
export const CustomReportBuilder: React.FC = () => {
  const [widgets, setWidgets] = useState<ReportWidget[]>([
    {
      id: '1',
      type: 'metric',
      title: 'Messages Sent',
      config: { metric: 'messages_sent' },
    },
  ]);

  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  const availableWidgets: Omit<ReportWidget, 'id'>[] = [
    { type: 'metric', title: 'Success Rate', config: { metric: 'success_rate' } },
    { type: 'metric', title: 'Bounce Rate', config: { metric: 'bounce_rate' } },
    { type: 'chart', title: 'Trend Chart', config: { chart_type: 'line' } },
    { type: 'chart', title: 'Distribution', config: { chart_type: 'pie' } },
    { type: 'table', title: 'Top Domains', config: { rows: 10 } },
  ];

  const addWidget = (widget: Omit<ReportWidget, 'id'>) => {
    setWidgets([...widgets, { ...widget, id: Date.now().toString() }]);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  const handleDragStart = (id: string) => {
    setDraggedWidget(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedWidget) return;

    const draggedIndex = widgets.findIndex((w) => w.id === draggedWidget);
    const targetIndex = widgets.findIndex((w) => w.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    setWidgets(newWidgets);
    setDraggedWidget(null);
  };

  const exportReport = () => {
    // Mock export functionality
    const reportData = {
      title: 'Custom Analytics Report',
      generated_at: new Date().toISOString(),
      widgets: widgets.map((w) => ({
        type: w.type,
        title: w.title,
        data: 'mock data', // Replace with actual data
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">
            Custom Report Builder
          </h3>
          <button
            onClick={exportReport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>

        {/* Available Widgets */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Available Widgets
          </h4>
          <div className="flex flex-wrap gap-2">
            {availableWidgets.map((widget, index) => (
              <button
                key={index}
                onClick={() => addWidget(widget)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-1" />
                {widget.title}
              </button>
            ))}
          </div>
        </div>

        {/* Report Canvas */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Report Layout
          </h4>
          {widgets.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <p>No widgets added yet. Add widgets from above to build your report.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {widgets.map((widget) => (
                <div
                  key={widget.id}
                  draggable
                  onDragStart={() => handleDragStart(widget.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(widget.id)}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-move hover:bg-gray-100 dark:hover:bg-gray-750"
                >
                  <div className="flex items-center">
                    <GripVertical className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-dark-text">
                        {widget.title}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Type: {widget.type}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
