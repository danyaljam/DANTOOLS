#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <version> [output.dmg]" >&2
  exit 1
fi

VERSION="${1#v}"
OUTPUT_DMG="${2:-dtools-${VERSION}.dmg}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/dtools-dmg.XXXXXX")"
APP_BUNDLE="$WORKDIR/dtools.app"
RESOURCES_DIR="$APP_BUNDLE/Contents/Resources"
MACOS_DIR="$APP_BUNDLE/Contents/MacOS"

sign_app_bundle() {
  local signing_identity="${APPLE_SIGNING_IDENTITY:-${DTOOLS_SIGNING_IDENTITY:-}}"
  if [[ -z "$signing_identity" ]]; then
    echo "Skipping app signing: APPLE_SIGNING_IDENTITY not set. Gatekeeper will reject the DMG until it is signed."
    return 0
  fi

  echo "Signing app bundle with identity: $signing_identity"
  codesign --deep --force --options runtime --timestamp --sign "$signing_identity" "$APP_BUNDLE"
}

notarize_dmg() {
  local keychain_profile="${APPLE_KEYCHAIN_PROFILE:-${DTOOLS_KEYCHAIN_PROFILE:-}}"
  local apple_id="${APPLE_ID:-${DTOOLS_APPLE_ID:-}}"
  local app_password="${APPLE_APP_SPECIFIC_PASSWORD:-${DTOOLS_APPLE_APP_SPECIFIC_PASSWORD:-}}"
  local team_id="${APPLE_TEAM_ID:-${DTOOLS_APPLE_TEAM_ID:-}}"

  if [[ -n "$keychain_profile" ]]; then
    echo "Submitting DMG to notarization via keychain profile: $keychain_profile"
    xcrun notarytool submit "$OUTPUT_DMG" --keychain-profile "$keychain_profile" --wait
    xcrun stapler staple "$OUTPUT_DMG"
    return 0
  fi

  if [[ -n "$apple_id" && -n "$app_password" && -n "$team_id" ]]; then
    echo "Submitting DMG to notarization for Apple account: $apple_id"
    xcrun notarytool submit "$OUTPUT_DMG" --apple-id "$apple_id" --password "$app_password" --team-id "$team_id" --wait
    xcrun stapler staple "$OUTPUT_DMG"
    return 0
  fi

  echo "Skipping notarization: APPLE_KEYCHAIN_PROFILE or APPLE_ID/APPLE_APP_SPECIFIC_PASSWORD/APPLE_TEAM_ID are not configured."
}

cleanup() {
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

mkdir -p "$RESOURCES_DIR" "$MACOS_DIR"
cp -R "$ROOT_DIR/out/." "$RESOURCES_DIR/app/"
mkdir -p "$RESOURCES_DIR/app/scripts"
cp "$ROOT_DIR/scripts/serve-local.mjs" "$RESOURCES_DIR/app/scripts/serve-local.mjs"

cat > "$MACOS_DIR/dtools" <<'EOF'
#!/bin/sh
set -eu
APP_DIR="$(cd "$(dirname "$0")/../Resources/app" && pwd)"
NODE_BIN="$(cd "$(dirname "$0")/../Resources/node" && pwd)/node"
exec "$NODE_BIN" "$APP_DIR/scripts/serve-local.mjs" "$@"
EOF
chmod +x "$MACOS_DIR/dtools"

if [[ -f "$ROOT_DIR/public/icon-512.png" ]]; then
  sips -s format icns "$ROOT_DIR/public/icon-512.png" --out "$RESOURCES_DIR/AppIcon.icns" >/dev/null
else
  echo "Missing icon asset at $ROOT_DIR/public/icon-512.png" >&2
  exit 1
fi

NODE_BIN="$(command -v node || true)"
if [[ -z "$NODE_BIN" ]]; then
  echo "Node.js must be installed and on PATH to build the macOS app bundle." >&2
  exit 1
fi
mkdir -p "$RESOURCES_DIR/node"
cp -L "$NODE_BIN" "$RESOURCES_DIR/node/node"
chmod +x "$RESOURCES_DIR/node/node"

cat > "$APP_BUNDLE/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>dtools</string>
  <key>CFBundleIdentifier</key>
  <string>com.danyaljam.dtools</string>
  <key>CFBundleName</key>
  <string>dtools</string>
  <key>CFBundleDisplayName</key>
  <string>dtools</string>
  <key>CFBundleVersion</key>
  <string>${VERSION}</string>
  <key>CFBundleShortVersionString</key>
  <string>${VERSION}</string>
  <key>CFBundleIconFile</key>
  <string>AppIcon</string>
  <key>LSMinimumSystemVersion</key>
  <string>12.0</string>
</dict>
</plist>
EOF

sign_app_bundle

hdiutil create \
  -srcfolder "$APP_BUNDLE" \
  -volname "dtools ${VERSION}" \
  -fs HFS+ \
  -format UDZO \
  -ov \
  "$OUTPUT_DMG" >/dev/null

notarize_dmg

printf '%s\n' "$OUTPUT_DMG"
