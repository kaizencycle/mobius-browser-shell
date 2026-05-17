/**
 * useHashTab — Hash-based tab routing for the Mobius Browser Shell.
 *
 * Maps URL hashes (e.g. #hive, #oaa) to TabId values so deep-links work
 * and the browser Back button navigates between chambers.
 *
 * Usage:
 *   const [activeTab, setActiveTab] = useHashTab(TabId.HALLWAY);
 */
import { useCallback, useEffect, useState } from 'react';
import { TabId } from '../types';

const HASH_MAP: Record<string, TabId> = {
  '#oaa':            TabId.OAA,
  '#hive':           TabId.HIVE,
  '#reflections':    TabId.REFLECTIONS,
  '#knowledge':      TabId.KNOWLEDGE_GRAPH,
  '#shield':         TabId.SHIELD,
  '#jade':           TabId.JADE,
  '#wallet':         TabId.WALLET,
  '#vault':          TabId.VAULT,
  '#epicon':         TabId.EPICON,
  '#hallway':        TabId.HALLWAY,
};

const REVERSE_MAP = Object.fromEntries(
  Object.entries(HASH_MAP).map(([hash, tab]) => [tab, hash])
) as Record<TabId, string>;

function tabFromHash(): TabId | null {
  return HASH_MAP[window.location.hash.toLowerCase()] ?? null;
}

export function useHashTab(defaultTab: TabId = TabId.HALLWAY): [TabId, (tab: TabId) => void] {
  const [activeTab, setActiveTabState] = useState<TabId>(
    () => tabFromHash() ?? defaultTab
  );

  const setActiveTab = useCallback((tab: TabId) => {
    const hash = REVERSE_MAP[tab] ?? '';
    // Use replaceState for HALLWAY (no back-button entry), pushState for chambers
    if (tab === TabId.HALLWAY) {
      window.history.replaceState(null, '', hash || window.location.pathname);
    } else {
      window.history.pushState(null, '', hash);
    }
    setActiveTabState(tab);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setActiveTabState(tabFromHash() ?? defaultTab);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [defaultTab]);

  return [activeTab, setActiveTab];
}
