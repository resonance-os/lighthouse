import { ServerSentEventStream } from "jsr:@std/http/server-sent-event-stream";

export function sseResponse(data: unknown) {
  const stream = ReadableStream.from([
    { data: JSON.stringify(data) },
  ]).pipeThrough(new ServerSentEventStream());
  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    },
  });
}
