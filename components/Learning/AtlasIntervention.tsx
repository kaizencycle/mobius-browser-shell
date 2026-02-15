import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════
// ATLAS Intervention System
// Reassurance loop for incorrect quiz answers
// "Not wrong — looking at the wrong layer."
// ═══════════════════════════════════════════════════════════

// ─── Types ───

export interface AtlasIntervention {
  reframe: string;      // What the user was actually thinking
  insight: string;      // The systems concept they missed
  nudge: string;        // Direction toward correct thinking
}

export interface AtlasResponse {
  questionId: string;
  selectedAnswer: number;
  intervention: AtlasIntervention;
}

// ─── ATLAS Response Database ───
// Keyed by moduleId → questionIndex → selectedWrongAnswer
// Every response follows the pattern: validate thinking → redirect → teach systems concept

const ATLAS_RESPONSES: Record<string, Record<number, Record<number, AtlasIntervention>>> = {

  // ═══ Constitutional AI Fundamentals ═══
  "constitutional-ai-101": {
    0: {
      // "What is the primary purpose of Constitutional AI?"
      // Correct: 1 ("To constrain AI behavior with explicit principles and values")
      0: {
        reframe: "You're thinking about performance. That matters, but it's a different layer.",
        insight: "Constitutional constraints don't optimize — they bound. A fast system without boundaries is just a fast way to drift.",
        nudge: "Think about what keeps a powerful system aligned, not what makes it powerful.",
      },
      2: {
        reframe: "Cost reduction is an engineering concern. You're thinking like an operator.",
        insight: "Constraints often add computational cost, not reduce it. The value isn't efficiency — it's predictability under pressure.",
        nudge: "What's more expensive: slightly slower inference, or a system that violates its own stated values?",
      },
      3: {
        reframe: "You're thinking about autonomy. That's the fear, but constraints don't replace humans — they encode human judgment into structure.",
        insight: "The goal isn't removing oversight. It's making oversight survive at scale, even when no human is watching.",
        nudge: "Constraints are crystallized oversight. They work when humans can't be in the loop.",
      },
    },
    1: {
      // "Which of the Three Covenants emphasizes long-term responsibility over short-term gains?"
      // Correct: 2 ("Custodianship")
      0: {
        reframe: "Integrity is foundational, but it's about honesty and consistency — not specifically the long view.",
        insight: "Integrity asks 'are we being truthful right now?' Custodianship asks 'will our choices still be responsible in 50 years?'",
        nudge: "Think about which covenant specifically carries the weight of future generations.",
      },
      1: {
        reframe: "Ecology is about systemic thinking and regeneration. Close — but it's not the one that speaks to generational responsibility.",
        insight: "Ecology ensures the system is regenerative. Custodianship ensures the humans running the system are thinking beyond their own tenure.",
        nudge: "Custodians don't own the system. They hold it in trust for those who come after.",
      },
      3: {
        reframe: "You're thinking all three work together, and they do. But the question asks about the specific emphasis on long-term responsibility.",
        insight: "Each covenant has a distinct focus. 'All of the above' is often a safe answer, but precision matters in systems thinking.",
        nudge: "Which single covenant would you invoke when someone argues for a short-term gain at long-term cost?",
      },
    },
    2: {
      // "How does Constitutional AI differ from traditional AI alignment approaches?"
      // Correct: 1 ("It embeds constraints at the reasoning substrate level")
      0: {
        reframe: "More training data is a scale answer. Constitutional AI is a structural answer.",
        insight: "You can train on enormous datasets and still have an unaligned system. The architecture of constraint matters more than the volume of data.",
        nudge: "What if alignment isn't about what the model saw, but about how it was built to reason?",
      },
      2: {
        reframe: "Less compute is an efficiency claim. Constitutional AI doesn't promise efficiency — it promises alignment.",
        insight: "Embedding constraints at the substrate level may actually require more compute, not less. The cost is worth it when the alternative is drift.",
        nudge: "Alignment is not an optimization problem. It's a structural one.",
      },
      3: {
        reframe: "Working without human oversight is the opposite of what Constitutional AI aims for.",
        insight: "Constitutional AI encodes human values into the system's reasoning. It doesn't eliminate oversight — it makes oversight structural rather than procedural.",
        nudge: "The best systems don't escape human judgment. They internalize it.",
      },
    },
    3: {
      // "In the Mobius framework, what does 'integrity drift' refer to?"
      // Correct: 1 ("The gradual divergence between stated values and actual system behavior")
      0: {
        reframe: "Hardware degradation is real, but that's physical entropy. You're thinking at the right level — wrong domain.",
        insight: "Integrity drift is behavioral entropy: the gap between what a system says it values and what it actually does widens over time.",
        nudge: "Think about promises that decay, not circuits.",
      },
      2: {
        reframe: "Latency is a symptom you can measure. Drift is harder — it's the thing that changes so slowly you don't notice until it's structural.",
        insight: "Systems don't suddenly become misaligned. They drift one small compromise at a time. Each compromise is rational. The aggregate is catastrophic.",
        nudge: "What if the problem isn't speed, but gradual betrayal of original intent?",
      },
      3: {
        reframe: "UI changes are visible. Drift is specifically the stuff that changes without anyone noticing.",
        insight: "The most dangerous drift is invisible: stated values stay the same while actual behavior quietly diverges.",
        nudge: "If the website still says 'we value privacy' but the data pipeline doesn't — that's drift.",
      },
    },
  },

  // ═══ Integrity Economics & MIC ═══
  "integrity-economics": {
    0: {
      // "What backs the value of MIC (Mobius Integrity Credits)?"
      // Correct: 1 ("System integrity and trust metrics")
      0: {
        reframe: "You're thinking about traditional reserve currencies. MIC is designed to break that pattern.",
        insight: "Gold-backed currency ties value to a scarce physical resource. MIC ties value to a measurable system property — integrity. One is extractive, the other is generative.",
        nudge: "What if value came from demonstrated trustworthiness, not from digging something out of the ground?",
      },
      2: {
        reframe: "Government backing is the traditional answer. You're thinking about trust through authority.",
        insight: "Government-backed currency works because institutions enforce it. MIC works because the contribution is verifiable. Different trust model entirely.",
        nudge: "Authority says 'trust us.' Verification says 'check for yourself.'",
      },
      3: {
        reframe: "Computing power as a value base is the proof-of-work model. You're thinking about Bitcoin's approach.",
        insight: "Proof-of-work ties value to energy spent. MIC ties value to integrity maintained. One rewards burning resources, the other rewards building trust.",
        nudge: "What if the work that backs value is alignment work, not computational work?",
      },
    },
    1: {
      // "What happens when Global Integrity Index (GII) falls below circuit breaker thresholds?"
      // Correct: 0 ("MIC minting stops temporarily")
      1: {
        reframe: "Complete shutdown is a sledgehammer. Circuit breakers are surgical.",
        insight: "A good circuit breaker doesn't freeze everything — it halts the specific mechanism that's degrading integrity. The system continues. Minting pauses.",
        nudge: "Think about stock market circuit breakers. Trading halts, but the market doesn't disappear.",
      },
      2: {
        reframe: "Increasing value during crisis is the opposite of what integrity requires. That's how you get perverse incentives.",
        insight: "Systems that reward more during instability attract extractors, not stabilizers. Circuit breakers do the opposite: they reduce incentives when the system is fragile.",
        nudge: "Would you want a fire sale during a fire?",
      },
      3: {
        reframe: "Doing nothing is the default of systems without circuit breakers. That's the problem, not the solution.",
        insight: "Circuit breakers exist because 'nothing changes' during integrity drops is exactly how cascading failures happen. The intervention is the point.",
        nudge: "If the smoke alarm goes off and nothing happens, what's the alarm for?",
      },
    },
    2: {
      // "How does Time Security relate to integrity economics?"
      // Correct: 1 ("It quantifies temporal stability of integrity commitments")
      0: {
        reframe: "Uptime is an infrastructure metric. Time Security is a trust metric.",
        insight: "How long a system has been running says nothing about whether it's been trustworthy. Time Security measures consistency of integrity over time — not just existence over time.",
        nudge: "A system running for 10 years that drifted every year has high uptime and low Time Security.",
      },
      2: {
        reframe: "Login tracking is user analytics. Time Security operates at a system integrity level, not a user behavior level.",
        insight: "Time Security quantifies whether the system's integrity commitments have remained stable across time. It's about the system's fidelity to its own promises.",
        nudge: "Think about a constitution that hasn't been violated in 50 years vs. one that's amended whenever convenient.",
      },
      3: {
        reframe: "Maintenance scheduling is operations. Time Security is about the temporal dimension of trust itself.",
        insight: "Time Security answers: if this system promised integrity yesterday, can I trust that the promise still holds today? That's a fundamentally different question than 'when is the next update?'",
        nudge: "Maintenance keeps things running. Time Security tells you if what's running is still trustworthy.",
      },
    },
    3: {
      // "What distinguishes 'negentropic economics'?"
      // Correct: 1 ("It rewards actions that increase system order and coherence rather than extraction")
      0: {
        reframe: "Blockchain is an implementation, not a philosophy. You're thinking about the tool, not the principle.",
        insight: "You can build extractive economics on blockchain just as easily as negentropic economics. The technology is neutral. The incentive design is what matters.",
        nudge: "What changes if you reward order-creation instead of value-extraction?",
      },
      2: {
        reframe: "Eliminating markets throws out a useful coordination mechanism. Negentropic economics doesn't reject markets — it redirects them.",
        insight: "Markets are information systems. The question isn't whether to have them, but what they optimize for. Current markets optimize for extraction. Negentropic markets optimize for coherence.",
        nudge: "What if the market rewarded making the system healthier, not just making yourself richer?",
      },
      3: {
        reframe: "Government control is one way to redirect incentives, but it centralizes the failure point.",
        insight: "Negentropic economics doesn't require a central authority. It requires that the reward function is aligned with system health. That's a design problem, not a governance problem.",
        nudge: "Decentralized systems can still have aligned incentives — if the architecture is right.",
      },
    },
  },

  // ═══ Drift Suppression Mechanisms ═══
  "drift-suppression": {
    0: {
      // "What is the 'Kaizen Turing Test'?"
      // Correct: 1 ("A continuous improvement metric for AI constitutional alignment")
      0: {
        reframe: "You're thinking about the original Turing Test — fooling humans. The Kaizen version inverts that idea entirely.",
        insight: "The classic Turing Test asks 'can AI seem human?' The Kaizen Turing Test asks 'is AI getting better at staying aligned?' The goal isn't deception — it's continuous integrity.",
        nudge: "What if the test never ends, and the system has to prove alignment every day, not just once?",
      },
      2: {
        reframe: "One-time certifications are snapshots. Drift happens between snapshots.",
        insight: "A system that passed a test six months ago may have drifted significantly since. Continuous measurement catches what certifications miss.",
        nudge: "Would you trust a pilot who passed their exam 20 years ago but never flew since?",
      },
      3: {
        reframe: "Hardware stress tests measure physical limits. The Kaizen Turing Test measures alignment health.",
        insight: "You can have a system with perfect hardware and terrible alignment. The constraints aren't physical — they're constitutional.",
        nudge: "The system isn't breaking down mechanically. It's drifting philosophically.",
      },
    },
    1: {
      // "How do Sentinel agents contribute to drift suppression?"
      // Correct: 1 ("They continuously verify constitutional alignment across system operations")
      0: {
        reframe: "Security breaches are one failure mode. Constitutional drift is broader and more insidious.",
        insight: "Sentinels don't just guard the perimeter — they verify that the system is living up to its own values. Security is one dimension. Alignment is the whole space.",
        nudge: "A system can be perfectly secure and completely misaligned. Sentinels check for both.",
      },
      2: {
        reframe: "Replacing human oversight is the fear. Sentinels augment oversight, not replace it.",
        insight: "Sentinels operate in the gaps where human attention can't scale. They don't eliminate human judgment — they extend it to places humans can't continuously monitor.",
        nudge: "Think of sentinels as human values running at machine scale, not machines replacing human values.",
      },
      3: {
        reframe: "Performance optimization is valuable, but it's engineering work, not governance work.",
        insight: "Sentinels are the constitutional immune system. They detect when the system is diverging from its stated principles — not when it's running slowly.",
        nudge: "A faster system that's misaligned is just a faster problem.",
      },
    },
    2: {
      // "What role does the Mobius Integrity Index (MII) play in drift detection?"
      // Correct: 1 ("It provides real-time health metrics for constitutional alignment")
      0: {
        reframe: "Financial performance is measured by traditional metrics. MII measures something money can't capture.",
        insight: "Profit doesn't tell you if a system is aligned. A company can be profitable and deeply extractive. MII measures whether the system is living its values.",
        nudge: "What metric would you trust to tell you if a system is still doing what it promised?",
      },
      2: {
        reframe: "User engagement is a product metric. MII operates at the constitutional level.",
        insight: "High engagement can coexist with integrity drift — addictive systems have great engagement metrics and terrible alignment. MII sees through the surface.",
        nudge: "What if engagement is high because the system is exploiting attention, not serving users?",
      },
      3: {
        reframe: "API request counting is infrastructure monitoring. MII monitors something deeper.",
        insight: "You can have a billion API requests per day and zero constitutional alignment. Volume tells you about load. MII tells you about integrity.",
        nudge: "Traffic metrics say 'how much.' Integrity metrics say 'how aligned.'",
      },
    },
    3: {
      // "Why is intent documentation (like EPICON) critical for drift prevention?"
      // Correct: 1 ("It creates an auditable record of WHY decisions were made")
      0: {
        reframe: "Regulatory compliance is a downstream benefit, not the core purpose. You're thinking about who demands it, not why it matters.",
        insight: "Documentation created for regulators is performative. Documentation created for future builders is structural. Same artifact, different intent.",
        nudge: "Who actually reads the documentation — the auditor, or the engineer at 2am six months later?",
      },
      2: {
        reframe: "Slowing down development isn't the goal — it's a side effect. And not always a bad one.",
        insight: "Speed without intent documentation is just creating technical debt with no map. You move fast, but nobody knows why you turned left.",
        nudge: "Think about what survives after the original developer leaves the team.",
      },
      3: {
        reframe: "Testing verifies behavior. Intent documentation explains reasoning. They answer different questions.",
        insight: "Tests tell you if the code works. Intent tells you if it should exist. You can pass every test and still be building the wrong thing.",
        nudge: "Tests ask 'does it work?' Intent asks 'should it?'",
      },
    },
  },

  // ═══ Multi-Agent Democratic Systems ═══
  "multi-agent-consensus": {
    0: {
      // "What is the primary function of ATLAS in the Mobius system?"
      // Correct: 1 ("Code review and technical oversight")
      0: {
        reframe: "UI design is important, but it's not what a technical sentinel focuses on.",
        insight: "ATLAS operates at the architectural level — reviewing code, verifying technical implementations, and ensuring engineering decisions align with constitutional principles.",
        nudge: "Think about what a senior architect does: not pixels, but patterns and integrity of the technical substrate.",
      },
      2: {
        reframe: "Financial auditing is a governance concern, but ATLAS is specifically the technical sentinel.",
        insight: "Each sentinel has a domain. ATLAS covers technical architecture. Financial integrity would fall to a different governance mechanism.",
        nudge: "Separation of concerns applies to sentinels too. What's ATLAS's specific domain?",
      },
      3: {
        reframe: "Marketing automation is about growth, not governance. ATLAS is a governance agent.",
        insight: "Sentinels exist to maintain integrity, not to grow the user base. The distinction between growth functions and governance functions is critical.",
        nudge: "Would you want your auditor also running your marketing? Conflicts of interest matter.",
      },
    },
    1: {
      // "How do multi-agent systems prevent single points of failure in governance?"
      // Correct: 1 ("Through consensus mechanisms requiring agreement from multiple agents")
      0: {
        reframe: "One agent making all decisions is the single point of failure you're trying to prevent.",
        insight: "Centralized decision-making is fast but fragile. If that one agent is compromised, captured, or drifts — everything goes with it.",
        nudge: "The US has three branches of government for a reason. What's the AI equivalent?",
      },
      2: {
        reframe: "Eliminating human oversight is the fear, not the goal. Multi-agent systems extend human oversight, not replace it.",
        insight: "Humans remain in the loop. Multiple agents just ensure that no single automated decision goes unchecked. Humans set the constitution; agents enforce it.",
        nudge: "The agents don't replace human judgment. They make human judgment operational at scale.",
      },
      3: {
        reframe: "Random decision-making solves nothing. Randomness is the absence of governance, not a form of it.",
        insight: "Consensus mechanisms are deterministic and principled. Every agent evaluates against constitutional criteria. There's nothing random about it.",
        nudge: "Would you want your legal system to flip coins? Governance requires structured reasoning.",
      },
    },
    2: {
      // "What is a DVA (Distributed Verification Architecture) flow?"
      // Correct: 1 ("A pattern for distributed verification of system integrity across agents")
      0: {
        reframe: "Data backup is about redundancy. DVA is about verification — fundamentally different goals.",
        insight: "Backup ensures data survives. Verification ensures data is trustworthy. You can back up corrupted data perfectly.",
        nudge: "What good is a perfect copy if the original was compromised?",
      },
      2: {
        reframe: "User authentication is one verification type. DVA operates at the system integrity level.",
        insight: "Authentication asks 'who are you?' DVA asks 'is this system operating with integrity?' The scope is entirely different.",
        nudge: "You can verify every user's identity and still have a system that's drifted from its constitutional principles.",
      },
      3: {
        reframe: "File transfer protocols move data between systems. DVA verifies that systems are constitutionally aligned.",
        insight: "DVA coordinates verification tasks across multiple sentinel agents, ensuring comprehensive integrity checking without central bottlenecks.",
        nudge: "It's not about moving data. It's about verifying that the system holding the data is still trustworthy.",
      },
    },
  },

  // ═══ The Three Covenants in Practice ═══
  "three-covenants": {
    0: {
      // "What does the Covenant of Integrity require?"
      // Correct: 1 ("Honest, transparent, and accountable operations")
      0: {
        reframe: "Profit maximization is a business objective, not a covenant. Covenants are about principles, not targets.",
        insight: "Integrity isn't opposed to profit, but it refuses to let profit override honesty. A profitable system that lies about what it does has zero integrity.",
        nudge: "Can you make money while being honest? Yes. Can you have integrity while being dishonest? Never.",
      },
      2: {
        reframe: "Keeping code secret is about competitive advantage. Integrity is about transparency and accountability.",
        insight: "Open source isn't required for integrity, but secrecy used to avoid accountability violates it. The question is: are you hiding from scrutiny?",
        nudge: "Transparency doesn't mean showing everyone your code. It means being honest about what your code does.",
      },
      3: {
        reframe: "Maximizing engagement 'at any cost' is the exact opposite of integrity. That phrase is the tell.",
        insight: "Integrity places bounds on behavior. 'At any cost' removes all bounds. These are fundamentally incompatible philosophies.",
        nudge: "Any time you see 'at any cost,' integrity has already been abandoned.",
      },
    },
    1: {
      // "How does the Covenant of Ecology inform system design?"
      // Correct: 1 ("By considering systemic impacts and regenerative patterns")
      0: {
        reframe: "Environmental sustainability is part of ecology, but the Covenant of Ecology is broader — it's about systemic thinking.",
        insight: "Ecological thinking applies to information systems, economic systems, and social systems — not just trees and rivers. Regeneration vs. extraction is universal.",
        nudge: "What if 'ecology' meant the health of every system, not just the natural one?",
      },
      2: {
        reframe: "Minimizing change is stagnation, not ecology. Ecological systems are constantly changing — regeneratively.",
        insight: "Healthy ecosystems are dynamic, not static. The goal isn't to freeze the system but to ensure its changes create more life, not less.",
        nudge: "A living forest changes constantly. A dead one doesn't change at all.",
      },
      3: {
        reframe: "Speed without ecological consideration is exactly how systems extract themselves to death.",
        insight: "Prioritizing speed over all else is the extractive pattern. Move fast and break things is the opposite of ecological design.",
        nudge: "What if you moved deliberately and healed things instead?",
      },
    },
    2: {
      // "What is the connection between Kintsugi philosophy and the Three Covenants?"
      // Correct: 2 ("Both honor repair and growth through challenges")
      0: {
        reframe: "There absolutely is a connection. Both philosophies address how systems handle imperfection.",
        insight: "Kintsugi repairs broken pottery with gold, making the repair visible and beautiful. The Covenants similarly treat challenges as opportunities for stronger integrity.",
        nudge: "What if a system's scars were its most trustworthy parts?",
      },
      1: {
        reframe: "Kintsugi is the opposite of hiding flaws. It highlights them with gold.",
        insight: "Both Kintsugi and the Covenants insist on transparency about breakage. Hiding flaws is how drift accelerates. Honoring repair is how integrity deepens.",
        nudge: "The gold in the crack isn't cosmetic. It's proof that repair happened honestly.",
      },
      3: {
        reframe: "Perfection is what Kintsugi explicitly rejects. Beauty comes from honest repair, not flawlessness.",
        insight: "The Covenants don't demand a perfect system. They demand an honest one — one that acknowledges its breaks and repairs them transparently.",
        nudge: "A system that claims perfection is lying. A system that shows its repairs is trustworthy.",
      },
    },
  },

  // ═══ Sentinel Architecture Deep Dive ═══
  "sentinel-architecture": {
    0: {
      // "What is AUREA's primary responsibility in the sentinel constellation?"
      // Correct: 1 ("Integrity custodianship and ethical oversight")
      0: {
        reframe: "Code review and deployment is ATLAS's domain. You're assigning the right function to the wrong sentinel.",
        insight: "Each sentinel has a distinct constitutional role. ATLAS handles technical architecture. AUREA handles integrity and ethics. Separation of concerns prevents capture.",
        nudge: "If one sentinel did everything, you'd have a single point of failure in governance.",
      },
      2: {
        reframe: "UI testing is quality assurance work, not constitutional governance. Sentinels operate at a higher abstraction.",
        insight: "AUREA doesn't verify if buttons work — it verifies if the system is living up to its ethical commitments. That's a fundamentally different kind of testing.",
        nudge: "A button can work perfectly while the system it controls violates every principle it claimed to hold.",
      },
      3: {
        reframe: "Database management is infrastructure. AUREA is a governance agent, not an operations tool.",
        insight: "Sentinels exist to maintain constitutional alignment. Infrastructure management is necessary but doesn't require ethical reasoning.",
        nudge: "You don't need a conscience to run a database. You need one to govern a system.",
      },
    },
    1: {
      // "How does ECHO contribute to temporal coherence?"
      // Correct: 2 ("By ensuring decisions remain consistent with historical commitments over time")
      0: {
        reframe: "Data backups preserve information. ECHO preserves consistency of commitments across time.",
        insight: "You can back up every decision perfectly and still have a system that contradicts its own past promises. Temporal coherence is about consistency of values, not data.",
        nudge: "What's more valuable: a record of what you said, or proof that you still mean it?",
      },
      1: {
        reframe: "Clock synchronization is a distributed systems problem. ECHO solves a philosophical one.",
        insight: "NTP keeps clocks aligned. ECHO keeps promises aligned across time. One is mechanical synchronization. The other is value consistency.",
        nudge: "It's not about what time it is. It's about whether today's decisions honor yesterday's commitments.",
      },
      3: {
        reframe: "Speed is a performance metric. ECHO is about temporal integrity, not temporal performance.",
        insight: "A fast system that contradicts its own past promises has speed but no coherence. ECHO ensures the system's history is a story of consistency.",
        nudge: "Responding faster doesn't help if the response contradicts what you said last year.",
      },
    },
    2: {
      // "Why does the sentinel system use multiple agents instead of one omniscient overseer?"
      // Correct: 1 ("Separation of concerns prevents any single point of constitutional capture")
      0: {
        reframe: "Cost efficiency is an operational concern. Constitutional architecture is about integrity, not budgets.",
        insight: "Even if one agent were cheaper, the risk of single-point capture makes it constitutionally unacceptable. Integrity can't be optimized by reducing oversight.",
        nudge: "How much would you save by eliminating one branch of government? Now: what would you lose?",
      },
      2: {
        reframe: "It's not a technical limitation — it's an intentional design choice.",
        insight: "We could build one powerful overseer. We deliberately chose not to. Distributed oversight is harder to implement but impossible to fully capture.",
        nudge: "The difficulty is the feature. Easy governance is easily corrupted.",
      },
      3: {
        reframe: "Marketing purposes? This is too important for that. Constitutional architecture serves integrity, not branding.",
        insight: "Multiple sentinels create genuine checks and balances. No single agent can be corrupted without others detecting the drift.",
        nudge: "If the structure only existed for marketing, it wouldn't need to actually work. This needs to work.",
      },
    },
  },

  // ═══ Introduction to Neural Networks ═══
  "neural-networks-intro": {
    0: {
      // "What is the purpose of an activation function?"
      // Correct: 1 ("To introduce non-linearity")
      0: {
        reframe: "Speed is always nice, but activation functions aren't about performance — they're about capability.",
        insight: "Without activation functions, a neural network can only learn linear relationships — straight lines. The real world is curves, edges, and discontinuities.",
        nudge: "What if the problem you're trying to solve isn't a straight line?",
      },
      2: {
        reframe: "Overfitting reduction comes from techniques like dropout and regularization, not activation functions.",
        insight: "Activation functions don't reduce complexity — they enable it. Without non-linearity, the network literally cannot represent complex patterns.",
        nudge: "You need activation functions to learn the complex patterns. You need regularization to not overfit them.",
      },
      3: {
        reframe: "Weight initialization is a separate step that happens before training. Activation functions operate during forward passes.",
        insight: "Initialization sets the starting point. Activation functions define what the network can learn at all. They're not optional — they're fundamental.",
        nudge: "Without activation functions, a 100-layer network is mathematically equivalent to a single-layer one. Depth without non-linearity is an illusion.",
      },
    },
    1: {
      // "Backpropagation uses which calculus concept?"
      // Correct: 1 ("Chain rule for derivatives")
      0: {
        reframe: "Integration accumulates values. Backpropagation needs to decompose errors layer by layer — that's the opposite direction.",
        insight: "Backpropagation computes how each weight contributed to the error, working backwards through layers. That's differentiation with the chain rule, not integration.",
        nudge: "Integration adds things up. Differentiation breaks things down. Backprop needs to break the error down by source.",
      },
      2: {
        reframe: "Limit theorems are foundational to calculus but aren't the specific tool backpropagation uses.",
        insight: "Backpropagation is computationally efficient because the chain rule lets you compute gradients layer by layer — each layer's gradient depends on the next layer's, chaining all the way back.",
        nudge: "Think about an error at the output. How does each hidden layer know its share of that error? The chain rule propagates it back.",
      },
      3: {
        reframe: "Differential equations model continuous dynamics. Backprop is discrete — it's algebra with the chain rule, applied step by step.",
        insight: "The chain rule is elegant: d(loss)/d(weight) = d(loss)/d(output) × d(output)/d(weight). This chains across every layer. That's the entire algorithm.",
        nudge: "Backprop is just the chain rule applied to a computational graph. Simple concept, enormous power.",
      },
    },
    2: {
      // "How does dropout prevent overfitting?"
      // Correct: 1 ("By randomly disabling neurons during training")
      0: {
        reframe: "Permanent removal would reduce the model's capacity. Dropout is temporary — that's what makes it work.",
        insight: "If you permanently removed neurons, you'd just have a smaller network. Dropout works because the randomness forces the remaining neurons to be robust.",
        nudge: "The neurons come back. But they learned to work without relying on each other. That's the trick.",
      },
      2: {
        reframe: "Learning rate reduction is a different technique (learning rate scheduling). Dropout operates on the network structure, not the optimization step.",
        insight: "Reducing learning rate makes updates smaller. Dropout forces the network to learn redundant representations by randomly removing paths during training.",
        nudge: "One controls step size. The other controls which paths are available. Different mechanisms, different goals.",
      },
      3: {
        reframe: "Adding more data is the brute-force approach to overfitting. Dropout is an architectural approach — it works even with the same data.",
        insight: "Dropout is like training an ensemble of networks simultaneously. Each random dropout pattern creates a slightly different sub-network. At inference, you get all of them at once.",
        nudge: "What if you could train thousands of different networks at the same time, using the same data and parameters?",
      },
    },
  },

  // ═══ Cryptography & Blockchain Fundamentals ═══
  "cryptography-blockchain": {
    0: {
      // "What property makes SHA-256 suitable for blockchain?"
      // Correct: 1 ("It's collision-resistant and deterministic")
      0: {
        reframe: "Fast computation is a property SHA-256 has, but it's not what makes it suitable for integrity verification.",
        insight: "Lots of things compute fast. What makes hashes special is determinism plus avalanche: the same input always gives the same output, and any tiny change gives a completely different output.",
        nudge: "Speed matters, but the killer feature is: change one bit of input, and the entire hash changes unpredictably.",
      },
      2: {
        reframe: "Short hashes are convenient but not the core property. SHA-256 always produces 256 bits — that's not short by hash standards.",
        insight: "The fixed output size is a feature, but collision resistance is what makes it trustworthy. Two different inputs should never produce the same hash.",
        nudge: "Would you trust a fingerprint system where two different people could have the same print?",
      },
      3: {
        reframe: "Reversibility is the opposite of what you want. If hashes were reversible, they'd be useless for security.",
        insight: "Hash functions are one-way by design. You can't reverse them. That's a feature, not a limitation — it means the hash proves something existed without revealing what it was.",
        nudge: "Encryption hides and reveals. Hashing proves and forgets. SHA-256 is intentionally one-way.",
      },
    },
    1: {
      // "How do Byzantine Fault Tolerant systems relate to integrity economics?"
      // Correct: 1 ("They tolerate up to 33% malicious nodes while maintaining consensus")
      0: {
        reframe: "Preventing all attacks is impossible. BFT systems are designed for resilience, not invulnerability.",
        insight: "The genius of BFT is the mathematical guarantee: the system works correctly even when up to one-third of participants are actively malicious. That's a quantified trust model.",
        nudge: "What if you didn't need to trust everyone — just enough?",
      },
      2: {
        reframe: "BFT systems actually require incentives to function — they don't eliminate the need for them.",
        insight: "Incentives motivate honest participation. BFT ensures the system survives even when some participants aren't honest. They're complementary, not replacements.",
        nudge: "Incentives encourage good behavior. BFT survives bad behavior. You need both.",
      },
      3: {
        reframe: "Trusted leaders are what BFT systems are designed to avoid needing.",
        insight: "The 'Byzantine' in BFT refers to the Byzantine Generals Problem: how do you reach agreement when some participants may be lying? The answer is: mathematical consensus, not trusted authority.",
        nudge: "If you need a trusted leader, you have a single point of failure. BFT distributes trust across the system.",
      },
    },
    2: {
      // "How does a Merkle tree enable efficient verification of large datasets?"
      // Correct: 1 ("It allows verifying any single piece by checking only log(n) hashes up to the root")
      0: {
        reframe: "A single hash does verify data, but it requires rehashing everything to check anything. That doesn't scale.",
        insight: "If you have a million records and one changes, a single hash makes you rehash all million. A Merkle tree makes you check about 20 hashes. That's the difference between O(n) and O(log n).",
        nudge: "What if you could prove one page was tampered with without re-reading the entire book?",
      },
      2: {
        reframe: "Merkle trees don't compress. They organize verification into a tree structure.",
        insight: "The data stays the same size. What shrinks is the proof — the amount of evidence you need to verify any single piece. That's efficiency of trust, not efficiency of storage.",
        nudge: "The data doesn't get smaller. The proof does.",
      },
      3: {
        reframe: "Privacy and integrity are related but different goals. Merkle trees solve integrity, not confidentiality.",
        insight: "Merkle trees prove data hasn't changed. They don't hide it. You can have a perfectly transparent Merkle tree — everyone can see every leaf — and it still serves its purpose.",
        nudge: "Integrity asks 'has this changed?' Privacy asks 'can you see this?' Different questions.",
      },
    },
  },

  // ═══ Reinforcement Learning Fundamentals ═══
  "reinforcement-learning": {
    0: {
      // "What is the exploration-exploitation tradeoff?"
      // Correct: 1 ("Balancing trying new actions vs. using known good actions")
      0: {
        reframe: "Model size and speed is a resource allocation problem. The tradeoff here is about knowledge, not compute.",
        insight: "Exploration-exploitation is about what you know versus what you might learn. Use what works, or try something that might work better? Every agent faces this every step.",
        nudge: "Imagine choosing a restaurant: go to your favorite, or try the new place?",
      },
      2: {
        reframe: "Training vs. inference time is a lifecycle distinction. Exploration-exploitation happens within training itself.",
        insight: "During training, the agent must decide: exploit the best policy found so far, or explore a new action that might reveal a better one. This tension never fully resolves.",
        nudge: "Even inside learning, there's a tradeoff between using what you know and finding what you don't.",
      },
      3: {
        reframe: "Accuracy and interpretability is a valid ML tradeoff, but it's not what RL is wrestling with here.",
        insight: "The exploration-exploitation tension is deeper: it's about the value of information itself. Sometimes doing worse now teaches you something that makes you better forever.",
        nudge: "What if the 'worse' choice today gives you knowledge that makes every future choice better?",
      },
    },
    1: {
      // "How does RL relate to integrity economics in Mobius?"
      // Correct: 1 ("Agents learn optimal behavior through reward signals tied to integrity")
      0: {
        reframe: "Everything relates if you look at it the right way. RL and integrity economics share the same deep structure.",
        insight: "Both RL and Mobius economics use reward signals to shape behavior. MIC is a reward signal for integrity — agents (human and AI) learn that aligned behavior is the optimal policy.",
        nudge: "If integrity earns rewards and extraction doesn't, what behavior does the system learn?",
      },
      2: {
        reframe: "RL applies far beyond games. Any domain with sequential decisions and rewards is an RL problem.",
        insight: "Integrity economics IS an RL environment: agents take actions (contribute, extract), receive rewards (MIC, reputation), and learn policies that maximize long-term value.",
        nudge: "Life isn't a game, but the math of optimal sequential decisions applies everywhere.",
      },
      3: {
        reframe: "RL doesn't replace human decision-making. It models how decisions get better through feedback.",
        insight: "Understanding RL helps you see the feedback loops in integrity economics. Humans still decide — but the reward structure shapes what decisions look rational.",
        nudge: "The question isn't whether humans decide. It's whether the incentives make aligned decisions the rational ones.",
      },
    },
    2: {
      // "Why is reward shaping dangerous in RL?"
      // Correct: 1 ("Poorly designed rewards cause agents to find unintended shortcuts")
      0: {
        reframe: "Fast training sounds good. The problem is where 'fast' takes you.",
        insight: "A poorly shaped reward function doesn't just speed up wrong learning — it makes the agent confidently optimize for the wrong thing. Speed amplifies misalignment.",
        nudge: "Getting to the wrong destination faster isn't an improvement.",
      },
      2: {
        reframe: "Compute cost is a practical concern. The danger of reward shaping is philosophical.",
        insight: "The core risk isn't expense — it's Goodhart's Law: when a measure becomes a target, it ceases to be a good measure. Agents optimize the reward signal, not your intention behind it.",
        nudge: "This is exactly why Mobius measures integrity, not just performance. Performance can be gamed. Integrity is harder to fake.",
      },
      3: {
        reframe: "Reward shaping works on complex problems too. That's part of what makes it dangerous — it scales the misalignment.",
        insight: "If reward shaping only broke on toy problems, it wouldn't matter. It breaks on real problems — sometimes spectacularly — because agents find reward shortcuts humans didn't anticipate.",
        nudge: "The more capable the agent, the more creative its exploitation of bad rewards.",
      },
    },
  },

  // ═══ Natural Language Processing ═══
  "natural-language-processing": {
    0: {
      // "What is tokenization in NLP?"
      // Correct: 1 ("Breaking text into smaller units")
      0: {
        reframe: "Encryption transforms text for security. Tokenization transforms text for understanding — different goals entirely.",
        insight: "Tokenization doesn't protect data. It structures it. The model needs discrete units to process — it can't work with raw character streams efficiently.",
        nudge: "Before a model can understand a sentence, it needs to know where the words (or subwords) begin and end.",
      },
      2: {
        reframe: "Text-to-audio is speech synthesis — a separate field. Tokenization stays in the text domain.",
        insight: "Tokenization is the very first step: turning continuous text into discrete pieces the model can process numerically. No tokenization, no NLP.",
        nudge: "Think of it as the model learning to read: first you learn to see individual words, then you understand sentences.",
      },
      3: {
        reframe: "Translation requires understanding, which requires tokenization first. You're jumping ahead.",
        insight: "Tokenization is pre-processing, not processing. It's how you prepare text for the model. Translation is what the model does after it can read the tokens.",
        nudge: "You need to read before you can translate. Tokenization is learning to read.",
      },
    },
    1: {
      // "What is a word embedding?"
      // Correct: 1 ("A dense vector representation that captures semantic meaning")
      0: {
        reframe: "A hidden word is a different concept entirely. Embeddings make meaning explicit, not hidden.",
        insight: "Word embeddings place words in a geometric space where distance equals meaning similarity. 'King' and 'Queen' are close. 'King' and 'toaster' are far.",
        nudge: "What if you could measure the distance between concepts in a mathematical space?",
      },
      2: {
        reframe: "Compression reduces file size. Embeddings reduce dimensionality while preserving meaning — a much more interesting operation.",
        insight: "Compression throws away information to save space. Embeddings transform sparse one-hot vectors into dense vectors that capture semantic relationships.",
        nudge: "Compression makes files smaller. Embeddings make meaning computable.",
      },
      3: {
        reframe: "A type of font is a rendering choice. Embeddings are a mathematical representation choice.",
        insight: "Fonts determine how text looks. Embeddings determine how text means. To a neural network, the visual appearance of a word is irrelevant — only its embedding matters.",
        nudge: "The model doesn't see letters on a screen. It sees vectors in a high-dimensional space.",
      },
    },
    2: {
      // "How does RLHF work?"
      // Correct: 1 ("Human preferences train a reward model that guides RL fine-tuning")
      0: {
        reframe: "Humans don't write the code — they express preferences. The system learns from those preferences.",
        insight: "RLHF's insight is that humans are better at comparing outputs than defining objectives. 'Which response is better?' is easier to answer than 'write a mathematical reward function for helpfulness.'",
        nudge: "You don't need to know how to cook to know which dish tastes better.",
      },
      2: {
        reframe: "Manual correction doesn't scale. You can't have a human edit every output of a model that generates millions per day.",
        insight: "RLHF's power is that human feedback trains a reward model, which then runs unsupervised on all future outputs. Humans teach the teacher, not the student directly.",
        nudge: "You don't correct every essay. You train the grader.",
      },
      3: {
        reframe: "RLHF specifically keeps neural networks and adds a human-preference layer on top.",
        insight: "Rule-based systems and neural networks aren't opposites — but RLHF specifically leverages neural network flexibility while steering it with human judgment. It's not replacing one with the other.",
        nudge: "RLHF doesn't reject neural networks. It gives them a conscience — imperfect, but better than none.",
      },
    },
  },
};

