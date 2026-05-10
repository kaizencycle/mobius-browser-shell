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
    slug: 'LAB 7',
    icon: '📚',
    title: 'OAA Library',
    role: 'Learn-to-earn. Modules, quizzes, MIC as XP.',
    litClass: 'door-lit-oaa',
  },
  {
    id: TabId.HIVE,
    num: '02',
    slug: 'LAB 8',
    icon: '🎮',
    title: 'HIVE Arcade',
    role: '16-bit governance JRPG. Dice, mesh, shards.',
    litClass: 'door-lit-hive',
  },
  {
    id: TabId.REFLECTIONS,
    num: '03',
    slug: 'LAB 4',
    icon: '🪞',
    title: 'Reflection Nook',
    role: 'Journal, mood, E.O.M.M. Past-you, present-you.',
    litClass: 'door-lit-reflect',
  },
  {
    id: TabId.SHIELD,
    num: '04',
    slug: 'LAB 6',
    icon: '🛡',
    title: 'Shield War Room',
    role: 'Civic radar + ECHO threat intel.',
    litClass: 'door-lit-shield',
  },
  {
    id: TabId.KNOWLEDGE_GRAPH,
    num: '05',
    slug: 'SENTINEL',
    icon: '⬡',
    title: 'ATLAS Observatory',
    role: 'Knowledge graph. Concepts, intents, time.',
    litClass: 'door-lit-atlas',
  },
  {
    id: TabId.JADE,
    num: '06',
    slug: 'SENTINEL',
    icon: '🍵',
    title: 'JADE Tea Room',
    role: 'The room that asks why. Socratic UX.',
    litClass: 'door-lit-jade',
  },
  {
    id: TabId.WALLET,
    num: '07',
    slug: 'TREASURY',
    icon: '◎',
    title: 'MIC Vault',
    role: 'Wallet, shards, ledger. Provenance over balance.',
    litClass: 'door-lit-wallet',
  },
  {
    id: null,
    num: 'FACULTY',
    slug: 'MII 0.95',
    icon: '⬢',
    title: 'ATLAS · JADE',
    role: 'Four sentinels watching the school. All green.',
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
          <div className="hallway-eyebrow">A school, not a dashboard</div>
          <h1 className="hallway-h1">
            Pick a room. <em>Each one is its own world.</em>
          </h1>
          <p className="hallway-lede">
            Seven chambers, each with its own atmosphere, vocabulary, and
            personality. The classroom feels like a classroom; the arcade feels
            like an arcade; the tea room invites you to slow down.{' '}
            <span className="hallway-lede-q">Step in to see each room's native voice.</span>
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
