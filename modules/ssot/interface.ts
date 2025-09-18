// modules/ssot/interface.ts
export type Observation = {
  id: string;
  t: string;
  type: string;
  payload?: unknown;
  meta?: unknown;
};
// ... 他の型定義

export interface ISSOTDriver {
  append(obs: Observation): Promise<void>;
  loadAll(): Promise<Observation[]>;
  replaceAll(timeline: Observation[]): Promise<void>;
}

// modules/ssot/adapters/ndjson.ts
import { type ISSOTDriver, type Observation } from "../interface.ts";
const DB_PATH = "./data/events.ndjson";
export class NdjsonDriver implements ISSOTDriver {
  async append(obs: Observation) {
    /* ...実装... */
  }
  async loadAll(): Promise<Observation[]> {
    /* ...実装... */
  }
  async replaceAll(timeline: Observation[]) {
    /* ...実装... */
  }
}

// modules/ssot/adapters/kv.ts
/// <reference lib="deno.unstable" />
import { type ISSOTDriver, type Observation } from "../interface.ts";
export class KvDriver implements ISSOTDriver {
  #kv = await Deno.openKv();
  async append(obs: Observation) {
    /* ...実装... */
  }
  // ...
}

// modules/ssot/adapters/sqlite.ts
import { DB } from "jsr:@db/sqlite@^0.11";
import { type ISSOTDriver, type Observation } from "../interface.ts";
export class SqliteDriver implements ISSOTDriver {
  #db = new DB("./data/ssot.db");
  async append(obs: Observation) {
    /* ...実装... */
  }
  // ...
}

// modules/ssot/index.ts (ドライバを選択してエクスポート)
import { type ISSOTDriver } from "./interface.ts";
import { NdjsonDriver } from "./adapters/ndjson.ts";
import { KvDriver } from "./adapters/kv.ts";
import { SqliteDriver } from "./adapters/sqlite.ts";

function createDriver(): ISSOTDriver {
  const driverType = Deno.env.get("SSOT_DRIVER") ?? "ndjson";
  switch (driverType) {
    case "kv":
      return new KvDriver();
    case "sqlite":
      return new SqliteDriver();
    default:
      return new NdjsonDriver();
  }
}
export const ssotDriver = createDriver();
