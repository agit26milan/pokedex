# Spec: World Exploration

## ADDED Requirements

### Requirement: Choose a partner before entering the world

The app SHALL require the player to pick exactly one of three Gen-1 starter partners (Bulbasaur, Charmander,
Squirtle) the first time the Play tab has no party member, and SHALL store it as party leader at level 5.

#### Scenario: First launch shows partner picker
- **WHEN** the Play tab is opened and the persisted party is empty
- **THEN** the partner picker is shown and the world map is NOT rendered until a choice is made

#### Scenario: Partner choice persists
- **WHEN** the player picks Bulbasaur and reloads the app
- **THEN** Bulbasaur is party leader at level 5 and the picker is not shown again

### Requirement: Endless procedural map

The map SHALL be generated deterministically from a persisted world seed and chunk coordinates, such that the same
seed always produces the same tiles, and the world has no boundary the player can reach.

#### Scenario: Same seed, same tiles
- **WHEN** a chunk is generated twice with the same seed and chunk coordinates
- **THEN** both generations return identical tile arrays

#### Scenario: Walking past the initial chunk
- **WHEN** the player walks beyond the edge of the loaded chunk
- **THEN** the next chunk is generated from the seed and movement continues without a loading screen

### Requirement: Tile types and blocked movement

Tiles SHALL have a type (path, grass, tall grass, water, rock). Water and rock SHALL be impassable; the player SHALL
receive visible and haptic feedback instead of a silent no-op.

#### Scenario: Moving into water
- **WHEN** the player attempts to step onto a water or rock tile
- **THEN** the player does not move, the tile shakes briefly, and a low haptic fires

### Requirement: Two ways to move, with visible affordance

The player SHALL be able to move one step by tapping an adjacent reachable tile, or move freely by dragging an
on-screen stick; adjacent reachable tiles SHALL be visually marked so the player never has to guess.

#### Scenario: Tap an adjacent tile
- **WHEN** the player taps one of the four adjacent reachable tiles
- **THEN** the player moves exactly one tile and a ripple plays at the destination

#### Scenario: Tap a distant tile
- **WHEN** the player taps a tile that is not adjacent
- **THEN** nothing happens; the game never teleports the player

#### Scenario: Stick drag
- **WHEN** the player drags the stick in a direction
- **THEN** movement animates continuously and snaps to the grid on release

### Requirement: Tall grass encounters

Stepping onto a tall grass tile SHALL roll for a wild encounter at the configured rate, and the very first tall grass
step of the run SHALL always trigger an encounter so the demo tour cannot fail.

#### Scenario: First tall grass step is guaranteed
- **WHEN** the player steps onto tall grass for the first time in the run
- **THEN** a wild encounter triggers regardless of the random roll

#### Scenario: Later steps use the configured rate
- **WHEN** the player steps onto tall grass after the first encounter
- **THEN** an encounter triggers with probability 18% per step

#### Scenario: Walking on non-tall-grass never triggers
- **WHEN** the player steps onto a path or plain grass tile
- **THEN** no encounter can trigger

### Requirement: Encounter presentation

A triggered encounter SHALL be presented as a bottom sheet over the dimmed map with the wild Pokémon's sprite, name,
level, types and HP, plus the actions Battle, Throw Ball and Run Away.

#### Scenario: Encounter sheet actions
- **WHEN** the encounter sheet is shown
- **THEN** tapping Battle enters the battle screen with the current party leader, throwing a ball resolves a catch
  attempt, and Run Away dismisses the sheet

### Requirement: Live encounter risk feedback

The world screen SHALL show the current encounter risk after every tall grass step and SHALL reset it after an
encounter resolves, so the loop feels alive rather than random.

#### Scenario: Risk rises in tall grass
- **WHEN** the player takes a step in tall grass without an encounter
- **THEN** the displayed encounter risk increases and is visible on the world screen
