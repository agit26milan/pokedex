# Spec: Build And Distribution

## ADDED Requirements

### Requirement: Reviewer can play without any build step

The app SHALL remain fully runnable in Expo Go from a QR code, with no dev build, no custom native module and no
manual native configuration, because that is the fastest path for a reviewer.

#### Scenario: QR scan on a clean device
- **WHEN** a reviewer scans the QR code from a clean Expo Go install
- **THEN** the app loads and the two-minute tour completes without any build step

### Requirement: Reproducible Android APK

The repo SHALL document and configure exactly one command that produces an installable Android APK, and the resulting
APK SHALL install and launch on a clean Android device or emulator with no development server running.

#### Scenario: Building the APK
- **WHEN** the documented APK command is run on a prepared machine
- **THEN** an APK artifact is produced at a documented path with no manual signing steps

#### Scenario: Installing on a clean device
- **WHEN** the APK is installed on a device with no Expo Go and no Metro running
- **THEN** the app launches and the tour works offline

#### Scenario: Build prerequisites are verified, not assumed
- **WHEN** the documented prerequisites (JDK, Android SDK, or EAS credentials) are missing
- **THEN** the README states exactly what is missing and the command fails with a clear message, not a silent error

### Requirement: iOS build path is prepared

The repo SHALL ship EAS build profiles for iOS (development, simulator and device/internal) plus a documented
command, so producing an IPA is a single command once Apple credentials exist, and SHALL state plainly what cannot be
done without them.

#### Scenario: Preparing the iOS path
- **WHEN** `eas.json` and the README are reviewed
- **THEN** the iOS profiles, the required Apple credentials and the exact IPA command are documented

#### Scenario: Apple credentials absent
- **WHEN** no Apple Developer account is available
- **THEN** the repo still produces a simulator build path and the README says a device-installable IPA requires a paid
  Apple Developer account and a provisioning profile; the gap is reported, never faked

#### Scenario: No secrets in the repository
- **WHEN** the repository is inspected
- **THEN** no keystore, provisioning profile, Expo token or Apple credential is committed; they are gitignored or
  supplied through EAS secrets

### Requirement: Build results are reported honestly

Any build claim SHALL be backed by a real artifact path or command output. An unbuilt or unverified build SHALL be
reported as not built.

#### Scenario: Claiming a successful build
- **WHEN** a build is reported as successful
- **THEN** the artifact exists at the stated path and the command output is available as evidence
