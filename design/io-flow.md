Pokedex Quest - I/O flow
com.agitafirstawan.pokedexquest | Expo SDK 57 / RN 0.86
zustand + persist | offline-first | every path is a real file

=============================== INPUT ================================

[1] TOUCH - the only interactive input
    D-pad / glowing tile .... app/(tabs)/index.tsx
    Battle buttons .......... BattleView.tsx
    Encounter sheet ......... EncounterSheet.tsx
    Search / type chips ..... SearchBar, TypeFilter
    New run (HUD, top right)  WorldHud.tsx -> resetRun()

[2] RNG - seeded, so a run is replayable
    mulberry32(worldSeed), one stream per run
    used by rollEncounter, rollWild, computeDamage,
    rollCatch, item drops, throwBall

[3] BUNDLED DATA - no network needed
    pokedex.gen1.json -> dex.ts -> moves.ts
    151 species, 145 moves, 17 types, ~80 KB

[4] NETWORK - optional, enriches the detail screen
    PokeAPI -> app/pokemon/[id].tsx
    timeout or offline -> seed data + honest notice

[5] STORAGE - in and out over time
    AsyncStorage key "pokedex-quest/run", version 2

============================== PROCESS ==============================

        +----------------------------+
        |          SCREENS           |
        +----------------------------+
          (tabs)/index.tsx   PLAY
          (tabs)/glossary.tsx
          battle.tsx
          pokemon/[id].tsx
                    |
                    | one action
                    v
        +----------------------------+
        |   LOGIC - pure functions   |
        +----------------------------+
  world/logic
    world.ts         tileAt, nextPosition, isBlocked, chunk
    rollEncounter.ts first tall-grass step always encounters
    rollWild.ts      level = leader level +- 2
  battle/logic
    createSide.ts    member <-> BattleSide (HP and PP both ways)
    stats.ts         statsAt(entry, level), maxHpFor, xpForLevel
    typeChart.ts     effectiveness(), hasStab()
    damage.ts        pickStats() -> computeDamage()
    turnEngine.ts    resolveTurn(state, action, rng)
    catchRate.ts     rollCatch()
    levelUp.ts       applyXp() - a level up refills PP
    syncParty.ts     whose HP/PP to write back this turn
    worldThrow.ts    ball from the sheet (full HP = worse odds)
                    |
                    v
        +----------------------------+
        |    STATE - zustand slices  |
        +----------------------------+
  partySlice    party (max 6, else storage), bag, leaderId
                choosePartner addCaught updateMember
                spendItem grantItem healParty
  worldSlice    worldSeed position steps encounterRisk
                pendingEncounter
  pokedexSlice  query typeFilters (not persisted)
  store/index   persist + migrate v1->v2 + isValidRun
                -> freshRun() fallback, resetRun() anytime

================================ OUTPUT ==============================

  WorldGrid      tile map, camera on the UI thread (Reanimated)
                 player sprite, reachable-tile rings
  WorldHud       partner sprite, LV, HP bar, PP n/max, bag chips,
                 steps, encounter risk, NEW RUN button
  EncounterSheet wild sprite, type badges, odds hint, 3 choices
  BattleView     both HP bars, moves with PP, switch/bag/run,
                 event log
  Glossary       151 rows, search, type filters, caught marks
  Detail         base stats, learnset (Red/Blue), evolution,
                 enrichment notice when offline
  Side channels  haptics, navigation, AsyncStorage writes

========================= ONE TURN IN BATTLE =========================

player action (move | item | ball | run | switch)
    |
    v
turnEngine.resolveTurn(battle, action, rng)
    |
    |-- rejected up front, turn NOT consumed:
    |     move with pp <= 0  |  potion at full HP
    |
    |-- order by speed, then attack(attacker, defender, move)
    |     damage.ts
    |       pickStats: special -> SpA vs SpD, else Atk vs Def
    |       base = ((2*lvl/5+2) * power * atk / def) / 50 + 2
    |       x STAB 1.5 x type 0/0.5/1/2 x crit 2 @6.25%
    |       x spread 0.85-1.00
    |     turnEngine
    |       hp = max(0, hp - damage)      <-- HP changes HERE
    |       hp == 0 -> faint -> won / lost
    |
    |-- item  : heals only below max, event carries consumed
    |-- ball  : rollCatch(), the ball is spent either way
    |-- run   : 80% success
    |-- switch: the member leaving keeps its damage (syncParty)
    v
events -> BattleView log + HpBar
state  -> battle.tsx

====================== RUN LOOP: WORLD -> BACK ======================

  D-pad or tap a glowing tile
        |
        v
  walk() -> tileAt(seed, x, y)
        |        |
        |        +-- rock or water -> no step taken
        v
  grass or tall grass -> steps++, risk meter grows
        |
        v
  rollEncounter(rng, tile, firstEncounterDone)
        |-- first tall-grass step of a run: guaranteed
        v
  EncounterSheet - the map stays visible underneath
        |
        +--> BATTLE      -> router.push('/battle', id + level)
        +--> THROW BALL  -> worldThrow(): full HP, worse odds,
        |                   ball spent, wild stays put
        +--> RUN AWAY    -> risk cleared, back to the map
                            |
                            v
                 battle.tsx <-> turnEngine (above)
                            |
        outcome: won | lost | caught
                            |
      +---------------------+---------------------+
      v                     v                     v
  xp -> level up        run failed           ball hit
  refills PP,           healParty(0.5)       addCaught()
  learns moves          + PP refilled        party <= 6 else
      |                     |                storage + dex mark
      +---------------------+---------------------+
                            v
      updateMember(index, memberFromSide(...))
      -> HP and PP written back to the party
      drop: 20% -> potion or poke ball (grantItem)
                            v
                    back to the world

========================= PERSISTENCE ===============================

  store change --> partialize --> AsyncStorage
                     key "pokedex-quest/run" v2
  launch
    |
    v
  migrate: v2 -> as is
           v1 -> moves: string[] becomes [{name, pp}]
           other -> fresh run
    |
    v
  mergePersisted: isValidRun() ? saved : freshRun()
  (a bad save can never crash the app)

  NOT persisted: battle state (transient), dex query/filters
  Derived, never a stored flag: caught list, PP totals, HP bars

========================== INVARIANTS ===============================

1. resolveTurn is pure: (state, action, rng) -> new state.
   Replayable, so it is testable without mocks.
2. Game state is derived from data, not from UI flags.
3. A step must not re-render 400 tiles: the camera is the only
   animation outside the HUD.
4. Every dead end stays playable: no PP -> Struggle, no balls ->
   battle instead, bad save -> fresh run.
5. 187 tests, and the battle engine holds 100% of them: the UI
   has no game rules of its own.
