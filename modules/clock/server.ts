// modules/hana/server.ts
import { serve } from "./deps.ts";
import { createRouter } from "./router.ts";
import { jitter } from "./lib/rng.ts";

const port = Number(Deno.env.get("HANA_PORT") || 8081);

console.log(`✅ Hana server starting on :${port}`);
console.log(`💡 Access:`);
console.log(`   - POST http://localhost:${port}/teach`);

const RNG_SEED = Number(process.env.RNG_SEED ?? 1);
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(RNG_SEED);
export const jitter = (ms: number, j: number) =>
  j <= 0 ? ms : Math.max(0, ms + Math.floor(rand() * (j * 2 + 1)) - j);

await serve(createRouter(), { port });
