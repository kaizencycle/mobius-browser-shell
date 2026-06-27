// src/lib/oaa/knowledge-graph.ts — C-355 Personalized Knowledge Graph

export interface KnowledgeGraphEdge {
  user_id: string;
  source_topic: string;
  target_topic: string;
  weight: number;      // [0,1] — increases with demonstrated comprehension
  confidence: number;  // [0,1] — based on retention over time
  last_updated: string;
}

const INITIAL_EDGE_WEIGHT = 0.3;
const WEIGHT_INCREMENT = 0.1;
const MAX_WEIGHT = 1.0;

// Path tree seeds — used by JADE routing as starting heuristic
export const PATH_TREES: Record<string, string[]> = {
  Economics: ['Markets', 'Incentives', 'Game Theory', 'Goodhart', 'Regulatory Capture', 'Governance'],
  AI: ['LLMs', 'Agents', 'Memory', 'Multi-Agent Consensus', 'Alignment', 'Constitutional AI'],
  Civics: ['Democracy', 'Gerrymandering', 'Institutional Drift', 'Public Goods', 'Civic Integrity'],
  Systems: ['Complexity', 'Feedback Loops', 'Emergence', 'Tipping Points', 'Civilizational Design'],
  Philosophy: ['Ethics', 'Virtue Theory', 'Accountability', 'Power', 'Justice', 'Wisdom'],
};

export function buildGraphEdges(
  userId: string,
  sourceTags: string[],
  questionTags: string[]
): KnowledgeGraphEdge[] {
  const now = new Date().toISOString();
  const edges: KnowledgeGraphEdge[] = [];

  for (const source of sourceTags) {
    for (const target of questionTags) {
      if (source !== target) {
        edges.push({
          user_id: userId,
          source_topic: source.toLowerCase(),
          target_topic: target.toLowerCase(),
          weight: INITIAL_EDGE_WEIGHT,
          confidence: 0.3,
          last_updated: now,
        });
      }
    }
  }
  return edges;
}

export function updateGraph(
  existing: KnowledgeGraphEdge[],
  newEdges: KnowledgeGraphEdge[]
): KnowledgeGraphEdge[] {
  const graph = [...existing];
  for (const edge of newEdges) {
    const idx = graph.findIndex(
      e =>
        e.user_id === edge.user_id &&
        e.source_topic === edge.source_topic &&
        e.target_topic === edge.target_topic
    );
    if (idx >= 0) {
      graph[idx] = {
        ...graph[idx],
        weight: Math.min(graph[idx].weight + WEIGHT_INCREMENT, MAX_WEIGHT),
        last_updated: new Date().toISOString(),
      };
    } else {
      graph.push(edge);
    }
  }
  return graph;
}

// Serialize / deserialize from localStorage
const GRAPH_KEY = 'oaa_knowledge_graph';

export function loadGraph(userId: string): KnowledgeGraphEdge[] {
  try {
    const raw = localStorage.getItem(`${GRAPH_KEY}:${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGraph(userId: string, graph: KnowledgeGraphEdge[]): void {
  try {
    localStorage.setItem(`${GRAPH_KEY}:${userId}`, JSON.stringify(graph));
  } catch {
    // Storage full — silently ignore
  }
}
