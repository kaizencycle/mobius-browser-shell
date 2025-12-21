/**
 * KnowledgeGraphContext
 * 
 * Manages the temporal epistemic graph that tracks the user's learning journey.
 * This is not a notes graph - it's a map of conceptual connections and cognitive evolution.
 * 
 * Key Features:
 * - Automatic concept extraction from reflections
 * - Learning module integration
 * - Intent horizon tracking
 * - Time-based graph filtering
 * - JADE integration for pattern analysis
 */
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  KnowledgeGraph,
  KnowledgeNode,
  KnowledgeEdge,
  KnowledgeNodeType,
  KnowledgeDomain,
  KnowledgeEdgeType,
  GraphData,
  IntentHorizon,
  JADEGraphInsight,
} from '../types';

// Storage keys
const STORAGE_KEY_GRAPH = 'mobius_knowledge_graph_v1';
const STORAGE_KEY_INTENTS = 'mobius_intents_v1';

// Domain colors for visualization
export const DOMAIN_COLORS: Record<KnowledgeDomain, string> = {
  reflection: '#60a5fa',   // Blue
  learning: '#34d399',     // Green
  civic: '#fb923c',        // Orange
  system: '#a78bfa',       // Purple
  personal: '#f472b6',     // Pink
};

// Node type colors
export const NODE_TYPE_COLORS: Record<KnowledgeNodeType, string> = {
  concept: '#94a3b8',      // Slate
  artifact: '#fbbf24',     // Amber
  intent: '#22d3ee',       // Cyan
};

interface KnowledgeGraphContextType {
  // Graph state
  graph: KnowledgeGraph;
  graphData: GraphData;           // Formatted for force-graph
  intents: IntentHorizon[];
  
  // Filtering
  timeRange: { start: Date | null; end: Date | null };
  setTimeRange: (range: { start: Date | null; end: Date | null }) => void;
  domainFilter: KnowledgeDomain[];
  setDomainFilter: (domains: KnowledgeDomain[]) => void;
  
  // Node operations
  addNode: (node: Omit<KnowledgeNode, 'id' | 'firstSeen' | 'lastSeen' | 'weight' | 'sources'>, sourceId?: string) => KnowledgeNode;
  updateNode: (id: string, updates: Partial<KnowledgeNode>) => void;
  getNode: (id: string) => KnowledgeNode | undefined;
  
  // Edge operations
  addEdge: (source: string, target: string, type: KnowledgeEdgeType, evidence?: string) => KnowledgeEdge;
  updateEdge: (id: string, updates: Partial<KnowledgeEdge>) => void;
  
  // Bulk operations
  extractAndAddConcepts: (text: string, domain: KnowledgeDomain, sourceId: string) => void;
  
  // Intent operations
  addIntent: (intent: Omit<IntentHorizon, 'id' | 'createdAt' | 'status' | 'progress' | 'reflections'>) => IntentHorizon;
  updateIntent: (id: string, updates: Partial<IntentHorizon>) => void;
  getIntent: (id: string) => IntentHorizon | undefined;
  
  // Analysis
  getNodeDetails: (id: string) => {
    node: KnowledgeNode;
    connections: KnowledgeNode[];
    mentions: { sourceId: string; date: string }[];
    trajectory: { date: string; weight: number }[];
  } | null;
  getDominantThemes: (limit?: number) => KnowledgeNode[];
  getNeglectedConcepts: () => KnowledgeNode[];
  getEmergingClusters: () => KnowledgeNode[][];
  
  // JADE integration
  analyzeWithJADE: () => Promise<JADEGraphInsight[]>;
  
  // Graph stats
  stats: {
    totalNodes: number;
    totalEdges: number;
    avgConnections: number;
    graphDensity: number;
    dominantDomain: KnowledgeDomain | null;
  };
}

const defaultGraph: KnowledgeGraph = {
  nodes: [],
  edges: [],
  metadata: {
    lastUpdated: new Date().toISOString(),
    totalConcepts: 0,
    totalConnections: 0,
    dominantDomains: [],
  },
};

const KnowledgeGraphContext = createContext<KnowledgeGraphContextType | undefined>(undefined);

