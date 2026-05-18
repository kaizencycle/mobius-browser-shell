/**
 * useChamberParam — reads ?chamber= on mount and navigates to the matching tab.
 *
 * When the HIVE simulator's O-portals launch the shell (e.g.
 * https://mobius-browser-shell.vercel.app?chamber=oaa), this hook picks up
 * the param, maps it to a TabId, triggers navigation, then removes the query
 * string so the URL stays clean.
 *
 * Mapping is intentionally lowercase and forgiving of aliases:
 *   chamber=oaa          → TabId.OAA
 *   chamber=hive         → TabId.HIVE
 *   chamber=reflections  → TabId.REFLECTIONS
 *   chamber=knowledge    → TabId.KNOWLEDGE_GRAPH
 *   chamber=graph        → TabId.KNOWLEDGE_GRAPH
 *   chamber=shield       → TabId.SHIELD
 *   chamber=jade         → TabId.JADE
 *   chamber=wallet       → TabId.WALLET
 *   chamber=vault        → TabId.VAULT
 *   chamber=epicon       → TabId.EPICON
 */
import { useEffect } from 'react';
import { TabId } from '../types';

const CHAMBER_MAP: Record<string, TabId> = {
  oaa:         TabId.OAA,
  learn:       TabId.OAA,
  library:     TabId.OAA,
  hive:        TabId.HIVE,
  game:        TabId.HIVE,
  rpg:         TabId.HIVE,
  reflections: TabId.REFLECTIONS,
  reflect:     TabId.REFLECTIONS,
  journal:     TabId.REFLECTIONS,
  knowledge:   TabId.KNOWLEDGE_GRAPH,
  graph:       TabId.KNOWLEDGE_GRAPH,
  atlas:       TabId.KNOWLEDGE_GRAPH,
  shield:      TabId.SHIELD,
  security:    TabId.SHIELD,
  jade:        TabId.JADE,
  oracle:      TabId.JADE,
  wallet:      TabId.WALLET,
  mic:         TabId.WALLET,
  vault:       TabId.VAULT,
  epicon:      TabId.EPICON,
};

export function useChamberParam(onNavigate: (tab: TabId) => void): void {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chamber = params.get('chamber')?.toLowerCase().trim();
    if (!chamber) return;

    const tab = CHAMBER_MAP[chamber];
    if (tab) {
      onNavigate(tab);
    }

    // Remove ?chamber= from URL without adding a history entry
    params.delete('chamber');
    const newSearch = params.toString();
    const cleanUrl = newSearch
      ? `${window.location.pathname}?${newSearch}${window.location.hash}`
      : `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState(null, '', cleanUrl);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only
}
