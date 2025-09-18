# Context Standards (Observation / State / Provenance)

Resonance OS / Lighthouse の **契約（Contract）** を統一し、**決定的リプレイ**を保証するための規約集。

## 1. Observation（観測）の基本形

```ts
type Observation = {
  id: string; // 一意ID（UUID v4 推奨）
  t: string; // ISO 8601 (e.g. "2025-01-01T00:00:00.000Z")
  type: string; // "namespace.action" or well-known type
  payload?: unknown; // 追加データ（決定化済み）
  provenance?: {
    source?: string; // 生成主体（例: "ingress", "agent.emmy", "clock"）
    actorId?: string; // 署名者/送信者ID
    sig?: string; // 署名値（HMACやEd25519など）
    ts?: number; // 署名時刻（ms since epoch）
    hash?: string; // ボディのハッシュ（hex）
    [k: string]: unknown;
  };
};
```

### 必須

- `id`: `crypto.randomUUID()` による UUID v4 を既定とする
- `t`: ISO 8601 の UTC。ミリ秒まで含める（`new Date().toISOString()`）
- `type`: `namespace.action` 形式を基本（例: `user.added`, `sys.tick`, `llm.request`）

### 任意

- `payload`: **非決定要素はここで固定化**してから保存（例: LLM の応答テキスト）
- `provenance`: 署名や発信元などのメタ情報

> **原則**：非決定な情報（乱数・現在時刻・LLM 応答・外部 API 結果）は **必ず Observation に固定化** してから Core に渡す。

---

## 2. State（状態）の原則

```ts
type State = {
  counter: number;
  // プロジェクションやメトリクスは別途 Projection として追加可能
};
```

- **Core は純粋関数**：`next = reduce(prev, observation)`
- **I/O 禁止**：外部状態やネットワークに依存しないこと
- **決定性**：同じ履歴（Observation 列）から、常に同じ結果（State）を導出できること

---

## 3. Type 命名規約（namespace）

- `sys.*` …… システムイベント（`sys.tick`, `sys.replay.started`, …）
- `ingress.*` …… 境界で生成されたイベント（正規化・検証結果など）
- `llm.request` / `llm.response` …… Agent（Emmy）の Outbox 起点/終点
- `user.*` / `git.*` / `release.*` …… 外界からの具体的なトピック
- `actor.*` …… 内部アクタの動作ログ（必要なら）

> ※ 新設時は簡潔＋衝突しない名前空間を採用。破壊的変更は **新しい type 名** として追加する。

---

## 4. Deterministic Replay の要件

1. **非決定要素を Observation へ固定化**

   - 例：LLM 応答は `llm.response.payload.output` に **テキスト本文** を保存

2. **Clock のジッタ決定化**

   - `RNG_SEED` を環境変数で固定し、Tick 系の揺れを再現可能に

3. **SSOT は append-only**

   - Replay（置換）は **明示的 API**（`POST /replay`）のみ

4. **Outbox は単一の実行点**

   - Agent のワーカーのみが外部 I/O を実行し、結果を Observation として保存

---

## 5. Provenance（署名・整合性）

- 署名ヘッダ例（Ingress/Gate）

  - `x-actor-id`, `x-actor-ts`, `x-actor-signature`（`sha256=...`）

- `provenance` に `actorId`, `sig`, `ts` を写す場合は **署名対象のカノニカル化**（JSON canonical）を固定化すること
- `hash` は `sha256(payload JSON string)` などで OK（監査用）

---

## 6. 互換性ポリシー

- 既存 type を破壊的変更しない
- 変更が必要な場合は **新しい type 名** を導入する
- 旧 type の読み取り互換を Core に残し、移行期を確保

---

## 7. 例

```json
{
  "id": "e511adee-5d4b-483f-9d88-7a8f6c1c9d7b",
  "t": "2025-09-18T00:00:00.000Z",
  "type": "llm.response",
  "payload": { "requestId": "b0f7...", "output": "要約: ..." },
  "provenance": { "source": "agent.emmy" }
}
```
