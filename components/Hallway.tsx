import React from 'react';
import { TabId } from '../types';

interface Door {
  id: TabId | null;
  num: string;
  slug: string;
  icon: string;
  title: string;
  role: string;
  litClass: string;
  disabled?: boolean;
}

const DOORS: Door[] = [
  {
    id: TabId.OAA,
    num: '01',
    slug: 'OAA · SCHOOL',
    icon: '📚',
    title: 'Open Academy',
    role: 'AI-guided learning. Structured knowledge for the civic era.',
    litClass: 'door-lit-oaa',
  },
  {
    id: TabId.HIVE,
    num: '02',
    slug: 'HIVE · ARCADE',
    icon: '🎮',
    title: 'HIVE Lab',
    role: '16-bit JRPG. Earn shards. Defend the protocol.',
    litClass: 'door-lit-hive',
  },
  {
    id: TabId.REFLECTIONS,
    num: '03',
    slug: 'REFLECTIONS · STUDIO',
    icon: '🪞',
    title: 'Reflections',
    role: 'Write with integrity. Mirror your reasoning.',
    litClass: 'door-lit-reflect',
  },
  {
    id: TabId.SHIELD,
    num: '04',
    slug: 'SHIELD · STATION',
    icon: '🛡️',
    title: 'Citizen Shield',
    role: 'Protect civil discourse. Fact-check in real time.',
    litClass: 'door-lit-shield',
  },
  {
    id: TabId.KNOWLEDGE_GRAPH,
    num: '05',
    slug: 'ATLAS · SENTINEL',
    icon: '⬡',
    title: 'ATLAS',
    role: 'Knowledge graph. Sentinel oversight. System health.',
    litClass: 'door-lit-atlas',
  },
  {
    id: TabId.JADE,
    num: '06',
    slug: 'JADE · STUDIO',
    icon: '🔮',
    title: 'JADE',
    role: 'Behavioral integrity. Reflective agent in session.',
    litClass: 'door-lit-jade',
  },
  {
    id: TabId.WALLET,
    num: '07',
    slug: 'VAULT · TREASURY',
    icon: '◎',
    title: 'MIC Vault',
    role: 'Integrity-backed tokens. Provenance on chain.',
    litClass: 'door-lit-wallet',
  },
  {
    id: null,
    num: '08',
    slug: 'MII · INDEX',
    icon: '∿',
    title: 'MII Index',
    role: 'Mobius Integrity Index. Coming next cycle.',
    litClass: 'door-lit-mii',
    disabled: true,
  },
];

interface HallwayProps {
  onEnter: (tab: TabId) => void;
}

export const Hallway: React.FC<HallwayProps> = ({ onEnter }) => {
  return (
    <div className="hallway-root">
      <div className="hallway-inner">

        <div className="hallway-hero">
          <div className="hallway-eyebrow">CITIZEN ENTRY POINT</div>
          <h1 className="hallway-h1">
            Choose your <em>chamber.</em>
          </h1>
          <p className="hallway-lede">
            Eight rooms. One protocol. Each chamber is a node in the civic
            integrity graph.{' '}
            <span className="hallway-lede-q">Where do you go today?</span>
          </p>
        </div>

        <div className="hallway-doors">
          {DOORS.map((door) => (
            <button
              key={door.num}
              className={[
                'hallway-door',
                door.litClass,
                door.disabled ? 'hallway-door--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => door.id && onEnter(door.id)}
              disabled={door.disabled}
              aria-label={door.disabled ? `${door.title} — coming soon` : `Enter ${door.title}`}
            >
              <span className="door-lit" aria-hidden />
              <span className="door-glow" aria-hidden />
              <span className="door-num">{door.num} · {door.slug}</span>
              <span className="door-body">
                <span className="door-icon" aria-hidden>{door.icon}</span>
                <span className="door-title">{door.title}</span>
                <span className="door-role">{door.role}</span>
              </span>
              <span className="door-enter">
                {door.disabled ? (
                  <span>COMING SOON</span>
                ) : (
                  <>
                    <span>ENTER</span>
                    <svg
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden
                      className="door-arrow"
                    >
                      <path
                        d="M2 7h10M8 3l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="hallway-footer">
          <span className="hallway-footer-copy">
            CC0 PUBLIC DOMAIN · Mobius Substrate
          </span>
          <span className="hallway-footer-motto">
            "Fork the shell, not the integrity."
          </span>
        </div>

      </div>
    </div>
  );
};
