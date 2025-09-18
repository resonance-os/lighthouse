// modules/app-api/handlers/observation_handler.ts
import type { Handler } from "../deps.ts";
import type {
  CreateObservationInput,
  Observation,
  ObservationConnection,
  ApiResponse,
  ErrorResponse,
} from "../types.ts";

// ローカルストレージ（将来的にHanaと連携）
const DB_PATH = "./data/observations.json";

// 初期化
await ensureDir("./data");
if (!(await fileExists(DB_PATH))) {
  await Deno.writeTextFile(DB_PATH, "[]");
}

// 観測登録
const handleCreateObservation: Handler = async (req): Promise<Response> => {
  try {
    const input: CreateObservationInput = await req.json();

    if (!input.nodeId || !input.author || !input.payload) {
      const error: ErrorResponse = {
        success: false,
        error: "nodeId, author, payload are required",
        code: "BAD_INPUT",
      };
      return Response.json(error, { status: 400 });
    }

    const file = await Deno.readTextFile(DB_PATH);
    const observations: Observation[] = JSON.parse(file);

    const newObs: Observation = {
      id: ulid(),
      nodeId: input.nodeId,
      author: input.author,
      payload: input.payload,
      tags: input.tags,
      createdAt: Date.now(),
    };

    observations.push(newObs);
    await Deno.writeTextFile(DB_PATH, JSON.stringify(observations, null, 2));

    const res: ApiResponse<Observation> = { success: true, data: newObs };
    return Response.json(res);
  } catch (err) {
    const error: ErrorResponse = {
      success: false,
      error: err instanceof Error ? err.message : "unknown error",
      code: "INTERNAL_ERROR",
    };
    return Response.json(error, { status: 500 });
  }
};

// 観測取得（nodeIdでフィルタ）
const handleGetObservations: Handler = async (req): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const nodeId = url.searchParams.get("nodeId");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const cursor = url.searchParams.get("cursor");

    if (!nodeId) {
      const error: ErrorResponse = {
        success: false,
        error: "nodeId is required",
        code: "BAD_INPUT",
      };
      return Response.json(error, { status: 400 });
    }

    const file = await Deno.readTextFile(DB_PATH);
    let observations: Observation[] = JSON.parse(file);

    // nodeIdでフィルタ
    observations = observations
      .filter((o) => o.nodeId === nodeId)
      .sort((a, b) => b.createdAt - a.createdAt);

    // カーソル処理（簡易版）
    if (cursor) {
      const index = observations.findIndex((o) => o.id === cursor);
      if (index !== -1) {
        observations = observations.slice(index + 1);
      }
    }

    const hasMore = observations.length > limit;
    const data = observations.slice(0, limit);

    const connection: ObservationConnection = {
      observations: data,
      cursor: hasMore ? data[data.length - 1].id : undefined,
      hasMore,
    };

    const res: ApiResponse<ObservationConnection> = {
      success: true,
      data: connection,
    };
    return Response.json(res);
  } catch (err) {
    const error: ErrorResponse = {
      success: false,
      error: err instanceof Error ? err.message : "unknown error",
      code: "INTERNAL_ERROR",
    };
    return Response.json(error, { status: 500 });
  }
};

// ファイル存在チェック
async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) return false;
    throw err;
  }
}

export { handleCreateObservation, handleGetObservations };
