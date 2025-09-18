// modules/ssot/adapters/ssot_sqlite.ts
import { DB } from "jsr:@db/sqlite@^0.11";
import type { Observation, OutboxItem, SSOT } from "../types.ts";

const db = new DB("./data/ssot.db");
db.exec(`
CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY, t TEXT NOT NULL, type TEXT NOT NULL, payload TEXT
);
CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL, created_at INTEGER NOT NULL
);
`);

export const sqliteSSOT: SSOT = {
  async appendObservation(o) {
    db.run(
      "INSERT OR REPLACE INTO observations(id,t,type,payload) VALUES (?,?,?,?)",
      o.id,
      o.t,
      o.type,
      JSON.stringify(o.payload ?? null)
    );
  },
  async loadTimeline() {
    return [
      ...db.query("SELECT id,t,type,payload FROM observations ORDER BY t ASC"),
    ].map(([id, t, type, payload]) => ({
      id,
      t,
      type,
      payload: payload ? JSON.parse(String(payload)) : null,
    })) as Observation[];
  },
  async replaceTimeline(tl) {
    const tx = db.transaction(() => {
      db.exec("DELETE FROM observations");
      for (const o of tl)
        db.run(
          "INSERT INTO observations(id,t,type,payload) VALUES (?,?,?,?)",
          o.id,
          o.t,
          o.type,
          JSON.stringify(o.payload ?? null)
        );
    });
    tx();
  },
  async enqueueOutbox(i) {
    db.run(
      "INSERT OR REPLACE INTO outbox(id,kind,payload,created_at) VALUES (?,?,?,?)",
      i.id,
      i.kind,
      JSON.stringify(i.payload ?? null),
      i.createdAt
    );
  },
  async nextOutbox() {
    const r = db
      .query(
        "SELECT id,kind,payload,created_at FROM outbox ORDER BY created_at ASC LIMIT 1"
      )
      .next();
    if (r.done) return null;
    const [id, kind, payload, created_at] = r.value;
    return {
      id,
      kind,
      payload: JSON.parse(String(payload)),
      createdAt: Number(created_at),
    } as OutboxItem;
  },
  async ackOutbox(id) {
    db.run("DELETE FROM outbox WHERE id = ?", id);
  },
};
