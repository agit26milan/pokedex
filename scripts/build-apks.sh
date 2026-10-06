#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
export JAVA_HOME="$HOME/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$PATH"

build() { # $1 = extra gradle args, $2 = dist filename
  rm -rf android/app/build/outputs/apk android/app/build/intermediates/incremental android/app/build/intermediates/apk
  (cd android && ./gradlew assembleRelease --no-daemon $1) || return 1
  cp android/app/build/outputs/apk/release/app-release.apk "dist/$2"
  echo "-> dist/$2 $(stat -f%z "dist/$2") bytes"
}

build "" pokedex-quest-1.0.0-universal.apk
build "-PreactNativeArchitectures=arm64-v8a" pokedex-quest-1.0.0-arm64.apk

echo "== hashes =="
shasum -a 256 dist/*.apk
echo "== testing-library in bundles =="
for apk in dist/*.apk; do
  count=$(unzip -p "$apk" assets/index.android.bundle | grep -c "testing-library" || true)
  echo "$apk: $count"
done
