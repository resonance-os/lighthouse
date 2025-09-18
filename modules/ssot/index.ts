// modules/ssot/index.ts
import type { SSOT } from "./types.ts";
import { ndjsonSSOT } from "./adapters/ssot_ndjson.ts";
import { kvSSOT } from "./adapters/ssot_kv.ts";
import { sqliteSSOT } from "./adapters/ssot_sqlite.ts";

const DRIVER = (Deno.env.get("SSOT_DRIVER") ?? "ndjson").toLowerCase();

let impl: SSOT;
switch (DRIVER) {
  case "kv":
    impl = kvSSOT;
    break;
  case "sqlite":
    impl = sqliteSSOT;
    break;
  default:
    impl = ndjsonSSOT;
}

// 再エクスポート（ingress/agent からはこれだけ使う）
export const {
  appendObservation,
  loadTimeline,
  replaceTimeline,
  enqueueOutbox,
  nextOutbox,
  ackOutbox,
} = impl;
