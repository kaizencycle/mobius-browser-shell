import React from 'react';
import type { LineageNode, LineageRelation } from '../../src/lib/chamber-journey/types';

const RELATION_LABELS: Record<LineageRelation, string> = {
  influenced: 'influenced',
  reinterpreted: 'reinterpreted',
  parallel: 'parallel',
  'responded-to': 'responded to',
  'derived-from': 'derived from',
  uncertain: 'uncertain link',
};

interface Props {
  nodes: LineageNode[];
  className?: string;
}

export function LineageVisualization({ nodes, className = '' }: Props) {
  if (nodes.length === 0) return null;

  return (
    <div
      className={`journey-lineage ${className}`.trim()}
      role="list"
      aria-label="Source lineage"
    >
      {nodes.map((node, index) => (
        <React.Fragment key={node.id}>
          <div className="journey-lineage-node" role="listitem">
            <div className="journey-lineage-label">{node.label}</div>
            {node.period && (
              <div className="journey-lineage-period">{node.period}</div>
            )}
          </div>
          {index < nodes.length - 1 && (
            <div className="journey-lineage-connector" aria-hidden>
              <span className="journey-lineage-arrow">↓</span>
              {(() => {
                const nextRelation = nodes[index + 1]?.relation;
                return nextRelation ? (
                  <span className="journey-lineage-relation">
                    {RELATION_LABELS[nextRelation]}
                  </span>
                ) : null;
              })()}
            </div>
          )}
        </React.Fragment>
      ))}
      <div className="journey-lineage-node journey-lineage-node--learner" role="listitem">
        <div className="journey-lineage-label">Your interpretation</div>
      </div>
    </div>
  );
}
