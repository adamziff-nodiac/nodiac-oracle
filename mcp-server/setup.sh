#!/usr/bin/env bash
#
# Nodiac Tracker MCP — One-time setup script
#
# This installs the MCP server locally and configures Claude Desktop
# to use it. Your power users run this once, then they're good to go.
#
# Usage:
#   bash setup.sh
#
set -euo pipefail

INSTALL_DIR="$HOME/.nodiac/mcp-server"
CLAUDE_CONFIG_DIR="$HOME/.config/claude-desktop"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║   Nodiac Tracker MCP Setup           ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# ── Check prerequisites ────────────────────────────────────────────────
if ! command -v bun &>/dev/null; then
  echo "Bun is not installed. Installing..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

echo "[1/4] Bun found: $(bun --version)"

# ── Copy server files ──────────────────────────────────────────────────
echo "[2/4] Installing MCP server to $INSTALL_DIR ..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp -r "$SCRIPT_DIR/src" "$INSTALL_DIR/src"
cp "$SCRIPT_DIR/package.json" "$INSTALL_DIR/package.json"
cp "$SCRIPT_DIR/tsconfig.json" "$INSTALL_DIR/tsconfig.json"

# ── Install dependencies ───────────────────────────────────────────────
echo "[3/4] Installing dependencies..."
cd "$INSTALL_DIR"
bun install --frozen-lockfile 2>/dev/null || bun install

# ── Collect Supabase credentials ───────────────────────────────────────
echo ""
echo "  You need two values from your Supabase project settings."
echo "  (Ask your team lead if you don't have these.)"
echo ""
read -rp "  Supabase URL (e.g. https://xxx.supabase.co): " SUPABASE_URL
read -rp "  Supabase Publishable Key (anon key):          " SUPABASE_KEY

if [[ -z "$SUPABASE_URL" || -z "$SUPABASE_KEY" ]]; then
  echo ""
  echo "  Error: Both values are required."
  exit 1
fi

# ── Configure Claude Desktop ──────────────────────────────────────────
echo "[4/4] Configuring Claude Desktop..."
mkdir -p "$CLAUDE_CONFIG_DIR"

# Build the MCP server config entry
MCP_ENTRY=$(cat <<JSONEOF
{
  "command": "bun",
  "args": ["run", "$INSTALL_DIR/src/index.ts"],
  "env": {
    "SUPABASE_URL": "$SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY": "$SUPABASE_KEY"
  }
}
JSONEOF
)

if [[ -f "$CLAUDE_CONFIG_FILE" ]]; then
  # Check if we can parse existing config
  if command -v python3 &>/dev/null; then
    python3 -c "
import json, sys

config_path = '$CLAUDE_CONFIG_FILE'
with open(config_path) as f:
    config = json.load(f)

if 'mcpServers' not in config:
    config['mcpServers'] = {}

config['mcpServers']['nodiac-tracker'] = json.loads('''$MCP_ENTRY''')

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print('  Updated existing Claude Desktop config.')
"
  else
    echo "  Warning: python3 not found. Please manually add to $CLAUDE_CONFIG_FILE:"
    echo "  \"nodiac-tracker\": $MCP_ENTRY"
  fi
else
  cat > "$CLAUDE_CONFIG_FILE" <<CONFIGEOF
{
  "mcpServers": {
    "nodiac-tracker": $MCP_ENTRY
  }
}
CONFIGEOF
  echo "  Created new Claude Desktop config."
fi

echo ""
echo "  ✓ Setup complete!"
echo ""
echo "  Next steps:"
echo "    1. Restart Claude Desktop"
echo "    2. When prompted, sign in with your @nodiac.ai Google account"
echo "    3. Start asking Claude about your portfolio!"
echo ""
echo "  Example prompts:"
echo "    • \"Show me all Lead-priority sites and their power phase status\""
echo "    • \"Update the power deposit checkpoint on site X to In Progress\""
echo "    • \"Log a call with Dairyland about capacity at the Midwest hub sites\""
echo ""
