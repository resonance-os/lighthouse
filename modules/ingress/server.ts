// modules/ingress/router.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { type Handler } from "./deps.ts"; // あなたの型定義に合わせて
import { validateObservation } from "./gate.ts";
import { appendObservation, getSnapshot, replaceTimeline } from "./ledger.ts";
import { createSseStream, notifyUpdate } from "./push.ts";

// ルーティング: 特定のパスとメソッドに、特定のハンドラを割り当てる
function route(req: Request): Promise<Response> | Response {
  const url = new URL(req.url);
  const { pathname, method } = url;

  if (method === "GET" && pathname === "/healthz") {
    return new Response("OK");
  }

  // SSE (Server-Sent Events) のためのエンドポイント
  if (method === "GET" && pathname === "/events") {
    const { stream, response } = createSseStream();
    // ここでstreamをどこかに保持し、更新を通知できるようにする
    return response;
  }

  // 観測データを受け取るエンドポイント
  if (method === "POST" && pathname === "/observation") {
    return (async () => {
      const obs = await req.json();

      // Gate: 契約の即時検証
      const validation = validateObservation(obs);
      if (!validation.valid) {
        return Response.json({ error: validation.error }, { status: 422 });
      }

      // Ledger: SSOTへの追記
      await appendObservation(obs);

      // Push: SSEリスナーに更新を通知
      notifyUpdate();

      return new Response(null, { status: 204 });
    })();
  }

  // 状態のスナップショットを取得
  if (method === "GET" && pathname === "/snapshot") {
    return getSnapshot();
  }

  // 状態で履歴をリプレイ
  if (method === "POST" && pathname === "/replay") {
    const body = await req.json().catch(() => ({}));
    await replaceTimeline(body?.timeline ?? []);
    notifyUpdate();
    return Response.json({ success: true });
  }

  return new Response("Not Found", { status: 404 });
}

// Add this export if not present
export function validateObservation(obs: any): { valid: boolean; error?: string } {
  // Implement your validation logic here
  if (!obs) {
    return { valid: false, error: "Observation is required" };
  }
  // Example: always valid
  return { valid: true };
}

export function startIngress(port = 8787) {
  console.log(`[ingress] HTTP server listening on http://127.0.0.1:${port}`);
  return serve(route, { port });
}
