// modules/emmy/types.ts
export type ChatInput = {
  input: string;
  sessionId?: string;
  author?: string;
};

export type ChatOutput = {
  output: string;
  timestamp: number;
  observationId: string;
};

export type EmmyResponse = {
  success: true;
  data: ChatOutput;
};

export type ErrorResponse = {
  success: false;
  error: string;
  code: string;
};
