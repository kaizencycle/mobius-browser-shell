import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { MICRewardBreakdown } from '../../src/lib/oaa/mic';

interface MicRewardToastProps {
  breakdown: MICRewardBreakdown;
  onDismiss: () => void;
}

export const MicRewardToast: React.FC<MicRewardToastProps> = ({ breakdown, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const rows = [
    { label: 'Quiz pass', value: breakdown.base, show: breakdown.base > 0 },
    { label: 'High retention', value: breakdown.highRetentionBonus, show: breakdown.highRetentionBonus > 0 },
    { label: 'Reflection', value: breakdown.reflectionBonus, show: breakdown.reflectionBonus > 0 },
    { label: 'JADE question', value: breakdown.jadeDepthBonus, show: breakdown.jadeDepthBonus > 0 },
  ].filter(r => r.show);

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        bg-white border-2 border-amber-400 rounded-2xl shadow-2xl shadow-amber-100
        px-5 py-4 min-w-[240px] max-w-xs
        transition-all duration-400 ease-out
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
      `}
    >
      <div className="flex items-center gap-3 mb-2">
        <Award className="w-6 h-6 text-amber-500 shrink-0" />
        <div>
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Comprehension verified</div>
          <div className="text-sm font-semibold text-stone-700 leading-snug">Learning attestation recorded</div>
        </div>
      </div>
      {rows.length > 0 && (
        <div className="space-y-0.5 border-t border-stone-100 pt-2 mt-2">
          {rows.map(r => (
            <div key={r.label} className="flex justify-between text-xs text-stone-500">
              <span>{r.label}</span>
              <span className="font-semibold text-stone-700">+{r.value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-2 text-[10px] text-stone-400 text-center leading-relaxed">
        Attestation logged. Fractal Shard portfolio attribution is not incremented on this path yet — stewardship recognition stays separate.
      </div>
    </div>
  );
};
