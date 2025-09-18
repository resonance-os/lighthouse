// modules/ssot/types.ts
export type Observation = {
  id: string;
  t: string;
  type: string;
  payload?: unknown;
};
export type OutboxItem = {
  id: string;
  kind: string;
  payload: unknown;
  createdAt: number;
};

export interface SSOT {
  appendObservation(obs: Observation): Promise<void>;
  loadTimeline(): Promise<Observation[]>;
  replaceTimeline(tl: Observation[]): Promise<void>;

  enqueueOutbox(item: OutboxItem): Promise<void>;
  nextOutbox(): Promise<OutboxItem | null>;
  ackOutbox(id: string): Promise<void>;
}
