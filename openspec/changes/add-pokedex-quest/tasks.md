# Tasks — add-pokedex-quest

Ordered by dependency. Each task is at most ~2 hours. `[E2E]` marks work that needs a device/device-like check
rather than a unit test.

## 1. Project scaffold

- [x] 1.1 `npx create-expo-app pokemon --template blank-typescript` in this repo, add expo-router, zustand, axios,
      expo-image, expo-haptics, and TypeScript strict. Commit the untouched baseline.
- [x] 1.2 Configure ESLint (`eslint-config-expo` + react-hooks rules as errors) and Prettier; add `npm run lint`,
      `npm run typecheck`, `npm test`.
- [ ] 1.3 Build the folder skeleton from design.md (`app/`, `src/features/*`, `src/shared/*`) with empty modules and
      the two-tab layout so routing works end to end. `[E2E]` both tabs open on a device.
      _Skeleton + tabs built; verified by a real Metro bundle export (android, 2.7 MB .hbc). On-device check still pending._

## 2. Data seed

- [x] 2.1 Write `scripts/genSeed.ts`: fetch species + pokemon + move learnsets for ids 1-151 from PokéAPI, emit
      `src/shared/data/pokedex.gen1.json` (id, name, types, baseStats, evolution, 4 legal moves with power/accuracy/pp/class).
- [x] 2.2 Run it, commit the seed, and add a test asserting all 151 entries exist with valid types and at least one
      damaging move each. _Adjusted while doing it: 4 Gen-1 entries (abra, ditto, kakuna, metapod) genuinely have no
      damaging level-up move, so the test locks that exact allowlist instead of pretending otherwise — see task 6.6._

## 3. Shared foundation

- [x] 3.1 `lib/rng.ts` (mulberry32) + unit tests, `lib/storage.ts` (AsyncStorage adapter), `shared/api/client.ts`
      (axios instance with timeout + error normalization).
