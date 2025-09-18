// modules/app-api/handlers/replay.ts
import type { Handler } from "../deps.ts";
const PATH = "../../ssot/.data/events.ndjson";

export const handleReplay: Handler = async (req) => {
  try {
    const { timeline = [] } = await req.json();
    const body =
      (timeline as unknown[]).map((o) => JSON.stringify(o)).join("\n") + "\n";
    await Deno.mkdir("./data", { recursive: true }).catch(() => {});
    await Deno.writeTextFile(PATH, body);
    return Response.json({ ok: true });
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
};
