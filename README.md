# Pokédex Quest

A playable mobile Pokédex built with React Native (Expo). Pick a partner, walk into the tall grass,
fight what you find, catch it, and watch it show up in the Glossary.

## The two-minute tour

1. Open the **Play** tab and choose a partner (Bulbasaur / Charmander / Squirtle — their level-5
   moveset and stats are on the card before you commit).
2. Walk with the D-pad or tap one of the glowing tiles. The **first** step into tall grass always
   starts an encounter; after that it is 18% per step, which the risk meter shows climbing.
3. In the battle: pick a move. Bulbasaur's Vine Whip shreds the Water types near the start.
   Weaken the wild Pokémon, then **BAG → POKé BALL**. Remaining HP sets the odds, and the odds are
   printed on the button.
4. Catch it and it joins your party — or your storage if you already have six. Either way it counts
   as caught in the **Glossary**, which lists all 151 Gen-1 Pokémon with search (name or `#025`)
   and multi-select type filters.

Progress survives a reload. A half-finished battle deliberately does not.

## Run it

```bash
npm install
npm start          # then scan the QR code with Expo Go, or press a / i
```

Expo Go compatibility is a hard requirement here: the reviewer should be playing 30 seconds after
`npm install`, without a dev build.

## Verify it

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint, react-hooks/exhaustive-deps is an error
npm test           # 133 unit tests across 16 suites
npm run seed       # regenerate src/shared/data/pokedex.gen1.json from PokéAPI (opt-in)
```

The only thing that ever calls PokéAPI is `npm run seed` and the glossary detail enrichment. Gameplay
reads a bundled snapshot, so encounters, damage and catch odds all work in airplane mode.

## Build the APK

Local, no credentials:

```bash
export JAVA_HOME="$HOME/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
npx expo prebuild -p android --no-install
cd android && ./gradlew assembleRelease
# android/app/build/outputs/apk/release/app-release.apk
```

`scripts/setup-local-android.sh` installs the JDK 17 + Android SDK pair that this expects, without
`sudo`. `eas.json` also carries `development` / `simulator` / `preview` (APK) / `production`
profiles for EAS cloud builds.

Leaner build for real phones (arm64 only, drops the emulator ABIs):

```bash
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

### What was actually built

| Artifact | Details |
| --- | --- |
| `dist/pokedex-quest-1.0.0-universal.apk` | 103 MB, all four ABIs (`arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`) — safest for an unknown device or an emulator |
| `dist/pokedex-quest-1.0.0-arm64.apk` | 41 MB, `arm64-v8a` only — the one to hand a reviewer with a modern phone |
| Package | `com.agitafirstawan.pokedexquest`, versionCode 1, versionName 1.0.0, targetSdk 36 |
| Label / activity | `Pokédex Quest` / `.MainActivity` |
| Self-contained | `assets/index.android.bundle` (3.2 MB) is embedded in both, so they run with Metro stopped and no network |
| SHA-256 | universal `f6ce8271b0e16f130de6352cb558d924e9e364493e8636ab735bdec90e5764e8`, arm64 `49678785289b7e55ddfaa38145f49c17981f6370ee04646dfe2adc3f756eb7f3` |

Verified by inspecting the produced file (`aapt2 dump badging`, `unzip -l`), not by assuming the build
succeeded, and launched on an emulator (see task 9.7 in the OpenSpec change). Test files live under
`src/`, never under `app/`: expo-router compiles every file in `app/` into the route context, so a test
there breaks the release bundle.

## Layout

```
app/                        expo-router routes (tabs: Play, Glossary) + battle + pokemon/[id]
src/
  features/
    world/    logic/  generateChunk, movePlayer, rollEncounter, rollWild   ui/  WorldGrid, Tile, Dpad, WorldHud, EncounterSheet
    battle/   logic/  damage, typeChart, catchRate, turnEngine, levelUp, createSide, stats
              ui/     BattleView, HpBar
    party/    logic/  partyRules                                            ui/  PartnerPicker
              store/  partySlice                                           types.ts
    pokedex/  logic/  filterPokemon                                         ui/  PokemonList, PokemonRow, SearchBar, TypeFilter
              store/  pokedexSlice
  store/                    composes the slices, persist + validation
  shared/       api/ axios client + cached enrichment
                components/ Sprite, TypeBadge
                data/ pokedex.gen1.json (generated), dex.ts, moves.ts
                lib/  rng (mulberry32), storage, format
  theme/                    tokens: colors, spacing, 18-type colour map
```

Feature-based rather than type-based: everything about the world sits together, so a reviewer can
read one folder instead of hunting through `components/` and `hooks/`. Each feature keeps `logic/`
(pure, tested, no React) separate from `ui/` (dumb, props in, callbacks out).

