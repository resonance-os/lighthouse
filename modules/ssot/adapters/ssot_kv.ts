// modules/ssot/adapters/ssot_kv.ts
/// <reference lib="deno.unstable" />
import type { Observation, OutboxItem, SSOT } from "../types.ts";
const kv = await Deno.openKv();

export const kvSSOT: SSOT = {
  async appendObservation(obs) {
    await kv.set(["obs", obs.id], obs);
    await kv.set(["obs_index", Date.now(), obs.id], true);
  },
  async loadTimeline() {
    const out: Observation[] = [];
    for await (const e of kv.list({ prefix: ["obs_index"] })) {
      const id = e.key[2] as string;
      const v = await kv.get<Observation>(["obs", id]);
      if (v.value) out.push(v.value);
    }
    return out;
  },
  async replaceTimeline(tl) {
    const tx = kv.atomic();
    for (const o of tl)
      tx.set(["obs", o.id], o).set(["obs_index", Date.now(), o.id], true);
    await tx.commit();
  },
  async enqueueOutbox(item) {
    await kv.set(["outbox", "pending", item.id], item);
    await kv.set(["outbox_index", Date.now(), item.id], true);
  },
  async nextOutbox() {
    for await (const e of kv.list({ prefix: ["outbox_index"] })) {
      const id = e.key[2] as string;
      const v = await kv.get<OutboxItem>(["outbox", "pending", id]);
      if (v.value) return v.value;
    }
    return null;
  },
  async ackOutbox(id) {
    await kv.delete(["outbox", "pending", id]);
    await kv.set(["outbox", "done", id], true);
  },
};
