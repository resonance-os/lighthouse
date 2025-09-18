// modules/app-api/deps.ts（修正版）
export { serve } from "https://deno.land/std@0.224.0/http/server.ts";
export { ulid } from "https://deno.land/std@0.224.0/ulid/mod.ts";
export { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";

export type Handler = (req: Request) => Response | Promise<Response>;

// minimal router
export function createRouterBase() {
  const routes: Array<{ method: string; path: string; handler: Handler }> = [];
  const add = (method: string, path: string, handler: Handler) => {
    routes.push({ method, path, handler });
    return api;
  };
  const api = {
    get: (path: string, handler: Handler) => add("GET", path, handler),
    post: (path: string, handler: Handler) => add("POST", path, handler),
    route: (req: Request) => {
      const url = new URL(req.url);
      const found = routes.find(
        (r) => r.method === req.method && r.path === url.pathname
      );
      return found
        ? found.handler(req)
        : new Response("Not Found", { status: 404 });
    },
  };
  return api;
}
