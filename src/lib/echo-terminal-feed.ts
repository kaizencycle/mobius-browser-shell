/**
 * Merge Mobius Terminal snapshot signals into ECHO Threat Intelligence entries.
 * Replaces demo mock CVEs when OAA RAG is unavailable — the Terminal is canonical.
 */

import { env } from '../../config/env';
import type { TerminalState, TerminalSignal } from './terminal-bridge';
import { isCyberRelevantSignal, shieldSeverityFromSignal } from './terminal-bridge';
import type {
  ThreatDomain,
  ThreatIntelligenceEntry,
  ThreatIntelligenceFeed,
  ThreatRAGSource,
  ThreatSeverity,
  ThreatStatus,
} from '../../types';

function signalToThreatSeverity(sig: TerminalSignal): ThreatSeverity {
  const bucket = shieldSeverityFromSignal(sig.severity);
  switch (bucket) {
    case 'critical':
      return 'critical';
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    default:
      return 'info';
  }
}

function slugId(sig: TerminalSignal): string {
  const raw = `${sig.agentName}|${sig.source}|${sig.label}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (h << 5) - h + raw.charCodeAt(i);
    h |= 0;
  }
  return `terminal-sig-${(h >>> 0).toString(16)}`;
}

function inferDomain(sig: TerminalSignal): ThreatDomain {
  const hay = `${sig.source} ${sig.label}`.toLowerCase();
  if (hay.includes('health') || hay.includes('hipaa') || hay.includes('medical')) {
    return 'digital_health';
  }
  if (
    hay.includes('owasp') ||
    hay.includes('policy') ||
    hay.includes('compliance') ||
    hay.includes('identity')
  ) {
    return 'cyber_security';
  }
  return 'cyber_threats';
}

/**
 * Map terminal micro-agent signals to threat feed rows (live, no mock).
 */
export function terminalSignalsToThreatEntries(
  state: TerminalState | null,
  opts: { max?: number } = {},
): ThreatIntelligenceEntry[] {
  if (!state) return [];
  const max = opts.max ?? 24;
  const list = state.signals.all
    .filter(isCyberRelevantSignal)
    .filter((s) => s.severity !== 'nominal' || s.value < 0.85)
    .sort((a, b) => {
      const order = { critical: 0, alert: 1, watch: 2, nominal: 3 } as const;
      return order[a.severity] - order[b.severity];
    })
    .slice(0, max);

  const ts = state.timestamp || new Date().toISOString();
  const terminalBase = env.terminalOrigin.replace(/\/+$/, '');
  const signalsUrl = `${terminalBase}/signals`;

  return list.map((sig) => {
    const domain = inferDomain(sig);
    const severity = signalToThreatSeverity(sig);
    const status: ThreatStatus =
      severity === 'critical' || severity === 'high' ? 'active' : 'monitoring';

    const ragSources: ThreatRAGSource[] = [
      {
        name: 'Mobius Terminal',
        url: signalsUrl,
        type: 'threat_feed',
        retrievedAt: ts,
        relevanceScore: Math.min(0.99, Math.max(0.5, sig.value)),
      },
    ];

    return {
      id: slugId(sig),
      source: 'terminal' as const,
      timestamp: ts,
      domain,
      severity,
      status,
      title: sig.label || `${sig.agentName} signal`,
      summary: `${sig.agentName} · ${sig.source} · value ${sig.value.toFixed(2)} (${sig.severity})`,
      details: `Live signal from terminal snapshot (${state.source}). Cycle ${state.cycle}.`,
      indicators: [sig.source, sig.agentName].filter(Boolean),
      recommendations: [
        'Review the signal in Mobius Terminal for lane context.',
        'If severity is elevated, confirm upstream services and OAA read paths.',
      ],
      ragSources,
      tags: ['terminal', 'live', sig.severity],
      ttl: 2,
      echoConfidence: sig.value,
    };
  });
}

/**
 * Prepend live Terminal-derived rows to the ECHO feed (OAA RAG rows follow).
 */
export function mergeThreatFeedWithTerminal(
  feed: ThreatIntelligenceFeed,
  terminalState: TerminalState | null,
): ThreatIntelligenceFeed {
  const terminalEntries = terminalSignalsToThreatEntries(terminalState);
  const seen = new Set<string>();
  const merged: ThreatIntelligenceEntry[] = [];

  for (const e of terminalEntries) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    merged.push(e);
  }
  for (const e of feed.entries) {
    if (seen.has(e.id)) continue;
    merged.push(e);
    seen.add(e.id);
  }

  merged.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const domainBreakdown = {
    cyber_threats: 0,
    cyber_security: 0,
    digital_health: 0,
  } as Record<ThreatDomain, number>;
  for (const e of merged) {
    domainBreakdown[e.domain]++;
  }

  const terminalLive = terminalEntries.length;

  return {
    ...feed,
    entries: merged,
    metadata: {
      ...feed.metadata,
      lastUpdated: new Date().toISOString(),
      totalEntries: merged.length,
      criticalCount: merged.filter((e) => e.severity === 'critical').length,
      highCount: merged.filter((e) => e.severity === 'high').length,
      domainBreakdown,
      liveTerminalSignalCount: terminalLive,
    },
  };
}
