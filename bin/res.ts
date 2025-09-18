#!/usr/bin/env -S deno run --allow-net
const BASE = Deno.env.get("APP_API_URL") ?? "http://127.0.0.1:8787";

// 1) 観測を1件ポスト
await fetch(`${BASE}/event`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    t: new Date().toISOString(),
    type: "add",
    payload: { n: 1 },
  }),
});

// 2) SSEを1回だけ受けて表示して終わり
const res = await fetch(`${BASE}/events`);
const reader = res.body!.getReader();
const dec = new TextDecoder();
let buf = "";
for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  buf += dec.decode(value, { stream: true });
  const m = buf.match(/data:\s*(.+)\n\n/);
  if (m) {
    console.log("STATE >", m[1]);
    break;
  }
}
reader.cancel();
