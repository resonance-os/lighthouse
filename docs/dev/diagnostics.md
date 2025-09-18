# Diagnostics（SSE / Outbox / Replay）

開発中の “詰まり” を最短で解くためのチェックリスト。

---

## 1. ヘルスチェック

```sh
curl -i http://127.0.0.1:${INGRESS_PORT:-8787}/healthz
# 200 OK / "OK" が返ればサーバは生きている
```

- 返らない → ポート競合 or サーバ未起動
- CI では `--retry-connrefused --retry 10 --retry-delay 1` を付けて待つ

---

## 2. SSE の確認

### curl で確認

```sh
curl -N http://127.0.0.1:${INGRESS_PORT:-8787}/events
# data: {...} が継続して流れる。1件で止まる場合は -N が抜けている可能性
```

### ブラウザ / Node で確認

```js
const es = new EventSource("/events");
es.onmessage = (ev) => console.log("STATE", JSON.parse(ev.data));
```

### よくある落とし穴

- 逆プロキシ配下での **接続切断（タイムアウト）**
  → `Cache-Control: no-cache`, `Connection: keep-alive` ヘッダを確認
- 初回イベントが来ない
  → サーバ側で **接続直後に 1 回 push** しているか確認

---

## 3. Outbox（Agent）の確認

### 現在の Pending を見る（NDJSON ドライバ）

```sh
sed -n '1,120p' modules/ssot/.data/outbox.ndjson
ls -l modules/ssot/.data/outbox_done
```

- `outbox.ndjson` にリクエストが追記され、`outbox_done/` に ack ファイルができれば処理済み
- 進まない場合：

  - Agent ワーカーが起動していない（`deno task dev:agent` or `dev:agent:worker`）
  - OPENAI_API_KEY 未設定（乾燥実行の場合は `(dryrun)` が返る実装）
  - ネットワーク権限（`--allow-net`）不足

### KV/SQLite ドライバ

- KV: `deno repl` で `const kv = await Deno.openKv();` → `for await (const e of kv.list({prefix:["outbox","pending"]})) console.log(e);`
- SQLite: `sqlite3 ./data/ssot.db 'select * from outbox;'`

---

## 4. Replay の検証

```sh
# 1) 現在のスナップショット
curl -s http://127.0.0.1:${INGRESS_PORT:-8787}/snapshot > /tmp/snap.json

# 2) timelineに正規化
jq '{timeline: .data.observations // .timeline // []}' /tmp/snap.json > /tmp/timeline.json

# 3) リプレイ
curl -s -X POST http://127.0.0.1:${INGRESS_PORT:-8787}/replay \
  -H 'content-type: application/json' -d @/tmp/timeline.json | jq .

# 4) もう一度スナップショットを取り、同値を確認
curl -s http://127.0.0.1:${INGRESS_PORT:-8787}/snapshot > /tmp/snap2.json
jq -S '.data.observations // .timeline // []' /tmp/snap.json  > /tmp/a.json
jq -S '.data.observations // .timeline // []' /tmp/snap2.json > /tmp/b.json
diff -u /tmp/a.json /tmp/b.json && echo "✅ replay matched"
```

---

## 5. Ingress Gate（署名/HMAC）

- 期待ヘッダ：`x-actor-id`, `x-actor-ts`, `x-actor-signature`
- `x-actor-ts` の許容ずれ（±300 秒など）を Gate で検査
- 署名本文は **ボディの生文字列** か **カノニカル JSON** に固定（実装と一致させる）

---

## 6. 権限（Deno）

- サーバ実行時：`--allow-net --allow-read --allow-write --allow-env`
- KV 使用時：`deno.json` の `"unstable": ["kv"]` を忘れない
- CI での失敗要因の 3 割は **権限不足**。まずフラグを確認

---

## 7. ログ

- `logs/` を `-A` または `--allow-write=logs` で書き込み許可
- 例：`tail -f logs/api.log` `tail -f logs/emmy.log`
- 例外が出る場合は `DENO_LOG_LEVEL=debug` を付けて起動
