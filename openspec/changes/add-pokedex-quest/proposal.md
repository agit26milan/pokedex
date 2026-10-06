# Add Pokédex Quest — a playable mobile Pokédex (React Native / Expo)

## Why

This repo is the take-home test for the **Frontend / Mobile Developer** role. A reviewer must be able to
scan one QR code, play the two-minute tour (choose a partner → walk into tall grass → win a battle → catch the
Pokémon), and then read the source and see clean feature-based architecture plus deliberate performance work.
So the project is judged on two axes at once: **does it actually run and play**, and **is the code worth reading**.

## What Changes

- New Expo application in this repo (SDK 57 / React Native 0.87, TypeScript, strict mode).
- **Play tab**: choose 1 of 3 starter partners, then explore an endless procedurally generated tile map, walk with
  tap-to-step or an on-screen stick, trigger wild encounters in tall grass, and battle turn-based.
- **Full battle**: 4 moves per Pokémon, switch party member, bag items, run away, XP + level up with automatic
  move learning, and a catch flow driven by remaining HP.
- **Glossary tab**: all 151 Gen-1 Pokémon with search, multi-select type filters, caught marks, and a detail screen.
- **Persistence**: run state (party, storage, items, position, world seed, dex caught flags) survives app reload.
- **Offline-first data**: a build-time generated seed ships species, base stats and legal movesets in the bundle, so
  world and battle run with zero network. PokéAPI is called only to enrich the detail screen, then cached.
- **Deliverables**: runnable via Expo Go (QR), **installable Android APK built reproducibly**, **iOS build path ready
  (EAS profiles + documented IPA command)**, English UI, README with setup + architecture, unit tests for game logic.
- **Phase 2 (out of this change)**: status effects, evolution animation, trainer battles, localisation.

## Scope

**In scope**

| Area | What ships |
|------|-----------|
| App shell | expo-router tab layout, theme tokens, feature folders |
| Play | partner select, procedural map, movement, encounters, encounter sheet |
| Battle | turn engine, damage/accuracy/crit, catch rate, XP/level, item + switch + run |
| Glossary | list (151), search, type filter, detail (stats + moves), caught state |
| Data | seed generation script, seed JSON committed, PokéAPI enrich + AsyncStorage cache |
| Quality | Jest unit tests for pure logic, ESLint incl. react-hooks, README |
| Build | Android APK (documented, reproducible, installs on a clean device) + iOS/EAS profiles so an IPA is one command away |

**Out of scope / Non-goals**

- No backend, no auth, no accounts, no server persistence, no trading, no multiplayer.
- No Gen-2+ Pokémon (151 only). No overworld NPCs, gyms, trainers, dialog trees, or cutscenes.
- No status effects (burn/poison/paralyze) and no mid-battle evolution animation — deferred to phase 2.
- No MMKV, Skia, or custom native module: Expo Go compatibility is a hard requirement, so the app must run on a
  plain QR scan without a dev build.
- Not a pixel-perfect clone of any commercial game; the map is a stylised grid, not an isometric engine.
- No App Store submission, no TestFlight release, and no Apple Developer enrolment paid from this repo: the iOS build
  path is configured and documented, but the Apple credentials stay the owner's decision (see design.md, machine state).

## Affected

- Solo repository: `/Users/mac/Documents/projects/pokemon`. No shared services, no Cakap systems, no DB migrations.
- External dependency: PokéAPI (`pokeapi.co`) — read-only, free, no API key. Only the detail screen depends on it.
- Reviewer-facing artifacts: README, `design/` mockups, this OpenSpec change.
