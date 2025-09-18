// modules/agent/handlers/chat_handler.ts
import {
  enqueueOutbox,
  nextOutbox,
  ackOutbox,
  appendObservation,
} from "../../ssot/index.ts";

type ChatReq = { prompt: string; author?: string; sessionId?: string };
type OutboxItem = {
  id: string;
  kind: "LLM_CALL.request";
  payload: ChatReq;
  createdAt: number;
};

// HTTP: 受け付け→Outboxへ
export async function handleChat(req: Request): Promise<Response> {
  const payload = (await req.json()) as ChatReq;
  const item: OutboxItem = {
    id: crypto.randomUUID(),
    kind: "LLM_CALL.request",
    payload,
    createdAt: Date.now(),
  };

  // 事実をまず記録（決定性の源）
  await appendObservation({
    id: item.id,
    t: new Date().toISOString(),
    type: item.kind,
    payload,
    provenance: { source: "agent.emmy" },
  });

  await enqueueOutbox(item);
  return Response.json({ ok: true, id: item.id }, { status: 202 });
}

// Worker: Outboxを唯一の実行点に
export async function runOutboxWorker() {
  console.log("[agent] outbox worker started");
  for (;;) {
    const item = await nextOutbox();
    if (!item) {
      await delay(300);
      continue;
    }

    try {
      const output = await callLLM(item.payload.prompt);
      await appendObservation({
        id: crypto.randomUUID(),
        t: new Date().toISOString(),
        type: "LLM_CALL.response",
        payload: { requestId: item.id, output },
        provenance: { source: "agent.emmy" },
      });
      await ackOutbox(item.id);
    } catch (e) {
      console.error("[agent] failed:", e);
      await delay(500);
    }
  }
}

async function callLLM(prompt: string): Promise<string> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) return `(dryrun) ${prompt}`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    }),
  });
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? "";
}
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
