// src/lib/oaa/jade-routing.ts — C-355 JADE Next Seminar Routing

import { courses, getCourseById, CourseVideo } from './courses';
import { KnowledgeGraphEdge, buildGraphEdges } from './knowledge-graph';

export interface JadeInput {
  userId: string;
  completedCourseId: string;
  userQuestion: string;
  quizScore: number;
  knowledgeGraph: KnowledgeGraphEdge[];
}

export interface JadeOutput {
  responseText: string;
  nextCourseId: string | null;
  semanticDepth: number;     // [0,1]
  micBonus: number;
  newGraphEdges: KnowledgeGraphEdge[];
}

// Simple keyword extraction from user question
function extractTags(text: string): string[] {
  const keywords = [
    'incentive', 'incentives', 'market', 'markets', 'governance', 'power',
    'democracy', 'corruption', 'ai', 'alignment', 'agent', 'agents',
    'game theory', 'game', 'cooperation', 'fairness', 'justice', 'ethics',
    'feedback', 'system', 'systems', 'complexity', 'emergence', 'network',
    'philosophy', 'truth', 'knowledge', 'learning', 'attention', 'cognitive',
    'information', 'entropy', 'coordination', 'consensus', 'trust',
    'platform', 'capture', 'regulation', 'goodhart', 'metrics',
    'public', 'goods', 'free rider', 'collective', 'constitution',
  ];
  const lower = text.toLowerCase();
  return keywords.filter(kw => lower.includes(kw));
}

// Compute semantic depth: proxy via word count + connecting language
export function scoreSemanticDepth(question: string): number {
  if (!question || question.trim().length < 10) return 0;
  const words = question.trim().split(/\s+/).length;
  const hasConnectors = /how|why|what if|connect|relate|compare|diverge|apply|means|implies|relate|tension|tradeoff/i.test(question);
  const hasCrossRef = /because|therefore|however|but|whereas|since|although|despite/i.test(question);
  const lengthScore = Math.min(words / 25, 1);
  const bonus = (hasConnectors ? 0.3 : 0) + (hasCrossRef ? 0.1 : 0);
  return Math.min(Number((lengthScore * 0.6 + bonus).toFixed(2)), 1);
}

// Tag overlap count between two tag arrays
function tagOverlap(a: string[], b: string[]): number {
  const setA = new Set(a.map(t => t.toLowerCase()));
  return b.filter(t => setA.has(t.toLowerCase())).length;
}

export function routeNextSeminar(input: JadeInput): JadeOutput {
  const completedCourse = getCourseById(input.completedCourseId);
  const questionTags = extractTags(input.userQuestion);
  const semanticDepth = scoreSemanticDepth(input.userQuestion);

  // Build candidates excluding already-completed course
  const candidates = courses
    .filter(c => c.id !== input.completedCourseId)
    .map(c => {
      const overlapScore = tagOverlap(
        [...(completedCourse?.tags ?? []), ...questionTags],
        c.tags
      );
      // Boost courses referenced in knowledge graph
      const graphBoost = input.knowledgeGraph.reduce((sum, edge) => {
        if (c.tags.some(t => t.toLowerCase() === edge.target_topic)) {
          return sum + edge.weight * 0.5;
        }
        return sum;
      }, 0);
      return { course: c, score: overlapScore + graphBoost };
    })
    .sort((a, b) => b.score - a.score);

  const next: CourseVideo | undefined = candidates[0]?.course;
  const micBonus = semanticDepth >= 0.7 ? 5 : 0;

  let responseText: string;
  if (next) {
    const credit = next.professorName
      ? `${next.professorName}${next.institution ? ` (${next.institution})` : ''}`
      : next.sourceCredit;
    const mins = Math.round(next.durationSeconds / 60);
    responseText =
      `Based on your question, coming up next: ${credit} — "${next.title}". ${mins} min.`;
  } else {
    responseText = `You've explored the available seminars in this track. Try a new subject!`;
  }

  const newGraphEdges = buildGraphEdges(
    input.userId,
    completedCourse?.tags ?? [],
    questionTags
  );

  return {
    responseText,
    nextCourseId: next?.id ?? null,
    semanticDepth,
    micBonus,
    newGraphEdges,
  };
}
