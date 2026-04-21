/**
 * ECHO Threat Intelligence Service
 * 
 * ECHO Sentinel agent that performs scheduled RAG-based scanning across
 * three domains: Cyber Threats, Cyber Security, and Digital Health.
 * 
 * Cron schedule runs every 30 minutes (configurable), querying threat
 * intelligence sources and surfacing actionable findings to the
 * Citizen Shield dashboard.
 * 
 * "ECHO listens, so citizens stay prepared." — Mobius Doctrine
 */

import {
  ThreatDomain,
  ThreatSeverity,
  ThreatStatus,
  ThreatIntelligenceEntry,
  ThreatRAGSource,
  EchoScanCycle,
  EchoAgentState,
  EchoAgentStatus,
  ThreatIntelligenceFeed,
} from '../types';
import { env } from '../config/env';

// ============================================
// Constants & Configuration
// ============================================

/** Default cron: every 30 minutes */
const DEFAULT_CRON_INTERVAL_MS = 30 * 60 * 1000;

/** Domains ECHO monitors */
const ECHO_DOMAINS: ThreatDomain[] = ['cyber_threats', 'cyber_security', 'digital_health'];

/** RAG source registries per domain */
const RAG_SOURCE_REGISTRY: Record<ThreatDomain, ThreatRAGSource[]> = {
  cyber_threats: [
    { name: 'CISA KEV', url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog', type: 'cve_db', retrievedAt: '', relevanceScore: 0.95 },
    { name: 'MITRE ATT&CK', url: 'https://attack.mitre.org/', type: 'threat_feed', retrievedAt: '', relevanceScore: 0.92 },
    { name: 'NVD (NIST)', url: 'https://nvd.nist.gov/', type: 'cve_db', retrievedAt: '', relevanceScore: 0.97 },
    { name: 'AlienVault OTX', url: 'https://otx.alienvault.com/', type: 'threat_feed', retrievedAt: '', relevanceScore: 0.88 },
    { name: 'Abuse.ch', url: 'https://abuse.ch/', type: 'threat_feed', retrievedAt: '', relevanceScore: 0.85 },
  ],
  cyber_security: [
    { name: 'OWASP Top 10', url: 'https://owasp.org/Top10/', type: 'advisory', retrievedAt: '', relevanceScore: 0.93 },
    { name: 'Google Project Zero', url: 'https://googleprojectzero.blogspot.com/', type: 'research', retrievedAt: '', relevanceScore: 0.94 },
    { name: 'US-CERT Advisories', url: 'https://www.cisa.gov/uscert/', type: 'advisory', retrievedAt: '', relevanceScore: 0.96 },
    { name: 'SecurityWeek', url: 'https://www.securityweek.com/', type: 'news', retrievedAt: '', relevanceScore: 0.82 },
    { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/', type: 'news', retrievedAt: '', relevanceScore: 0.87 },
  ],
  digital_health: [
    { name: 'HHS HIPAA Breach Portal', url: 'https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf', type: 'health_advisory', retrievedAt: '', relevanceScore: 0.91 },
    { name: 'FDA Cybersecurity Guidance', url: 'https://www.fda.gov/medical-devices/digital-health-center-excellence', type: 'health_advisory', retrievedAt: '', relevanceScore: 0.89 },
    { name: 'WHO Digital Health', url: 'https://www.who.int/health-topics/digital-health', type: 'health_advisory', retrievedAt: '', relevanceScore: 0.86 },
    { name: 'Health-ISAC', url: 'https://health-isac.org/', type: 'threat_feed', retrievedAt: '', relevanceScore: 0.93 },
    { name: 'NIST Health IT', url: 'https://www.nist.gov/healthcare', type: 'advisory', retrievedAt: '', relevanceScore: 0.88 },
  ],
};

// ============================================
// ECHO Threat Intelligence Service (Singleton)
// ============================================

type EchoEventCallback = (feed: ThreatIntelligenceFeed) => void;

class EchoThreatIntelligenceService {
  private entries: ThreatIntelligenceEntry[] = [];
  private agentStatus: EchoAgentStatus = 'idle';
  private scanHistory: EchoScanCycle[] = [];
  private cronIntervalMs: number;
  private cronTimer: ReturnType<typeof setInterval> | null = null;
  private startTime: number;
  private totalScans: number = 0;
  private listeners: Set<EchoEventCallback> = new Set();
  private isInitialized: boolean = false;
  private lastRagHydrated = false;

  constructor(cronIntervalMs: number = DEFAULT_CRON_INTERVAL_MS) {
    this.cronIntervalMs = cronIntervalMs;
    this.startTime = Date.now();
  }

  // ---- Lifecycle ----

  /**
   * Initialize ECHO agent and start the cron cycle
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔊 ECHO: Initializing Threat Intelligence Agent...');
    this.agentStatus = 'scanning';
    this.isInitialized = true;

    // Perform initial scan
    await this.performFullScan();

    // Start cron cycle
    this.startCron();

    console.log(`🔊 ECHO: Agent active. Cron interval: ${this.cronIntervalMs / 1000}s`);
  }

  /**
   * Shut down the ECHO agent gracefully
   */
  shutdown(): void {
    console.log('🔊 ECHO: Shutting down Threat Intelligence Agent...');
    this.stopCron();
    this.agentStatus = 'offline';
    this.isInitialized = false;
    this.notifyListeners();
  }

  // ---- Cron Management ----

  private startCron(): void {
    if (this.cronTimer) return;

    this.cronTimer = setInterval(async () => {
      await this.performFullScan();
    }, this.cronIntervalMs);
  }

  private stopCron(): void {
    if (this.cronTimer) {
      clearInterval(this.cronTimer);
      this.cronTimer = null;
    }
  }

  /**
   * Update the cron interval (in milliseconds)
   */
  setCronInterval(ms: number): void {
    this.cronIntervalMs = Math.max(60 * 1000, ms); // Minimum 1 minute
    if (this.cronTimer) {
      this.stopCron();
      this.startCron();
    }
  }

  // ---- Scanning ----

  /**
   * Perform a full scan across all three domains
   */
  async performFullScan(): Promise<void> {
    this.agentStatus = 'scanning';
    this.lastRagHydrated = false;
    this.notifyListeners();

    for (const domain of ECHO_DOMAINS) {
      await this.scanDomain(domain);
    }

    this.agentStatus = 'idle';
    this.totalScans++;
    this.notifyListeners();
  }

  /**
   * Scan a single threat domain via RAG
   */
  async scanDomain(domain: ThreatDomain): Promise<ThreatIntelligenceEntry[]> {
    const cycle: EchoScanCycle = {
      id: `echo-scan-${Date.now()}-${domain}`,
      startedAt: new Date().toISOString(),
      domain,
      status: 'running',
      entriesFound: 0,
      ragQueriesPerformed: 0,
      nextScheduledAt: new Date(Date.now() + this.cronIntervalMs).toISOString(),
    };

    this.scanHistory.push(cycle);
    this.agentStatus = 'processing';

    try {
      const results = await this.queryRAG(domain);
      if (results.length > 0) {
        this.lastRagHydrated = true;
      }

      if (results.length > 0) {
        const existingIds = new Set(this.entries.map((e) => e.id));
        const tagged = results.map((e) => ({ ...e, source: 'echo_rag' as const }));
        const newEntries = tagged.filter((e) => !existingIds.has(e.id));
        this.entries = [...newEntries, ...this.entries];
        cycle.entriesFound = newEntries.length;
      }

      cycle.status = 'completed';
      cycle.completedAt = new Date().toISOString();
      cycle.ragQueriesPerformed = RAG_SOURCE_REGISTRY[domain].length;
    } catch {
      console.warn(`🔊 ECHO: RAG unavailable for ${domain} — feed uses live Terminal signals only`);
      cycle.status = 'completed';
      cycle.completedAt = new Date().toISOString();
      cycle.entriesFound = 0;
    }

    return this.entries.filter(e => e.domain === domain);
  }

  /**
   * Query the RAG backend for threat intelligence
   * In production, this calls the OAA API /api/echo/threat-rag endpoint
   */
  private async queryRAG(domain: ThreatDomain): Promise<ThreatIntelligenceEntry[]> {
    const apiUrl = `${env.api.oaa}/api/echo/threat-rag`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        domain,
        sources: RAG_SOURCE_REGISTRY[domain].map(s => s.name),
        maxResults: 10,
        minRelevance: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`RAG query failed: ${response.status}`);
    }

    const data = await response.json();
    return data.entries || [];
  }

  // ---- Data Access ----

  /**
   * Get the current threat intelligence feed
   */
  getFeed(): ThreatIntelligenceFeed {
    const sortedEntries = [...this.entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const domainBreakdown: Record<ThreatDomain, number> = {
      cyber_threats: 0,
      cyber_security: 0,
      digital_health: 0,
    };

    for (const entry of sortedEntries) {
      domainBreakdown[entry.domain]++;
    }

    return {
      entries: sortedEntries,
      agentState: this.getAgentState(),
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalEntries: sortedEntries.length,
        criticalCount: sortedEntries.filter(e => e.severity === 'critical').length,
        highCount: sortedEntries.filter(e => e.severity === 'high').length,
        domainBreakdown,
        echoRagHydrated: this.lastRagHydrated,
      },
    };
  }

  /**
   * Get entries filtered by domain
   */
  getEntriesByDomain(domain: ThreatDomain): ThreatIntelligenceEntry[] {
    return this.entries
      .filter(e => e.domain === domain)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get entries filtered by severity
   */
  getEntriesBySeverity(severity: ThreatSeverity): ThreatIntelligenceEntry[] {
    return this.entries
      .filter(e => e.severity === severity)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get the current ECHO agent state
   */
  getAgentState(): EchoAgentState {
    const lastCycle = this.scanHistory[this.scanHistory.length - 1] || null;
    const now = new Date();

    const domainCoverage: EchoAgentState['domainCoverage'] = {} as EchoAgentState['domainCoverage'];
    for (const domain of ECHO_DOMAINS) {
      const domainEntries = this.entries.filter(e => e.domain === domain);
      const lastDomainScan = [...this.scanHistory]
        .reverse()
        .find(c => c.domain === domain);

      const critCount = domainEntries.filter(e => e.severity === 'critical' || e.severity === 'high').length;
      const totalCount = domainEntries.length || 1;

      domainCoverage[domain] = {
        lastScanned: lastDomainScan?.completedAt || now.toISOString(),
        threatCount: domainEntries.length,
        healthScore: Math.max(0, 1 - (critCount / totalCount) * 0.5),
      };
    }

    return {
      status: this.agentStatus,
      lastScanCycle: lastCycle,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      totalScansCompleted: this.totalScans,
      totalThreatsIdentified: this.entries.length,
      activeThreatCount: this.entries.filter(e => e.status === 'active').length,
      domainCoverage,
      cronSchedule: `*/${Math.floor(this.cronIntervalMs / 60000)} * * * *`,
      nextScanAt: new Date(Date.now() + this.cronIntervalMs).toISOString(),
      integrity: 0.98,
    };
  }

  // ---- Event System ----

  /**
   * Subscribe to feed updates
   */
  subscribe(callback: EchoEventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const feed = this.getFeed();
    for (const listener of this.listeners) {
      try {
        listener(feed);
      } catch (err) {
        console.error('🔊 ECHO: Listener error:', err);
      }
    }
  }

  // ---- Utility ----

  /**
   * Force a manual scan (bypasses cron schedule)
   */
  async forceScan(): Promise<ThreatIntelligenceFeed> {
    await this.performFullScan();
    return this.getFeed();
  }

  /**
   * Get RAG source metadata for a domain
   */
  getRAGSources(domain: ThreatDomain): ThreatRAGSource[] {
    return RAG_SOURCE_REGISTRY[domain];
  }

  /**
   * Get all RAG sources across all domains
   */
  getAllRAGSources(): Record<ThreatDomain, ThreatRAGSource[]> {
    return { ...RAG_SOURCE_REGISTRY };
  }

  /**
   * Check if agent is initialized and running
   */
  isRunning(): boolean {
    return this.isInitialized && this.cronTimer !== null;
  }
}

// ============================================
// Singleton Export
// ============================================

/** Global ECHO Threat Intelligence agent instance */
export const echoAgent = new EchoThreatIntelligenceService(DEFAULT_CRON_INTERVAL_MS);

export default EchoThreatIntelligenceService;