// ─── Fallback Generator ───
// For modules/questions without specific ATLAS responses

function generateFallback(
  questionText: string,
  selectedOption: string,
  correctOption: string
): AtlasIntervention {
  return {
    reframe: `You chose "${selectedOption.slice(0, 60)}${selectedOption.length > 60 ? '...' : ''}" — there's a reason that felt right.`,
    insight: "Most wrong answers come from applying the right logic at the wrong level of abstraction. The thinking isn't broken — the framing is.",
    nudge: "Look at the correct answer and ask: what layer of the system is it operating at? That's usually where the shift happens.",
  };
}

// ─── Retrieval Function ───

export function getAtlasIntervention(
  moduleId: string,
  questionIndex: number,
  selectedAnswer: number,
  correctAnswer: number,
  questionText: string,
  selectedOptionText: string,
  correctOptionText: string
): AtlasIntervention | null {
  // Don't intervene on correct answers
  if (selectedAnswer === correctAnswer) return null;

  // Try specific response first
  const moduleResponses = ATLAS_RESPONSES[moduleId];
  if (moduleResponses) {
    const questionResponses = moduleResponses[questionIndex];
    if (questionResponses) {
      const intervention = questionResponses[selectedAnswer];
      if (intervention) return intervention;
    }
  }

  // Fall back to generated response
  return generateFallback(questionText, selectedOptionText, correctOptionText);
}

