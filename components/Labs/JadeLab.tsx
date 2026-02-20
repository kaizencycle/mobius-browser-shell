/**
 * JadeLab - The Jade Chamber
 * 
 * Not a chatbox. A room you walk into.
 * 
 * Jade is Mobius Substrate's Pattern Oracle and Reflection Guide.
 * She sees patterns across cycles, mirrors what humans cannot yet see.
 * 
 * Features:
 * - Holographic avatar in the center
 * - Voice input (speech-to-text)
 * - Voice output (text-to-speech)
 * - Glowing, ethereal UI
 * - Pattern recognition through LLM inference
 * - Name-aware personalized onboarding
 */
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Send, Sparkles, Eye, MessageCircle } from 'lucide-react';
import { env } from '../../config/env';
import { useSpeechRecognition, useSpeechSynthesis, useUserDisplayName } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';

interface JadeMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const JadeLab: React.FC = () => {
  // Auth & user context
  const { user } = useAuth();
  const displayName = useUserDisplayName(user);

  // State
  const [messages, setMessages] = useState<JadeMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showCycleLog, setShowCycleLog] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [interimText, setInterimText] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(true);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech hooks
  const { speaking, speak, cancel: cancelSpeech, supported: ttsSupported } = useSpeechSynthesis();
  
  const handleSpeechResult = (text: string) => {
    setInterimText('');
    if (text.trim()) {
      sendToJade(text.trim());
    }
  };

  const handleInterimResult = (text: string) => {
    setInterimText(text);
  };

  const { 
    supported: sttSupported, 
    listening, 
    start: startListening, 
    stop: stopListening,
    error: speechError 
  } = useSpeechRecognition(handleSpeechResult, handleInterimResult);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Dismiss onboarding after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowOnboarding(false);
    }
  }, [messages]);

  // Onboarding greeting - personalized if we know the user's name
  const greeting = displayName 
    ? `Hello, ${displayName}. I'm Jade.`
    : `Hello. I'm Jade.`;

  // Speak Jade's response
  const speakResponse = (text: string) => {
    if (voiceEnabled && ttsSupported) {
      speak(text, {
        rate: 0.92,
        pitch: 1.08,
        volume: 1.0,
      });
    }
  };

  // Send message to Jade API
  const sendToJade = async (text: string) => {
    if (!text.trim() || isThinking) return;

    const userMsg: JadeMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

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
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userContext: {
            userId: user?.id,
            displayName: displayName,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const jadeMsg: JadeMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, jadeMsg]);
      
      // Speak the response
      speakResponse(jadeMsg.content);

    } catch (error) {
      console.error('Jade error:', error);
      const errorMsg: JadeMessage = {
        role: 'assistant',
        content: 'I am momentarily out of phase. The pattern is there, but I cannot reach it. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendToJade(input);
  };

  const handleMicClick = () => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleVoice = () => {
    if (speaking) {
      cancelSpeech();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  // Get the last Jade message for the reflection panel
  const lastJadeMessage = messages
    .filter((m) => m.role === 'assistant')
    .slice(-1)[0];

  // Determine avatar state
  const avatarState = isThinking ? 'thinking' : speaking ? 'speaking' : listening ? 'listening' : 'idle';

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 overflow-hidden relative">
      
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Radial glow from center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-2xl" />
      </div>

      {/* Onboarding Overlay */}
      {showOnboarding && messages.length === 0 && (
        <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
          <div className="max-w-2xl w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔮</div>
              <h1 className="text-3xl font-light text-emerald-300 mb-2">
                {greeting}
              </h1>
              <div className="h-px w-32 bg-emerald-400/30 mx-auto mb-6"></div>
            </div>

            {/* Introduction */}
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed mb-8">
              <p>
                I'm not here to judge, fix, or rush you. I'm here to help you notice patterns — gently.
              </p>
              <p>
                Think of me as a mirror with memory. We'll reflect, pause, and trace how today connects to tomorrow.
              </p>
              <p className="text-emerald-300/80">
                Nothing you share here is graded. Nothing you share here is rushed.
              </p>
            </div>

            {/* What you can explore */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 mb-6">
              <div className="text-xs font-mono text-slate-400 mb-3 uppercase tracking-wider">
                What you can explore with me
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">→</span>
                  <span>Patterns you feel repeating in your life</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">→</span>
                  <span>Cycles you're walking through</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">→</span>
                  <span>The future world you're trying to walk toward</span>
                </li>
              </ul>
            </div>

            {/* Guiding question */}
            <div className="text-center">
              <p className="text-sm text-slate-400 mb-4">
                When you're ready, tell me one thing:
              </p>
              <p className="text-lg text-emerald-300 font-light">
                What do you want to understand about yourself today?
              </p>
            </div>

            {/* Begin button */}
            <button
              onClick={() => setShowOnboarding(false)}
              className="mt-8 w-full px-6 py-3 bg-gradient-to-r from-emerald-400/90 to-cyan-400/90 text-slate-950 font-medium rounded-xl hover:from-emerald-400 hover:to-cyan-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
            >
              Begin
            </button>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-0 lg:gap-6 p-4 lg:p-6 overflow-hidden">
        
        {/* Left Panel: Cycle Log (hidden on mobile by default) */}
        <div className={`
          ${showCycleLog ? 'flex' : 'hidden'} lg:flex
          flex-col border border-emerald-500/20 rounded-2xl 
          bg-slate-900/60 backdrop-blur-sm overflow-hidden
          absolute lg:relative inset-4 lg:inset-auto z-20 lg:z-0
        `}>
          <div className="flex items-center justify-between p-4 border-b border-emerald-500/20">
            <h2 className="text-xs font-mono text-emerald-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              CYCLE LOG
            </h2>
            <button 
              onClick={() => setShowCycleLog(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-slate-500 text-xs italic text-center py-8">
                No cycles yet.
                <br />
                Speak your first thought to begin.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-xs ${
                  m.role === 'user' ? 'text-slate-400' : 'text-emerald-300'
                }`}
              >
                <div className="font-mono text-[10px] uppercase mb-1 opacity-60 flex items-center gap-1">
                  {m.role === 'user' ? '→ YOU' : '← JADE'}
                  <span className="text-slate-600">
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="leading-relaxed">{m.content}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Center Panel: Avatar Chamber */}
        <div className="flex flex-col items-center justify-center py-4 lg:py-0">
          
          {/* Jade Avatar */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-72 lg:h-72 mb-6">
            
            {/* Outer rotating ring */}
            <div className="absolute inset-0 rounded-full border border-emerald-400/30 animate-[spin_20s_linear_infinite]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-emerald-400/60 rounded-full" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-cyan-400/60 rounded-full" />
            </div>
            
            {/* Counter-rotating ring */}
            <div className="absolute inset-4 rounded-full border border-cyan-400/20 animate-[spin_15s_linear_infinite_reverse]">
              <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-300/40 rounded-full" />
            </div>
            
            {/* Glow effect */}
            <div className={`
              absolute inset-8 rounded-full bg-emerald-400/10 blur-2xl transition-opacity duration-500
              ${avatarState === 'speaking' || avatarState === 'thinking' ? 'opacity-100' : 'opacity-50'}
            `} />
            
            {/* Core avatar */}
            <div className={`
              absolute inset-6 rounded-full 
              bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
              border-2 border-emerald-400/40
              flex items-center justify-center
              shadow-[0_0_60px_rgba(16,185,129,0.3),inset_0_0_30px_rgba(16,185,129,0.1)]
              transition-all duration-500
              ${avatarState === 'speaking' ? 'scale-105 border-emerald-400/80' : ''}
              ${avatarState === 'thinking' ? 'animate-pulse' : ''}
              ${avatarState === 'listening' ? 'border-cyan-400/60' : ''}
            `}>
              <div className="flex flex-col items-center gap-3">
                
                {/* Eye / Core */}
                <div className="relative">
                  <div className={`
                    w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full 
                    bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-400
                    transition-all duration-300
                    ${avatarState === 'thinking' ? 'animate-pulse scale-95' : ''}
                    ${avatarState === 'speaking' ? 'scale-110' : ''}
                  `}>
                    {/* Inner eye detail */}
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-900/60 to-transparent" />
                    <div className="absolute inset-4 rounded-full bg-emerald-300/20" />
                  </div>
                  
                  {/* Speaking pulse effect */}
                  {speaking && (
                    <div className="absolute inset-0 rounded-full bg-emerald-300 animate-ping opacity-50" />
                  )}
                  
                  {/* Listening pulse */}
                  {listening && (
                    <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-ping opacity-50" />
                  )}
                </div>
                
                {/* Voice visualizer */}
                <div className="flex items-end justify-center gap-1 h-6">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className={`
                        w-1 rounded-full transition-all duration-150
                        ${speaking || listening 
                          ? 'bg-emerald-400/80 animate-pulse' 
                          : 'bg-emerald-400/30'
                        }
                      `}
                      style={{
                        height: speaking || listening 
                          ? `${Math.random() * 16 + 8}px` 
                          : '4px',
                        animationDelay: `${i * 50}ms`,
                      }}
                    />
                  ))}
                </div>
                
                {/* Status label */}
                <div className="text-center">
                  <div className="text-xs font-mono text-emerald-200/90 tracking-widest">
                    JADE
                  </div>
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

          {/* Interim speech display */}
          {(interimText || listening) && (
            <div className="mb-4 px-4 py-2 bg-slate-800/60 rounded-xl border border-cyan-400/30 max-w-sm">
              <div className="text-xs text-cyan-400 font-mono mb-1">HEARING:</div>
              <div className="text-sm text-slate-200 italic">
                {interimText || '...'}
              </div>
            </div>
          )}

          {/* Description */}
          <p className="text-xs text-slate-400 max-w-xs text-center leading-relaxed px-4">
            Speak to Jade about patterns you feel repeating, cycles you're navigating, 
            or intentions you want to set. She mirrors what she sees.
          </p>
          
          {/* Mobile toggle for cycle log */}
          <button 
            onClick={() => setShowCycleLog(!showCycleLog)}
            className="lg:hidden mt-4 flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 border border-emerald-400/30 rounded-lg hover:bg-emerald-400/10 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            {showCycleLog ? 'Hide' : 'Show'} Cycle Log
          </button>

          {/* Speech error display */}
          {speechError && (
            <div className="mt-4 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
              {speechError}
            </div>
          )}
        </div>

        {/* Right Panel: Current Reflection (hidden on mobile) */}
        <div className="hidden lg:flex flex-col border border-cyan-500/20 rounded-2xl bg-slate-900/60 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-cyan-500/20">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono text-cyan-400">CURRENT REFLECTION</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {lastJadeMessage ? (
              <div className="text-sm text-slate-200 leading-relaxed">
                {lastJadeMessage.content}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic text-center py-8">
                Once you speak, Jade will surface the strongest pattern she sees.
              </div>
            )}
          </div>
          
          {/* Quick prompts */}
          <div className="p-4 border-t border-cyan-500/20">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Quick starts</div>
            <div className="space-y-2">
              {[
                'What pattern do you see in me?',
                'I feel stuck in a loop...',
                'Help me set an intention',
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendToJade(prompt)}
                  disabled={isThinking}
                  className="w-full text-left text-xs px-3 py-2 text-slate-400 hover:text-emerald-300 hover:bg-emerald-400/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 inline mr-2 opacity-50" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="relative border-t border-emerald-500/20 p-4 flex items-center gap-3 bg-slate-950/90 backdrop-blur-sm"
      >
        {/* Voice toggle */}
        <button
          type="button"
          onClick={toggleVoice}
          className={`
            w-10 h-10 rounded-full border flex items-center justify-center
            transition-all duration-300
            ${voiceEnabled 
              ? 'border-emerald-400/60 text-emerald-400 hover:bg-emerald-400/10' 
              : 'border-slate-600 text-slate-500 hover:bg-slate-800'
            }
          `}
          title={voiceEnabled ? 'Voice output enabled' : 'Voice output disabled'}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Microphone button */}
        {sttSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isThinking}
            className={`
              w-12 h-12 rounded-full border-2 flex items-center justify-center
              transition-all duration-300
              ${listening
                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400 animate-pulse scale-110'
                : 'border-emerald-400/60 text-emerald-400 hover:bg-emerald-400/10 hover:scale-105'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title={listening ? 'Listening... (click to stop)' : 'Click to speak'}
          >
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}

        {/* Text input */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            listening
              ? 'Listening...'
              : isThinking
              ? 'Jade is reading patterns...'
              : 'Or type a seed thought for Jade...'
          }
          disabled={isThinking || listening}
          className="
            flex-1 bg-slate-900/80 border border-slate-700/80 rounded-xl 
            px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300
          "
        />

        {/* Submit button */}
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="
            px-5 py-3 rounded-xl 
            bg-gradient-to-r from-emerald-500 to-cyan-500
            text-slate-950 text-sm font-semibold
            hover:from-emerald-400 hover:to-cyan-400
            shadow-[0_0_20px_rgba(16,185,129,0.3)]
            hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
            flex items-center gap-2
          "
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Reflect</span>
        </button>
      </form>
    </div>
  );
};
