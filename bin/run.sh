#!/usr/bin/env bash

# run.sh
# Resonance-OS の起動スクリプト（並列モード）
# Deno + No npm + No package.json

set -euo pipefail

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
  echo -e "${GREEN}✅ $1${NC}"
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
  echo -e "${RED}❌ $1${NC}" >&2
}

# 初期チェック
log "Resonance-OS を起動中..."

# Denoがインストールされているか確認
if ! command -v deno >/dev/null 2>&1; then
  error "Denoがインストールされていません。"
  error "https://deno.land からインストールしてください。"
  exit 1
fi

# Denoのバージョン確認（推奨: v1.40+）
DENOV=$(deno --version | awk '{print $2}')
if ! printf '%s\n' "1.40.0" "$DENOV" | sort -V -C; then
  warn "Denoのバージョンが古い可能性があります: $DENOV"
  warn "最新版へのアップデートを推奨します。"
fi

# 必要なディレクトリを作成
mkdir -p data logs

# 環境変数の設定
export PORT=${PORT:-8080}
export HANA_PORT=${HANA_PORT:-8081}
export APP_API_PORT=${APP_API_PORT:-8082}
export LOG_LEVEL=${LOG_LEVEL:-info}

# ログファイル
EMMY_LOG="logs/emmy.log"
HANA_LOG="logs/hana.log"
API_LOG="logs/api.log"

# ログディレクトリ作成
mkdir -p logs

# サーバー起動関数
start_emmy() {
  log "Emmyサーバー起動中... PORT=$PORT"
  deno run \
    --allow-env \
    --allow-net \
    --allow-read \
    modules/emmy/server.ts \
    >>"$EMMY_LOG" 2>&1 &
  echo $! > logs/emmy.pid
  success "Emmyサーバー起動 (PID: $(cat logs/emmy.pid))"
}

start_hana() {
  log "Hanaサーバー起動中... PORT=$HANA_PORT"
  deno run \
    --allow-env \
    --allow-net \
    --allow-read \
    --allow-write \
    modules/hana/server.ts \
    >>"$HANA_LOG" 2>&1 &
  echo $! > logs/hana.pid
  success "Hanaサーバー起動 (PID: $(cat logs/hana.pid))"
}

start_app_api() {
  log "app-apiサーバー起動中... PORT=$APP_API_PORT"
  deno run \
    --allow-env \
    --allow-net \
    --allow-read \
    --allow-write \
    modules/app-api/server.ts \
    >>"$API_LOG" 2>&1 &
  echo $! > logs/api.pid
  success "app-apiサーバー起動 (PID: $(cat logs/api.pid))"
}

# 全サーバーを起動
start_emmy
start_hana
start_app_api

# 起動確認
echo ""
log "すべてのサーバーを起動しました。"
echo ""
echo "📌 Endpoints:"
echo "   - Emmy:    POST http://localhost:$PORT/emmy/chat"
echo "   - Hana:    POST http://localhost:$HANA_PORT/teach"
echo "   - API:     POST http://localhost:$APP_API_PORT/observation"
echo ""
echo "📄 ログ: logs/ ディレクトリを確認"
echo "🛑 停止するには: pkill -f 'deno' または kill \$(cat logs/*.pid)"

# ログの追跡（オプション）
tail -f logs/*.log
