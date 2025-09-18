// modules/app-api/handlers/snapshot.ts
import type { Handler } from "../deps.ts";
import { reduce } from "../../core/reduce.ts"; // ← あなたの実体に合わせて
type Obs = unknown; // 実体があるなら import へ差し替え

const PATH = "../../ssot/.data/events.ndjson";
const readAll = async (): Promise<Obs[]> => {
  try {
    const text = await Deno.readTextFile(PATH);
    return text
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  } catch {
    return [];
  }
};

export const handleSnapshot: Handler = async () => {
  const timeline = await readAll();
  // 初期stateの定義が別なら  { counter: 0 } を差し替え
  const state = (timeline as any[]).reduce(reduce as any, { counter: 0 });
  return Response.json({ timeline, state });
};
