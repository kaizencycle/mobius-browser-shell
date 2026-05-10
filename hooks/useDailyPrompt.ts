import { useTerminal } from '../contexts/TerminalContext';

const GREEN_PROMPTS = [
  'What did you build today that will outlast today?',
  'Name one belief you tested and one that held.',
  'Where did integrity cost you something — and was it worth it?',
  'What signal did you act on? What signal did you ignore?',
  'Describe a moment where your action matched your values exactly.',
  'What evidence today suggested the system is working?',
  'What would you do differently if the GI were lower?',
];

const YELLOW_PROMPTS = [
  'What is the most uncertain thing you are holding right now?',
  'Where are you waiting for clarity instead of creating it?',
  'What assumption, if wrong, changes everything?',
  'Name one thing that felt stable but might not be.',
  'What would you need to believe to take the next step?',
  'Where is the system under strain — and what can you do about it?',
  'What tradeoff are you deferring that you should be making?',
];

const RED_PROMPTS = [
  'What are you protecting that needs to be released?',
  'What is the smallest act of integrity you can take right now?',
  'Name the pressure you are under. Name one person who would understand.',
  'What does resilience look like for you today — not in general, but today?',
  'Where does fear masquerade as caution in your decisions?',
  'What would it cost you to tell the full truth here?',
  'What is worth rebuilding, and what should be let go?',
];

function pickPrompt(prompts: string[], seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return prompts[hash % prompts.length]!;
}

export function useDailyPrompt(): string {
  const { state } = useTerminal();
  const mode = state?.mode ?? 'yellow';
  const cycle = state?.cycle ?? new Date().toISOString().slice(0, 10);

  const pool =
    mode === 'green' ? GREEN_PROMPTS : mode === 'red' ? RED_PROMPTS : YELLOW_PROMPTS;

  return pickPrompt(pool, cycle + mode);
}
