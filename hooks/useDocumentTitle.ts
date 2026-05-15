import { useEffect } from 'react';
import { TabId } from '../types';

const TITLES: Partial<Record<TabId, string>> = {
  [TabId.HALLWAY]:        'Mobius — School of Chambers',
  [TabId.OAA]:            'OAA Learning Hub — Mobius',
  [TabId.HIVE]:           'HIVE Arcade — Mobius',
  [TabId.REFLECTIONS]:    'Reflections — Mobius',
  [TabId.KNOWLEDGE_GRAPH]:'ATLAS Knowledge Graph — Mobius',
  [TabId.SHIELD]:         'Citizen Shield — Mobius',
  [TabId.JADE]:           'JADE Chamber — Mobius',
  [TabId.WALLET]:         'MIC Wallet — Mobius',
  [TabId.VAULT]:          'Reserve Vault — Mobius',
  [TabId.EPICON]:         'Intent Record — Mobius',
};

const DEFAULT_TITLE = 'Mobius Browser Shell';

export function useDocumentTitle(tab: TabId): void {
  useEffect(() => {
    document.title = TITLES[tab] ?? DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [tab]);
}
