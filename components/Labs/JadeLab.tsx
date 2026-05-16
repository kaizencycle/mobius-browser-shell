/**
 * JadeLab - The Jade Chamber
 * 
 * Not a chatbox. A room you walk into.
 * 
 * Jade is Mobius Substrate's Pattern Oracle and Reflection Guide.
 * She sees patterns across cycles, mirrors what humans cannot yet see.
 * 
 * Features:
 * - Holographic avatar with rotating rings
 * - Voice input (speech-to-text)
 * - Voice output (text-to-speech)
 * - Glowing, ethereal UI
 * - Pattern recognition through LLM inference
 * - Name-aware personalized onboarding
 * - INSIGHTS tab: graph analysis panel (JADE-01 to JADE-20)
 */
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, Sparkles, Eye, MessageCircle } from 'lucide-react';
import { env } from '../../config/env';
import { useSpeechRecognition, useSpeechSynthesis, useUserDisplayName } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import { useKnowledgeGraph } from '../../contexts/KnowledgeGraphContext';
import { JADEGraphInsight } from '../../types';
import {
  InsightCard,
  InsightTypeFilter,
  DominantThemes,
  NeglectedAreaAlert,
  IntentAlignmentPanel,
  JadeThinkingState,
  JADEEmptyState,
  WeeklyJADEReport,
  LearningPathCard,
  SuggestedConnectionCard,
  ConfidenceScoreBar,
  GraphDiffView,
  CrossChamberSynthesis,
  ConceptRecommendation,
  InsightCountBadge,
  ExportJADEReportButton,
  JADESkeleton,
  JADEConversationMode,
  InsightHistory,
  recordInsightRun,
  snapshotGraphSize,
  getUnreadInsightCount,
  setUnreadInsightCount,
} from './JADEEnhancements';

type JadeTab = 'oracle' | 'insights';

interface JadeMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const JadeLab: React.FC = () => {
  const { user } = useAuth();
  const displayName = useUserDisplayName(user);
  const { graph, intents, analyzeWithJADE } = useKnowledgeGraph();

