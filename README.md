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
5. Coins won in battle are spent in the **Bags** tab: potion 10, hyper potion 20, Poké Ball 10,
   Great Ball 15. The **Storage** tab moves a Pokémon between the bench and the party, and it refuses
   the two moves that would break a run — sending the lead away, or emptying the party.

Progress survives a reload. A half-finished battle deliberately does not.

## Requirements

No account, no API key and no environment variable: the game reads a bundled data snapshot, and PokéAPI is only
touched by `npm run seed` and the glossary detail enrichment.

| Need | Version | For |
| --- | --- | --- |
| Node.js | `20.19.4+` · `22.13+` · `24.3+` · `25+` — what `react-native@0.86.3` declares in its own `engines` field | everything |
| npm | 10+ (comes with Node 20) | install and scripts |
| OS | macOS, Linux or Windows | Expo Go works from any of them; the local-Android scripts here assume macOS |
| Expo Go app | current version, iOS or Android | the 30-second path, no dev build |
| Phone + laptop on the same Wi-Fi | — | so the QR code can reach Metro |
| JDK 17 + Android SDK | Temurin 17, `platforms;android-36`, `build-tools;36.0.0` | **only** for local APK builds and the emulator |
| Android emulator + AVD | `system-images;android-36;google_apis;arm64-v8a`, AVD named `pokedex` | **only** for `npm run emulator` / `npm run e2e:android` |

Checked on Node 25.9.0 / npm 11.12.1, macOS on Apple silicon, against an Android 36 arm64 emulator.

## Install and run

```bash
git clone <this repo> && cd pokemon
npm install        # no native build step, no credentials
npm start          # Metro + a QR code
```

Then pick a target:

| Target | Command | Needs |
| --- | --- | --- |
| **Expo Go (fastest)** | scan the QR with Expo Go, or press `a` / `i` for a booted emulator or simulator | nothing but Node |
| Emulator, existing release APK | `npm run emulator` | an APK in `dist/` and an AVD named `pokedex`; `npm run emulator -- --debug` builds a debug APK and starts Metro instead |
| Emulator, from source | `npm run android` | the JDK 17 + SDK pair |
| iOS simulator | `npm run ios` | Xcode |
| Cloud build | `npm run android:apk` (`eas build -p android --profile preview`) | an Expo account; `eas.json` carries development / simulator / preview / production |

Expo Go compatibility is a hard requirement here: the reviewer should be playing 30 seconds after
`npm install`, without a dev build.

Missing the JDK/SDK? `bash scripts/setup-local-android.sh` installs both under `~/Library/Java` and
`~/Library/Android/sdk` without `sudo` (macOS, Apple silicon) and prints the exports for `~/.zshrc`. It does
**not** install the emulator or a system image — for those:

```bash
sdkmanager --install emulator 'system-images;android-36;google_apis;arm64-v8a'
avdmanager create avd -n pokedex -k 'system-images;android-36;google_apis;arm64-v8a'
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| QR scans but the app cannot reach Metro | phone and laptop on one network, or `npx expo start --tunnel` |
| `Port 8081 is running this app in another window` | `npx expo start --port 8082`, or stop the other Metro |
| `emulator: command not found` | `sdkmanager --install emulator` — the setup script does not do this |
| Gradle fails with a Java version error | point `JAVA_HOME` at `temurin-17.jdk` — the JDK every script here exports, and the only one this was built with |
| Strange resolve errors after a dependency bump | `npx expo-doctor`, then `npm ci` |
| Suspect a rule is broken | `npm test` — 352 tests pin the rules before you debug a screen |

## Verify it

```bash
npm run typecheck  # tsc --noEmit
npm run lint       # eslint, react-hooks/exhaustive-deps is an error
npm test           # 352 unit tests across 42 suites
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

> Those two files were produced on 7 Oct 00:42–00:43, i.e. **before** the Storage/Bags tabs and the battle grass
> landed: neither bundle contains `BAGS`, `StorageRow` or `ShopRow`. `bash scripts/build-apks.sh` rebuilds both in
> one go, copies them into `dist/` and prints the new hashes, so this table can be refreshed.

Verified by inspecting the produced file (`aapt2 dump badging`, `unzip -l`), not by assuming the build
succeeded, and launched on an emulator (see task 9.7 in the OpenSpec change). Test files live under
`src/`, never under `app/`: expo-router compiles every file in `app/` into the route context, so a test
there breaks the release bundle.

## Layout

