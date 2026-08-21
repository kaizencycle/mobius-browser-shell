import type { ChamberJourney } from '../types';

/**
 * Flagship exemplar — capability without stewardship.
 * Prometheus is revealed only after the learner commits a first position.
 */
export const FIRE_WE_STOLE: ChamberJourney = {
  id: 'fire-we-stole',
  title: 'The Fire We Stole',
  hook: 'Humanity discovers a technology capable of transforming civilization, but its creators cannot fully predict the consequences. Should it be released?',
  openingQuestion:
    'A research team has built a capability that could reshape society. They cannot fully predict the consequences. Should it be released?',
  origin: {
    period: 'Ancient Greece (Hesiod, ~700 BCE)',
    context:
      'Prometheus steals fire from the gods and gives it to humanity. Zeus punishes both Prometheus and mankind — the gift carries cost, not pure liberation.',
    source: {
      claim: 'Prometheus brings fire to mortals; Zeus responds with Pandora and eternal punishment.',
      source: 'Hesiod, Theogony & Works and Days (trans. various)',
      date: '~700 BCE',
      provenance: 'Primary Greek mythological account',
      confidence: 'high',
    },
  },
  encounters: [
    {
      id: 'modern-problem',
      kind: 'hook',
      title: 'A modern capability problem',
      body:
        'Gene editing, nuclear fission, general-purpose AI — each arrived as a capability before society agreed on stewardship. The question is not only "can we?" but "who bears cost when we are wrong?"',
    },
    {
      id: 'first-position',
      kind: 'position',
      title: 'Your first answer',
      body: 'Before any myth or case study — commit to an initial judgment.',
      prompt: 'Should the capability be released before full predictability exists?',
    },
    {
      id: 'prometheus',
      kind: 'origin',
      title: 'Prometheus / Hesiod',
      body:
        'In Hesiod, fire is not a neutral tool. It enables craft and civilization — and triggers divine retaliation. The myth frames capability as theft with consequences, not uncomplicated progress.',
      evidence: [
        {
          claim: 'Fire enables human craft; Zeus withholds it to limit mortal power.',
          source: 'Hesiod, Works and Days',
          confidence: 'high',
        },
      ],
      lineage: [
        { id: 'hesiod', label: 'Hesiod — forbidden fire', period: '~700 BCE' },
        { id: 'prometheus', label: 'Prometheus as transgressor', relation: 'reinterpreted' },
      ],
    },
    {
      id: 'frankenstein',
      kind: 'source',
      title: 'Frankenstein',
      body:
        'Mary Shelley\'s subtitle — "The Modern Prometheus" — explicitly links scientific creation to mythic overreach. Victor Frankenstein releases a capability he cannot steward.',
      evidence: [
        {
          claim: 'Victor creates life without accepting responsibility for the created.',
          source: 'Mary Shelley, Frankenstein (1818)',
          date: '1818',
          confidence: 'high',
        },
      ],
      lineage: [
        { id: 'hesiod', label: 'Prometheus myth', period: 'Ancient' },
        { id: 'shelley', label: 'Frankenstein', period: '1818', relation: 'responded-to' },
      ],
    },
    {
      id: 'nuclear',
      kind: 'modern',
      title: 'Nuclear technology',
      body:
        'Oppenheimer invoked Shiva — "I am become Death." Capability deployed under wartime urgency; decades of stewardship debate followed. Liberation and catastrophe share the same physics.',
      evidence: [
        {
          claim: 'Trinity test, July 1945 — atomic capability demonstrated before civilian governance frameworks.',
          source: 'Historical record — Manhattan Project',
          date: '1945',
          confidence: 'high',
        },
      ],
      lineage: [
        { id: 'shelley', label: 'Scientific responsibility literature', relation: 'parallel' },
        { id: 'nuclear', label: 'Nuclear age', period: '1945–', relation: 'derived-from' },
      ],
    },
    {
      id: 'ai',
      kind: 'modern',
      title: 'Artificial intelligence',
      body:
        'General-purpose models arrive faster than institutional readiness. The parallel is thematic — not a claim that AI equals fire — but the stewardship question recurs.',
      lineage: [
        { id: 'nuclear', label: 'Prior capability releases', relation: 'parallel' },
        { id: 'ai', label: 'Present-day AI deployment', period: '2020s', relation: 'uncertain' },
      ],
    },
    {
      id: 'friction',
      kind: 'friction',
      title: 'Force an interpretation',
      body: 'Was Prometheus a liberator — or capability without stewardship?',
      prompt: 'Choose the reading that best fits the evidence you reviewed.',
    },
    {
      id: 'counterpoint',
      kind: 'counterpoint',
      title: 'A credible counter-reading',
      body:
        'Some read Prometheus as necessary transgression: without stolen fire, humanity remains powerless against nature and tyranny. Restraint can preserve injustice. The myth may warn about punishment, not about the gift itself.',
    },
    {
      id: 'reinterpret',
      kind: 'reinterpret',
      title: 'Revise your answer',
      body: 'You have encountered myth, literature, and modern cases. Has your position changed?',
      prompt: 'Restate your judgment — release, delay, or conditional release — and why.',
    },
    {
      id: 'reflect',
      kind: 'reflect',
      title: 'What changed your mind, if anything?',
      body: 'Mobius does not score your ideology. The record is whether you can show what you believed, what challenged you, and what remains uncertain.',
      prompt: 'What changed your mind, if anything? What remains uncertain?',
    },
  ],
  frictionPrompt: 'Was Prometheus a liberator, or capability without stewardship?',
  frictionOptions: [
    'Liberator — gift was necessary',
    'Stewardship failure — release was reckless',
    'Conditional — depends on who decides',
  ],
  counterpoint: {
    title: 'The liberation reading',
    body:
      'Fire as emancipation: Prometheus breaks divine monopoly. Punishment reflects power defending itself, not proof the gift was wrong.',
    evidence: [
      {
        claim: 'Aeschylus\' Prometheus Bound portrays Prometheus as benefactor of mankind.',
        source: 'Aeschylus, Prometheus Bound (trans. various)',
        confidence: 'medium',
        counterpoint: 'Hesiod\'s account is more punitive; traditions diverge.',
      },
    ],
  },
  reflectionPrompt: 'What changed your mind, if anything?',
  nextQuestions: [
    'Who should decide when a capability is "ready"?',
    'What evidence would change your mind again?',
    'Where does Memory (EPICON) record stewardship decisions in Mobius?',
  ],
};
