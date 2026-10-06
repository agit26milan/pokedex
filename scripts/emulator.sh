#!/usr/bin/env bash
# Boot the Android emulator WITH a window, install the release APK and launch the app.
# Usage: bash scripts/emulator.sh [path/to/app.apk]      AVD=pokedex by default.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"

AVD="${AVD:-pokedex}"
APK="${1:-$ROOT/dist/pokedex-quest-1.0.0-arm64.apk}"
PKG=com.agitafirstawan.pokedexquest

if [ ! -x "$ANDROID_HOME/emulator/emulator" ]; then
  echo "emulator belum terpasang. Jalankan: sdkmanager --install emulator 'system-images;android-36;google_apis;arm64-v8a'"
  exit 1
fi
if [ ! -f "$APK" ]; then
  echo "APK tidak ditemukan: $APK (build dulu: bash scripts/build-apks.sh)"
  exit 1
fi

echo "boot $AVD (jendela akan terbuka)…"
emulator -avd "$AVD" -no-snapshot-save -gpu auto >/tmp/pokedex-emulator.log 2>&1 &
EMU=$!
trap 'kill "$EMU" 2>/dev/null || true' EXIT

adb wait-for-device
until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 2; done
echo "boot selesai — install $APK"
adb install -r "$APK" | tail -1
adb shell am start -n "$PKG/.MainActivity" >/dev/null
echo "Pokédex Quest jalan. Matikan emulator dengan: adb emu kill"
wait "$EMU"
