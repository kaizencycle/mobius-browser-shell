import React from 'react';
import { ShellErrorBoundary } from '../ShellErrorBoundary';
import { ErrorCodes } from '../../errors/errorCodes';
import { useAtlasErrorLog } from '../useAtlasErrorLog';
import { EPICONFeed } from '../EPICONFeed/EPICONFeed';
import { chamberPublicName } from '../../src/lib/chambers';
import { TabId } from '../../types';

export const EPICONChamber: React.FC = () => {
  const logToAtlas = useAtlasErrorLog();
  return (
    <div className="flex flex-col h-full bg-stone-50">
      <ShellErrorBoundary
        appName={chamberPublicName(TabId.EPICON)}
        appIcon="📋"
        errorCode={ErrorCodes.MIC_SYNC_FAILED}
        onError={logToAtlas}
      >
        <EPICONFeed />
      </ShellErrorBoundary>
    </div>
  );
};
