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
- [ ] 4.3 `(glossary)/[id].tsx` detail from seed, then axios enrichment + AsyncStorage cache with TTL and silent fallback.
      `[E2E]` open detail with airplane mode on.

## 5. World / Play

- [x] 5.1 `logic/generateChunk.ts` (seeded chunk generation) + `logic/movePlayer.ts` (blocked tiles, adjacency) with unit
      tests: determinism, blocked movement, adjacency rule.
- [x] 5.2 `logic/rollEncounter.ts` (18% rate, guaranteed first encounter) with unit tests using seeded RNG.
- [ ] 5.3 Partner picker screen + `logic/partyRules.ts` (party max 6, storage overflow) with unit tests.
- [ ] 5.4 `ui/WorldGrid.tsx` + `ui/Tile.tsx` rendering the chunk with reachable-tile rings, rustle on tall grass and the
      risk meter; Reanimated movement so tiles do not re-render. `[E2E]` walking feels responsive on a device.
- [ ] 5.5 `ui/Stick.tsx` joystick + tap-to-step + long-press sprint + haptics on step/encounter.

## 6. Battle

- [ ] 6.1 `logic/damage.ts` (formula, STAB, 18-type chart, crit) with unit tests for super/not-very effective, crit and
      minimum damage. _Chart must be the modern 18-type table: Gen-1 species typing in the seed already includes fairy
      and steel (e.g. Clefairy, Magnemite), so a 15-type chart would silently mis-resolve those matchups._
- [ ] 6.6 Handle Pokémon whose Red-Blue learnset has no damaging move (metapod, kakuna, abra, ditto — found in the seed):
      engine grants a fallback Struggle-style move so a wild one can still fight and a caught one can never soft-lock the
      player into an unwinnable battle. Unit tests for both directions.
- [ ] 6.2 `logic/turnEngine.ts` (`resolveTurn(state, action, rng) -> {state, events}`) with unit tests: turn order by
      speed, accuracy miss, PP exhaustion rejection, switch-in consumes turn.
- [ ] 6.3 `logic/catchRate.ts` + `logic/levelUp.ts` (XP thresholds, automatic move learning) with unit tests, including
      party-full storage path and no-balls path.
- [ ] 6.4 `ui/BattleView.tsx` + `ui/MoveGrid.tsx` + `ui/HpBar.tsx` + `ui/PartySwitch.tsx` + bag/run actions, driven only by
      engine events. `[E2E]` full battle to a catch on a device.
- [ ] 6.5 `ui/EncounterSheet.tsx` bottom sheet (Battle / Throw Ball / Run Away) with haptics and spring-in.

## 7. Persistence and polish

- [ ] 7.1 Persist run state (party, storage, bag, seed, position, caught flags) with version + migrate; keep battle transient.
- [ ] 7.2 Defensive reload path: invalid persisted state falls back to a fresh run instead of crashing. Unit tests for both.
- [ ] 7.3 Performance pass with evidence: record render counts for a step and a list scroll, confirm tiles are not
      re-rendered and memo/useCallback/useMemo are only where design.md says. Fix or remove anything unjustified.
- [ ] 7.4 README: setup, QR instructions, 2-minute tour script, architecture map, performance notes, phase-2 backlog.

## 8. Verification

- [ ] 8.1 `npm run typecheck && npm run lint && npm test` green; note the real test count (no claimed coverage numbers).
- [ ] 8.2 `[E2E]` Two-minute tour on a real device via Expo Go QR: partner → tall grass → encounter → win → catch → Glossary
      shows the caught mark.
- [ ] 8.3 `[E2E]` Airplane mode run: world, battle, list, search, filter and detail all still work.
- [ ] 8.4 Sanity-check non-goals are still non-goals (no trainer battle, no status effect, no native module added).

## 9. Build and distribution (APK + iOS/IPA path)

- [ ] 9.1 Add `eas.json` with `development`, `simulator`, `preview` (Android APK) and `production` profiles; add
      `npm run android:apk` / `npm run ios:build` scripts that call the documented commands.
- [ ] 9.2 Decide the APK route with evidence: try EAS cloud build (`eas build -p android --profile preview`) and, if no
      Expo login is available, install the local toolchain (Android cmdline-tools + platform/build-tools + JDK 17) and
      use `npx expo prebuild -p android && ./gradlew assembleRelease`.
- [ ] 9.3 Produce a real APK and record its path; verify it launches on a device or emulator. `[E2E]` install and run with
      Metro stopped and the network off.
- [ ] 9.4 Prepare the iOS path: verify `eas.json` profiles are valid, document the exact IPA command and the required
      Apple credentials. If Xcode and/or an Apple Developer account are absent, record that plainly in the README
      instead of claiming an IPA exists.
- [ ] 9.5 Gitignore `android/`, `ios/`, keystores, provisioning profiles and `*.jks`; confirm no credential is committed.
- [ ] 9.6 README build section: prerequisites, the exact commands, what is verified, what is blocked and why.

## Phase 2 (explicitly NOT in this change)

- [ ] Status effects (burn/poison/paralyze) and held items.
- [ ] Evolution animation and in-battle evolution; dex evolution chains rendering.
- [ ] Trainer battles, NPCs, dialog, day/night cycle.
- [ ] App Store / Play Store submission, TestFlight, and paid Apple Developer enrolment.