  const [activeTab, setActiveTab] = useState<JadeTab>('oracle');
  const [messages, setMessages] = useState<JadeMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showCycleLog, setShowCycleLog] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [interimText, setInterimText] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [jadeInsights, setJadeInsights] = useState<JADEGraphInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insightFilter, setInsightFilter] = useState<JADEGraphInsight['type'] | 'all'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { speaking, speak, cancel: cancelSpeech, supported: ttsSupported } = useSpeechSynthesis();

  const handleSpeechResult = (text: string) => {
    setInterimText('');
    if (text.trim()) sendToJade(text.trim());
  };

  const handleInterimResult = (text: string) => setInterimText(text);

  const { supported: sttSupported, listening, start: startListening, stop: stopListening, error: speechError } =
    useSpeechRecognition(handleSpeechResult, handleInterimResult);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) setShowOnboarding(false);
  }, [messages]);

  useEffect(() => {
    setUnreadCount(getUnreadInsightCount());
  }, []);

  const greeting = displayName ? `Hello, ${displayName}. I'm Jade.` : `Hello. I'm Jade.`;

  const speakResponse = (text: string) => {
    if (voiceEnabled && ttsSupported) speak(text, { rate: 0.92, pitch: 1.08, volume: 1.0 });
  };

  const sendToJade = async (text: string) => {
    if (!text.trim() || isThinking) return;
    const userMsg: JadeMessage = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    try {
      const apiBase = env.api.oaa || 'https://oaa-api-library.onrender.com';
      const response = await fetch(`${apiBase}/api/jade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          userContext: { userId: user?.id, displayName },
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const jadeMsg: JadeMessage = { role: 'assistant', content: data.response, timestamp: new Date() };
      setMessages((prev) => [...prev, jadeMsg]);
      speakResponse(jadeMsg.content);
    } catch (error) {
      console.error('Jade error:', error);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: 'I am momentarily out of phase. The pattern is there, but I cannot reach it. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); sendToJade(input); };
  const handleMicClick = () => { if (listening) stopListening(); else startListening(); };
  const toggleVoice = () => { if (speaking) cancelSpeech(); setVoiceEnabled(!voiceEnabled); };

  const handleAnalyzeGraph = async () => {
    setIsAnalyzing(true);
    snapshotGraphSize(graph.nodes.length);
    try {
      const results = await analyzeWithJADE();
      setJadeInsights(results);
      recordInsightRun(results.length);
      setUnreadCount(results.length);
      setUnreadInsightCount(results.length);
    } catch (e) {
      console.error('JADE analysis error:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTabChange = (tab: JadeTab) => {
    setActiveTab(tab);
    if (tab === 'insights') { setUnreadCount(0); setUnreadInsightCount(0); }
  };

  const filteredInsights = insightFilter === 'all' ? jadeInsights : jadeInsights.filter((i) => i.type === insightFilter);

  const insightCounts: Partial<Record<JADEGraphInsight['type'], number>> = {};
  jadeInsights.forEach((i) => { insightCounts[i.type] = (insightCounts[i.type] ?? 0) + 1; });

  const lastJadeMessage = messages.filter((m) => m.role === 'assistant').slice(-1)[0];
  const avatarState = isThinking ? 'thinking' : speaking ? 'speaking' : listening ? 'listening' : 'idle';
  const hasGraph = graph.nodes.length > 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 overflow-hidden relative">

      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-2xl" />
      </div>

      {/* ═══ Tab Bar ═══ */}
      <div className="relative z-10 flex items-center gap-1 px-4 pt-4 border-b border-emerald-500/20 pb-0">
        <button type="button" onClick={() => handleTabChange('oracle')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${activeTab === 'oracle' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <span>🔮</span> ORACLE
        </button>
        <button type="button" onClick={() => handleTabChange('insights')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px ${activeTab === 'insights' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
          <span>🧩</span> INSIGHTS
          {unreadCount > 0 && <InsightCountBadge count={unreadCount} />}
        </button>
      </div>

      {/* ═══ ORACLE Tab ═══ */}
      {activeTab === 'oracle' && (
        <>
          {/* Onboarding Overlay */}
          {showOnboarding && messages.length === 0 && (
            <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
              <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🔮</div>
                  <h1 className="text-3xl font-light text-emerald-300 mb-2">{greeting}</h1>
                  <div className="h-px w-32 bg-emerald-400/30 mx-auto mb-6" />
                </div>
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed mb-8">
                  <p>I'm not here to judge, fix, or rush you. I'm here to help you notice patterns — gently.</p>
                  <p>Think of me as a mirror with memory. We'll reflect, pause, and trace how today connects to tomorrow.</p>
                  <p className="text-emerald-300/80">Nothing you share here is graded. Nothing you share here is rushed.</p>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 mb-6">
                  <div className="text-xs font-mono text-slate-400 mb-3 uppercase tracking-wider">What you can explore with me</div>
                  <ul className="space-y-2 text-sm text-slate-300">
                    <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">→</span><span>Patterns you feel repeating in your life</span></li>
                    <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">→</span><span>Cycles you're walking through</span></li>
                    <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">→</span><span>The future world you're trying to walk toward</span></li>
                  </ul>
                </div>
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-4">When you're ready, tell me one thing:</p>
                  <p className="text-lg text-emerald-300 font-light">What do you want to understand about yourself today?</p>
                </div>
                <button onClick={() => setShowOnboarding(false)} className="mt-8 w-full px-6 py-3 bg-gradient-to-r from-emerald-400/90 to-cyan-400/90 text-slate-950 font-medium rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  Begin
                </button>
              </div>
            </div>
          )}

          {/* Main Grid Layout */}
          <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-0 lg:gap-6 p-4 lg:p-6 overflow-hidden">

            {/* Left Panel: Cycle Log */}
            <div className={`${showCycleLog ? 'flex' : 'hidden'} lg:flex flex-col border border-emerald-500/20 rounded-2xl bg-slate-900/60 backdrop-blur-sm overflow-hidden absolute lg:relative inset-4 lg:inset-auto z-20 lg:z-0`}>
              <div className="flex items-center justify-between p-4 border-b border-emerald-500/20">
                <h2 className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />CYCLE LOG
                </h2>
                <button onClick={() => setShowCycleLog(false)} className="lg:hidden text-slate-400 hover:text-white">×</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-slate-500 text-xs italic text-center py-8">No cycles yet.<br />Speak your first thought to begin.</div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`text-xs ${m.role === 'user' ? 'text-slate-400' : 'text-emerald-300'}`}>
                    <div className="font-mono text-[10px] uppercase mb-1 opacity-60 flex items-center gap-1">
                      {m.role === 'user' ? '→ YOU' : '← JADE'}
                      <span className="text-slate-600">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="leading-relaxed">{m.content}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Center Panel: Avatar Chamber */}
            <div className="flex flex-col items-center justify-center py-4 lg:py-0">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-72 lg:h-72 mb-6">
                <div className="absolute inset-0 rounded-full border border-emerald-400/30 animate-[spin_20s_linear_infinite]">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400/60 rounded-full" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-cyan-400/60 rounded-full" />
                </div>
                <div className="absolute inset-4 rounded-full border border-cyan-400/20 animate-[spin_15s_linear_infinite_reverse]">
                  <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-300/40 rounded-full" />
                </div>
                <div className={`absolute inset-8 rounded-full bg-emerald-400/10 blur-2xl transition-opacity duration-500 ${avatarState === 'speaking' || avatarState === 'thinking' ? 'opacity-100' : 'opacity-50'}`} />
                <div className={`absolute inset-6 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-400/40 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.3),inset_0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500 ${avatarState === 'speaking' ? 'scale-105 border-emerald-400/80' : ''} ${avatarState === 'thinking' ? 'animate-pulse' : ''} ${avatarState === 'listening' ? 'border-cyan-400/60' : ''}`}>
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-400 transition-all duration-300 ${avatarState === 'thinking' ? 'animate-pulse scale-95' : ''} ${avatarState === 'speaking' ? 'scale-110' : ''}`}>
                        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-900/60 to-transparent" />
                        <div className="absolute inset-4 rounded-full bg-emerald-300/20" />
                      </div>
                      {speaking && <div className="absolute inset-0 rounded-full bg-emerald-300 animate-ping opacity-50" />}
                      {listening && <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-50" />}
                    </div>
                    <div className="flex items-end justify-center gap-1 h-6">
                      {[...Array(7)].map((_, i) => (
                        <div key={i} className={`w-1 rounded-full transition-all duration-150 ${speaking || listening ? 'bg-emerald-400/80 animate-pulse' : 'bg-emerald-400/30'}`} style={{ height: speaking || listening ? `${Math.random() * 16 + 8}px` : '4px', animationDelay: `${i * 50}ms` }} />
                      ))}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-mono text-emerald-200/90 tracking-widest">JADE</div>
                      <div className="text-[10px] text-emerald-400/70 uppercase tracking-widest">
                        {avatarState === 'thinking' && 'Reading patterns...'}
                        {avatarState === 'speaking' && 'Speaking...'}
                        {avatarState === 'listening' && 'Listening...'}
                        {avatarState === 'idle' && 'Pattern Oracle'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {(interimText || listening) && (
                <div className="mb-4 px-4 py-2 bg-slate-800/60 rounded-xl border border-cyan-400/30 max-w-sm">
                  <div className="text-xs text-cyan-400 font-mono mb-1">HEARING:</div>
                  <div className="text-sm text-slate-200 italic">{interimText || '...'}</div>
                </div>
              )}

              <p className="text-xs text-slate-400 max-w-xs text-center leading-relaxed px-4">
                Speak to Jade about patterns you feel repeating, cycles you're navigating, or intentions you want to set. She mirrors what she sees.
              </p>

              <button onClick={() => setShowCycleLog(!showCycleLog)} className="lg:hidden mt-4 flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 border border-emerald-400/30 rounded-lg hover:bg-emerald-400/10 transition-colors">
                <MessageCircle className="w-4 h-4" />
                {showCycleLog ? 'Hide' : 'Show'} Cycle Log
              </button>

              {speechError && (
                <div className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">{speechError}</div>
              )}
            </div>

            {/* Right Panel: Current Reflection */}
            <div className="hidden lg:flex flex-col border border-cyan-500/20 rounded-2xl bg-slate-900/60 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center gap-2 p-4 border-b border-cyan-500/20">
                <Eye className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-mono text-cyan-400">CURRENT REFLECTION</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {lastJadeMessage ? (
                  <div className="text-sm text-slate-200 leading-relaxed">{lastJadeMessage.content}</div>
                ) : (
                  <div className="text-xs text-slate-500 italic text-center py-8">Once you speak, Jade will surface the strongest pattern she sees.</div>
                )}
              </div>
              <div className="p-4 border-t border-cyan-500/20">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Quick starts</div>
                <div className="space-y-2">
                  {['What pattern do you see in me?', 'I feel stuck in a loop...', 'Help me set an intention'].map((prompt, i) => (
                    <button key={i} onClick={() => sendToJade(prompt)} disabled={isThinking} className="w-full text-left text-xs px-3 py-2 text-slate-400 hover:text-emerald-300 hover:bg-emerald-400/10 rounded-lg transition-colors disabled:opacity-50">
                      <Sparkles className="w-3 h-3 inline mr-2 opacity-50" />{prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSubmit} className="relative border-t border-emerald-500/20 p-4 flex items-center gap-3 bg-slate-950/90 backdrop-blur-sm">
            <button type="button" onClick={toggleVoice} className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${voiceEnabled ? 'border-emerald-400/60 text-emerald-400 hover:bg-emerald-400/10' : 'border-slate-600 text-slate-500 hover:bg-slate-800'}`} title={voiceEnabled ? 'Voice output enabled' : 'Voice output disabled'}>
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            {sttSupported && (
              <button type="button" onClick={handleMicClick} disabled={isThinking} className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${listening ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400 animate-pulse scale-110' : 'border-emerald-400/60 text-emerald-400 hover:bg-emerald-400/10 hover:scale-105'} disabled:opacity-50 disabled:cursor-not-allowed`} title={listening ? 'Listening... (click to stop)' : 'Click to speak'}>
                {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={listening ? 'Listening...' : isThinking ? 'Jade is reading patterns...' : 'Or type a seed thought for Jade...'} disabled={isThinking || listening} className="flex-1 bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300" />
            <button type="submit" disabled={!input.trim() || isThinking} className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-sm font-semibold hover:from-emerald-400 hover:to-cyan-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2">
              <Send className="w-4 h-4" /><span className="hidden sm:inline">Reflect</span>
            </button>
          </form>
        </>
      )}

      {/* ═══ INSIGHTS Tab ═══ */}
      {activeTab === 'insights' && (
        <div className="relative flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-emerald-300">Graph Analysis</h2>
              <p className="text-xs text-slate-400 mt-0.5">{graph.nodes.length} nodes · {graph.edges.length} connections</p>
            </div>
            <div className="flex items-center gap-2">
              <ExportJADEReportButton insights={jadeInsights} graph={graph} />
              <button type="button" onClick={handleAnalyzeGraph} disabled={isAnalyzing || !hasGraph} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 text-slate-950 text-xs font-bold hover:from-emerald-400 hover:to-cyan-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                {isAnalyzing ? 'Analyzing…' : '🔍 Analyze Graph'}
              </button>
            </div>
          </div>

          {!hasGraph && <JADEEmptyState />}
          {isAnalyzing && <JadeThinkingState />}

          {hasGraph && !isAnalyzing && jadeInsights.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Click <strong className="text-emerald-400">"Analyze Graph"</strong> to generate JADE insights.
            </div>
          )}

          {!isAnalyzing && jadeInsights.length > 0 && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <GraphDiffView graph={graph} />
              </div>

              <WeeklyJADEReport insights={jadeInsights} graph={graph} />
              <CrossChamberSynthesis />
              <NeglectedAreaAlert insights={jadeInsights} />

              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-4">
                <DominantThemes graph={graph} />
              </div>

              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-4">
                <IntentAlignmentPanel intents={intents} graph={graph} />
              </div>

              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-4">
                <ConceptRecommendation />
              </div>

              <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-4">
                <InsightHistory />
              </div>

              <InsightTypeFilter selected={insightFilter} onChange={setInsightFilter} counts={insightCounts} />

              {filteredInsights.length === 0 && insightFilter !== 'all' ? (
                <JADESkeleton />
              ) : (
                <div className="space-y-3">
                  {filteredInsights.map((insight, i) => (
                    <React.Fragment key={i}>
                      <InsightCard insight={insight} />
                      {insight.type === 'knowledge_gap' && <LearningPathCard insight={insight} />}
                      {insight.type === 'suggested_connection' && <SuggestedConnectionCard insight={insight} />}
                      <ConfidenceScoreBar confidence={insight.confidence} />
                    </React.Fragment>
                  ))}
                </div>
              )}
            </>
          )}

          {hasGraph && (
            <div className="sticky bottom-0 pt-2 pb-1 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent">
              <JADEConversationMode graph={graph} onSend={(msg: string) => { setActiveTab('oracle'); sendToJade(msg); }} disabled={isThinking} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
