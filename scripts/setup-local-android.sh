#!/usr/bin/env bash
set -euo pipefail

SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}"
JVM_DIR="$HOME/Library/Java/JavaVirtualMachines"
JAVA_MAJOR=17

say() { printf '\n=== %s ===\n' "$1"; }

say "JDK $JAVA_MAJOR"
mkdir -p "$JVM_DIR"
if [ -d "$JVM_DIR/temurin-$JAVA_MAJOR.jdk" ]; then
  echo "already present: $JVM_DIR/temurin-$JAVA_MAJOR.jdk"
else
  URL="https://api.adoptium.net/v3/binary/latest/${JAVA_MAJOR}/ga/mac/aarch64/jdk/hotspot/normal/eclipse"
  TMP="$(mktemp -d)"
  curl -fsSL "$URL" -o "$TMP/jdk.tar.gz"
  mkdir -p "$TMP/x"
  tar -xzf "$TMP/jdk.tar.gz" -C "$TMP/x"
  SRC="$(find "$TMP/x" -maxdepth 1 -type d -name 'jdk-*' | head -1)"
  mv "$SRC" "$JVM_DIR/temurin-$JAVA_MAJOR.jdk"
  rm -rf "$TMP"
  echo "installed: $JVM_DIR/temurin-$JAVA_MAJOR.jdk"
fi

say "Android command line tools"
mkdir -p "$SDK_ROOT/cmdline-tools"
if [ -d "$SDK_ROOT/cmdline-tools/latest/bin" ]; then
  echo "already present: $SDK_ROOT/cmdline-tools/latest"
else
  XML="https://dl.google.com/android/repository/repository2-3.xml"
  ZIP_PATH="$(curl -fsSL "$XML" | tr '>' '>\n' | grep -o 'commandlinetools-mac-[0-9]*_latest.zip' | head -1)"
  [ -n "$ZIP_PATH" ] || { echo "could not resolve commandlinetools path"; exit 1; }
  TMP="$(mktemp -d)"
  curl -fsSL "https://dl.google.com/android/repository/$ZIP_PATH" -o "$TMP/tools.zip"
  (cd "$TMP" && unzip -q tools.zip)
  mv "$TMP/cmdline-tools" "$SDK_ROOT/cmdline-tools/latest"
  rm -rf "$TMP"
  echo "installed: $SDK_ROOT/cmdline-tools/latest ($ZIP_PATH)"
fi

export JAVA_HOME="$JVM_DIR/temurin-$JAVA_MAJOR.jdk/Contents/Home"
export ANDROID_SDK_ROOT="$SDK_ROOT"
export ANDROID_HOME="$SDK_ROOT"
export PATH="$SDK_ROOT/cmdline-tools/latest/bin:$SDK_ROOT/platform-tools:$JAVA_HOME/bin:$PATH"

say "sdkmanager: accept licenses + install packages"
yes | sdkmanager --licenses >/dev/null 2>&1 || true
sdkmanager --install "platform-tools" "platforms;android-36" "build-tools;36.0.0"

say "versions"
java -version 2>&1 | head -2
echo "SDK root: $ANDROID_SDK_ROOT"
ls "$SDK_ROOT"

cat <<EOF

=== done ===
For a build, export these first (or add to ~/.zshrc):
  export ANDROID_HOME="$SDK_ROOT"
  export ANDROID_SDK_ROOT="$SDK_ROOT"
  export JAVA_HOME="$JVM_DIR/temurin-$JAVA_MAJOR.jdk/Contents/Home"
  export PATH="\$ANDROID_HOME/platform-tools:\$JAVA_HOME/bin:\$PATH"
EOF
