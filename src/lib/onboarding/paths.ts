export type OnboardingPath = 'learner' | 'operator' | 'researcher' | 'builder';

export interface PathDefinition {
  id: OnboardingPath;
  label: string;
  description: string;
  icon: string;
  firstChamber: string;
  firstChamberLabel: string;
  tag: string;
}

export const ONBOARDING_PATHS: PathDefinition[] = [
  {
    id: 'learner',
    label: 'Learner',
    description:
      'Start with guided seminars, earn MIC through verified comprehension, and grow civic skill progressively.',
    icon: '📖',
    firstChamber: 'oaa',
    firstChamberLabel: 'Learn',
    tag: 'Opens Learn first',
  },
  {
    id: 'operator',
    label: 'Operator',
    description:
      'Monitor GI, sentinel activity, and live system signals. Deploy agents, review integrity, manage the terminal.',
    icon: '⚡',
    firstChamber: 'terminal',
    firstChamberLabel: 'Pulse',
    tag: 'Opens Pulse first',
  },
  {
    id: 'researcher',
    label: 'Researcher',
    description:
      'Explore the canonical handbook, whitepapers, governance docs, and constitutional architecture.',
    icon: '🔬',
    firstChamber: 'handbook',
    firstChamberLabel: 'Handbook',
    tag: 'Opens handbook first',
  },
  {
    id: 'builder',
    label: 'Builder',
    description:
      'Contribute to the substrate — PRs, EPICON intent blocks, Reserve Block attestations, and protocol work.',
    icon: '🌍',
    firstChamber: 'cpc',
    firstChamberLabel: 'Core',
    tag: 'Opens Core first',
  },
];

export const CHAMBER_PREVIEWS: Record<
  OnboardingPath,
  {
    description: string;
    subjects?: string[];
    rewards?: Array<{ label: string; value: string }>;
  }
> = {
  learner: {
    description:
      'Swipe through 5-minute seminars on civic topics. After every 5, a quiz gate verifies comprehension. Pass it to earn MIC and unlock JADE routing — your personalized next seminar based on the questions you ask.',
    subjects: ['Economics', 'Civics', 'AI governance', 'Game theory', 'Systems'],
    rewards: [
      { label: 'Pass quiz', value: '5 MIC' },
      { label: 'Ask JADE', value: '+5 MIC' },
      { label: 'Cross-topic synthesis', value: '+10 MIC' },
    ],
  },
  operator: {
    description:
      'The Pulse chamber shows live GI, sentinel journal entries, tripwire alerts, and system health. When GI degrades, you see why — and which sentinel flagged it first.',
    subjects: ['GI monitor', 'Sentinel journal', 'Tripwires', 'Signal strip', 'Cron health'],
    rewards: [
      { label: 'Attest block', value: 'quorum +1' },
      { label: 'Resolve tripwire', value: 'GI +delta' },
      { label: 'Human witness', value: 'IPI −delta' },
    ],
  },
  researcher: {
    description:
      'The Handbook is the constitutional record — canon laws, cycle journals, sentinel constitution, GI formula, MIC whitepaper, and 1,100+ docs organized by audience and purpose.',
    subjects: ['Canon laws', 'Cycle journal', 'Governance', 'Architecture', 'Whitepapers'],
    rewards: [
      { label: 'Read handbook', value: 'context' },
      { label: 'Cite canon', value: 'provenance' },
      { label: 'Submit RFC', value: 'contribution' },
    ],
  },
  builder: {
    description:
      'The Core chamber exposes the protocol rails — identity, MIC wallet, attestation API, ledger endpoints, and the EPICON intent layer. All PRs require an EPICON block.',
    subjects: ['Ledger API', 'MIC wallet', 'Identity', 'EPICON', 'Reserve Blocks'],
    rewards: [
      { label: 'Ship PR', value: 'canon +1' },
      { label: 'EPICON intent', value: 'provenance' },
      { label: 'Attest block', value: '50 MIC' },
    ],
  },
};
