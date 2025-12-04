#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  Eunoia - First Time Setup (macOS/Linux)"
echo "========================================"
echo

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

abort() {
  echo
  echo "[ERROR] $1"
  exit 1
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || abort "$cmd is required but not found in PATH."
}

# --- Check Node.js ---
require_cmd node
NODE_VER="$(node -v | tr -d 'v')"
NODE_MAJOR="${NODE_VER%%.*}"
if [[ -z "$NODE_MAJOR" || "$NODE_MAJOR" -lt 18 ]]; then
  abort "Node.js 18+ required. Detected: v$NODE_VER"
fi
echo "Node.js: v$NODE_VER"

require_cmd npm
echo "npm:     v$(npm -v)"
echo

# --- Check Python ---
PY_BIN="${PY_BIN:-python3}"
if ! command -v "$PY_BIN" >/dev/null 2>&1; then
  PY_BIN="python"
fi
require_cmd "$PY_BIN"
PY_VER="$("$PY_BIN" - <<'PY'
import sys
print(".".join(map(str, sys.version_info[:3])))
PY
)"
if ! "$PY_BIN" - <<'PY'
import sys
sys.exit(0 if sys.version_info >= (3, 10) else 1)
PY
then
  abort "Python 3.10+ required. Detected: $PY_VER"
fi
echo "Python:  $PY_VER"
echo

# --- Virtual env ---
VENV_PATH="$ROOT_DIR/.venv"
if [[ ! -x "$VENV_PATH/bin/python" ]]; then
  echo "Creating virtual environment at $VENV_PATH ..."
  "$PY_BIN" -m venv "$VENV_PATH" || abort "Failed to create virtual environment."
fi
source "$VENV_PATH/bin/activate"
echo "Using Python: $(which python)"

echo "Upgrading pip..."
python -m pip install --upgrade pip

echo "Installing Python packages..."
python -m pip install -r python/requirements.txt
echo "Python dependencies installed."
echo

# --- Frontend deps ---
echo "Installing frontend dependencies (npm ci)..."
npm ci
echo "Frontend dependencies installed."
echo

# --- Env file ---
if [[ ! -f ".env" ]]; then
  echo "Creating .env from .env.example ..."
  cp .env.example .env
fi

echo "========================================"
echo "  Setup complete!"
echo "  Frontend: npm run dev"
echo "  Backend : python python/api/main.py"
echo "========================================"