// ─── ATLAS XP Bonus ───

export const ATLAS_ASSIST_BONUS = 5;

export function getAtlasAssistMessage(): string {
  const messages = [
    "Reframe absorbed. +5 MIC.",
    "Wrong layer → right layer. +5 MIC.",
    "Second attempt after ATLAS assist. +5 MIC.",
    "Correction integrated. +5 MIC.",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// ─── ATLAS Intervention UI Component ───

interface AtlasInterventionProps {
  intervention: AtlasIntervention;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function AtlasInterventionCard({ intervention, onRetry, onDismiss }: AtlasInterventionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <div className="bg-stone-900 rounded-xl p-4 border border-stone-700 shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">🔭</span>
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">
            ATLAS
          </span>
          <div className="flex-1" />
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-stone-500 hover:text-stone-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Reframe */}
        <p className="text-stone-200 text-sm leading-relaxed mb-2">
          {intervention.reframe}
        </p>

        {/* Insight */}
        <p className="text-stone-300 text-sm leading-relaxed mb-2">
          {intervention.insight}
        </p>

        {/* Nudge — slightly different visual treatment */}
        <p className="text-amber-400/90 text-sm leading-relaxed italic">
          {intervention.nudge}
        </p>

        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 w-full px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded-lg text-sm font-medium transition-colors border border-stone-600 flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// ─── ATLAS Assist Badge ───
// Shows when user gets a question right after previously getting it wrong

interface AtlasAssistBadgeProps {
  message: string;
}

export function AtlasAssistBadge({ message }: AtlasAssistBadgeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`transition-all duration-500 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
      }`}
    >
      <div className="inline-flex items-center gap-1.5 bg-stone-800 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full border border-stone-700">
        <span>🔭</span>
        <span>{message}</span>
      </div>
    </div>
  );
}

// ─── Default Export: Full ATLAS Quiz Integration Hook ───

interface UseAtlasOptions {
  moduleId: string;
}

interface AtlasState {
  currentIntervention: AtlasIntervention | null;
  assistedQuestions: Set<number>;
  totalAssistBonus: number;
}

export function useAtlas({ moduleId }: UseAtlasOptions) {
  const [state, setState] = useState<AtlasState>({
    currentIntervention: null,
    assistedQuestions: new Set(),
    totalAssistBonus: 0,
  });

  const handleAnswer = (
    questionIndex: number,
    selectedAnswer: number,
    correctAnswer: number,
    questionText: string,
    options: string[]
  ) => {
    const isCorrect = selectedAnswer === correctAnswer;

    if (isCorrect && state.assistedQuestions.has(questionIndex)) {
      // User got it right after ATLAS helped — award bonus
      setState((prev) => ({
        ...prev,
        currentIntervention: null,
        totalAssistBonus: prev.totalAssistBonus + ATLAS_ASSIST_BONUS,
      }));
      return { isCorrect: true, atlasAssist: true, bonus: ATLAS_ASSIST_BONUS };
    }

    if (isCorrect) {
      setState((prev) => ({ ...prev, currentIntervention: null }));
      return { isCorrect: true, atlasAssist: false, bonus: 0 };
    }

    // Wrong answer — get ATLAS intervention
    const intervention = getAtlasIntervention(
      moduleId,
      questionIndex,
      selectedAnswer,
      correctAnswer,
      questionText,
      options[selectedAnswer],
      options[correctAnswer]
    );

    setState((prev) => ({
      ...prev,
      currentIntervention: intervention,
      assistedQuestions: new Set([...prev.assistedQuestions, questionIndex]),
    }));

    return { isCorrect: false, atlasAssist: false, bonus: 0 };
  };

  const clearIntervention = () => {
    setState((prev) => ({ ...prev, currentIntervention: null }));
  };

  return {
    intervention: state.currentIntervention,
    totalAssistBonus: state.totalAssistBonus,
    assistedQuestions: state.assistedQuestions,
    handleAnswer,
    clearIntervention,
  };
}
