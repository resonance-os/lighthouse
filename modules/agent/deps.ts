// modules/app-api/deps.ts（修正版）
export { serve } from "https://deno.land/std@0.224.0/http/server.ts";
export { ulid } from "https://deno.land/std@0.224.0/ulid/mod.ts";
export { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";

// ルータは軽量に自前実装 or 小粒URLモジュールにする
export type Handler = (req: Request) => Response | Promise<Response>;
export function createRouter() {
  const routes: [string, string, Handler][] = [];
  const add = (m: string, p: string, h: Handler) => {
    routes.push([m, p, h]);
    return api;
  };
  const api = {
    get: (p: string, h: Handler) => add("GET", p, h),
    post: (p: string, h: Handler) => add("POST", p, h),
    route: (req: Request) => {
      const url = new URL(req.url);
      const hit = routes.find(
        ([m, p]) => m === req.method && p === url.pathname
      );
      return hit ? hit[2](req) : new Response("Not Found", { status: 404 });
    },
  };
  return api;
}
