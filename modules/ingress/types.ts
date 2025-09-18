// modules/app-api/types.ts
// 将来的に `shared/types.ts` に移動可

export type Observation = {
  id: string;
  nodeId: string;
  author: string;
  payload: Record<string, unknown>;
  tags?: string[];
  createdAt: number;
};

export type CreateObservationInput = {
  nodeId: string;
  author: string;
  payload: Record<string, unknown>;
  tags?: string[];
};

export type ObservationConnection = {
  observations: Observation[];
  cursor?: string;
  hasMore: boolean;
};

export type ApiResponse<T> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  error: string;
  code: string;
};
