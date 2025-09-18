// modules/emmy/server.ts
import { serve } from "./deps.ts";
import { createRouter } from "./router.ts";

const port = Number(Deno.env.get("PORT") || 8080);

console.log(`✅ Emmy server starting on :${port}`);
console.log(`💡 Access:`);
console.log(`   - http://localhost:${port}/healthz`);
console.log(`   - POST http://localhost:${port}/chat`);

await serve(createRouter(), { port });