// Helper: Generate stable ID from label
function generateNodeId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Helper: Simple TF-IDF-like concept extraction
function extractConcepts(text: string, maxConcepts: number = 10): string[] {
  // Common stop words to filter out
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'can', 'will', 'just', 'should', 'now', 'i', 'my', 'me', 'we', 'our',
    'you', 'your', 'he', 'she', 'it', 'they', 'them', 'what', 'which',
    'who', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
    'does', 'did', 'doing', 'would', 'could', 'might', 'must', 'shall',
    'today', 'tomorrow', 'yesterday', 'want', 'feel', 'think', 'know',
    'see', 'get', 'make', 'go', 'come', 'take', 'use', 'find', 'give',
    'tell', 'say', 'try', 'way', 'thing', 'things', 'lot', 'really',
    'also', 'even', 'still', 'well', 'back', 'much', 'because', 'like',
    'dont', "don't", 'im', "i'm", 'ive', "i've", 'its', "it's",
  ]);

  // Mobius-specific concepts to always capture
  const mobiusConcepts = new Set([
    'integrity', 'kaizen', 'mic', 'mii', 'sentinel', 'atlas', 'aurea',
    'jade', 'eve', 'echo', 'epicon', 'covenant', 'custodianship',
    'ecology', 'reflection', 'drift', 'alignment', 'constitutional',
    'governance', 'ledger', 'shard', 'circuit breaker', 'hive',
  ]);

  // Extract words
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Count word frequency
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // Boost Mobius-specific concepts
  mobiusConcepts.forEach(concept => {
    if (text.toLowerCase().includes(concept)) {
      wordFreq.set(concept, (wordFreq.get(concept) || 0) + 5);
    }
  });

  // Sort by frequency and take top concepts
  const sortedConcepts = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxConcepts)
    .map(([word]) => word);

  return sortedConcepts;
}

// Helper: Calculate co-occurrence edges
function calculateCoOccurrences(concepts: string[]): Array<{ source: string; target: string }> {
  const pairs: Array<{ source: string; target: string }> = [];
  
  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      pairs.push({
        source: generateNodeId(concepts[i]),
        target: generateNodeId(concepts[j]),
      });
    }
  }
  
  return pairs;
}

