import React, { useState } from 'react';
import { X } from 'lucide-react';

const COVENANTS = [
  {
    id: 'integrity',
    name: 'Covenant of Integrity',
    glyph: '◈',
    principle: 'All actions declared before executed. All intents recorded. No silent operations.',
    mechanic: 'EPICON — every change carries an intent block visible to all citizens.',
  },
  {
    id: 'ecology',
    name: 'Covenant of Ecology',
    glyph: '◉',
    principle: 'Outputs contribute to the commons. Extraction without contribution degrades the system.',
    mechanic: 'MIC issuance proportional to epistemic contribution quality, not volume.',
  },
  {
    id: 'custodianship',
    name: 'Covenant of Custodianship',
    glyph: '⬡',
    principle: 'Sentinels hold the system, not control it. Authority is held in trust.',
    mechanic: 'Five-sentinel attestation quorum required for all vault seal ratifications.',
  },
];

interface Props {
  onClose: () => void;
}

export const CovenantPanel: React.FC<Props> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
        <div>
          <h2 className="text-base font-semibold text-stone-900">The Three Covenants</h2>
          <p className="text-xs text-stone-400 font-mono mt-0.5">Constitutional foundation of Mobius</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-6 py-5 flex flex-col gap-5">
        {COVENANTS.map(c => (
          <div key={c.id} className="flex gap-4">
            <span className="text-2xl shrink-0 mt-0.5">{c.glyph}</span>
            <div>
              <p className="text-sm font-semibold text-stone-900">{c.name}</p>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{c.principle}</p>
              <p className="text-[11px] text-stone-400 font-mono mt-1.5 leading-snug">{c.mechanic}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-3 bg-stone-50 border-t border-stone-100">
        <p className="text-[10px] text-stone-400 font-mono text-center">
          CC0 · Public Domain · Mobius Civic Infrastructure · C-312
        </p>
      </div>
    </div>
  </div>
);

export function useCovenantPanel() {
  const [open, setOpen] = useState(false);
  return { isOpen: open, open: () => setOpen(true), close: () => setOpen(false) };
}
