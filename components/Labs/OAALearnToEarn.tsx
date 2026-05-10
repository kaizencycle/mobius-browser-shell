import React, { useState, useCallback, useRef, useEffect } from 'react';

interface OAALearnToEarnProps {
  onNavigateToKnowledgeGraph?: () => void;
}

type Screen = 'path' | 'lesson' | 'results' | 'kg';

interface Question {
  n: number;
  diff: 1 | 2 | 3;
  label: string;
  q: string;
  opts: string[];
  ans: number;
  explain: string;
  hint: string;
}

const QUESTIONS: Question[] = [
  {
    n: 1, diff: 1, label: 'EASY',
    q: 'A fair six-sided die is rolled. What is the probability of rolling an even number?',
    opts: ['1/6', '1/3', '1/2', '2/3'],
    ans: 2,
    explain: 'There are 3 even outcomes (2, 4, 6) out of 6 equally-likely outcomes — so P = 3/6 = 1/2.',
    hint: 'Count the favorable outcomes (even faces) and divide by the total — six faces, equally likely.',
  },
  {
    n: 2, diff: 2, label: 'MEDIUM',
    q: 'Two events A and B are independent if and only if…',
    opts: ['P(A and B) = P(A) + P(B)', 'P(A | B) = P(A)', 'P(A) + P(B) = 1', 'P(A and B) = 0'],
    ans: 1,
    explain: 'Independence means the occurrence of B gives you no new information about A — formally P(A|B) = P(A), equivalent to P(A∩B) = P(A)·P(B).',
    hint: '"B happening tells you nothing new about A." Which line states that?',
  },
  {
    n: 3, diff: 2, label: 'MEDIUM',
    q: 'You roll two fair dice. What is the probability that the sum is 7?',
    opts: ['1/12', '1/9', '1/6', '1/4'],
    ans: 2,
    explain: 'There are 6 ways to make 7 — (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) — out of 36 equally-likely outcomes. 6/36 = 1/6.',
    hint: 'There are 36 equally-likely outcomes. How many of them sum to seven?',
  },
  {
    n: 4, diff: 3, label: 'HARD',
    q: 'P(A) = 0.4 and P(B | A) = 0.5. What is P(A and B)?',
    opts: ['0.10', '0.20', '0.45', '0.90'],
    ans: 1,
    explain: 'By the multiplication rule: P(A∩B) = P(A) · P(B|A) = 0.4 · 0.5 = 0.20.',
    hint: 'P(A∩B) = P(A) · P(B|A). Plug the two numbers in.',
  },
  {
    n: 5, diff: 3, label: 'HARD',
    q: 'A test for a rare disease has 99% sensitivity and 99% specificity. The disease prevalence is 1%. A patient tests positive. What is the probability they actually have the disease?',
    opts: ['~1%', '~50%', '~90%', '~99%'],
    ans: 1,
    explain: "Bayes: of every 10,000 people, 100 have the disease (99 test positive). 9,900 don't (99 false positives). 99 / (99+99) ≈ 50%. Counterintuitive — but the math is exact.",
    hint: 'Even with 99% accuracy, false positives swamp the result when the base rate is tiny. Try Bayes with concrete numbers.',
  },
];

const BALANCE_START = 142.50;

interface MicGhost {
  id: number;
  text: string;
  x: number;
  y: number;
}

