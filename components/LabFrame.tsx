import React from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

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
 */
export const LabFrame: React.FC<LabFrameProps> = ({ url, title, description }) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    // Force iframe reload by changing key
    const iframe = document.querySelector(`iframe[title="${title}"]`) as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
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
        <p className="text-stone-500 max-w-md mb-6">
          The lab might be blocking iframe embedding, or there may be a connectivity issue.
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
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mb-4" />
          <p className="text-stone-500 text-sm">Loading {title}...</p>
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

      {/* The Iframe */}
      <iframe
        src={url}
        title={title}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
};
