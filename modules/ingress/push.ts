// modules/ingress/push.ts
import { ServerSentEventStream } from "https://deno.land/std@0.224.0/http/server_sent_event_stream.ts";
// TODO: Update the import path to the correct location of reduce.ts or create the file if missing
// import { currentState } from "../../core/reduce.ts"; // ← reduce済みstateを返す関数を用意しておく想定
// Update the path below to the actual location of reduce.ts in your project
import { currentState } from "../../core/reduce.ts";

export function createSseStream() {
  // Implement the function or provide a stub
  const stream = new ReadableStream();
  const response = new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
  return { stream, response };
}

export function notifyUpdate() {
  // Implement the function or leave as a stub
}

const bc = new BroadcastChannel("state"); // ローカル通知
export function sseStream() {
  const stream = new ReadableStream({
    start(ctrl) {
      const push = () =>
        ctrl.enqueue(`data: ${JSON.stringify(currentState())}\n\n`);
      push();
      const h = () => push();
      bc.addEventListener("message", h);
      // close on cancel
      // deno-lint-ignore no-explicit-any
      (ctrl as any).signal?.addEventListener?.("abort", () =>
        bc.removeEventListener("message", h)
      );
    },
  })
    .pipeThrough(new TextEncoderStream())
    .pipeThrough(new ServerSentEventStream());
  return stream;
}
export function ack() {
  bc.postMessage("update");
}