export const OAALearnToEarn: React.FC<OAALearnToEarnProps> = ({ onNavigateToKnowledgeGraph }) => {
  const [screen, setScreen] = useState<Screen>('path');
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [earned, setEarned] = useState(0);
  const [locked, setLocked] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [coachExpanded, setCoachExpanded] = useState(false);
  const [coachHint, setCoachHint] = useState('');
  const [balance, setBalance] = useState(BALANCE_START);
  const [ghosts, setGhosts] = useState<MicGhost[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const qcardRef = useRef<HTMLDivElement>(null);
  const ghostIdRef = useRef(0);
  const balanceRef = useRef(BALANCE_START);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (screen !== 'path') goToPath();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen]);

  const goToPath = useCallback(() => {
    setScreen('path');
    setQi(0);
    setScore(0);
    setEarned(0);
    setBalance(BALANCE_START);
    balanceRef.current = BALANCE_START;
    setLocked(false);
    setChosen(null);
    setCoachExpanded(false);
    setCoachHint('');
    setGhosts([]);
  }, []);

  const startLesson = useCallback(() => {
    setQi(0);
    setScore(0);
    setEarned(0);
    setBalance(BALANCE_START);
    balanceRef.current = BALANCE_START;
    setLocked(false);
    setChosen(null);
    setCoachExpanded(false);
    setCoachHint('');
    setGhosts([]);
    setScreen('lesson');
  }, []);

  const flyMic = useCallback((text: string) => {
    if (!qcardRef.current) return;
    const rect = qcardRef.current.getBoundingClientRect();
    const id = ++ghostIdRef.current;
    setGhosts(g => [...g, { id, text, x: rect.right - 120, y: rect.top + 60 }]);
    setTimeout(() => setGhosts(g => g.filter(x => x.id !== id)), 1500);
  }, []);

  const animateBalance = useCallback((newEarned: number) => {
    const target = BALANCE_START + newEarned;
    const start = balanceRef.current;
    const dur = 700;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const v = start + (target - start) * (1 - Math.pow(1 - k, 3));
      balanceRef.current = v;
      setBalance(parseFloat(v.toFixed(2)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  const handleAnswer = useCallback((i: number) => {
    if (locked) return;
    setLocked(true);
    setChosen(i);
    const Q = QUESTIONS[qi];
    if (i === Q.ans) {
      const newEarned = earned + 0.5;
      setScore(s => s + 1);
      setEarned(newEarned);
      flyMic('+0.50 MIC');
      animateBalance(newEarned);
    } else {
      setCoachExpanded(true);
      setCoachHint(Q.hint);
    }
  }, [locked, qi, earned, flyMic, animateBalance]);

  const handleNext = useCallback(() => {
    if (qi < 4) {
      setQi(q => q + 1);
      setLocked(false);
      setChosen(null);
    } else {
      setFinalScore(score + (chosen === QUESTIONS[qi].ans ? 1 : 0));
      setScreen('results');
    }
  }, [qi, score, chosen]);

  const Q = QUESTIONS[qi];
  const sessionAcc = locked ? `${score + (chosen === Q.ans ? 1 : 0)}/${qi + 1} · ${Math.round((score + (chosen === Q.ans ? 1 : 0)) / (qi + 1) * 100)}%` : '—';

  return (
    <div className="oaa-root">
      {/* MIC ghosts */}
      {ghosts.map(g => (
        <div key={g.id} className="oaa-mic-ghost" style={{ left: g.x, top: g.y }}>
          {g.text}<small>+ rises to balance</small>
        </div>
      ))}

      {/* ── SCREEN 1: TODAY'S PATH ── */}
      {screen === 'path' && (
        <div className="oaa-screen oaa-screen--path">
          <div className="oaa-path-wrap">
            <div className="oaa-greeting">
              <h1 className="oaa-greeting__h1 oaa-serif">
                Welcome back, Kai. <em>Three things on the path today.</em>
              </h1>
              <div className="oaa-greeting__when oaa-mono">
                Mon, 9 May<b>9:14 am</b>
              </div>
            </div>

            <div className="oaa-streak">
              <div className="oaa-streak__L">
                <span className="oaa-streak__flame">🔥</span>
                <div>
                  <b>12-day streak</b>
                  <p>Miss today and you reset to zero — protect the bonus before noon.</p>
                </div>
              </div>
              <div className="oaa-streak__R">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="oaa-pip" />
                ))}
                <div className="oaa-pip oaa-pip--future" title="today" />
                <div className="oaa-pip oaa-pip--future" title="tomorrow" />
              </div>
            </div>

            <div className="oaa-section-label">
              <h2 className="oaa-serif">Today's Path</h2>
              <div className="oaa-section-label__why oaa-mono">ranked by streak risk · MIC ceiling · time-fit</div>
            </div>

            <div className="oaa-path-list">
              {/* Primary card */}
              <button className="oaa-path-card oaa-path-card--primary" onClick={startLesson}>
                <span className="oaa-applies oaa-mono">REC 01 · 04</span>
                <div className="oaa-path-card__reason">
                  <div className="oaa-path-card__dot">🔥</div>
                  <div className="oaa-path-card__why-tag oaa-mono">Streak<br />at risk</div>
                </div>
                <div className="oaa-path-card__body">
                  <h3 className="oaa-serif">Probability — Independence &amp; Conditional</h3>
                  <p className="oaa-path-card__sub">Five short questions. Picks up where you stopped Friday — 60% through the module.</p>
                  <div className="oaa-payoff">
                    <span className="oaa-payoff-chip oaa-payoff-chip--time oaa-mono">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                      ~9 min
                    </span>
                    <span className="oaa-payoff-chip oaa-payoff-chip--mic oaa-mono">MIC <span>+4.5</span></span>
                    <span className="oaa-payoff-chip oaa-payoff-chip--streak oaa-mono">+1 streak day</span>
                    <span className="oaa-payoff-chip oaa-mono">JADE: 2 weak nodes here</span>
                  </div>
                </div>
                <div className="oaa-path-card__go oaa-mono">
                  START
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </div>
              </button>

              {/* Secondary cards */}
              <div className="oaa-path-card">
                <div className="oaa-path-card__reason">
                  <div className="oaa-path-card__dot oaa-path-card__dot--muted">📈</div>
                  <div className="oaa-path-card__why-tag oaa-mono">Build on<br />last week</div>
                </div>
                <div className="oaa-path-card__body">
                  <h3 className="oaa-serif">Linear Algebra — Eigenvalues, part 2</h3>
                  <p className="oaa-path-card__sub">Continues Thursday's matrix decomposition. Higher MIC ceiling because the difficulty is up.</p>
                  <div className="oaa-payoff">
                    <span className="oaa-payoff-chip oaa-payoff-chip--time oaa-mono">~14 min</span>
                    <span className="oaa-payoff-chip oaa-payoff-chip--mic oaa-mono">MIC <span>+6.0</span></span>
                    <span className="oaa-payoff-chip oaa-payoff-chip--streak oaa-mono">+1 streak day</span>
                  </div>
                </div>
                <div className="oaa-path-card__go oaa-mono">
                  Open
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </div>
              </div>

              <div className="oaa-path-card">
                <div className="oaa-path-card__reason">
                  <div className="oaa-path-card__dot oaa-path-card__dot--muted">✨</div>
                  <div className="oaa-path-card__why-tag oaa-mono">New<br />territory</div>
                </div>
                <div className="oaa-path-card__body">
                  <h3 className="oaa-serif">Stats Inference — Hypothesis Testing</h3>
                  <p className="oaa-path-card__sub">JADE flagged this as a knowledge gap from your last three reflections.</p>
                  <div className="oaa-payoff">
                    <span className="oaa-payoff-chip oaa-payoff-chip--time oaa-mono">~18 min</span>
                    <span className="oaa-payoff-chip oaa-payoff-chip--mic oaa-mono">MIC <span>+7.5</span></span>
                    <span className="oaa-payoff-chip oaa-payoff-chip--streak oaa-mono">+1 streak day</span>
                    <span className="oaa-payoff-chip oaa-mono">opens 3 KG nodes</span>
                  </div>
                </div>
                <div className="oaa-path-card__go oaa-mono">
                  Open
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>

            <div className="oaa-library">
              <div className="oaa-section-label">
                <h2 className="oaa-serif">Library <span className="oaa-mono" style={{ fontSize: 10.5, color: 'var(--oaa-mute)', fontWeight: 500, marginLeft: 8, letterSpacing: '0.06em' }}>— 247 modules</span></h2>
                <div className="oaa-section-label__why oaa-mono">browse if Today's Path doesn't fit your mood</div>
              </div>
              <div className="oaa-lib-grid">
                <div className="oaa-lib-card">
                  <h4 className="oaa-serif">Calculus · Limits</h4>
                  <div className="oaa-mono oaa-lib-card__meta">BEGINNER · 3.0 MIC</div>
                  <div className="oaa-lib-card__pgr"><i style={{ width: '100%' }} /></div>
                </div>
                <div className="oaa-lib-card">
                  <h4 className="oaa-serif">Number Theory · Modular Arithmetic</h4>
                  <div className="oaa-mono oaa-lib-card__meta">INTERMEDIATE · 5.0 MIC</div>
                  <div className="oaa-lib-card__pgr"><i style={{ width: '42%' }} /></div>
                </div>
                <div className="oaa-lib-card">
                  <h4 className="oaa-serif">Topology · Open Sets</h4>
                  <div className="oaa-mono oaa-lib-card__meta">ADVANCED · 7.5 MIC</div>
                  <div className="oaa-lib-card__pgr"><i style={{ width: '0%' }} /></div>
                </div>
              </div>
            </div>

            <div className="oaa-demo-foot oaa-mono">end-to-end demo · 4 screens · esc to return</div>
          </div>
        </div>
      )}

      {/* ── SCREEN 2: IN LESSON ── */}
      {screen === 'lesson' && (
        <div className="oaa-screen oaa-screen--lesson">
          <div className="oaa-lesson-wrap">
            <div className="oaa-lesson-main">
              <div className="oaa-lesson-bar">
                <div className="oaa-lesson-bar__L">
                  <h2 className="oaa-serif">
                    Probability — Independence &amp; Conditional
                    <small className="oaa-mono">MODULE 14 · INTERMEDIATE</small>
                  </h2>
                </div>
                <div className="oaa-lesson-bar__R">
                  <div className="oaa-progress-dots">
                    {QUESTIONS.map((_, i) => (
                      <div
                        key={i}
                        className={[
                          'oaa-pdot',
                          i < qi ? 'oaa-pdot--done' : '',
                          i === qi ? 'oaa-pdot--now' : '',
                        ].filter(Boolean).join(' ')}
                      />
                    ))}
                  </div>
                  <div className="oaa-ceiling oaa-mono">
                    <span>could earn</span>
                    <span className="oaa-ceiling__v oaa-serif">
                      +{(4.5).toFixed(2)}<small className="oaa-mono">MIC</small>
                    </span>
                  </div>
                </div>
              </div>

              <div className="oaa-question-card" ref={qcardRef}>
                <div className="oaa-qheader">
                  <div className="oaa-qnum oaa-mono">QUESTION 0{Q.n} · 05</div>
                  <div className="oaa-difficulty oaa-mono">
                    <span>difficulty</span>
                    <div className="oaa-diff-bars">
                      {[1, 2, 3].map(d => (
                        <span key={d} className={d <= Q.diff ? 'oaa-diff-bar--on' : ''} />
                      ))}
                    </div>
                    <span>{Q.label}</span>
                  </div>
                </div>

                <div className="oaa-question oaa-serif">{Q.q}</div>

                <div className="oaa-options">
                  {Q.opts.map((opt, i) => {
                    const key = ['A', 'B', 'C', 'D'][i];
                    let cls = 'oaa-opt';
                    if (locked && chosen !== null) {
                      if (i === Q.ans) cls += ' oaa-opt--correct';
                      else if (i === chosen) cls += ' oaa-opt--wrong';
                      else cls += ' oaa-opt--dim';
                    }
                    return (
                      <button
                        key={i}
                        className={cls}
                        onClick={() => handleAnswer(i)}
                        disabled={locked}
                      >
                        <span className="oaa-opt__key oaa-mono">{key}</span>
                        <span className="oaa-opt__text oaa-serif">{opt}</span>
                        <svg className="oaa-opt__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      </button>
                    );
                  })}
                </div>

                {locked && chosen !== null && (
                  <div className={`oaa-explain ${chosen !== Q.ans ? 'oaa-explain--wrong' : ''}`}>
                    <div className="oaa-mono oaa-explain__label">{chosen === Q.ans ? 'CORRECT' : 'NOT QUITE'}</div>
                    {Q.explain}
                  </div>
                )}

                {locked && (
                  <button className="oaa-next-btn oaa-mono" onClick={handleNext}>
                    {qi < 4 ? 'Next question' : 'See your reward'}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ATLAS coach rail */}
            <aside className="oaa-coach">
              <div className="oaa-coach__head">
                <div className="oaa-coach__mark oaa-serif">A</div>
                <div className="oaa-coach__name">
                  <b className="oaa-serif">ATLAS</b>
                  <small className="oaa-mono">coach · whisper mode</small>
                </div>
                <span className="oaa-coach__pip" />
              </div>
              <div className={`oaa-whisper ${coachExpanded ? 'oaa-whisper--expanded' : ''}`}>
                {coachExpanded && coachHint ? (
                  <>
                    <b style={{ fontStyle: 'normal', display: 'block', marginBottom: 4, color: '#92400e' }}>A hint, just for you:</b>
                    {coachHint}
                  </>
                ) : coachExpanded ? (
                  <>
                    <b style={{ fontStyle: 'normal', display: 'block', marginBottom: 4, color: '#92400e' }}>From the rail:</b>
                    I see Bayes' Theorem coming up — it's the idea that new evidence updates a prior belief. Hold that frame as you read question 4.
                  </>
                ) : (
                  "I'm watching quietly. I'll only speak if you stumble — or if you ask."
                )}
              </div>
              <button
                className="oaa-coach__toggle oaa-mono"
                onClick={() => { setCoachExpanded(e => !e); if (coachExpanded) setCoachHint(''); }}
              >
                {coachExpanded ? 'collapse' : 'expand'}
              </button>
              <div className="oaa-coach__stats oaa-mono">
                <div>STREAK<span className="oaa-serif oaa-coach__stat-val">12 days</span></div>
                <div>EARNED TODAY<span className="oaa-serif oaa-coach__stat-val">{earned.toFixed(2)} MIC</span></div>
                <div>SESSION ACC<span className="oaa-serif oaa-coach__stat-val">{sessionAcc}</span></div>
                <div>RAIL UNLOCKS<span className="oaa-serif oaa-coach__stat-val">at 2 misses</span></div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ── SCREEN 3: RESULTS ── */}
      {screen === 'results' && (
        <div className="oaa-screen oaa-screen--results">
          <div className="oaa-results-wrap">
            <div className="oaa-mono oaa-results-eyebrow">module complete</div>
            <h1 className="oaa-serif">You finished the path. <em>Cleanly.</em></h1>
            <p className="oaa-results-sub">Probability — Independence &amp; Conditional · 9 minutes 14 seconds</p>

            <div className="oaa-reward-stack">
              <div className="oaa-reward-total">
                <div className="oaa-reward-total__L">
                  <div className="oaa-mono oaa-reward-total__label">total earned</div>
                  <div className="oaa-serif oaa-reward-total__v">
                    +{earned.toFixed(2)}<small className="oaa-mono">MIC</small>
                  </div>
                </div>
                <div className="oaa-reward-total__R">
                  <div className="oaa-serif oaa-reward-total__acc">
                    {finalScore}/5<small> · {Math.round(finalScore / 5 * 100)}%</small>
                  </div>
                  <div className="oaa-mono oaa-reward-total__acc-lbl">accuracy</div>
                </div>
              </div>
              <div className="oaa-breakdown">
                <div className="oaa-br-row">
                  <div className="oaa-br-ico">◎</div>
                  <div className="oaa-br-lbl"><b>Base reward</b>3 MIC for completing an intermediate module</div>
                  <div className="oaa-mono oaa-br-v">+3.00</div>
                </div>
                <div className="oaa-br-row oaa-br-row--bonus">
                  <div className="oaa-br-ico">🔥</div>
                  <div className="oaa-br-lbl"><b>Streak bonus</b>Day 13 — 17% multiplier on base</div>
                  <div className="oaa-mono oaa-br-v">+0.50</div>
                </div>
                <div className="oaa-br-row oaa-br-row--perfect">
                  <div className="oaa-br-ico">✦</div>
                  <div className="oaa-br-lbl"><b>Perfect bonus</b>Awarded when accuracy = 100%</div>
                  <div className="oaa-mono oaa-br-v">+1.00</div>
                </div>
              </div>
            </div>

            <div className="oaa-levelup">
              <div className="oaa-levelup__L">
                <div className="oaa-serif oaa-levelup__badge">14</div>
                <div>
                  <b className="oaa-serif">You're now Level 14.</b>
                  <p>147 MIC earned · 6 modules to Level 15.</p>
                </div>
              </div>
              <div className="oaa-mono oaa-levelup__arrow">+1 LEVEL →</div>
            </div>

            <div className="oaa-results-actions">
              <button className="oaa-btn oaa-mono" onClick={startLesson}>Take another lesson</button>
              <button className="oaa-btn oaa-btn--primary oaa-mono" onClick={() => setScreen('kg')}>
                See knowledge graph receipt
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SCREEN 4: KG RECEIPT ── */}
      {screen === 'kg' && (
        <div className="oaa-screen oaa-screen--kg">
          <div className="oaa-kg-wrap">
            <div className="oaa-mono oaa-kg-eyebrow">knowledge graph · receipt</div>
            <h1 className="oaa-serif">You touched 4 nodes. <em>Two are new.</em></h1>
            <p className="oaa-kg-sub">Every lesson rewires a small piece of your graph. Here's exactly what changed in the last nine minutes — and where it sits in ATLAS.</p>

            <div className="oaa-kg-card">
              <div className="oaa-kg-canvas">
                <svg viewBox="0 0 800 280" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  <line x1="180" y1="80" x2="380" y2="160" stroke="rgba(253,224,71,.45)" strokeWidth="1.5" fill="none"/>
                  <line x1="380" y1="160" x2="600" y2="80" stroke="rgba(16,185,129,.7)" strokeWidth="1.5" fill="none" strokeDasharray="3 3" className="oaa-kg-link--new"/>
                  <line x1="380" y1="160" x2="280" y2="230" stroke="rgba(253,224,71,.45)" strokeWidth="1.5" fill="none"/>
                  <line x1="380" y1="160" x2="540" y2="220" stroke="rgba(16,185,129,.7)" strokeWidth="1.5" fill="none" strokeDasharray="3 3" className="oaa-kg-link--new"/>
                  <line x1="600" y1="80" x2="540" y2="220" stroke="rgba(253,224,71,.45)" strokeWidth="1.5" fill="none"/>
                </svg>
                <div className="oaa-kg-node" style={{ left: '22%', top: '28%' }}>
                  <div className="oaa-kg-node__dot" /><div className="oaa-kg-node__label oaa-mono">Conditional Probability</div>
                </div>
                <div className="oaa-kg-node" style={{ left: '48%', top: '57%' }}>
                  <div className="oaa-kg-node__dot" /><div className="oaa-kg-node__label oaa-mono">Independence</div>
                </div>
                <div className="oaa-kg-node oaa-kg-node--new oaa-kg-node--square" style={{ left: '75%', top: '28%' }}>
                  <div className="oaa-kg-node__dot" /><div className="oaa-kg-node__label oaa-mono">Bayes' Theorem · NEW</div>
                </div>
                <div className="oaa-kg-node" style={{ left: '35%', top: '82%' }}>
                  <div className="oaa-kg-node__dot" /><div className="oaa-kg-node__label oaa-mono">Sample Space</div>
                </div>
                <div className="oaa-kg-node oaa-kg-node--new oaa-kg-node--diamond" style={{ left: '67%', top: '78%' }}>
                  <div className="oaa-kg-node__dot" /><div className="oaa-kg-node__label oaa-mono">Master probability · INTENT</div>
                </div>
              </div>

              <div className="oaa-kg-list">
                <h3 className="oaa-serif">
                  Strengthened &amp; created
                  <span className="oaa-mono oaa-kg-list__count">4 nodes · 2 new edges</span>
                </h3>

                {[
                  { shape: 'concept', name: 'Conditional Probability', type: 'CONCEPT · LEARNING', desc: 'Already a strong node — touched 7 times before. Reinforced today.', delta: '+1', pct: 80 },
                  { shape: 'concept', name: 'Independence', type: 'CONCEPT · LEARNING', desc: "Strengthened by question 3 — the dice example tied this directly to Conditional.", delta: '+2', pct: 55 },
                  { shape: 'artifact', name: "Bayes' Theorem", type: 'ARTIFACT · LEARNING', desc: "Question 4's setup is the canonical Bayes example. First mention in your graph.", delta: '+1', pct: 18, isNew: true },
                  { shape: 'intent', name: 'Master Probability', type: 'INTENT · 90d', desc: 'Goal you set on Apr 12 — now 38% along. Six lessons to target.', delta: '+5%', pct: 38 },
                ].map((row, i) => (
                  <div key={i} className="oaa-kg-row">
                    <div className={`oaa-kg-shape oaa-kg-shape--${row.shape}`}><div className="oaa-kg-shape__s" /></div>
                    <div className="oaa-kg-row__nm">
                      <span className="oaa-serif">{row.name}</span>
                      <span className="oaa-mono oaa-kg-row__type">{row.type}</span>
                      {row.isNew && <span className="oaa-mono oaa-kg-row__new-tag">NEW</span>}
                      <p>{row.desc}</p>
                    </div>
                    <div className="oaa-mono oaa-kg-row__delta">
                      {row.delta}
                      <div className="oaa-kg-row__bar"><i style={{ width: `${row.pct}%` }} /></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="oaa-kg-actions">
                <div className="oaa-mono oaa-kg-actions__meta">
                  JADE proposes you cluster <b>Bayes</b> with <b>Conditional</b> next session.
                </div>
                <div className="oaa-kg-actions__right">
                  <button className="oaa-btn oaa-mono" onClick={goToPath}>Back to today's path</button>
                  {onNavigateToKnowledgeGraph ? (
                    <button className="oaa-btn oaa-btn--primary oaa-mono" onClick={onNavigateToKnowledgeGraph}>
                      Open in ATLAS
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                    </button>
                  ) : (
                    <button className="oaa-btn oaa-btn--primary oaa-mono" disabled>
                      Open in ATLAS
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="oaa-mono oaa-demo-foot">demo loop · esc returns to today's path</div>
          </div>
        </div>
      )}

      {/* MIC balance chip — always visible during lesson */}
      {screen === 'lesson' && (
        <div className="oaa-balance-chip oaa-mono">
          MIC <span className="oaa-serif">{balance.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};
