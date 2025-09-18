// modules/ssot/adapters/ssot_ndjson.ts
import type { Observation, OutboxItem, SSOT } from "../types.ts";

const ROOT = new URL("../.data/", import.meta.url);
const OBS = new URL("observations.ndjson", ROOT);
const OBQ = new URL("outbox.ndjson", ROOT);
const OBD = new URL("outbox_done/", ROOT);

await Deno.mkdir(ROOT, { recursive: true }).catch(() => {});
await Deno.mkdir(OBD, { recursive: true }).catch(() => {});

export const ndjsonSSOT: SSOT = {
  async appendObservation(obs) {
    await Deno.writeTextFile(OBS, JSON.stringify(obs) + "\n", { append: true });
  },
  async loadTimeline() {
    try {
      const text = await Deno.readTextFile(OBS);
      return text
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l));
    } catch {
      return [];
    }
  },
  async replaceTimeline(tl) {
    const body =
      tl.map((o) => JSON.stringify(o)).join("\n") + (tl.length ? "\n" : "");
    await Deno.writeTextFile(OBS, body);
  },

  async enqueueOutbox(item) {
    await Deno.writeTextFile(OBQ, JSON.stringify(item) + "\n", {
      append: true,
    });
  },
  async nextOutbox() {
    try {
      const text = await Deno.readTextFile(OBQ);
      for (const line of text.split("\n").filter(Boolean)) {
        const item = JSON.parse(line) as OutboxItem;
        try {
          await Deno.stat(new URL(`${item.id}.json`, OBD));
          continue;
        } catch {}
        return item;
      }
      return null;
    } catch {
      return null;
    }
  },
  async ackOutbox(id) {
    await Deno.writeTextFile(
      new URL(`${id}.json`, OBD),
      JSON.stringify({ id, t: Date.now() })
    );
  },
};
