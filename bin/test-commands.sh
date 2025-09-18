#!/usr/bin/env bash

# test-commands.sh
# Resonance-OS 起動後の動作確認用コマンド集

set -euo pipefail

echo "🧪 Resonance-OS 動作確認テスト開始"
echo ""

# 1. Emmyサーバーの確認
echo "1. Emmyサーバー: /healthz"
curl -s -o /dev/null -w "HTTP %{http_code} " http://localhost:8080/healthz
echo "- Emmyサーバーの生存確認"

echo "   POST /emmy/chat"
curl -X POST http://localhost:8080/emmy/chat \
  -H "Content-Type: application/json" \
  -d '{"input":"Hello from Sue"}' | jq '.' || echo "(jq not installed, raw response above)"
echo ""

# 2. Hanaサーバーの確認
echo "2. Hanaサーバー: /healthz"
curl -s -o /dev/null -w "HTTP %{http_code} " http://localhost:8081/healthz
echo "- Hanaサーバーの生存確認"

echo "   POST /teach (観測登録)"
curl -X POST http://localhost:8081/teach \
  -H "Content-Type: application/json" \
  -d '{
    "nodeId": "test-node",
    "author": "sue",
    "payload": { "content": "This is a test observation" },
    "tags": ["test", "resonance"]
  }' | jq '.' || echo "(jq not installed, raw response above)"
echo ""

# 3. app-apiサーバーの確認
echo "3. app-apiサーバー: /healthz"
curl -s -o /dev/null -w "HTTP %{http_code} " http://localhost:8082/healthz
echo "- app-apiサーバーの生存確認"

echo "   POST /observation (観測登録)"
curl -X POST http://localhost:8082/observation \
  -H "Content-Type: application/json" \
  -d '{
    "nodeId": "api-test",
    "author": "api-client",
    "payload": { "msg": "Posted via app-api" },
    "tags": ["api", "test"]
  }' | jq '.' || echo "(jq not installed, raw response above)"
echo ""

echo "   GET /observations?nodeId=api-test (観測取得)"
curl "http://localhost:8082/observations?nodeId=api-test&limit=5" | jq '.' || echo "(jq not installed, raw response above)"
echo ""

# 4. dataディレクトリの確認
echo "4. dataディレクトリの確認"
if [ -f "data/observations.json" ]; then
  echo "✅ data/observations.json が存在"
  echo "   観測数: $(jq '. | length' data/observations.json 2>/dev/null || echo "jq not available")"
else
  echo "❌ data/observations.json が存在しません"
fi
echo ""

# 5. ログの確認
echo "5. ログの確認"
for service in emmy hana api; do
  log_file="logs/${service}.log"
  if [ -f "$log_file" ]; then
    last_line=$(tail -n 1 "$log_file" | cut -c -80)
    echo "   $service: $(date -r "$log_file" "+%H:%M") - $last_line"
  else
    echo "   $service: ログファイル未生成"
  fi
done
echo ""

echo "✅ テスト完了"
