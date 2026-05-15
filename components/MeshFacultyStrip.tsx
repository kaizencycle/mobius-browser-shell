import React, { useMemo } from 'react';
import { useTerminal } from '../contexts/TerminalContext';
import {
  projectTerminalFaculty,
  summarizeMeshFaculty,
  type MeshFacultyProjection,
} from '../src/lib/terminal-agent-mesh';

function heartbeatClass(state: MeshFacultyProjection['heartbeat']) {
  switch (state) {
    case 'live':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'warm':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
    case 'stale':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-200';
    default:
      return 'border-stone-700 bg-stone-900/60 text-stone-400';
  }
}

export const MeshFacultyStrip: React.FC = () => {
  const { state } = useTerminal();

  const faculty = useMemo(() => projectTerminalFaculty(state), [state]);
  const summary = useMemo(() => summarizeMeshFaculty(faculty), [faculty]);

  return (
    <div className="mx-4 mt-3 rounded-xl border border-cyan-500/10 bg-[#071019]/90 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-cyan-500/10 px-4 py-2">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/80">
            Mesh Faculty
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            Live Terminal heartbeat projections reflected into the Hallway.
          </p>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-mono text-stone-400">
          <span>{summary.active}/{summary.total} active</span>
          <span>{summary.live} live</span>
          <span>{summary.warm} warm</span>
          {summary.stale > 0 && <span>{summary.stale} stale</span>}
          {summary.offline > 0 && <span>{summary.offline} offline</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 p-3">
        {faculty.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border px-3 py-2 transition-all ${heartbeatClass(item.heartbeat)}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold tracking-wide">
                  {item.persona.displayName}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] opacity-70">
                  {item.persona.title}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono uppercase">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.persona.color }}
                />
                {item.heartbeat}
              </div>
            </div>

            <div className="mt-2 text-[11px] text-stone-300/90 leading-relaxed">
              {item.persona.description}
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-stone-500">
              <span>{item.persona.district}</span>
              <span>{item.source === 'terminal' ? 'terminal-live' : 'fallback'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
