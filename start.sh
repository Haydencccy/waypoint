#!/bin/bash
# Route Finder Startup Script
# Run on target machine or over SSH.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if docker compose version >/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
else
  DOCKER_COMPOSE_CMD="docker-compose"
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FRONTEND_PORT="${FRONTEND_PORT:-3550}"
BACKEND_PORT="${BACKEND_PORT:-3551}"
API_PORT="${API_PORT:-3552}"

REBUILD="false"
DEV_MODE="false"
STOP="false"
CLEAN="false"

print_help() {
  echo ""
  echo "Route Finder Startup Script"
  echo ""
  echo "Usage: ./start.sh [options]"
  echo ""
  echo "Options:"
  echo "  -p, --port <port>  Host port for frontend, default: 3550"
  echo "  -r, --rebuild      Rebuild Docker image"
  echo "  -d, --dev          Run Vite dev server (non-Docker)"
  echo "  -s, --stop         Stop Docker services"
  echo "  -c, --clean        Stop + remove image"
  echo "  -h, --help         Show this help"
  echo ""
}

is_valid_port() {
  case "$1" in
    ''|*[!0-9]*) return 1 ;;
    *) [ "$1" -ge 1 ] && [ "$1" -le 65535 ] ;;
  esac
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --port|-p)
      if [ -z "$2" ]; then
        echo -e "${RED}Missing value for --port${NC}"
        exit 1
      fi
      FRONTEND_PORT="$2"
      shift 2
      ;;
    --rebuild|-r)
      REBUILD="true"
      shift
      ;;
    --dev|-d)
      DEV_MODE="true"
      shift
      ;;
    --stop|-s)
      STOP="true"
      shift
      ;;
    --clean|-c)
      CLEAN="true"
      shift
      ;;
    --help|-h)
      print_help
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      print_help
      exit 1
      ;;
  esac
done

if ! is_valid_port "$FRONTEND_PORT"; then
  echo -e "${RED}Invalid port: $FRONTEND_PORT${NC}"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}Docker not found.${NC}"
  exit 1
fi

if [ "$STOP" = "true" ]; then
  echo -e "${YELLOW}Stopping services...${NC}"
  $DOCKER_COMPOSE_CMD down
  echo -e "${GREEN}Services stopped.${NC}"
  exit 0
fi

if [ "$CLEAN" = "true" ]; then
  echo -e "${YELLOW}Cleaning services and images...${NC}"
  $DOCKER_COMPOSE_CMD down 2>/dev/null || true
  docker rmi route-finder-frontend 2>/dev/null || true
  docker rmi route-finder-backend 2>/dev/null || true
  echo -e "${GREEN}Cleanup done.${NC}"
  exit 0
fi

export FRONTEND_PORT
export BACKEND_PORT
export API_PORT

if [ "$DEV_MODE" = "true" ]; then
  echo -e "${BLUE}Starting dev server on port ${FRONTEND_PORT}...${NC}"
  npm run dev -- --host 0.0.0.0 --port "$FRONTEND_PORT"
  exit 0
fi

echo -e "${YELLOW}Stopping previous containers...${NC}"
$DOCKER_COMPOSE_CMD down 2>/dev/null || true

if [ "$REBUILD" = "true" ]; then
  echo -e "${BLUE}Building and starting containers...${NC}"
  $DOCKER_COMPOSE_CMD up --build -d
else
  echo -e "${BLUE}Starting containers...${NC}"
  $DOCKER_COMPOSE_CMD up -d
fi

echo ""
echo -e "${GREEN}Route Finder is Live${NC}"
echo -e "${BLUE}Frontend URL: http://localhost:${FRONTEND_PORT}${NC}"
if [ -n "$BACKEND_PORT" ]; then
  echo -e "${BLUE}Backend URL: http://localhost:${BACKEND_PORT}${NC}"
fi
echo -e "${YELLOW}Logs: $DOCKER_COMPOSE_CMD logs -f${NC}"
echo -e "${YELLOW}Stop: ./start.sh --stop${NC}"
