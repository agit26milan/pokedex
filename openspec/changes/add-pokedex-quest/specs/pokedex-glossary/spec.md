# Spec: Pokédex Glossary

## ADDED Requirements

### Requirement: List every Gen-1 Pokémon

The Glossary tab SHALL list all 151 Gen-1 Pokémon in national dex order, each row showing sprite, dex number, name,
type badges and a caught mark when applicable.

#### Scenario: Full list on open
- **WHEN** the Glossary tab is opened
- **THEN** 151 rows are listed in dex order with the caught count shown

### Requirement: Search by name

The Glossary SHALL filter the list by name as the player types, case-insensitively and without a network request.

#### Scenario: Partial name search
- **WHEN** the player types "pika"
- **THEN** only matching Pokémon (for example Pikachu) remain in the list

#### Scenario: No results
- **WHEN** the query matches nothing
- **THEN** an empty state is shown instead of a blank screen

### Requirement: Filter by type

The Glossary SHALL offer type filters that can be combined with the name search, and SHALL make it obvious when a
filter is active.

#### Scenario: Single type filter
- **WHEN** the player selects the Electric type filter
- **THEN** only Electric Pokémon are listed

#### Scenario: Filter combined with search
- **WHEN** a type filter and a search query are both active
- **THEN** the result is the intersection of both conditions

### Requirement: Detail screen

Tapping a row SHALL open a detail screen showing the large sprite, dex number, name, types, base stats and the
currently learned moves.

#### Scenario: Detail from seed data
- **WHEN** a detail screen is opened
- **THEN** it renders immediately from bundled seed data without waiting for the network

### Requirement: Offline-first data with live enrichment

The app SHALL bundle a generated seed containing dex number, name, types, base stats, evolution chain and legal move
data for all 151 Pokémon. Battle and world logic SHALL read only from that seed. The detail screen MAY enrich itself
from PokéAPI and SHALL cache the response on the device.

#### Scenario: No network at all
- **WHEN** the device has no connectivity
- **THEN** the world, battles, list, search, filter and detail screens all still work from seed data

#### Scenario: Enrichment succeeds and is cached
- **WHEN** the detail screen is opened online
- **THEN** the extra PokéAPI fields are fetched once and reused on later opens without refetching

#### Scenario: Enrichment fails
- **WHEN** the PokéAPI request fails or times out
- **THEN** the screen keeps showing seed data and surfaces a non-blocking notice

### Requirement: Caught state is shared with the game

The caught mark SHALL come from the same persisted run state used by the battle catch flow, so catching a Pokémon in
Play immediately updates the Glossary.

#### Scenario: Catching updates the dex
- **WHEN** a Pokémon is successfully caught in battle
- **THEN** its Glossary row shows a caught mark and the caught counter increases
