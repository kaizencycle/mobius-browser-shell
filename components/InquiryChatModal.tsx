// components/InquiryChatModal.tsx
// Modal wrapper for the conversational inquiry chat
// Part of Mobius Systems - Integrity-First AI Infrastructure

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { InquiryChat } from './InquiryChat';

interface InquiryChatModalProps {
  /** Optional: Control modal externally */
  isOpen?: boolean;
  /** Optional: External control callback */
  onOpenChange?: (open: boolean) => void;
}

export function InquiryChatModal({ isOpen: externalIsOpen, onOpenChange }: InquiryChatModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Support both controlled and uncontrolled modes
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalIsOpen(value);
    }
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40 group"
        aria-label="New Inquiry"
        title="Start a new inquiry"
      >
        <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        
        {/* Pulse effect */}
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping pointer-events-none" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inquiry-chat-title"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal content */}
          <div 
            className="relative w-full max-w-2xl h-[600px] max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
            style={{
              animation: 'fadeInUp 0.3s ease-out'
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-stone-100 hover:bg-stone-200 rounded-full flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-stone-600" />
            </button>

            {/* Chat component */}
            <InquiryChat onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}

      {/* Animation keyframes - injected once */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

export default InquiryChatModal;
