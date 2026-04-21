import React from 'react';
import { Construction, Clock3, ArrowLeft, Network, BookOpen, MessageCircle } from 'lucide-react';
import { MOBIUS_OPEN_INQUIRY_EVENT } from '../InquiryChatModal';

interface UnderConstructionLabProps {
  labName: string;
  subtitle?: string;
  onBackToHub?: () => void;
  onOpenKnowledgeGraph?: () => void;
  onOpenOaa?: () => void;
}

export const UnderConstructionLab: React.FC<UnderConstructionLabProps> = ({
  labName,
  subtitle = 'This module is being rebuilt and will return soon.',
  onBackToHub,
  onOpenKnowledgeGraph,
  onOpenOaa,
}) => {
  return (
    <div className="h-full w-full bg-stone-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-xl w-full rounded-2xl border border-amber-200 bg-white shadow-sm p-6 sm:p-8 text-center">
        <a
          href="#jade-main-card"
          className="sr-only focus:not-sr-only focus:block focus:w-fit focus:mx-auto focus:mb-3 focus:px-3 focus:py-2 focus:rounded-md focus:bg-stone-900 focus:text-white focus:text-xs"
        >
          Skip to Jade status card
        </a>
        <div
          id="jade-main-card"
          className="mx-auto w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4"
        >
          <Construction className="w-6 h-6" aria-hidden />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-stone-900">
          {labName} — Under Construction
        </h2>
        <p className="mt-2 text-sm text-stone-600">{subtitle}</p>
        <p className="mt-3 text-xs text-stone-500">
          Press <kbd className="px-1 py-0.5 rounded bg-stone-100 border border-stone-200 font-mono text-[10px]">Tab</kbd>{' '}
          to move through actions, or use the shortcuts below.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
          <Clock3 className="w-3.5 h-3.5" aria-hidden />
          <span>Maintenance mode active</span>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-2 justify-center">
          {onBackToHub && (
            <button
              type="button"
              onClick={onBackToHub}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-stone-200 text-sm font-medium text-stone-800 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to OAA Hub
            </button>
          )}
          {onOpenKnowledgeGraph && (
            <button
              type="button"
              onClick={onOpenKnowledgeGraph}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <Network className="w-4 h-4" />
              Open Knowledge Graph
            </button>
          )}
          {onOpenOaa && (
            <button
              type="button"
              onClick={onOpenOaa}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              <BookOpen className="w-4 h-4" />
              Browse OAA
            </button>
          )}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(MOBIUS_OPEN_INQUIRY_EVENT))}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 text-sm font-medium text-indigo-800 bg-indigo-50 hover:bg-indigo-100"
          >
            <MessageCircle className="w-4 h-4" />
            Ask in Inquiry
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnderConstructionLab;
