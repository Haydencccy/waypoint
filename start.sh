#!/usr/bin/env bash

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. 基礎變數設定 (跟返 Dayline 邏輯)
FRONTEND_PORT="${FRONTEND_PORT:-3550}"
BACKEND_PORT="${BACKEND_PORT:-3551}"
PROJECT_NAME="route-finder"
DEV_PID_FILE=".waypoint-dev.pid"
DEV_LOG_FILE=".waypoint-dev.log"

export FRONTEND_PORT BACKEND_PORT

# 參數預設值
REBUILD=""
DEV_MODE=""
STOP=""
CLEAN=""

# 2. 環境檢查 (抄足 Dayline 嘅嚴謹)
check_requirements() {
  if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is required.${NC}"
    exit 1
  fi
  if ! docker compose version >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker Compose v2 is required.${NC}"
    exit 1
  fi
}

# 3. Health Check 邏輯 (確保唔係「假起動」)
wait_for_health() {
  local url="http://localhost:${FRONTEND_PORT}"
  local max_retries=30
  local retry=0

  echo -e "${YELLOW}⏳ Waiting for ${PROJECT_NAME} to respond on port ${FRONTEND_PORT}...${NC}"

  until curl -fsS "$url" >/dev/null 2>&1; do
    retry=$((retry + 1))
    if [ "$retry" -ge "$max_retries" ]; then
      echo -e "${RED}⚠️  Health check timed out. Checking logs...${NC}"
      docker compose logs --tail=20 frontend
      return 1
    fi
    echo -e "   ${YELLOW}Waiting... (${retry}/${max_retries})${NC}"
    sleep 2
  done
  return 0
}

# 4. Stop & Clean 邏輯
handle_stop() {
  echo -e "${YELLOW}🛑 Stopping ${PROJECT_NAME}...${NC}"
  # 殺掉背景行緊嘅 Dev Process
  if [ -f "$DEV_PID_FILE" ]; then
    local pid=$(cat "$DEV_PID_FILE")
    kill "$pid" 2>/dev/null || true
    rm -f "$DEV_PID_FILE"
  fi
  docker compose down 2>/dev/null || true
  echo -e "${GREEN}✅ Stopped.${NC}"
}

# --- 參數解析 ---
for arg in "$@"; do
  case "$arg" in
    --rebuild|-r) REBUILD="true" ;;
    --dev|-d)     DEV_MODE="true" ;;
    --stop|-s)    STOP="true" ;;
    --clean|-c)   CLEAN="true" ;;
  esac
done

# --- 執行流程 ---

if [ "$STOP" = "true" ]; then
  handle_stop
  exit 0
fi

if [ "$CLEAN" = "true" ]; then
  handle_stop
  docker rmi route-finder-frontend route-finder-backend 2>/dev/null || true
  exit 0
fi

check_requirements

if [ "$DEV_MODE" = "true" ]; then
  echo -e "${BLUE}🛠️  Starting Vite in Background (Dev Mode)...${NC}"
  nohup npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT" >"$DEV_LOG_FILE" 2>&1 &
  echo $! > "$DEV_PID_FILE"
  wait_for_health
else
  echo -e "${YELLOW}🧹 Clearing old containers...${NC}"
  docker compose down 2>/dev/null || true

  echo -e "${BLUE}📦 Starting Docker Stack...${NC}"
  if [ "$REBUILD" = "true" ]; then
    docker compose up -d --build
  else
    docker compose up -d
  fi
  wait_for_health
fi

# 5. 顯示狀態 (靚仔版)
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ${PROJECT_NAME} is Live!${NC}"
echo -e "${BLUE}Frontend: http://localhost:${FRONTEND_PORT}${NC}"
echo -e "${BLUE}Backend:  http://localhost:${BACKEND_PORT}${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"