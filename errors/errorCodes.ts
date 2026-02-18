/**
 * Mobius Shell Error Codes
 *
 * Format: ERR-{DOMAIN}-{SEQUENCE}
 * - DOMAIN: 3-4 letter subsystem identifier
 * - SEQUENCE: 3-digit zero-padded counter
 *
 * Reserved ranges:
 * 001-099: Critical / Sentinel
 * 100-199: OAA Learning Hub
 * 200-299: Citizen Shield
 * 300-399: Reflections Lab
 * 400-499: MIC Wallet / Economics
 * 500-599: HIVE / Game Systems
 * 600-699: Infrastructure / Shell
 * 900-999: Unknown / Fallback
 */

export const ErrorCodes = {
  // ═══════════════════════════════════════════════════════════
  // CRITICAL / SENTINEL (001-099)
  // ═══════════════════════════════════════════════════════════
  ATLAS_SENTINEL_DOWN: 'ERR-ATL-001',
  ATLAS_LOGGING_FAILED: 'ERR-ATL-002',
  ROOT_BOUNDARY_BREACH: 'ERR-ATL-003',
  MULTI_PANEL_CASCADE: 'ERR-ATL-004',

  // ═══════════════════════════════════════════════════════════
  // OAA LEARNING HUB (100-199)
  // ═══════════════════════════════════════════════════════════
  OAA_LOAD_FAILED: 'ERR-OAA-100',
  OAA_AI_PROXY_ERROR: 'ERR-OAA-101',
  OAA_SESSION_SYNC: 'ERR-OAA-102',
  OAA_PROGRESS_PERSIST: 'ERR-OAA-103',

  // ═══════════════════════════════════════════════════════════
  // CITIZEN SHIELD (200-299)
  // ═══════════════════════════════════════════════════════════
  SHIELD_AUTH_EXPIRED: 'ERR-SHD-200',
  SHIELD_VERIFICATION_FAIL: 'ERR-SHD-201',
  SHIELD_REPORT_SUBMIT: 'ERR-SHD-202',
  SHIELD_EVIDENCE_UPLOAD: 'ERR-SHD-203',

  // ═══════════════════════════════════════════════════════════
  // REFLECTIONS LAB (300-399)
  // ═══════════════════════════════════════════════════════════
  REFL_MIRROR_SYNC: 'ERR-RFL-300',
  REFL_JOURNAL_ENCRYPT: 'ERR-RFL-301',
  REFL_INSIGHT_GENERATE: 'ERR-RFL-302',

  // ═══════════════════════════════════════════════════════════
  // MIC WALLET / ECONOMICS (400-499)
  // ═══════════════════════════════════════════════════════════
  MIC_SYNC_FAILED: 'ERR-MIC-400',
  MIC_LEDGER_FETCH: 'ERR-MIC-401',
  MIC_SHARD_CALC: 'ERR-MIC-402',
  MII_COMPUTE_ERROR: 'ERR-MIC-403',

  // ═══════════════════════════════════════════════════════════
  // HIVE / GAME (500-599)
  // ═══════════════════════════════════════════════════════════
  HIVE_SESSION_LOST: 'ERR-HIV-500',
  HIVE_STATE_DESYNC: 'ERR-HIV-501',

  // ═══════════════════════════════════════════════════════════
  // KNOWLEDGE GRAPH / ATLAS (700-799)
  // ═══════════════════════════════════════════════════════════
  ATLAS_GRAPH_LOAD: 'ERR-ATL-700',
  ATLAS_GRAPH_SYNC: 'ERR-ATL-701',

  // ═══════════════════════════════════════════════════════════
  // INFRASTRUCTURE / SHELL (600-699)
  // ═══════════════════════════════════════════════════════════
  SHELL_CONFIG_LOAD: 'ERR-SHL-600',
  SHELL_LAB_IFRAME_TIMEOUT: 'ERR-SHL-601',
  SHELL_ROUTER_FAIL: 'ERR-SHL-602',
  ENV_VAR_MISSING: 'ERR-SHL-603',

  // ═══════════════════════════════════════════════════════════
  // UNKNOWN / FALLBACK (900-999)
  // ═══════════════════════════════════════════════════════════
  UNKNOWN_ERROR: 'ERR-UNK-900',
  UNHANDLED_REJECTION: 'ERR-UNK-901',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Metadata for error classification
 */
export interface ErrorMetadata {
  code: ErrorCode;
  severity: 'critical' | 'high' | 'medium' | 'low';
  retryable: boolean;
  alertChannel?: 'pagerduty' | 'slack' | 'email' | 'none';
}

export const ErrorRegistry: Record<ErrorCode, ErrorMetadata> = {
  [ErrorCodes.ATLAS_SENTINEL_DOWN]: {
    code: ErrorCodes.ATLAS_SENTINEL_DOWN,
    severity: 'critical',
    retryable: false,
    alertChannel: 'pagerduty',
  },
  [ErrorCodes.ATLAS_LOGGING_FAILED]: {
    code: ErrorCodes.ATLAS_LOGGING_FAILED,
    severity: 'high',
    retryable: true,
    alertChannel: 'slack',
  },
  [ErrorCodes.ROOT_BOUNDARY_BREACH]: {
    code: ErrorCodes.ROOT_BOUNDARY_BREACH,
    severity: 'critical',
    retryable: false,
    alertChannel: 'pagerduty',
  },
  [ErrorCodes.MULTI_PANEL_CASCADE]: {
    code: ErrorCodes.MULTI_PANEL_CASCADE,
    severity: 'critical',
    retryable: false,
    alertChannel: 'pagerduty',
  },
  [ErrorCodes.OAA_LOAD_FAILED]: {
    code: ErrorCodes.OAA_LOAD_FAILED,
    severity: 'high',
    retryable: true,
    alertChannel: 'slack',
  },
  [ErrorCodes.OAA_AI_PROXY_ERROR]: {
    code: ErrorCodes.OAA_AI_PROXY_ERROR,
    severity: 'high',
    retryable: true,
    alertChannel: 'slack',
  },
  [ErrorCodes.OAA_SESSION_SYNC]: {
    code: ErrorCodes.OAA_SESSION_SYNC,
    severity: 'medium',
    retryable: true,
    alertChannel: 'none',
  },
  [ErrorCodes.OAA_PROGRESS_PERSIST]: {
    code: ErrorCodes.OAA_PROGRESS_PERSIST,
    severity: 'medium',
    retryable: true,
    alertChannel: 'none',
  },
  [ErrorCodes.SHIELD_AUTH_EXPIRED]: {
    code: ErrorCodes.SHIELD_AUTH_EXPIRED,
    severity: 'high',
    retryable: true,
    alertChannel: 'slack',
  },
  [ErrorCodes.SHIELD_VERIFICATION_FAIL]: {
    code: ErrorCodes.SHIELD_VERIFICATION_FAIL,
    severity: 'high',
    retryable: true,
    alertChannel: 'slack',
  },
  [ErrorCodes.SHIELD_REPORT_SUBMIT]: {
    code: ErrorCodes.SHIELD_REPORT_SUBMIT,
    severity: 'medium',
    retryable: true,
    alertChannel: 'none',
  },
  [ErrorCodes.SHIELD_EVIDENCE_UPLOAD]: {
    code: ErrorCodes.SHIELD_EVIDENCE_UPLOAD,
    severity: 'medium',
    retryable: true,
    alertChannel: 'none',
  },
  [ErrorCodes.REFL_MIRROR_SYNC]: {
    code: ErrorCodes.REFL_MIRROR_SYNC,
    severity: 'medium',
    retryable: true,
    alertChannel: 'none',
  },
  [ErrorCodes.REFL_JOURNAL_ENCRYPT]: {
    code: ErrorCodes.REFL_JOURNAL_ENCRYPT,
    severity: 'high',
    retryable: true,
    alertChannel: 'slack',
  },
  [ErrorCodes.REFL_INSIGHT_GENERATE]: {
    code: ErrorCodes.REFL_INSIGHT_GENERATE,
    severity: 'medium',
    retryable: true,
    alertChannel: 'none',
  },
  [ErrorCodes.MIC_SYNC_FAILED]: {
    code: ErrorCodes.MIC_SYNC_FAILED,
    severity: 'high',
    retryable: true,
    alertChannel: 'slack',
  },
  [ErrorCodes.MIC_LEDGER_FETCH]: {
    code: ErrorCodes.MIC_LEDGER_FETCH,
    severity: 'high',
    retryable: true,
    alertChannel: 'slack',
  },
  [ErrorCodes.MIC_SHARD_CALC]: {
    code: ErrorCodes.MIC_SHARD_CALC,
    severity: 'medium',
    retryable: true,
    alertChannel: 'none',
  },
  [ErrorCodes.MII_COMPUTE_ERROR]: {
    code: ErrorCodes.MII_COMPUTE_ERROR,
    severity: 'high',
    retryable: true,
    alertChannel: 'slack',
  },
  [ErrorCodes.HIVE_SESSION_LOST]: {
    code: ErrorCodes.HIVE_SESSION_LOST,
    severity: 'medium',
    retryable: true,
    alertChannel: 'none',
  },
  [ErrorCodes.HIVE_STATE_DESYNC]: {
    code: ErrorCodes.HIVE_STATE_DESYNC,
    severity: 'medium',
    retryable: true,
    alertChannel: 'none',
  },
  [ErrorCodes.ATLAS_GRAPH_LOAD]: {
    code: ErrorCodes.ATLAS_GRAPH_LOAD,
    severity: 'high',
    retryable: false,
    alertChannel: 'slack',
  },
  [ErrorCodes.ATLAS_GRAPH_SYNC]: {
    code: ErrorCodes.ATLAS_GRAPH_SYNC,
    severity: 'high',
    retryable: false,
    alertChannel: 'slack',
  },
  [ErrorCodes.SHELL_CONFIG_LOAD]: {
    code: ErrorCodes.SHELL_CONFIG_LOAD,
    severity: 'critical',
    retryable: false,
    alertChannel: 'pagerduty',
  },
  [ErrorCodes.SHELL_LAB_IFRAME_TIMEOUT]: {
    code: ErrorCodes.SHELL_LAB_IFRAME_TIMEOUT,
    severity: 'medium',
    retryable: true,
    alertChannel: 'none',
  },
  [ErrorCodes.SHELL_ROUTER_FAIL]: {
    code: ErrorCodes.SHELL_ROUTER_FAIL,
    severity: 'high',
    retryable: true,
    alertChannel: 'slack',
  },
  [ErrorCodes.ENV_VAR_MISSING]: {
    code: ErrorCodes.ENV_VAR_MISSING,
    severity: 'critical',
    retryable: false,
    alertChannel: 'pagerduty',
  },
  [ErrorCodes.UNKNOWN_ERROR]: {
    code: ErrorCodes.UNKNOWN_ERROR,
    severity: 'medium',
    retryable: true,
    alertChannel: 'none',
  },
  [ErrorCodes.UNHANDLED_REJECTION]: {
    code: ErrorCodes.UNHANDLED_REJECTION,
    severity: 'high',
    retryable: true,
    alertChannel: 'slack',
  },
};

/**
 * Generate a human-readable error ID for user-facing display
 * Format: ERR-{CODE}-{RANDOM}
 * Example: ERR-OAA-100-X7K9
 */
export const generateErrorId = (code: ErrorCode): string => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${code}-${random}`;
};

/**
 * Parse error code from error message or stack
 * Used for automatic classification of unhandled errors
 */
export const inferErrorCode = (error: Error): ErrorCode => {
  const message = error.message.toLowerCase();

  if (message.includes('atlas') || message.includes('sentinel')) {
    return ErrorCodes.ATLAS_SENTINEL_DOWN;
  }
  if (message.includes('mic') || message.includes('wallet')) {
    return ErrorCodes.MIC_SYNC_FAILED;
  }
  if (message.includes('oaa') || message.includes('learning')) {
    return ErrorCodes.OAA_LOAD_FAILED;
  }
  if (message.includes('shield') || message.includes('citizen')) {
    return ErrorCodes.SHIELD_AUTH_EXPIRED;
  }
  if (message.includes('reflection') || message.includes('journal')) {
    return ErrorCodes.REFL_MIRROR_SYNC;
  }
  if (message.includes('hive') || message.includes('game')) {
    return ErrorCodes.HIVE_SESSION_LOST;
  }
  if (message.includes('graph') || message.includes('knowledge')) {
    return ErrorCodes.ATLAS_GRAPH_LOAD;
  }

  return ErrorCodes.UNKNOWN_ERROR;
};
