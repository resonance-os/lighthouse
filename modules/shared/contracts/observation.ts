export type Observation = {
  id: string;
  t: string;
  type: string;
  payload?: Record<string, unknown>;
  provenance?: Record<string, unknown>;
};
export type State = { counter: number };
