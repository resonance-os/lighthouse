# API Spec

本仕様は **Ingress（Boundary）** と **Agent** の最小 API を定義します。  
エラーは原則 `{ error: string, code?: string }` で返却します。

---

## 共通

- Base URL: `http://127.0.0.1:{INGRESS_PORT}`（既定: 8787）
- Content-Type: `application/json`
- 署名（任意・推奨）
  - `x-actor-id`: 発信者 ID
  - `x-actor-ts`: 送信 UNIX 時刻（ms）
  - `x-actor-signature`: `sha256={HMAC}`（ボディを鍵で HMAC 署名）

---

## 型

### Observation

```ts
type Observation = {
  id: string; // 一意ID
  t: string; // ISO8601（例: "2025-01-01T00:00:00Z"）
  type: string; // "add" | "tick" | "LLM_CALL.request" | "LLM_CALL.response" など
  payload?: unknown; // 任意
  provenance?: Record<string, unknown>; // 署名・発信元など
};
```

### State（例）

```ts
type State = {
  counter: number;
};
```

---

## Ingress

### `GET /healthz`

- 200 OK → `"OK"`

### `POST /observation`

- 入力: `Observation`
- 204 No Content
- 422 Unprocessable Entity（契約違反）
- 401/403（署名検証エラーを採用する場合）

**例**

```http
POST /observation
content-type: application/json

{
  "id": "1",
  "t": "2025-01-01T00:00:00Z",
  "type": "add",
  "payload": { "n": 1 }
}
```

### `GET /events`（SSE）

- `Content-Type: text/event-stream`
- イベント: `data: {state}\n\n`
- 200 OK（ストリーム）

**受信例（curl）**

```sh
curl -N http://127.0.0.1:8787/events
```

### `GET /snapshot`

- 200 OK
- 返却:

  - パターン A: `{ data: { observations: Observation[], count: number } }`
  - パターン B: `{ timeline: Observation[], state: State }`
    （実装に合わせてどちらかを採用）

**例**

```json
{
  "data": {
    "observations": [
      {
        "id": "1",
        "t": "2025-01-01T00:00:00Z",
        "type": "add",
        "payload": { "n": 1 }
      }
    ],
    "count": 1
  }
}
```

### `POST /replay`

- 入力: `{ timeline: Observation[] }`（または `{ observations: Observation[] }`）
- 挙動: 履歴を置換 → 状態を再計算
- 200 OK: `{ success: true }`

---

## Agent（Emmy）

### `POST /chat`

- 入力: `{ "prompt": string, "author"?: string, "sessionId"?: string }`
- 挙動:

  1. `LLM_CALL.request` を **Observation** として保存
  2. **Outbox** に enqueue
  3. ワーカーが実行し、`LLM_CALL.response` を Observation として保存

- 202 Accepted: `{ ok: true, id: "<request-id>" }`

**例**

```http
POST /chat
content-type: application/json

{ "prompt": "こんにちは。要約して" }
```

**保存される観測（例）**

```json
{"id":"req-123","t":"2025-01-01T00:00:03Z","type":"LLM_CALL.request","payload":{"prompt":"こんにちは。要約して"}}
{"id":"res-456","t":"2025-01-01T00:00:03Z","type":"LLM_CALL.response","payload":{"requestId":"req-123","output":"…"}}
```

---

## ステータスコード

- 2xx: 正常（204 はボディなし）
- 4xx: クライアントエラー（400/401/403/422）
- 429: レート制限（採用する場合）
- 5xx: サーバエラー

---

## セキュリティ（推奨）

- Gate で HMAC 署名（`x-actor-*`）と時刻許容差（±5 分）
- Idempotency-Key（重複 POST 対策）を導入可能
- Deno 権限：`--allow-net --allow-read --allow-write --allow-env` を最小化

---

## 互換性/バージョニング

- `Observation` 契約は後方互換を基本方針に、破壊的変更時は `type` を新設
- エンドポイントは `/v{major}` を付ける運用も可能（例: `/v1/observation`）
