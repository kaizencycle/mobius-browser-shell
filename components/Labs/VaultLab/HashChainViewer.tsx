import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Link2 } from 'lucide-react';

interface Props {
  prevHash: string | null;
  thisHash: string;
}

function shortHash(h: string) {
  return `${h.slice(0, 8)}…${h.slice(-6)}`;
}

export const HashChainViewer: React.FC<Props> = ({ prevHash, thisHash }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(x => !x)}
        className="flex items-center gap-1.5 text-[10px] font-mono text-stone-400 hover:text-stone-600 transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Link2 className="w-3 h-3" />
        Hash Chain
      </button>
      {expanded && (
        <div className="mt-1.5 pl-3 border-l-2 border-stone-100 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-stone-400 font-mono w-16 shrink-0">prev</span>
            {prevHash ? (
              <span className="text-[9px] font-mono text-stone-500 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-100">
                {shortHash(prevHash)}
              </span>
            ) : (
              <span className="text-[9px] font-mono text-emerald-600 italic">genesis</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-stone-400 font-mono w-16 shrink-0">this</span>
            <span className="text-[9px] font-mono text-stone-700 bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200 font-bold">
              {shortHash(thisHash)}
            </span>
          </div>
          <details className="mt-0.5">
            <summary className="text-[9px] text-stone-300 cursor-pointer select-none">full hash</summary>
            <p className="text-[9px] font-mono text-stone-400 break-all mt-0.5 leading-relaxed">{thisHash}</p>
          </details>
        </div>
      )}
    </div>
  );
};