```
app/                        expo-router routes — tabs PLAY, STORAGE, BAGS, GLOSSARY — plus battle + pokemon/[id]
src/
  features/
    world/    logic/  world (chunkOf, tileAt, isBlocked, nextPosition), rollEncounter, rollWild
              ui/     WorldGrid, Tile, Dpad, WorldHud, EncounterSheet
    battle/   logic/  damage, typeChart, catchRate, turnEngine, levelUp, createSide, stats, evolve,
                      getMoney, syncParty, worldThrow
              ui/     BattleView, HpBar, XpBar, EvolutionMoment, GrassField
    party/    logic/  partyRules, shop, strength, activeMember
              ui/     PartnerPicker, LeadPickerSheet, LeadRow, StrengthPanel, PartySlotCard,
                      StorageRow, BagRow, ShopRow, ItemGlyph, itemMeta, RosterNotice
              store/  partySlice                                           types.ts
    pokedex/  logic/  filterPokemon                                         ui/  PokemonList, PokemonRow, SearchBar, TypeFilter
              store/  pokedexSlice
    shell/    ui/     tabs-layout.test.tsx (the bar itself lives in app/(tabs)/_layout.tsx)
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
version, a migration chain and a shape check: a corrupt or stale payload falls back to a fresh run
instead of crashing. v1→v2 gives every persisted move a PP slot; v2→v3 fills in a bag that a v2 save
never had. The party, the storage, the bag (balls, potions, coins) and the lead id are all part of the
persisted run.

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
| Money | `floor(foe level / winner level × 10 + 10)` | a win pays something even against a much weaker foe |
| Shop | potion 10 · hyper potion 20 · Poké Ball 10 · Great Ball 15 | prices live in `party/types.ts`; the screen only reads them |
| Potions | restore 50% of max HP, and on a fainted member the same item is the revive | there is no Pokémon Centre, so an item has to be the recovery path |
| Storage | refuses the two moves that break a run — the lead, and the last party member | the party can never be emptied or left leaderless |

Damage follows the Gen-1 formula with STAB, a critical chance and the full modern 18-type chart —
Gen-1 species already carry Fairy/Steel typing (Clefairy, Magnemite), so a 15-type chart would
silently mis-resolve those matchups.

## Picking your lead

Tap the partner card in the world HUD to open the party sheet (the card, not the whole HUD, so a
mis-tap while walking never swaps a Pokémon). Each row shows HP, XP inside the current level, and a
**combat rating** — `attack + defense + specialAttack + specialDefense + speed` at that Pokémon's
level, graded A ≥ 150 / B ≥ 120 / C ≥ 100 / D below, from `src/features/party/logic/strength.ts`.
Opening a row adds the six stats, each move's type/power/PP, and the member's rank inside the party.

The lead wears a ★ in the HUD, in the party list and on the battle bench, and it is the Pokémon that
steps out first. A fainted member (0 HP) cannot be made lead — the sheet says so and the battle falls
through to the next healthy one — and the ★ stays where it is until you move it. The choice survives a
reload: `leaderId` is part of the persisted run, and `updateMember` keeps it pointing at the right id
when a member evolves (the evolution used to strand the lead on the old id, which paid 0 XP).

Design reference: `design/lead-picker.html` (local mockup, ignored by git).

## Performance

The rules were treated as acceptance criteria, not decoration:

- The world renders a 20×20 chunk as **memoized tiles with stable keys**; moving animates the camera
  with a Reanimated shared value on the UI thread, so a step never re-renders 400 tiles.
- The battle's tall grass is 41 blades in four depth bands driven by **two shared clocks** — it animates
  `transform` and `opacity` only, honours `ReduceMotion.System`, and cancels on `AppState` background so a
  suspended app is never animating.
- `Sprite`, `TypeBadge`, `PokemonRow`, `Tile`, the move buttons and the rows added later (`StorageRow`,
  `ShopRow`, `BagRow`, `ItemGlyph`, `PartySlotCard`) are `memo` with primitive props and callback props
  held stable by `useCallback` — that is the point of memoizing them.
- `useMemo` appears exactly twice in the list screen, for work that is real: filtering 151 entries and
  building the caught-id `Set`.
- `react-hooks/exhaustive-deps` is an error, and it is satisfied by construction: the battle screen's mount guard
  derives its dependencies instead of silencing the rule. There is no `eslint-disable` anywhere in the codebase.

## Comments

Comments are the exception, and where they exist they are load-bearing: eight lines in `app/(tabs)/_layout.tsx`
explain why the tab bar must not pin a `height` or a `paddingTop` — the library resolves the safe-area inset *after*
a custom height, so a pinned bar spends the inset out of its own content box. Everywhere else the reasoning that
would otherwise sit next to the code lives in the OpenSpec change documents (`openspec/changes/*/design.md`), in
`README.md`, and in the `design/` mockups. Every non-obvious rule — the damage formula, why a switch must persist
the outgoing member, why an item is only spent once the engine reports it consumed, why PP refills on level up — has
a named home there, and the tests pin the behaviour.

## Testing

352 unit tests across 42 suites: seeded RNG, chunk determinism and blocked movement, the encounter
guarantee and rate, party overflow into storage, the type chart, damage monotonicity and crits, the
damage class picking the right stat pair, catch odds, the full turn engine (order, miss, PP rejection,
switch cost, faint, run, determinism), that a switch keeps the outgoing member's HP and PP, that an
item is only consumed when it does something, XP and level-up move learning, persisted PP, the v1→v2
and v2→v3 save upgrades, shop purchases (out of money, bad quantity, unknown item), potion healing and
revive, moving a member to storage and back including the refusals, money per win, evolution, glossary
filtering, the Bags and Storage screens, the tab bar layout, world ball throws, the grass field, the
new-run wipe, and the corrupt-storage fallback.

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