## State

One zustand store over three slices — `party`, `world`, `pokedex` — persisted to AsyncStorage with a
version and a shape check: a corrupt or stale payload falls back to a fresh run instead of crashing.

Battle state is **not** in the store. The screen owns it with a lazy `useState`, which makes "a reload
never restores a half-finished battle" true by construction rather than by a `partialize` allowlist.

Anything derivable is derived: "caught" is `party ∪ storage`, never a second copy that can drift.

## Game rules worth knowing

| Rule | Value | Why |
| --- | --- | --- |
| Encounter rate | 18% per tall-grass step | the spec's number, surfaced live in the risk meter |
| First encounter | always fires | the two-minute tour must not depend on luck |
| Wild level | partner level − 2, +0..3 | the tour stays winnable |
| Catch odds | Gen-1 style ratio, clamped 3%–95% | never impossible, never a guaranteed catch |
| XP | `12 × foe level`, up to +50% underdog bonus | grinding stays optional |
| Level up | automatic, learns moves up to 4 | the spec asks for no prompt |
| Evolution | level triggers only, at the end of a won battle | the data carries stones and trades too, but the game has neither |
| Struggle | fallback for Abra/Ditto/Metapod/Kakuna | without it a player could field a Pokémon that can never win |

Damage follows the Gen-1 formula with STAB, a critical chance and the full modern 18-type chart —
Gen-1 species already carry Fairy/Steel typing (Clefairy, Magnemite), so a 15-type chart would
silently mis-resolve those matchups.

## Performance

The rules were treated as acceptance criteria, not decoration:

- The world renders a 20×20 chunk as **memoized tiles with stable keys**; moving animates the camera
  with a Reanimated shared value on the UI thread, so a step never re-renders 400 tiles.
- `Sprite`, `TypeBadge`, `PokemonRow`, `Tile` and the move buttons are `memo` with primitive props and
  callback props held stable by `useCallback` — that is the point of memoizing them.
- `useMemo` appears exactly twice in the list screen, for work that is real: filtering 151 entries and
  building the caught-id `Set`.
- `react-hooks/exhaustive-deps` is an error, and it is satisfied by construction: the battle screen's mount guard
  derives its dependencies instead of silencing the rule. There is no `eslint-disable` anywhere in the codebase.

## Comments

The code carries no comments by request. That is a policy, not an omission: the reasoning that would otherwise sit
next to the code lives in the OpenSpec change documents (`openspec/changes/*/design.md`), in `README.md`, and in
`design/io-flow.md` for the data flow. Every non-obvious rule — the damage formula, why a switch must persist the
outgoing member, why an item is only spent once the engine reports it consumed, why PP refills on level up — has a
named home there, and the tests pin the behaviour.

## Testing

187 unit tests: seeded RNG, chunk determinism and blocked movement, the encounter guarantee and rate,
party overflow into storage, the type chart, damage monotonicity and crits, the damage class picking
the right stat pair, catch odds, the full turn engine (order, miss, PP rejection, switch cost, faint,
run, determinism), that a switch keeps the outgoing member's HP and PP, that an item is only consumed
when it does something, XP and level-up move learning, persisted PP and the v1 to v2 save upgrade,
glossary filtering, world ball throws, the new-run wipe, and the corrupt-storage fallback.

Everything that decides an outcome is pure with an injected RNG, so a battle can be replayed exactly
in a test. `logic/` folders contain no React and no AsyncStorage.

## Known limitations

- **Device coverage is an emulator, not a physical phone.** On an Android 36 arm64 emulator the release APK installs,
  launches, and runs with airplane mode on (credentials-free, `scripts/emulator-e2e.sh` / `npm run e2e:android`), and
  the project also loads through Expo Go's `exp://` URL — the same URL the QR code encodes. Still unverified: real
  haptics, GPU-realistic frame timing, and a hand-driven run of the whole tour. The tour's logic is pinned headlessly in
  `src/tour.test.ts` instead of being claimed from a screenshot.
- **iOS**: `eas.json` has the profiles ready, but an installable IPA needs Xcode plus a paid Apple
  Developer account and a provisioning profile — out of scope for this take-home.
- **Status effects, held items, and an item-based way to restore PP are out of scope** (phase 2 by agreement). PP does
  persist between battles and is refilled on level up and after a loss. That is deliberate rather than faithful to Gen 1:
  the original leans on long dungeons, Pokémon Centers and Ethers, none of which exist here, so importing PP without a
  recovery path would strand a run with no usable move.
- Sprites are loaded from the PokeAPI sprite CDN at runtime; the app degrades to type badges if it is
  offline, and the detail screen shows a short notice instead of a blank panel.
