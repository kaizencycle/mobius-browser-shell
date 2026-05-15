import React, { useState } from 'react';
import { TabId } from '../types';
import { SENTINELS } from '../constants';
import { SentinelStatus } from './SentinelStatus';
import { CitizenProfileButton } from './CitizenProfile/CitizenProfileButton';
import { Coffee, CheckCircle } from 'lucide-react';
import { useTerminal } from '../contexts/TerminalContext';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { useGuest } from '../contexts/GuestContext';
import { wakeAllServices, env } from '../config/env';
import { type TerminalState } from '../src/lib/terminal-bridge';

const TERMINAL_APP_URL = `${env.terminalOrigin.replace(/\/+$/, '')}/terminal`;

function giClass(mode: TerminalState['mode'], stale: boolean): string {
  if (stale) return 'hall-gi--dim';
  return mode === 'green' ? 'hall-gi--green' : mode === 'red' ? 'hall-gi--red' : 'hall-gi--yellow';
}

interface Door {
  id: TabId | null;
  room: string;
  slug: string;
  icon: string;
  title: string;
  role: string;
  dClass: string;
  disabled?: boolean;
}

const DOORS: Door[] = [
  { id: TabId.OAA,             room: '01', slug: 'LAB 7',    icon: '📚', title: 'OAA Library',       role: 'Learn-to-earn. Modules, quizzes, MIC as XP.',          dClass: 'd-oaa'     },
  { id: TabId.HIVE,            room: '02', slug: 'LAB 8',    icon: '🎮', title: 'HIVE Arcade',        role: '16-bit governance JRPG. Dice, mesh, shards.',           dClass: 'd-hive'    },
  { id: TabId.REFLECTIONS,     room: '03', slug: 'LAB 4',    icon: '🪞', title: 'Reflection Nook',    role: 'Journal, mood, E.O.M.M. Past-you, present-you.',        dClass: 'd-reflect' },
  { id: TabId.SHIELD,          room: '04', slug: 'LAB 6',    icon: '🛡', title: 'Shield War Room',    role: 'Civic radar + ECHO threat intel.',                      dClass: 'd-shield'  },
  { id: TabId.KNOWLEDGE_GRAPH, room: '05', slug: 'SENTINEL', icon: '⬡', title: 'ATLAS Observatory',  role: 'Knowledge graph. Concepts, intents, time.',             dClass: 'd-atlas'   },
  { id: TabId.JADE,            room: '06', slug: 'SENTINEL', icon: '🍵', title: 'JADE Tea Room',      role: 'The room that asks why. Socratic UX.',                  dClass: 'd-jade'    },
  { id: TabId.WALLET,          room: '07', slug: 'TREASURY', icon: '◎', title: 'MIC Vault',           role: 'Wallet, shards, ledger. Provenance over balance.',      dClass: 'd-wallet'  },
  { id: null,                  room: 'FACULTY', slug: 'MII 0.95', icon: '⬢', title: 'ATLAS · AUREA · EVE · JADE', role: 'Four sentinels watching the school. All green.', dClass: 'd-mii', disabled: true },
];

interface HallwayProps {
  onEnter: (tab: TabId) => void;
  onOpenProfile: () => void;
}

export const Hallway: React.FC<HallwayProps> = ({ onEnter, onOpenProfile }) => {
  const [isWaking, setIsWaking] = useState(false);
  const [wakeComplete, setWakeComplete] = useState(false);
  const { state: terminalState } = useTerminal();
  const { wallet } = useWallet();
  const { citizen } = useAuth();
  const { isGuest, triggerBecomeCitizen } = useGuest();

  const handleWakeLabs = async () => {
    setIsWaking(true);
    setWakeComplete(false);
    await wakeAllServices();
    setIsWaking(false);
    setWakeComplete(true);
    setTimeout(() => setWakeComplete(false), 3000);
  };

  return (
    <div className="hall-root">
      <div className="hall-inner">

        {/* ── Hall header ─────────────────────────────────────── */}
        <div className="hall-head">
          <div className="brand">
            <div className="glyph">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 4H3"/><path d="M18 8H6"/><path d="M19 12H9"/>
                <path d="M16 16h-6"/><path d="M11 20h2"/>
              </svg>
            </div>
            <div>
              <div className="name">Mobius — School of Chambers</div>
              <div className="sub">
                {env.network.isTestnet && <span className="hall-testnet">TESTNET</span>}
                ATLAS v1.0 · 7 rooms · MII 0.95
              </div>
            </div>
          </div>

          <div className="right">
            {terminalState ? (
              <a
                href={TERMINAL_APP_URL}
                target="_blank"
                rel="noreferrer"
                className={`hall-gi ${giClass(terminalState.mode, terminalState.stale)}`}
                title={terminalState.stale ? 'Stale — last-known-good' : 'Open Mobius Terminal'}
              >
                ↗ GI {terminalState.gi.toFixed(2)}
              </a>
            ) : (
              <span className="hall-gi hall-gi--dim">GI …</span>
            )}

            <span className="hall-chip hall-chip--mic">
              ◎ {wallet
                ? wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0.00'}
            </span>

            <button
              className="hall-wake"
              onClick={handleWakeLabs}
              disabled={isWaking}
              title="Wake all Render services"
            >
              {wakeComplete
                ? <CheckCircle size={13} />
                : <Coffee size={13} className={isWaking ? 'animate-pulse' : ''} />}
            </button>

            <span className="hall-sentinel-row">
              <span className="pip" aria-hidden />
              Sentinels online · MII 0.95
            </span>

            <span className="hall-sentinels-detail">
              <SentinelStatus sentinels={SENTINELS} />
            </span>

            {isGuest ? (
              <button className="hall-guest" onClick={triggerBecomeCitizen}>⬡ Guest</button>
            ) : citizen ? (
              <CitizenProfileButton onClick={onOpenProfile} />
            ) : null}
          </div>
        </div>

        {/* ── Hero ────────────────────────────────────────────── */}
        <div className="hall-title">
          <div className="eyebrow">A school, not a dashboard</div>
          <h1>Pick a room. <em>Each one is its own world.</em></h1>
          <p className="lede">
            Seven chambers, each with its own atmosphere, vocabulary, and
            personality. The classroom feels like a classroom; the arcade feels
            like an arcade; the tea room invites you to slow down.{' '}
            <span className="q">Step in to see each room's native voice.</span>
          </p>
        </div>

        {/* ── Door grid ────────────────────────────────────────── */}
        <div className="hallway-doors">
          {DOORS.map((door) => (
            <button
              key={door.room}
              className={['door', door.dClass, door.disabled ? 'door--disabled' : ''].filter(Boolean).join(' ')}
              onClick={() => door.id && onEnter(door.id)}
              disabled={door.disabled}
              aria-label={door.disabled ? `${door.title} — read only` : `Enter ${door.title}`}
            >
              <span className="lit" aria-hidden />
              <span className="glow" aria-hidden />
              <span className="num">ROOM {door.room} · {door.slug}</span>
              <span className="body">
                <span className="icon" aria-hidden>{door.icon}</span>
                <span className="door-title">{door.title}</span>
                <span className="role">{door.role}</span>
              </span>
              <span className="enter">
                {door.disabled ? (
                  <span>read-only</span>
                ) : (
                  <>
                    <span>Enter</span>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 12h14" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </>
                )}
              </span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
