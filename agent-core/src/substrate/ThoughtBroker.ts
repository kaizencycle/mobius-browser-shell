/**
 * PR-016 · ThoughtBroker
 * Pub/sub event mesh for swarm-wide agent communication.
 * Agents publish experiences and subscribe to topics for coordination.
 */
import { EventEmitter } from 'events';
import { OAAClient } from '../oaa/OAAClient';

export interface ThoughtMessage {
  topic: string;
  agentId: string;
  payload: unknown;
  timestamp: number;
  id: string;
}

type TopicHandler = (msg: ThoughtMessage) => void | Promise<void>;

export class ThoughtBroker extends EventEmitter {
  private readonly oaa: OAAClient;
  private readonly subscriptions = new Map<string, Set<TopicHandler>>();
  private messageCount = 0;

  constructor(oaa: OAAClient) {
    super();
    this.setMaxListeners(100);
    this.oaa = oaa;
  }

  subscribe(topic: string, handler: TopicHandler): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic)!.add(handler);
    // Do NOT call this.on() here — publish() drives delivery via the explicit
    // subscriptions map only. Mixing EventEmitter.on + manual map iteration
    // would invoke every handler twice per message.
    return () => this.unsubscribe(topic, handler);
  }

  unsubscribe(topic: string, handler: TopicHandler): void {
    this.subscriptions.get(topic)?.delete(handler);
    // Mirror removal from map only — no EventEmitter registration to clean up.
  }

  async publish(topic: string, agentId: string, payload: unknown): Promise<void> {
    const msg: ThoughtMessage = {
      topic,
      agentId,
      payload,
      timestamp: Date.now(),
      id: `${agentId}:${++this.messageCount}`,
    };

    // Persist to OAA for audit trail
    await this.oaa.append(`broker:log:${topic}`, msg);

    // Fan-out to explicit subscribers (topic-specific then wildcard).
    // Use the subscriptions map as the single delivery mechanism — do NOT
    // also call this.emit(), which would fire the same handlers a second time
    // for any consumer who subscribed via subscribe().
    const handlers = this.subscriptions.get(topic);
    if (handlers) {
      await Promise.allSettled([...handlers].map(h => Promise.resolve(h(msg))));
    }

    const wildcardHandlers = this.subscriptions.get('*');
    if (wildcardHandlers) {
      await Promise.allSettled([...wildcardHandlers].map(h => Promise.resolve(h(msg))));
    }
  }

  async getRecentMessages(topic: string, limit = 20): Promise<ThoughtMessage[]> {
    const raw = await this.oaa.get(`broker:log:${topic}`);
    if (!raw) return [];
    const all = JSON.parse(raw) as ThoughtMessage[];
    return all.slice(-limit);
  }

  getSubscriberCount(topic: string): number {
    return this.subscriptions.get(topic)?.size ?? 0;
  }
}
