import { useEffect } from 'react';
import { TabId } from '../types';
import { chamberDocumentTitle } from '../src/lib/chambers';

const DEFAULT_TITLE = 'Mobius Substrate';

export function useDocumentTitle(tab: TabId): void {
  useEffect(() => {
    document.title = chamberDocumentTitle(tab);
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [tab]);
}
