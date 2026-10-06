# Spec: Battle System

## ADDED Requirements

### Requirement: Pure deterministic turn engine

The battle logic SHALL be implemented as pure functions that take a battle state plus one player action and return
the next battle state, with all randomness coming from an injectable seeded RNG so any battle can be replayed exactly
in a test.

#### Scenario: Same seed, same outcome
- **WHEN** the same battle state and the same action are resolved twice with the same RNG seed
- **THEN** both resulting states are identical

#### Scenario: Engine runs without React
- **WHEN** the engine is imported in a Jest test with no renderer
- **THEN** it resolves turns and returns state without referencing React, the store, or the network

### Requirement: Turn order and player actions

Each turn SHALL offer the actions Use Move, Switch, Use Item and Run. A player action SHALL resolve first when the
active Pokémon's speed is at least the opponent's, otherwise the opponent SHALL act first.

#### Scenario: Player is faster
- **WHEN** the player selects a move and the player's active Pokémon has equal or higher speed
- **THEN** the player's move resolves before the opponent's counterattack

#### Scenario: Switching consumes the turn
- **WHEN** the player switches party member
- **THEN** the new Pokémon is sent out and the opponent immediately takes its turn

### Requirement: Moves, accuracy, criticals and type effectiveness

Each Pokémon SHALL have up to 4 usable moves with power, accuracy, PP and damage class. Damage SHALL follow the
Gen-1 style formula using level, attack, defense, STAB and the 18-type effectiveness chart, with a 6.25% critical
chance. Accuracy SHALL be rolled before damage; PP SHALL decrease per use and a move at 0 PP SHALL be rejected.

#### Scenario: Type effectiveness applied
- **WHEN** a Grass move hits a Water Pokémon
- **THEN** the damage is multiplied by the chart value and the log states whether it was super effective or not very effective

#### Scenario: Move out of PP
- **WHEN** the player taps a move whose PP is 0
- **THEN** the move is rejected with a visible message and no turn is consumed

#### Scenario: Accuracy miss
- **WHEN** the accuracy roll fails
- **THEN** the move deals no damage and the log reports the miss

### Requirement: Fainting, XP and automatic level up

A Pokémon at 0 HP SHALL faint. If the player's active Pokémon faints with at least one healthy party member left, the
player SHALL be prompted to switch; otherwise the battle is lost and the player returns to the map. Winning SHALL
grant XP, and crossing the Gen-1 threshold SHALL raise the level and learn newly legal moves automatically.

#### Scenario: Player Pokémon faints
- **WHEN** the player's active Pokémon reaches 0 HP and another party member is healthy
- **THEN** the player is forced to choose a replacement before the next turn

#### Scenario: Level up learns a move
- **WHEN** accumulated XP crosses the threshold for the next level and a level-up move exists at that level
- **THEN** the level increases and the move is learned without interrupting the player with a prompt

#### Scenario: Battle lost
- **WHEN** every party member has fainted
- **THEN** the battle ends, the player returns to the map, and party HP is partially restored

### Requirement: Catch flow driven by remaining HP

Throwing a ball SHALL resolve a catch attempt whose probability increases as the wild Pokémon's remaining HP
decreases, and a successful catch SHALL add the Pokémon to the party (or to storage when the party already holds 6)
and mark it caught in the Glossary.

#### Scenario: Catch succeeds
- **WHEN** a ball is thrown and the catch roll succeeds
- **THEN** the wild Pokémon joins the party, the dex marks it caught, and the battle ends

#### Scenario: Catch fails but ball is consumed
- **WHEN** the catch roll fails
- **THEN** one ball is removed from the bag and the opponent takes its turn

#### Scenario: Party already full
- **WHEN** the catch succeeds while the party holds 6 Pokémon
- **THEN** the Pokémon goes to storage, still counts as caught in the Glossary, and the party is unchanged

#### Scenario: No balls left
- **WHEN** the bag holds no ball
- **THEN** throwing is disabled with a visible reason instead of failing silently

### Requirement: Items and running away

The player SHALL start with 10 Poké Balls and 3 Potions. Using a Potion SHALL heal the active Pokémon and consume the
turn. Run Away SHALL succeed 80% of the time against wild Pokémon and SHALL always end the battle when successful.

#### Scenario: Potion heals and passes the turn
- **WHEN** a Potion is used on a damaged Pokémon
- **THEN** HP is restored, one Potion is consumed, and the opponent takes its turn

#### Scenario: Run away fails
- **WHEN** the run roll fails
- **THEN** the player stays in battle and the opponent takes its turn
