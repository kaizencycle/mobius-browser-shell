import React from 'react';
import { Construction, Clock3 } from 'lucide-react';

interface UnderConstructionLabProps {
  labName: string;
  subtitle?: string;
}

export const UnderConstructionLab: React.FC<UnderConstructionLabProps> = ({
  labName,
  subtitle = 'This module is being rebuilt and will return soon.',
}) => {
  return (
    <div className="h-full w-full bg-stone-50 flex items-center justify-center px-4">
      <div className="max-w-xl w-full rounded-2xl border border-amber-200 bg-white shadow-sm p-6 sm:p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
          <Construction className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900">
          {labName} — Under Construction
        </h2>
        <p className="mt-2 text-sm text-stone-600">{subtitle}</p>
        <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
          <Clock3 className="w-3.5 h-3.5" />
          <span>Maintenance mode active</span>
        </div>
      </div>
    </div>
  );
};

export default UnderConstructionLab;
