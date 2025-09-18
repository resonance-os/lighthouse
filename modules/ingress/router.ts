// modules/ingress/router.ts
import { serve } from "jsr:@std/http@^1/server";
import { validateObservation } from "./gate.ts";
import { appendObservation, getSnapshot, replaceTimeline } from "./ledger.ts";
import { sseStream, notifyUpdate } from "./push.ts";

function route(req: Request): Response | Promise<Response> {
  const url = new URL(req.url);
  const { pathname, method } = url;

  if (method === "GET" && pathname === "/healthz") return new Response("OK");

  if (method === "GET" && pathname === "/events") {
    return new Response(sseStream(), {
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
        connection: "keep-alive",
      },
    });
  }

  if (method === "POST" && pathname === "/observation") {
    return (async () => {
      const obs = await req.json();
      const ok = validateObservation(obs);
      if (!ok.valid) return Response.json({ error: ok.error }, { status: 422 });
      await appendObservation(obs);
      notifyUpdate();
      return new Response(null, { status: 204 });
    })();
  }

  if (method === "GET" && pathname === "/snapshot") return getSnapshot();

  if (method === "POST" && pathname === "/replay") {
    return (async () => {
      const body = await req.json().catch(() => ({}));
      await replaceTimeline(body?.timeline ?? body?.observations ?? []);
      notifyUpdate();
      return Response.json({ success: true });
    })();
  }

  return new Response("Not Found", { status: 404 });
}

export function startIngress(
  port = Number(Deno.env.get("INGRESS_PORT") ?? 8787)
) {
  console.log(`[ingress] http://127.0.0.1:${port}`);
  return serve(route, { port });
}
