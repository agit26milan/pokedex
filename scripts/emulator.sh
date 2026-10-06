#!/usr/bin/env bash
# Boot the Android emulator WITH a window and run Pokédex Quest on it.
#
#   npm run emulator              release APK (self-contained, no Metro needed)
#   npm run emulator -- --debug   debug build + Metro: dev menu, fast refresh, Hermes DevTools
#   npm run emulator -- --airplane   network off, to test the offline paths
#
# Env: AVD=pokedex  APK=/path/to/app.apk
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_HOME
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
export JAVA_HOME="${JAVA_HOME:-$HOME/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home}"

DEBUG=0
AIRPLANE=0
APK_ARG=""
for arg in "$@"; do
  case "$arg" in
    --debug|-d) DEBUG=1 ;;
    --airplane|-a) AIRPLANE=1 ;;
    *) APK_ARG="$arg" ;;
  esac
done

AVD="${AVD:-pokedex}"
PKG=com.agitafirstawan.pokedexquest

if [ ! -x "$ANDROID_HOME/emulator/emulator" ]; then
  echo "emulator belum terpasang."
  echo "  sdkmanager --install emulator 'system-images;android-36;google_apis;arm64-v8a'"
  exit 1
fi

if [ "$DEBUG" = "1" ]; then
  APK="${APK_ARG:-$ROOT/android/app/build/outputs/apk/debug/app-debug.apk}"
  echo "mode: DEBUG (butuh Metro, dapat dev menu + DevTools)"
  if [ ! -f "$APK" ] || [ -z "$(find "$APK" -newer "$ROOT/package.json" 2>/dev/null)" ]; then
    echo "build APK debug… (pertama kali bisa beberapa menit)"
    (cd "$ROOT/android" && ./gradlew assembleDebug --no-daemon) || { echo "build debug gagal"; exit 1; }
  else
    echo "pakai APK debug yang ada: $APK"
  fi
else
  APK="${APK_ARG:-$ROOT/dist/pokedex-quest-1.0.0-arm64.apk}"
  echo "mode: RELEASE (tanpa dev menu — itu normal)"
fi
[ -f "$APK" ] || { echo "APK tidak ada: $APK"; echo "release: bash scripts/build-apks.sh"; exit 1; }

echo "boot $AVD (jendela akan terbuka)…"
emulator -avd "$AVD" -no-snapshot-save -gpu auto >/tmp/pokedex-emulator.log 2>&1 &
EMU=$!
cleanup() {
  kill "$EMU" 2>/dev/null || true
  pkill -f "expo start" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

adb wait-for-device
until [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do sleep 2; done

# AVD settings survive between runs, so network state is set explicitly instead of assumed.
if [ "$AIRPLANE" = "1" ]; then
  adb shell svc wifi disable
  adb shell svc data disable
  adb shell settings put global airplane_mode_on 1
  echo "network: OFF (airplane)"
else
  adb shell settings put global airplane_mode_on 0
  adb shell svc wifi enable >/dev/null 2>&1
  adb shell svc data enable >/dev/null 2>&1
  echo "network: ON (airplane_mode_on=$(adb shell settings get global airplane_mode_on | tr -d '\r'))"
fi

if [ "$DEBUG" = "1" ]; then
  echo "start Metro…"
  nohup npx expo start --port 8081 >/tmp/pokedex-metro.log 2>&1 &
  for _ in $(seq 1 30); do
    curl -sf --max-time 2 http://localhost:8081/status >/dev/null 2>&1 && break
    sleep 2
  done
  adb reverse tcp:8081 tcp:8081 >/dev/null 2>&1 || true
fi

echo "install $APK"
adb install -r "$APK" | tail -1
adb shell am start -n "$PKG/.MainActivity" >/dev/null

if [ "$DEBUG" = "1" ]; then
  cat <<'EOF'

DEBUG MODE AKTIF
  dev menu       : Cmd/Ctrl+M di jendela emulator, atau  adb shell input keyevent 82
  reload         : tekan r di terminal Metro, atau Reload dari dev menu
  React DevTools : tekan j di terminal Metro (Hermes: breakpoint, console, network)
  JS log         : adb logcat | grep ReactNativeJS
  Metro log      : /tmp/pokedex-metro.log
EOF
else
  echo "untuk debug: npm run emulator -- --debug"
fi
echo "matikan emulator: adb emu kill    (Ctrl+C di sini juga mematikannya)"

wait "$EMU"
