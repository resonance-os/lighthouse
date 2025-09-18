export { ulid } from "https://deno.land/std@0.224.0/ulid/mod.ts";
export { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";

export type Handler = (req: Request) => Response | Promise<Response>;

// ルートルーターの作成
const rootRouter = new URLPattern({ pathname: "/" });
const apiRouter = new URLPattern({ pathname: "/api/*" });

// リクエストをルーティング
const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  // /healthz は共通
  if (url.pathname === "/healthz") {
    return new Response("OK", { status: 200 });
  }

  // /emmy はEmmyルーター
  if (url.pathname.startsWith("/emmy")) {
    return createEmmyRouter()(req);
  }

  // /hana はHanaルーター
  if (url.pathname.startsWith("/hana")) {
    return createHanaRouter()(req);
  }

  // /api はapp-apiルーター
  if (apiRouter.exec(req)) {
    return createApiRouter()(req);
  }

  // ルートはEmmyに
  if (rootRouter.exec(req)) {
    return createEmmyRouter()(req);
  }

  // GET /snapshot
  if (req.url === "/snapshot") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ timeline, state }));
    return;
  }

  // POST /replay
  if (req.method === "POST" && req.url === "/replay") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const { timeline: tl = [] } = JSON.parse(body || "{}");
        state = initialState();
        for (const obs of tl) state = reduce(state, obs);
        bus.emit("state");
        res
          .writeHead(200, { "Content-Type": "application/json" })
          .end(JSON.stringify({ ok: true, state }));
      } catch {
        res.writeHead(400).end();
      }
    });
    return;
  }

  return new Response("Not Found", { status: 404 });
};

// サーバー起動
const port = Number(Deno.env.get("PORT") || 8080);

console.log(`🚀 Resonance-OS starting on :${port}`);
console.log(``);
console.log(`📌 Endpoints:`);
console.log(`   - GET  /healthz`);
console.log(`   - POST /emmy/chat`);
console.log(`   - POST /hana/teach`);
console.log(`   - POST /api/observation`);
console.log(``);
console.log(`✅ Ready. Waiting for resonance...`);

await serve(handler, { port });
