import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface JadePromptProps {
  courseName: string;
  onSubmit: (question: string) => void;
  onSkip: () => void;
}

export const JadePrompt: React.FC<JadePromptProps> = ({ courseName, onSubmit, onSkip }) => {
  const [question, setQuestion] = useState('');
  const wordCount = question.trim().split(/\s+/).filter(Boolean).length;
  const hasContent = wordCount >= 3;

  return (
    <div className="max-w-xl mx-auto px-4">
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-5 space-y-4">
        {/* JADE header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">JADE</div>
            <div className="text-sm font-bold text-stone-900">Memory Layer</div>
          </div>
        </div>

        <p className="text-sm text-stone-700 leading-relaxed">
          Congratulations on passing <span className="font-semibold">"{courseName}"</span>.
          Any questions before we move on?
        </p>

        <p className="text-xs text-stone-500">
          Your question helps JADE route the right next seminar. The better the question, the more MIC you earn.
        </p>

        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="What are you still thinking about? What would you like to explore next?"
          rows={3}
          className="w-full bg-white border border-indigo-200 rounded-xl p-3 text-sm text-stone-800 placeholder-stone-300 resize-none outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
        />

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onSkip}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors px-3 py-2"
          >
            Skip (−3 MIC)
          </button>
          <button
            onClick={() => hasContent && onSubmit(question)}
            disabled={!hasContent}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
              ${hasContent
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }
            `}
          >
            Ask JADE
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
