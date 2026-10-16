#!/usr/bin/env bash
# DAN Tools One-Command Updater for macOS and Linux
# Usage: bash scripts/update.sh

set -euo pipefail

echo -e "\033[1;36m=============================================\033[0m"
echo -e "\033[1;36m          DAN Tools Updater (macOS/Linux)     \033[0m"
echo -e "\033[1;36m=============================================\033[0m"

# 1. If inside a Git clone, pull and rebuild
if [[ -f "package.json" && -d ".git" ]]; then
  echo -e "\033[1;32mUpdating git repository and dependencies...\033[0m"
  git pull origin main
  npm ci
  npm run build
  echo -e "\033[1;32mUpdate complete! Starting local server...\033[0m"
  npm run local
  exit 0
fi

# 2. Check if installed via Homebrew
if command -v brew >/dev/null 2>&1; then
  if brew list dtools >/dev/null 2>&1; then
    echo -e "\033[1;32mUpgrading Homebrew package...\033[0m"
    brew upgrade dtools
    echo -e "\033[1;32mHomebrew package upgraded successfully!\033[0m"
    exit 0
  fi
fi

echo -e "\033[1;33mPlease visit https://github.com/danyaljam/DANTOOLS/releases/latest for the latest release.\033[0m"