export const KnowledgeGraphProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [graph, setGraph] = useState<KnowledgeGraph>(defaultGraph);
  const [intents, setIntents] = useState<IntentHorizon[]>([]);
  const [timeRange, setTimeRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });
  const [domainFilter, setDomainFilter] = useState<KnowledgeDomain[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedGraph = localStorage.getItem(STORAGE_KEY_GRAPH);
      if (savedGraph) {
        setGraph(JSON.parse(savedGraph));
      }
      
      const savedIntents = localStorage.getItem(STORAGE_KEY_INTENTS);
      if (savedIntents) {
        setIntents(JSON.parse(savedIntents));
      }
    } catch (e) {
      console.error('Failed to load knowledge graph from storage:', e);
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GRAPH, JSON.stringify(graph));
    } catch (e) {
      console.error('Failed to save knowledge graph:', e);
    }
  }, [graph]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INTENTS, JSON.stringify(intents));
    } catch (e) {
      console.error('Failed to save intents:', e);
    }
  }, [intents]);

  // Convert graph to force-graph format with filters applied
  const graphData: GraphData = React.useMemo(() => {
    let filteredNodes = [...graph.nodes];
    let filteredEdges = [...graph.edges];

    // Apply time filter
    if (timeRange.start || timeRange.end) {
      filteredNodes = filteredNodes.filter(node => {
        const nodeDate = new Date(node.lastSeen);
        if (timeRange.start && nodeDate < timeRange.start) return false;
        if (timeRange.end && nodeDate > timeRange.end) return false;
        return true;
      });

      const validNodeIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = filteredEdges.filter(edge =>
        validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
      );
    }

    // Apply domain filter
    if (domainFilter.length > 0) {
      filteredNodes = filteredNodes.filter(node =>
        domainFilter.includes(node.domain)
      );

      const validNodeIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = filteredEdges.filter(edge =>
        validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
      );
    }

    return {
      nodes: filteredNodes.map(node => ({
        id: node.id,
        label: node.label,
        type: node.type,
        domain: node.domain,
        weight: node.weight,
        val: Math.max(3, Math.log(node.weight + 1) * 5),
        color: DOMAIN_COLORS[node.domain],
      })),
      links: filteredEdges.map(edge => ({
        source: edge.source,
        target: edge.target,
        type: edge.type,
        strength: edge.strength,
        color: `rgba(148, 163, 184, ${0.2 + edge.strength * 0.6})`,
      })),
    };
  }, [graph, timeRange, domainFilter]);

  // Add node
  const addNode = useCallback((
    nodeData: Omit<KnowledgeNode, 'id' | 'firstSeen' | 'lastSeen' | 'weight' | 'sources'>,
    sourceId?: string
  ): KnowledgeNode => {
    const id = generateNodeId(nodeData.label);
    const now = new Date().toISOString();

    // Check if node exists
    const existing = graph.nodes.find(n => n.id === id);
    
    if (existing) {
      // Update existing node
      const updated: KnowledgeNode = {
        ...existing,
        weight: existing.weight + 1,
        lastSeen: now,
        sources: sourceId && !existing.sources.includes(sourceId)
          ? [...existing.sources, sourceId]
          : existing.sources,
      };
      
      setGraph(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === id ? updated : n),
        metadata: {
          ...prev.metadata,
          lastUpdated: now,
        },
      }));
      
      return updated;
    }

    // Create new node
    const newNode: KnowledgeNode = {
      id,
      label: nodeData.label,
      type: nodeData.type,
      domain: nodeData.domain,
      weight: 1,
      firstSeen: now,
      lastSeen: now,
      sources: sourceId ? [sourceId] : [],
      metadata: nodeData.metadata,
    };

    setGraph(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      metadata: {
        ...prev.metadata,
        lastUpdated: now,
        totalConcepts: prev.nodes.length + 1,
      },
    }));

    return newNode;
  }, [graph.nodes]);

  // Update node
  const updateNode = useCallback((id: string, updates: Partial<KnowledgeNode>) => {
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === id ? { ...n, ...updates } : n),
      metadata: {
        ...prev.metadata,
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  // Get node
  const getNode = useCallback((id: string): KnowledgeNode | undefined => {
    return graph.nodes.find(n => n.id === id);
  }, [graph.nodes]);

  // Add edge
  const addEdge = useCallback((
    source: string,
    target: string,
    type: KnowledgeEdgeType,
    evidence?: string
  ): KnowledgeEdge => {
    const edgeId = `${source}-${target}-${type}`;
    const now = new Date().toISOString();

    // Check if edge exists
    const existing = graph.edges.find(e => e.id === edgeId);
    
    if (existing) {
      // Strengthen existing edge
      const updated: KnowledgeEdge = {
        ...existing,
        strength: Math.min(1, existing.strength + 0.1),
        lastSeen: now,
        evidence: evidence && !existing.evidence.includes(evidence)
          ? [...existing.evidence, evidence]
          : existing.evidence,
      };
      
      setGraph(prev => ({
        ...prev,
        edges: prev.edges.map(e => e.id === edgeId ? updated : e),
        metadata: {
          ...prev.metadata,
          lastUpdated: now,
        },
      }));
      
      return updated;
    }

    // Create new edge
    const newEdge: KnowledgeEdge = {
      id: edgeId,
      source,
      target,
      type,
      strength: 0.3,
      evidence: evidence ? [evidence] : [],
      firstSeen: now,
      lastSeen: now,
    };

    setGraph(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge],
      metadata: {
        ...prev.metadata,
        lastUpdated: now,
        totalConnections: prev.edges.length + 1,
      },
    }));

    return newEdge;
  }, [graph.edges]);

  // Update edge
  const updateEdge = useCallback((id: string, updates: Partial<KnowledgeEdge>) => {
    setGraph(prev => ({
      ...prev,
      edges: prev.edges.map(e => e.id === id ? { ...e, ...updates } : e),
      metadata: {
        ...prev.metadata,
        lastUpdated: new Date().toISOString(),
      },
    }));
  }, []);

  // Extract concepts from text and add to graph
  const extractAndAddConcepts = useCallback((
    text: string,
    domain: KnowledgeDomain,
    sourceId: string
  ) => {
    const concepts = extractConcepts(text, 10);
    
    // Add nodes for each concept
    concepts.forEach(concept => {
      addNode({
        label: concept.charAt(0).toUpperCase() + concept.slice(1),
        type: 'concept',
        domain,
      }, sourceId);
    });

    // Add co-occurrence edges
    const pairs = calculateCoOccurrences(concepts);
    pairs.forEach(pair => {
      addEdge(pair.source, pair.target, 'co-occurs', sourceId);
    });
  }, [addNode, addEdge]);

  // Add intent
  const addIntent = useCallback((
    intentData: Omit<IntentHorizon, 'id' | 'createdAt' | 'status' | 'progress' | 'reflections'>
  ): IntentHorizon => {
    const id = `intent-${Date.now()}`;
    const now = new Date().toISOString();

    const newIntent: IntentHorizon = {
      id,
      goal: intentData.goal,
      horizon: intentData.horizon,
      createdAt: now,
      targetDate: intentData.targetDate,
      relatedConcepts: intentData.relatedConcepts,
      status: 'active',
      progress: 0,
      reflections: [],
    };

    setIntents(prev => [...prev, newIntent]);

    // Create intent node in graph
    addNode({
      label: intentData.goal.slice(0, 30) + (intentData.goal.length > 30 ? '...' : ''),
      type: 'intent',
      domain: 'personal',
      metadata: {
        goalText: intentData.goal,
        intentHorizon: intentData.horizon,
      },
    });

    // Connect intent to related concepts
    intentData.relatedConcepts.forEach(conceptId => {
      addEdge(id, conceptId, 'motivates');
    });

    return newIntent;
  }, [addNode, addEdge]);

  // Update intent
  const updateIntent = useCallback((id: string, updates: Partial<IntentHorizon>) => {
    setIntents(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  }, []);

  // Get intent
  const getIntent = useCallback((id: string): IntentHorizon | undefined => {
    return intents.find(i => i.id === id);
  }, [intents]);

  // Get node details
  const getNodeDetails = useCallback((id: string) => {
    const node = graph.nodes.find(n => n.id === id);
    if (!node) return null;

    const connectedEdges = graph.edges.filter(e => e.source === id || e.target === id);
    const connectedNodeIds = connectedEdges.map(e => e.source === id ? e.target : e.source);
    const connections = graph.nodes.filter(n => connectedNodeIds.includes(n.id));

    const mentions = node.sources.map(sourceId => ({
      sourceId,
      date: node.lastSeen, // In production, you'd look up the actual source date
    }));

    // Mock trajectory - in production, this would come from historical data
    const trajectory = [
      { date: node.firstSeen, weight: 1 },
      { date: node.lastSeen, weight: node.weight },
    ];

    return { node, connections, mentions, trajectory };
  }, [graph]);

  // Get dominant themes
  const getDominantThemes = useCallback((limit: number = 5): KnowledgeNode[] => {
    return [...graph.nodes]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);
  }, [graph.nodes]);

  // Get neglected concepts (high weight but old)
  const getNeglectedConcepts = useCallback((): KnowledgeNode[] => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return graph.nodes
      .filter(n => {
        const lastSeen = new Date(n.lastSeen);
        return n.weight > 3 && lastSeen < thirtyDaysAgo;
      })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  }, [graph.nodes]);

  // Get emerging clusters (simple community detection)
  const getEmergingClusters = useCallback((): KnowledgeNode[][] => {
    // Simple clustering: group nodes that are all connected to each other
    const clusters: KnowledgeNode[][] = [];
    const visited = new Set<string>();

    graph.nodes.forEach(node => {
      if (visited.has(node.id)) return;

      const cluster: KnowledgeNode[] = [node];
      visited.add(node.id);

      // Find all nodes directly connected to this one
      const connectedEdges = graph.edges.filter(e => e.source === node.id || e.target === node.id);
      connectedEdges.forEach(edge => {
        const otherId = edge.source === node.id ? edge.target : edge.source;
        if (!visited.has(otherId)) {
          const otherNode = graph.nodes.find(n => n.id === otherId);
          if (otherNode) {
            cluster.push(otherNode);
            visited.add(otherId);
          }
        }
      });

      if (cluster.length > 2) {
        clusters.push(cluster);
      }
    });

    return clusters.sort((a, b) => b.length - a.length).slice(0, 3);
  }, [graph]);

  // Analyze with JADE (mock for now, would call API in production)
  const analyzeWithJADE = useCallback(async (): Promise<JADEGraphInsight[]> => {
    const insights: JADEGraphInsight[] = [];

    // Dominant themes
    const dominantThemes = getDominantThemes(3);
    if (dominantThemes.length > 0) {
      insights.push({
        type: 'dominant_theme',
        title: 'Core Conceptual Focus',
        description: `Your thinking centers around: ${dominantThemes.map(n => n.label).join(', ')}. These concepts appear frequently across your reflections.`,
        relatedNodes: dominantThemes.map(n => n.id),
        confidence: 0.85,
      });
    }

    // Neglected areas
    const neglected = getNeglectedConcepts();
    if (neglected.length > 0) {
      insights.push({
        type: 'neglected_area',
        title: 'Concepts to Revisit',
        description: `You explored ${neglected.map(n => n.label).join(', ')} extensively before, but haven't engaged with them recently.`,
        relatedNodes: neglected.map(n => n.id),
        confidence: 0.75,
        actionable: 'Consider revisiting these concepts in your next reflection.',
      });
    }

    // Emerging clusters
    const clusters = getEmergingClusters();
    if (clusters.length > 0) {
      clusters.forEach((cluster, i) => {
        insights.push({
          type: 'emerging_cluster',
          title: `Emerging Pattern ${i + 1}`,
          description: `A conceptual cluster is forming around: ${cluster.map(n => n.label).join(', ')}. These ideas are connecting in your thinking.`,
          relatedNodes: cluster.map(n => n.id),
          confidence: 0.7,
        });
      });
    }

    // Knowledge gaps (nodes with low connections)
    const isolatedNodes = graph.nodes.filter(node => {
      const connectionCount = graph.edges.filter(e => e.source === node.id || e.target === node.id).length;
      return connectionCount < 2 && node.weight > 1;
    });

    if (isolatedNodes.length > 0) {
      insights.push({
        type: 'knowledge_gap',
        title: 'Concepts Seeking Connection',
        description: `These concepts exist in isolation: ${isolatedNodes.slice(0, 3).map(n => n.label).join(', ')}. Consider how they might connect to your broader thinking.`,
        relatedNodes: isolatedNodes.slice(0, 3).map(n => n.id),
        confidence: 0.6,
        actionable: 'Reflect on how these concepts relate to your dominant themes.',
      });
    }

    return insights;
  }, [getDominantThemes, getNeglectedConcepts, getEmergingClusters, graph]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalNodes = graph.nodes.length;
    const totalEdges = graph.edges.length;
    const avgConnections = totalNodes > 0 
      ? totalEdges * 2 / totalNodes  // Each edge connects 2 nodes
      : 0;
    
    // Graph density: actual edges / possible edges
    const possibleEdges = totalNodes * (totalNodes - 1) / 2;
    const graphDensity = possibleEdges > 0 ? totalEdges / possibleEdges : 0;

    // Find dominant domain
    const domainCounts = new Map<KnowledgeDomain, number>();
    graph.nodes.forEach(node => {
      domainCounts.set(node.domain, (domainCounts.get(node.domain) || 0) + node.weight);
    });
    
    let dominantDomain: KnowledgeDomain | null = null;
    let maxCount = 0;
    domainCounts.forEach((count, domain) => {
      if (count > maxCount) {
        maxCount = count;
        dominantDomain = domain;
      }
    });

    return {
      totalNodes,
      totalEdges,
      avgConnections: Math.round(avgConnections * 10) / 10,
      graphDensity: Math.round(graphDensity * 100) / 100,
      dominantDomain,
    };
  }, [graph]);

  const value: KnowledgeGraphContextType = {
    graph,
    graphData,
    intents,
    timeRange,
    setTimeRange,
    domainFilter,
    setDomainFilter,
    addNode,
    updateNode,
    getNode,
    addEdge,
    updateEdge,
    extractAndAddConcepts,
    addIntent,
    updateIntent,
    getIntent,
    getNodeDetails,
    getDominantThemes,
    getNeglectedConcepts,
    getEmergingClusters,
    analyzeWithJADE,
    stats,
  };

  return (
    <KnowledgeGraphContext.Provider value={value}>
      {children}
    </KnowledgeGraphContext.Provider>
  );
};

export const useKnowledgeGraph = (): KnowledgeGraphContextType => {
  const context = useContext(KnowledgeGraphContext);
  if (!context) {
    throw new Error('useKnowledgeGraph must be used within a KnowledgeGraphProvider');
  }
  return context;
};

export default KnowledgeGraphContext;
