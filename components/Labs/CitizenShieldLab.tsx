import React, { useState } from 'react';
import { getLabById } from '../../constants';
import { TabId, ThreatIntelligenceFeed } from '../../types';
import { shouldUseLiveMode } from '../../config/env';
import { LabFrame } from '../LabFrame';
import { Shield, CheckCircle, Wifi, Lock, Eye, AlertOctagon, Radio } from 'lucide-react';
import { CivicRadar, EchoThreatAgent, ThreatFeed, ShieldTerminalPanel } from '../CitizenShield';
import { useTerminal } from '../../contexts/TerminalContext';
import { computeDigitalHygieneScore, isCyberRelevantSignal } from '../../src/lib/terminal-bridge';
import {
  SeveritySummary,
  EchoAgentPanel,
  HygieneChecklist,
  PracticeMode,
  ShieldSkeleton,
} from './ShieldEnhancements';

export interface CitizenShieldLabProps {
  onNavigateToHive?: () => void;
}

export const CitizenShieldLab: React.FC<CitizenShieldLabProps> = ({ onNavigateToHive }) => {
  const lab = getLabById(TabId.SHIELD);
  const [threatFeed, setThreatFeed] = useState<ThreatIntelligenceFeed | null>(null);
  const { state: terminalState } = useTerminal();
  const hygieneScore = computeDigitalHygieneScore(terminalState);
  const resiliencePct = Math.round(hygieneScore * 100);
  const tripwireElevated = !!terminalState?.tripwire.elevated;
  const liveSignalCount =
    terminalState?.signals.all.filter(isCyberRelevantSignal).length ?? 0;
  
  // If live mode is enabled and URL exists, show iframe
  if (lab && shouldUseLiveMode(lab.url)) {
    return (
      <LabFrame 
        url={lab.url!} 
        title={lab.name}
        description={lab.description}
      />
    );
  }

  // Otherwise show demo UI
  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 text-slate-900">
        <div className="max-w-5xl mx-auto">
            <a
              href="#shield-terminal"
              className="sr-only focus:not-sr-only focus:block focus:w-fit focus:mb-3 focus:px-3 focus:py-2 focus:rounded-md focus:bg-slate-900 focus:text-white focus:text-sm"
            >
              Skip to terminal telemetry
            </a>
            
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-10 gap-4 sm:gap-0">
                <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg text-emerald-700">
                        <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Citizen Shield</h1>
                        <p className="text-slate-500 text-xs sm:text-sm">
                            Civic Layer Active • ECHO Sentinel Online
                            <span className="inline-flex items-center gap-1 ml-2">
                                <Radio className="w-3 h-3 text-cyan-500" />
                                <span className="text-cyan-600 font-medium">RAG Monitoring</span>
                            </span>
                            {terminalState && (
                                <span className="inline-flex items-center gap-1 ml-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                                    <span className="text-emerald-700 font-medium">
                                        Terminal {terminalState.cycle}
                                    </span>
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="text-left sm:text-right flex sm:block items-center gap-2">
                    <div
                        className={`text-2xl sm:text-3xl font-mono font-bold tabular-nums ${
                            resiliencePct >= 65
                                ? 'text-emerald-600'
                                : resiliencePct >= 45
                                  ? 'text-amber-600'
                                  : 'text-red-600'
                        }`}
                        role="meter"
                        aria-valuenow={resiliencePct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Digital resilience score ${resiliencePct} percent`}
                    >
                        {resiliencePct}%
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider font-semibold">
                        Resilience Score
                    </div>
                </div>
            </div>

            {/* Terminal Heartbeat — Live telemetry from Mobius Civic AI Terminal */}
            <div id="shield-terminal" className="mb-6 sm:mb-8 scroll-mt-4">
                <ShieldTerminalPanel />
            </div>

            {/* ECHO Threat Intelligence Agent — Primary Feature */}
            <div className="mb-6 sm:mb-8">
                <EchoThreatAgent onFeedUpdate={setThreatFeed} />
            </div>

            {/* ECHO Agent Panel + Severity Summary */}
            {threatFeed ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <EchoAgentPanel agentState={threatFeed.agentState} />
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-700 text-sm mb-3">Threat Severity Breakdown</h3>
                  <SeveritySummary feed={threatFeed} />
                </div>
              </div>
            ) : (
              <div className="mb-6 sm:mb-8 bg-white rounded-xl border border-slate-200 shadow-sm">
                <ShieldSkeleton />
              </div>
            )}

            {/* Shield Module Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                
                {/* Modules */}
                <div
                    role={onNavigateToHive ? 'button' : undefined}
                    tabIndex={onNavigateToHive ? 0 : undefined}
                    onClick={() => onNavigateToHive?.()}
                    onKeyDown={(e) => {
                      if (!onNavigateToHive) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onNavigateToHive();
                      }
                    }}
                    className={`bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between text-left w-full ${
                      onNavigateToHive
                        ? 'cursor-pointer hover:border-blue-200 hover:shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2'
                        : ''
                    }`}
                >
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-blue-50 text-blue-600 rounded-md">
                            <Wifi className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        {hygieneScore >= 0.65 ? (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                        ) : (
                            <AlertOctagon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Digital Hygiene</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                            Terminal-fed score {Math.round(hygieneScore * 100)}/100 · HTTPS &amp; passkey-capable.
                            {onNavigateToHive && (
                              <span className="block mt-1 text-blue-600 font-medium">Open HIVE mesh loop →</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-purple-50 text-purple-600 rounded-md">
                            <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Signal coverage</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                          {terminalState
                            ? `${liveSignalCount} cyber-scoped micro-signals in the latest terminal sweep.`
                            : 'Connect to the terminal to see live signal coverage.'}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-1.5 sm:p-2 bg-orange-50 text-orange-600 rounded-md">
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        {tripwireElevated ? (
                            <AlertOctagon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                        ) : (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Civic Resilience</h3>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                            {tripwireElevated
                                ? `Tripwire elevated · ${terminalState?.tripwire.count ?? 0} active.`
                                : terminalState?.degraded
                                  ? 'Terminal degraded · serving cached lanes.'
                                  : 'Terminal nominal · lanes healthy.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Hygiene Checklist + Practice Mode */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <HygieneChecklist />
              <PracticeMode />
            </div>

            {/* ECHO Threat Intelligence Feed — RAG Results */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6 sm:mb-8">
                <div className="p-4 sm:p-6">
                    <ThreatFeed 
                        feed={threatFeed}
                        maxEntries={6}
                    />
                </div>
            </div>

            {/* Civic Radar Section — Complementary Intelligence */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6">
                    <CivicRadar 
                        maxAlerts={4}
                        onModuleNavigate={() => {
                            document.getElementById('shield-terminal')?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                        }}
                    />
                </div>
            </div>

        </div>
    </div>
  );
};