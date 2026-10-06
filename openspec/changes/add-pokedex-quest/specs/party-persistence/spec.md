# Spec: Party And Persistence

## ADDED Requirements

### Requirement: Party of up to six

The run SHALL keep a party of at most 6 Pokémon with exactly one active leader. A Pokémon caught while the party is
full SHALL be placed in storage instead.

#### Scenario: Party fills up
- **WHEN** a fourth, fifth and sixth Pokémon are caught
- **THEN** all six are in the party and the leader is unchanged

#### Scenario: Seventh catch goes to storage
- **WHEN** a Pokémon is caught with 6 already in the party
- **THEN** it appears in storage, the party stays at 6, and it is still marked caught in the Glossary

### Requirement: Bag inventory

The run SHALL track Poké Balls, Great Balls and Potions, starting with 10 Poké Balls and 3 Potions, and SHALL never
allow an item count to go below zero.

#### Scenario: Using the last ball
- **WHEN** the player uses the final Poké Ball
- **THEN** the count becomes 0 and further throw attempts are blocked

#### Scenario: Battle reward
- **WHEN** a wild battle is won
- **THEN** there is a 20% chance to gain a Potion or a Poké Ball, and the bag updates

### Requirement: Run state survives reload

Party, storage, bag, world seed, player position and dex caught flags SHALL persist locally and be restored after the
app is reloaded, using a versioned persisted store with a migration path.

#### Scenario: Reload keeps the run
- **WHEN** the player reloads the app after walking, catching and spending a ball
- **THEN** position, party, bag and caught flags are exactly as they were

#### Scenario: Stored state from an older version
- **WHEN** persisted state carries an older version number
- **THEN** the migration runs and the app starts without crashing

### Requirement: Battle in progress is not persisted

Transient battle state SHALL NOT be written to storage, so a reload never restores a half-finished battle.

#### Scenario: Reload during battle
- **WHEN** the app is reloaded while a battle is in progress
- **THEN** the player returns to the world map with a consistent party, not into a broken battle

### Requirement: Expo Go compatibility

The app SHALL run in Expo Go with no dev build and no custom native module, so the reviewer can scan a QR code and
start playing.

#### Scenario: QR scan on a clean device
- **WHEN** a reviewer scans the QR code from a clean Expo Go install
- **THEN** the app loads and the two-minute tour can be completed without any native build step
