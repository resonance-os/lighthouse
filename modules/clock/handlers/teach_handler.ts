// modules/hana/handlers/teach_handler.ts
import type { Handler } from "../deps.ts";
import type {
  TeachInput,
  Observation,
  HanaResponse,
  ErrorResponse,
} from "../types.ts";

// ローカルに保存するファイルパス
const DB_PATH = "./data/observations.json";

// 初期化
await ensureDir("./data");
if (!(await fileExists(DB_PATH))) {
  await Deno.writeTextFile(DB_PATH, "[]");
}

const handleTeach: Handler = async (req): Promise<Response> => {
  try {
    const input: TeachInput = await req.json();

    if (!input.nodeId || !input.author || !input.payload) {
      const error: ErrorResponse = {
        success: false,
        error: "nodeId, author, payload are required",
        code: "BAD_INPUT",
      };
      return Response.json(error, { status: 400 });
    }

    // 現在の観測を読み込み
    const file = await Deno.readTextFile(DB_PATH);
    const observations: Observation[] = JSON.parse(file);

    // 新しい観測を作成
    const newObs: Observation = {
      id: ulid(),
      nodeId: input.nodeId,
      author: input.author,
      payload: input.payload,
      tags: input.tags,
      createdAt: Date.now(),
    };

    // 保存
    observations.push(newObs);
    await Deno.writeTextFile(DB_PATH, JSON.stringify(observations, null, 2));

    const res: HanaResponse<Observation> = { success: true, data: newObs };
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

export { handleTeach };
