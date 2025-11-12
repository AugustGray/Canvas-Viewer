import React from 'react';

export const Spinner: React.FC<{ className?: string }> = ({ className = "h-10 w-10" }) => {
  return (
    <div
      className={`animate-spin rounded-full border-solid border-2 border-t-transparent border-[#44A0D1] dark:border-t-transparent dark:border-[#54C1FB] ${className}`}
      role="status"
    >
        <span className="sr-only">Loading...</span>
    </div>
  );
};
