#!/usr/bin/env bash
# Boot a headless emulator, install the release APK, launch it and capture a screenshot.
# Usage: bash scripts/emulator-e2e.sh [path/to/app.apk]
set -euo pipefail

ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
AVD="${AVD:-pokedex}"
APK="${1:-dist/pokedex-quest-1.0.0-arm64.apk}"
PKG="com.agitafirstawan.pokedexquest"
ACTIVITY="$PKG/.MainActivity"
SHOT="${SHOT:-/tmp/pokedex-quest-launch.png}"
BOOT_TIMEOUT="${BOOT_TIMEOUT:-300}"

export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"

if [ ! -f "$APK" ]; then
  echo "APK not found: $APK" >&2
  exit 1
fi

echo "==> booting $AVD (headless)"
emulator -avd "$AVD" -no-window -no-audio -no-boot-anim -no-snapshot -gpu swiftshader_indirect \
  >/tmp/emulator.log 2>&1 &
EMU_PID=$!
trap 'kill "$EMU_PID" 2>/dev/null || true' EXIT

adb start-server >/dev/null
adb wait-for-device

waited=0
until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
  sleep 3
  waited=$((waited + 3))
  if [ "$waited" -ge "$BOOT_TIMEOUT" ]; then
    echo "emulator did not finish booting in ${BOOT_TIMEOUT}s (see /tmp/emulator.log)" >&2
    exit 1
  fi
done
echo "==> booted after ${waited}s"

echo "==> installing $APK"
adb install -r "$APK"

echo "==> launching $ACTIVITY"
adb shell am start -n "$ACTIVITY" >/dev/null

sleep 12
adb exec-out screencap -p >"$SHOT"
echo "==> screenshot: $SHOT"

echo "==> foreground activity"
adb shell dumpsys activity activities 2>/dev/null | grep -m1 "mResumedActivity" || true

echo "==> recent crashes / errors for the app"
adb logcat -d -t 400 2>/dev/null | grep -iE "FATAL|AndroidRuntime|$PKG.*(E|W) " | tail -12 || true
