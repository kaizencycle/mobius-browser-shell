export type VaultSealStatus = 'sealed' | 'quarantined' | 'pending' | 'reattestation';

export interface SentinelAttestation {
  sentinel: string;
  attested: boolean;
  attested_at: string | null;
  signature: string | null;
}

export interface VaultSeal {
  id: string;
  cycle: string;
  status: VaultSealStatus;
  mic_reserved: number;
  gi_at_seal: number;
  sealed_at: string;
  prev_hash: string | null;
  this_hash: string;
  attestations: SentinelAttestation[];
  quarantine_reason?: string;
  reattestation_due?: string;
}

export interface VaultMetrics {
  total_seals: number;
  sealed: number;
  quarantined: number;
  pending: number;
  reattestation: number;
  total_mic_reserved: number;
  chain_length: number;
  last_seal_at: string | null;
  chain_valid: boolean;
}

export interface VaultState {
  metrics: VaultMetrics;
  seals: VaultSeal[];
  fetched_at: string;
  ledger_ok: boolean;
}
