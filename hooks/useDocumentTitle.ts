import { useEffect } from 'react';
import { TabId } from '../types';

const TITLES: Partial<Record<TabId, string>> = {
  [TabId.HALLWAY]:        'Mobius Substrate — School of Chambers',
  [TabId.OAA]:            'Learn — Mobius Substrate',
  [TabId.HIVE]:           'World — Mobius Substrate',
  [TabId.REFLECTIONS]:    'Reflections — Mobius Substrate',
  [TabId.KNOWLEDGE_GRAPH]:'ATLAS Knowledge Graph — Mobius Substrate',
  [TabId.SHIELD]:         'Citizen Shield — Mobius Substrate',
  [TabId.JADE]:           'JADE Chamber — Mobius Substrate',
  [TabId.WALLET]:         'MIC Wallet — Mobius Substrate',
  [TabId.VAULT]:          'Archives — Mobius Substrate',
  [TabId.EPICON]:         'Memory — Mobius Substrate',
};

const DEFAULT_TITLE = 'Mobius Substrate';

export function useDocumentTitle(tab: TabId): void {
  useEffect(() => {
    document.title = TITLES[tab] ?? DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [tab]);
}
