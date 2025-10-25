import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
  type?: 'card' | 'text' | 'stat' | 'table';
}

/**
 * Reusable loading skeleton component for better UX
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className = '',
  count = 1,
  type = 'card'
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  const renderSkeleton = () => {
    switch (type) {
      case 'stat':
        return (
          <div className={`rounded-lg bg-white dark:bg-dark-surface p-6 shadow ${className}`}>
            <div className="flex items-center">
              <div className={`${baseClasses} h-12 w-12`}></div>
              <div className="ml-4 flex-1">
                <div className={`${baseClasses} h-4 w-24 mb-2`}></div>
                <div className={`${baseClasses} h-8 w-32`}></div>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={className}>
            <div className={`${baseClasses} h-4 w-full mb-2`}></div>
            <div className={`${baseClasses} h-4 w-3/4`}></div>
          </div>
        );

      case 'table':
        return (
          <div className={`rounded-lg bg-white dark:bg-dark-surface shadow overflow-hidden ${className}`}>
            <div className={`${baseClasses} h-12 w-full`}></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`${baseClasses} h-16 w-full mt-1`}></div>
            ))}
          </div>
        );

      default: // card
        return (
          <div className={`rounded-lg bg-white dark:bg-dark-surface p-6 shadow ${className}`}>
            <div className={`${baseClasses} h-6 w-3/4 mb-4`}></div>
            <div className={`${baseClasses} h-4 w-full mb-2`}></div>
            <div className={`${baseClasses} h-4 w-5/6`}></div>
          </div>
        );
    }
  };

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
};

export default LoadingSkeleton;
