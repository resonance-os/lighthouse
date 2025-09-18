// modules/emmy/router.ts
import { createRouter } from "./deps.ts";
import { handleChat } from "./handlers/chat_handler.ts";

export const createRouter = () => {
  return createRouter()
    .post("/chat", handleChat)
    .get("/healthz", () => new Response("OK"))
    .get("/", () => new Response("Emmy is listening"));
};
