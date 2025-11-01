import React from 'react';

/**
 * Simple loading spinner component for Suspense fallback
 *
 * Displays a centered loading indicator while lazy-loaded components are being fetched.
 * Optimized for minimal bundle size impact.
 *
 * @returns {JSX.Element} Loading spinner
 */
const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-600 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default React.memo(LoadingSpinner);
