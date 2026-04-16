import React from 'react';

interface LabSkeletonProps {
  label?: string;
}

export const LabSkeleton: React.FC<LabSkeletonProps> = ({ label }) => {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center bg-stone-100 text-stone-500"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 font-mono text-xs">
        <span
          className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-stone-400"
          aria-hidden
        />
        <span>{label ? `Loading ${label}…` : 'Loading lab…'}</span>
      </div>
    </div>
  );
};
