import React from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';
import { EPICONFeed } from '../EPICONFeed/EPICONFeed';

export const EPICONChamber: React.FC = () => {
  const logToAtlas = useAtlasErrorLog();
  return (
    <div className="flex flex-col h-full bg-stone-50">
      <ShellErrorBoundary
        appName="Intent Record"
        appIcon="📋"
        errorCode={ErrorCodes.MIC_SYNC_FAILED}
        onError={logToAtlas}
      >
        <EPICONFeed />
      </ShellErrorBoundary>
    </div>
  );
};