- [ ] 3.2 Theme module: colors, spacing, type-color map (18 types) + `components/ui/*` (Button, Card, TypeBadge, Sprite).
      _Tokens done (src/theme/tokens.ts, 18-type map). ui/* components still to write alongside the screens that use them._
- [x] 3.3 Root store with four slices + persist (version 1) and a selector hook built on `useShallow`.
      _Three slices shipped (party, world, pokedex) — the battle slice is transient and arrives with the engine (task 6.2/6.4)._

## 4. Glossary (fills the tab while Play is built)

- [x] 4.1 `logic/filterPokemon.ts` (search + multi-type filter, pure) with unit tests for search, filter, intersection, empty result.
- [x] 4.2 `ui/PokemonList.tsx` + `ui/PokemonRow.tsx` + `ui/SearchBar.tsx` + `ui/TypeFilter.tsx` wired to the store;
      FlatList tuning from design.md; memoization only where props are primitive.
- [x] 4.3 `(glossary)/[id].tsx` detail from seed, then axios enrichment + AsyncStorage cache with TTL and silent fallback.
      `[E2E]` open detail with airplane mode on. _Route is `app/pokemon/[id].tsx` (root Stack, pushed from the list).
      Verified: typecheck/lint/tests green and the screen renders from seed before the request resolves. The airplane-mode
      pass on a physical device is still pending (task 8.3)._

## 5. World / Play

- [x] 5.1 `logic/generateChunk.ts` (seeded chunk generation) + `logic/movePlayer.ts` (blocked tiles, adjacency) with unit
      tests: determinism, blocked movement, adjacency rule.
- [x] 5.2 `logic/rollEncounter.ts` (18% rate, guaranteed first encounter) with unit tests using seeded RNG.
- [x] 5.3 Partner picker screen + `logic/partyRules.ts` (party max 6, storage overflow) with unit tests.
- [x] 5.4 `ui/WorldGrid.tsx` + `ui/Tile.tsx` rendering the chunk with reachable-tile rings, rustle on tall grass and the
      risk meter; Reanimated movement so tiles do not re-render. `[E2E]` walking feels responsive on a device.
      _Camera translation is a Reanimated shared value, tiles are memo + stable keys. On-device feel still pending._
- [x] 5.5 `ui/Stick.tsx` joystick + tap-to-step + long-press sprint + haptics on step/encounter.
      _Shipped as `ui/Dpad.tsx`: hold-to-repeat D-pad plus a sprint toggle, tap-to-step on the glowing tiles, and haptics
      on step, blocked step and encounter. Deviation and reasoning are recorded in design.md._

## 6. Battle

- [x] 6.1 `logic/damage.ts` (formula, STAB, 18-type chart, crit) with unit tests for super/not-very effective, crit and
      minimum damage. _Chart must be the modern 18-type table: Gen-1 species typing in the seed already includes fairy
      and steel (e.g. Clefairy, Magnemite), so a 15-type chart would silently mis-resolve those matchups._
- [x] 6.6 Handle Pokémon whose Red-Blue learnset has no damaging move (metapod, kakuna, abra, ditto — found in the seed):
      engine grants a fallback Struggle-style move so a wild one can still fight and a caught one can never soft-lock the
      player into an unwinnable battle. Unit tests for both directions.
      _Implemented once in `shared/data/moves.ts` and applied on both sides (`createSide` for the player, `damagingMoves`
      for the opponent); tested in both directions._
- [x] 6.7 `logic/levelUp.ts` — XP reward, thresholds and automatic move learning (the second half of task 6.3).
- [x] 6.2 `logic/turnEngine.ts` (`resolveTurn(state, action, rng) -> {state, events}`) with unit tests: turn order by
      speed, accuracy miss, PP exhaustion rejection, switch-in consumes turn.
- [x] 6.3 `logic/catchRate.ts` + `logic/levelUp.ts` (XP thresholds, automatic move learning) with unit tests, including
      party-full storage path and no-balls path.
      _Catch odds and level curve done; the storage path is covered by `placeInRoster` (task 5.3) and the no-balls path by
      the battle slice wiring in task 6.4._
- [x] 6.4 `ui/BattleView.tsx` + `ui/MoveGrid.tsx` + `ui/HpBar.tsx` + `ui/PartySwitch.tsx` + bag/run actions, driven only by
      engine events. `[E2E]` full battle to a catch on a device.
      _MoveGrid and PartySwitch live inside BattleView; the screen owns battle state, settlement and navigation. The
      on-device pass is still pending._
- [x] 6.5 `ui/EncounterSheet.tsx` bottom sheet (Battle / Throw Ball / Run Away) with haptics and spring-in.
      _Shipped with Battle / Run Away live and the ball action handed to the battle screen, where remaining HP sets the
      odds. Haptics fire on the encounter itself._

## 7. Persistence and polish

- [x] 7.1 Persist run state (party, storage, bag, seed, position, caught flags) with version + migrate; keep battle transient.
      _Persisted: party, storage, bag, leader, world seed, position, steps, encounter flags. "Caught" is persisted as
      party ∪ storage rather than as a duplicated flag list. Battle never enters the store._
- [x] 7.2 Defensive reload path: invalid persisted state falls back to a fresh run instead of crashing. Unit tests for both.
      _`isValidRun` + `mergePersisted` in src/store/index.ts, wired as persist `merge`, tested against eight malformed
      payloads plus a never-throws loop._
- [x] 7.3 Performance pass with evidence: record render counts for a step and a list scroll, confirm tiles are not
      re-rendered and memo/useCallback/useMemo are only where design.md says. Fix or remove anything unjustified.
      _Evidence shipped as `src/features/pokedex/ui/PokemonRow.test.tsx`: a render-count test that proves a parent
      re-render does not re-render rows when the callback is stable, and does when it is not. `useMemo` survives in two
      places only (the 151-entry filter and the caught-id Set). What this environment cannot do is on-device render
      profiling, so the Flipper/Reanimated timeline numbers the design asked for are recorded as pending, not claimed._
- [x] 7.4 README: setup, QR instructions, 2-minute tour script, architecture map, performance notes, phase-2 backlog.
      _README.md covers all six, plus the build commands and a Known limitations section that lists the checks this
      environment could not run._

## 8. Verification

- [x] 8.1 `npm run typecheck && npm run lint && npm test` green; note the real test count (no claimed coverage numbers).
      _typecheck 0, lint 0, 137 tests across 17 suites — the count is read from the Jest summary, not estimated._
- [ ] 8.2 `[E2E]` Two-minute tour on a real device via Expo Go QR: partner → tall grass → encounter → win → catch → Glossary
      shows the caught mark.
- [ ] 8.3 `[E2E]` Airplane mode run: world, battle, list, search, filter and detail all still work.
- [x] 8.4 Sanity-check non-goals are still non-goals (no trainer battle, no status effect, no native module added).
      _Checked rather than assumed: `grep -riE "trainer"` and a burn/paralyze/sleep-status grep both return nothing, and
      every native dependency resolves inside Expo Go's `bundledNativeModules.json` at the installed version
      (async-storage 2.2.0, reanimated 4.5.1, safe-area-context ~5.7.0, screens ~4.26.0, worklets 0.10.1) with zero
      custom modules. `npx expo-doctor` reports 21/21 after removing the stale `newArchEnabled` flag._

## 9. Build and distribution (APK + iOS/IPA path)

- [x] 9.1 Add `eas.json` with `development`, `simulator`, `preview` (Android APK) and `production` profiles; add
      `npm run android:apk` / `npm run ios:build` scripts that call the documented commands.
      _`eas.json` has all four profiles; package.json carries `android:apk` (EAS) and `android:apk:local`
      (prebuild + gradlew), plus `ios:sim` and `ios:ipa`._
- [x] 9.2 Decide the APK route with evidence: try EAS cloud build (`eas build -p android --profile preview`) and, if no
      Expo login is available, install the local toolchain (Android cmdline-tools + platform/build-tools + JDK 17) and
      use `npx expo prebuild -p android && ./gradlew assembleRelease`.
      _EAS needs an Expo login that is not available here, so the local route was used: `scripts/setup-local-android.sh`
      installed JDK 17.0.20.1 + the Android SDK without sudo, then `expo prebuild` + `./gradlew assembleRelease`
      succeeded (BUILD SUCCESSFUL in 37m32s, 559 tasks)._
- [x] 9.3 Produce a real APK and record its path; verify it launches on a device or emulator. `[E2E]` install and run with
      Metro stopped and the network off.
      _`dist/pokedex-quest-1.0.0-universal.apk` (103 MB, 4 ABIs) and `dist/pokedex-quest-1.0.0-arm64.apk`
      (41 MB, arm64-v8a only, built in 1m11s from the warm Gradle cache). Both statically verified with
      `aapt2 dump badging` (package/label/activity/targetSdk/ABIs) and `unzip -l` (bundle + dex + .so present). The
      install-and-launch half is NOT done — no device or emulator exists on this machine; tracked as task 9.7._
- [ ] 9.7 Install the produced APK on a real device (or create an emulator with a system image) and confirm it launches
      with Metro stopped: the tour, haptics and sprite loading on a device remain unverified until this is done.
- [x] 9.4 Prepare the iOS path: verify `eas.json` profiles are valid, document the exact IPA command and the required
      Apple credentials. If Xcode and/or an Apple Developer account are absent, record that plainly in the README
      instead of claiming an IPA exists.
      _Documented in the README: `npm run ios:ipa` with an Apple Developer account and provisioning profile; this machine
      has neither Xcode nor a paid account, so no IPA is claimed._
- [x] 9.5 Gitignore `android/`, `ios/`, keystores, provisioning profiles and `*.jks`; confirm no credential is committed.
      _Verified with `git check-ignore` and by grepping the tree for keystores/credentials._
- [x] 9.6 README build section: prerequisites, the exact commands, what is verified, what is blocked and why.
      _README has the prerequisites, both build routes, the produced-artifact table with hashes, and a Known limitations
      section naming what is blocked (device E2E, iOS IPA) and why._

## Phase 2 (explicitly NOT in this change)

- [ ] Status effects (burn/poison/paralyze) and held items.
- [ ] Evolution animation and in-battle evolution; dex evolution chains rendering.
- [ ] Trainer battles, NPCs, dialog, day/night cycle.
- [ ] App Store / Play Store submission, TestFlight, and paid Apple Developer enrolment.
