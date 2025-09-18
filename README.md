# Resonance OS / Lighthouse

> **最小縦スライス**で「観測 → SSOT → 純計算 → 行為（通知）」を実現し、  
> **決定的リプレイ**（Deterministic Replay）と**契約駆動**でプロダクトの再現性を保証する実験的 OS。

このリポジトリは、以下の 4 役を分離して実装します：

- **Ingress（旧 Membrane）**: 外界 I/O の境界。受信・検証・正規化・SSOT への append、SSE 配信を担当
- **Core（旧 Kernel）**: 純粋関数（副作用ゼロ）。`reduce(state, observation)` だけで状態を導出
- **Clock（Hana）**: 観測の拍動（tick）。`RNG_SEED` で**決定化ジッタ**を実現（デモ・検証用）
- **Agent（Emmy）**: 人/LLM など**非決定チャネル**を Outbox パターンで決定化（request/response を観測として記録）
- **SSOT**: 事実（Observation）と Outbox を保存する唯一の真実源（NDJSON/KV/SQLite の 3 実装切替）

---

## なぜこれを作るか

- 「**決定的リプレイ**」…乱数・時刻・LLM 応答などの非決定要素を**観測（Observation）**として固定化。履歴から**同じ状態**を再計算できる。
- 「**最小縦スライス**」…`/observation` に 1 件投げるだけで、`/events`（SSE）に**状態**が流れ、`/snapshot` で履歴が取得できる。
- 「**契約駆動**」… I/O は Ingress の Gate で**必ず検証**。Core は**契約に従った純計算**だけを行う。

---

## クイックスタート

### 0) 依存

- Deno v1.45+（TS/ESM・Web API 準拠）
- （任意）`OPENAI_API_KEY`（Agent で LLM を叩くとき）

### 1) 起動（最小・NDJSON ドライバ）

```bash
# Ingress（HTTP/SSE）
deno run -A modules/ingress/server.ts

# 別ターミナル：Clock（決定化されたtickを発生）
RNG_SEED=42 deno run -A modules/clock/server.ts

# （任意）Agent Outbox ワーカー
OPENAI_API_KEY=... deno run -A modules/agent/server.ts
```

### 2) 一枚技（観測 →SSE）

```bash
# 1件の観測をPOST
curl -X POST http://127.0.0.1:8787/observation \
  -H 'content-type: application/json' \
  -d '{"id":"1","t":"2025-09-18T12:00:00Z","type":"add","payload":{"n":1}}'

# SSE で state を受信（別端末）
curl -N http://127.0.0.1:8787/events

# 現在のスナップショット
curl -s http://127.0.0.1:8787/snapshot | jq .
```

### 3) リプレイ（決定的再現）

```bash
# 現在の履歴を取得
curl -s http://127.0.0.1:8787/snapshot > /tmp/snap.json

# timeline だけ残して /replay に渡す（状態が完全一致することを確認）
jq '{timeline: .data.observations // .timeline // []}' /tmp/snap.json \
| curl -s -X POST http://127.0.0.1:8787/replay -H 'content-type: application/json' -d @- | jq .
```

---

## API（最小セット）

- `GET /healthz` … Liveness
- `GET /events` … SSE（`data: {state}` が流れる）
- `POST /observation` … 観測の append（Ingress が検証 →SSOT へ保存 →Core で状態更新）
- `GET /snapshot` … `{ observations, count }`（または `{ timeline, state }`）
- `POST /replay` … `{ timeline: Observation[] }` を受け取り、履歴を置換 → 状態を再計算
- `POST /chat`（Agent） … `{ prompt }` を Outbox に積む → ワーカーが LLM を叩き `LLM_CALL.response` を観測として保存

> **Observation（観測）**は必ず **`{ id, t(ISO8601), type, payload?, provenance? }`** の形。
> 非決定要素（時刻・乱数・LLM 応答）は**観測**として固定化してから Core に渡す。

---

## 設定（環境変数）

- `INGRESS_PORT`（既定: `8787`）
- `SSOT_DRIVER`：`ndjson`｜`kv`｜`sqlite`（既定: `ndjson`）
- `RNG_SEED`：Clock のジッタ決定化用（任意。指定推奨）
- `OPENAI_API_KEY`：Agent で LLM を叩くとき

---

## ディレクトリ

```
modules/
  ├─ ingress/   # Boundary: port/gate/ledger/push（HTTP, 検証, append, SSE）
  ├─ core/      # 純計算：reduce/measure/guardrails/gradient
  ├─ clock/     # 決定化tick（seeded jitter）
  ├─ agent/     # Outboxワーカー（LLM等の非決定を決定化）
  └─ ssot/      # NDJSON/KV/SQLite ドライバと共通IF
```

---

## 不変条件（Invariants）

1. **SSOT は append-only**（リプレイは別系として `replaceTimeline` を明示的に実行）
2. **Core は純粋関数のみ**（I/O 禁止）
3. **Ingress が唯一の書き込み者**（検証 → 正規化 →SSOT append）
4. **非決定の外部 I/O は Agent のみ**（Outbox 経由）
5. **契約は 1 ヶ所**（`modules/shared/contracts`）で定義・共有

---

## ランタイム選定：なぜ Deno？

- TS/ESM を**素で実行**、**Web API 準拠**、**権限モデル**が強く、Boundary の責務と相性がよい
- 依存を増やさずに **SSE/KV/SQLite** 等を小さく書ける
- `deno compile` で **単体バイナリ配布**が可能（CLI やワーカーに向く）

> Node/Turbo 生態系は強力。ただしこのプロジェクトでは「再現性・契約・最小縦スライス」を先に固めたい。**いま学ぶなら Deno の投資対効果が高い**という判断。

---

## ライセンス

MIT
