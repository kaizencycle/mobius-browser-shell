import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, RefreshCw, Coffee, Clock } from 'lucide-react';
import { env } from '../config/env';

interface LabFrameProps {
  url: string;
  title: string;
  description?: string;
}

/**
 * LabFrame - Embeds a live lab via iframe
 * 
 * This component handles the iframe embedding for live deployed labs.
 * Falls back gracefully if the iframe fails to load.
 * 
 * Includes:
 * - Loading states with cold start hints (Render free tier)
 * - Load time tracking (in debug mode)
 * - Error recovery with retry functionality
 */
export const LabFrame: React.FC<LabFrameProps> = ({ url, title, description }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadTime, setLoadTime] = useState<number>(0);
  const [showColdStartHint, setShowColdStartHint] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Show cold start hint after 5 seconds of loading
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowColdStartHint(true);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setShowColdStartHint(false);
    }
  }, [isLoading]);

  const handleLoad = () => {
    setIsLoading(false);
    setLoadTime(Date.now() - startTimeRef.current);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRefresh = () => {
    startTimeRef.current = Date.now();
    setIsLoading(true);
    setHasError(false);
    setShowColdStartHint(false);
    // Force iframe reload
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  };

  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (hasError) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-stone-50 p-8 text-center">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
          <RefreshCw className="w-8 h-8 text-stone-400" />
        </div>
        <h2 className="text-xl font-medium text-stone-800 mb-2">Unable to load {title}</h2>
        <p className="text-stone-500 max-w-md mb-4">
          The lab might be blocking iframe embedding, or there may be a connectivity issue.
        </p>
        <p className="text-stone-400 text-sm max-w-md mb-6">
          <Coffee className="w-4 h-4 inline mr-1" />
          Render free tier services sleep after 15 min of inactivity. 
          First request may take 30-60 seconds to wake them up.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <button
            onClick={handleOpenExternal}
            className="flex items-center space-x-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open in New Tab</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-stone-50 flex flex-col items-center justify-center z-10">
          <div className="w-10 h-10 border-2 border-stone-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-stone-600 text-sm font-medium">Loading {title}...</p>
          
          {/* Cold start hint - shows after 5 seconds */}
          {showColdStartHint && (
            <div className="mt-6 max-w-sm text-center animate-fadeIn">
              <div className="flex items-center justify-center space-x-2 text-amber-600 mb-2">
                <Coffee className="w-4 h-4" />
                <span className="text-sm font-medium">Waking up service...</span>
              </div>
              <p className="text-stone-400 text-xs leading-relaxed">
                Render free tier services sleep after 15 min of inactivity.
                First load may take 30-60 seconds. Thank you for your patience!
              </p>
              <div className="flex items-center justify-center space-x-1 mt-3 text-stone-400 text-xs">
                <Clock className="w-3 h-3" />
                <span>Usually takes about 30-60 seconds</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* External Link Button (always visible) */}
      <button
        onClick={handleOpenExternal}
        className="absolute top-3 right-3 z-20 p-2 bg-white/90 backdrop-blur-sm border border-stone-200 rounded-lg hover:bg-white transition-colors shadow-sm"
        title="Open in new tab"
      >
        <ExternalLink className="w-4 h-4 text-stone-600" />
      </button>

      {/* Debug info - load time (only in debug mode) */}
      {!isLoading && !hasError && loadTime > 0 && env.features.debugMode && (
        <div className="absolute bottom-3 right-3 z-20 px-2 py-1 bg-black/50 backdrop-blur-sm rounded text-white text-xs font-mono">
          Loaded in {(loadTime / 1000).toFixed(1)}s
        </div>
      )}

      {/* The Iframe */}
      <iframe
        ref={iframeRef}
        src={url}
        title={title}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};
