// modules/hana/types.ts
export type Observation = {
  id: string;
  nodeId: string;
  author: string;
  payload: Record<string, unknown>;
  tags?: string[];
  createdAt: number;
};

export type TeachInput = {
  nodeId: string;
  author: string;
  payload: Record<string, unknown>;
  tags?: string[];
};

export type RetrieveInput = {
  nodeId: string;
  limit?: number;
  cursor?: string;
};

export type InferInput = {
  context: string[];
  prompt: string;
};

export type HanaResponse<T> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  error: string;
  code: string;
};
