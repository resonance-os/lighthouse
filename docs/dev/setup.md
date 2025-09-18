# 開発セットアップ（最短）

## 前提

- Deno v1.45+（`deno --version` で確認）
- macOS/Linux/WSL いずれか
- （任意）OpenAI API キー：`OPENAI_API_KEY`

## 1. 依存インストール

```sh
# Deno（Homebrewの例）
brew install deno
# または公式インストーラ
# curl -fsSL https://deno.land/install.sh | sh
```

## 2. 環境ファイル

`.env.example` を参考に必要な環境変数を設定（シェルに export で OK）

- `INGRESS_PORT`（既定: 8787）
- `SSOT_DRIVER` = `ndjson` | `kv` | `sqlite`（既定: ndjson）
- `RNG_SEED`（任意だが推奨。tick のジッタを決定化）
- `OPENAI_API_KEY`（Agent で LLM を叩く場合）

## 3. 起動（最小・NDJSON）

```sh
# Ingress（HTTP/SSE）
deno task dev:ingress

# 別ターミナル：決定化Clock
RNG_SEED=42 deno task dev:clock

# （任意）Agent（Outbox workerも内包する実装ならこれだけ）
OPENAI_API_KEY=sk-... deno task dev:agent
# もしワーカー分離実装なら：
# deno task dev:agent:worker
```

## 4. 動作確認（一枚技）

```sh
# 観測を1件投入
curl -X POST http://127.0.0.1:8787/observation \
  -H 'content-type: application/json' \
  -d '{"id":"1","t":"2025-01-01T00:00:00Z","type":"add","payload":{"n":1}}'

# SSEで state を受信（別端末）
curl -N http://127.0.0.1:8787/events

# スナップショット
curl -s http://127.0.0.1:8787/snapshot | jq .
```

## 5. リプレイ（決定的再現）

```sh
curl -s http://127.0.0.1:8787/snapshot > /tmp/snap.json
jq '{timeline: .data.observations // .timeline // []}' /tmp/snap.json \
| curl -s -X POST http://127.0.0.1:8787/replay \
  -H 'content-type: application/json' -d @- | jq .
```

## 6. SSOT ドライバ切替

```sh
# SQLiteに切替
SSOT_DRIVER=sqlite deno task dev:ingress
# KVに切替（deno.json の "unstable": ["kv"] が必要）
SSOT_DRIVER=kv deno task dev:ingress
```

## 7. CLI

```sh
# 実行
deno task res -- help

# バイナリ配布
deno task build:cli
./dist/res --help
```

## 8. よくある落とし穴

- **ポート競合**：`INGRESS_PORT` を変更するか既存プロセスを落とす
- **KV 使用時の権限**：`deno.json` の `"unstable"` 設定と `--allow-env` が必要
- **相対パス問題**：SSOT の NDJSON アダプタは `import.meta.url` 基準で解決済み
- **SSE が 1 件で止まる**：クライアント側が `-N`（curl） or EventSource で継続読みにする
