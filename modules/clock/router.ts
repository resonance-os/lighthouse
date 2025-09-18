// modules/hana/router.ts
import { createRouterBase } from "./deps.ts";
import { handleTeach } from "./handlers/teach_handler.ts";

export const createRouter = () => {
  return createRouterBase()
    .post("/teach", handleTeach)
    .get("/healthz", () => new Response("OK"));
};
