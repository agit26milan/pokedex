import { MOVES } from '@/shared/data/dex';
import { isDamaging, moveInfo, STRUGGLE } from '@/shared/data/moves';
import { pickOne, rollChance, type Rng } from '@/shared/lib/rng';
import { catchChance, rollCatch } from './catchRate';
import { computeDamage, pickStats } from './damage';
import type { Stats } from './stats';
import { effectiveness } from './typeChart';

export type BattleSideName = 'player' | 'foe';
export type BattleOutcome = 'ongoing' | 'won' | 'lost' | 'caught' | 'fled';
export type BallName = 'pokeBall' | 'greatBall';

export interface BattleMove {
  name: string;
  pp: number;
  maxPp: number;
}

export interface BattleSide {
  id: number;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  stats: Stats;
  types: string[];
  moves: BattleMove[];
  captureRate: number;
}

export interface BattleState {
  player: BattleSide;
  foe: BattleSide;
  turn: number;
  outcome: BattleOutcome;
}

export type BattleAction =
  | { kind: 'move'; move: string }
  | { kind: 'switch'; to: BattleSide }
  | { kind: 'item'; item: 'potion' }
  | { kind: 'ball'; ball: BallName }
  | { kind: 'run' }
  | { kind: 'item'; item: 'hyperPotion' };

export interface BattleEvent {
  kind: 'move' | 'miss' | 'nopp' | 'faint' | 'switch' | 'item' | 'ball' | 'run';
  text: string;
  side?: BattleSideName;
  damage?: number;
  effectiveness?: number;
  critical?: boolean;

  consumed?: boolean;
}

export const BALL_BONUS: Record<BallName, number> = { pokeBall: 1, greatBall: 1.5 };
export const POTION_HEAL = 20;
export const HYPER_POTION_HEAL = 60;
export const RUN_SUCCESS_RATE = 0.8;

function damagingMoves(side: BattleSide): string[] {
  const usable = side.moves.filter((move) => move.pp > 0 && isDamaging(move.name)).map((move) => move.name);
  return usable.length > 0 ? usable : [STRUGGLE];
}

const spendPp = (side: BattleSide, move: string): BattleSide => ({
  ...side,
  moves: side.moves.map((entry) => (entry.name === move ? { ...entry, pp: Math.max(0, entry.pp - 1) } : entry)),
});

interface AttackResult {
  attacker: BattleSide;
  defender: BattleSide;
  events: BattleEvent[];
}

function attack(side: BattleSideName, attacker: BattleSide, defender: BattleSide, move: string, rng: Rng): AttackResult {
  const info = moveInfo(move);
  const used = move === STRUGGLE ? attacker : spendPp(attacker, move);

  if (!info) {
    return { attacker: used, defender, events: [{ kind: 'nopp', side, text: `${move} is not a known move.` }] };
  }

  if (info.accuracy < 100 && !rollChance(rng, info.accuracy / 100)) {
    return { attacker: used, defender, events: [{ kind: 'miss', side, text: `${attacker.name} used ${move} — it missed!` }] };
  }

  const hit = computeDamage({
    attackerLevel: attacker.level,
    ...pickStats(attacker.stats, defender.stats, info.damageClass),
    movePower: info.power,
    moveType: info.type,
    attackerTypes: attacker.types,
    defenderTypes: defender.types,
    rng,
  });
  const wounded = { ...defender, hp: Math.max(0, defender.hp - hit.damage) };
  const verdict =
    hit.effectiveness > 1 ? ' Super effective!' : hit.effectiveness < 1 ? ' Not very effective…' : '';

  const events: BattleEvent[] = [
    {
      kind: 'move',
      side,
      damage: hit.damage,
      effectiveness: hit.effectiveness,
      critical: hit.critical,
      text: `${attacker.name} used ${move} — ${hit.damage} damage.${verdict}${hit.critical ? ' Critical hit!' : ''}`,
    },
  ];
  if (wounded.hp === 0) events.push({ kind: 'faint', side, text: `${wounded.name} fainted!` });

  return { attacker: used, defender: wounded, events };
}

export function resolveTurn(state: BattleState, action: BattleAction, rng: Rng): { state: BattleState; events: BattleEvent[] } {
  if (state.outcome !== 'ongoing') return { state, events: [] };

  const events: BattleEvent[] = [];
  let player = state.player;
  let foe = state.foe;
  let outcome: BattleOutcome = 'ongoing';

  if (action.kind === 'move') {
    const chosen = player.moves.find((entry) => entry.name === action.move);
    if (!chosen || chosen.pp <= 0) {
      return { state, events: [{ kind: 'nopp', text: `${action.move} has no PP left.` }] };
    }
  }

  if (action.kind === 'item' && player.hp >= player.maxHp) {
    return { state, events: [{ kind: 'item', consumed: false, text: `${player.name} is already at full HP.` }] };
  }

  if (action.kind === 'run') {
    if (rollChance(rng, RUN_SUCCESS_RATE)) {
      return { state: { ...state, turn: state.turn + 1, outcome: 'fled' }, events: [{ kind: 'run', text: 'Got away safely!' }] };
    }
    events.push({ kind: 'run', text: 'Could not escape!' });
  }

  if (action.kind === 'ball') {
    const attempt = rollCatch(
      { captureRate: foe.captureRate, hp: foe.hp, maxHp: foe.maxHp, ballBonus: BALL_BONUS[action.ball] },
      rng,
    );
    if (attempt.caught) {
      return {
        state: { ...state, turn: state.turn + 1, outcome: 'caught' },
        events: [{ kind: 'ball', consumed: true, text: `Gotcha! ${foe.name} was caught!` }],
      };
    }
    events.push({ kind: 'ball', consumed: true, text: `${foe.name} broke free (${Math.round(attempt.chance * 100)}% chance).` });
  }

  if (action.kind === 'item') {
    let type = action.item === 'potion' ? POTION_HEAL : HYPER_POTION_HEAL;
    const healed = Math.min(type, player.maxHp - player.hp);
    console.log(healed, 'healed')
    player = { ...player, hp: player.hp + healed };
    events.push({ kind: 'item', consumed: true, text: `${player.name} recovered ${healed} HP.` });
  }

  if (action.kind === 'switch') {
    player = action.to;
    events.push({ kind: 'switch', text: `Go, ${player.name}!` });
  }

  const useMove = action.kind === 'move' ? action.move : null;
  const order: BattleSideName[] = player.stats.speed >= foe.stats.speed ? ['player', 'foe'] : ['foe', 'player'];

  for (const side of order) {
    if (outcome !== 'ongoing') break;

    if (side === 'player') {
      if (!useMove) continue;
      const result = attack('player', player, foe, useMove, rng);
      player = result.attacker;
      foe = result.defender;
      events.push(...result.events);
    } else {
      const result = attack('foe', foe, player, pickOne(rng, damagingMoves(foe)), rng);
      foe = result.attacker;
      player = result.defender;
      events.push(...result.events);
    }

    if (player.hp === 0) outcome = 'lost';
    else if (foe.hp === 0) outcome = 'won';
  }

  return { state: { player, foe, turn: state.turn + 1, outcome }, events };
}

export const foeCaptureChance = (foe: BattleSide, ball: BallName): number =>
  catchChance({ captureRate: foe.captureRate, hp: foe.hp, maxHp: foe.maxHp, ballBonus: BALL_BONUS[ball] });

export const consumedFrom = (events: readonly BattleEvent[]): boolean => events.some((event) => event.consumed === true);

export const previewEffectiveness = (move: string, defenderTypes: readonly string[]): number =>
  effectiveness(MOVES[move]?.type ?? 'normal', defenderTypes);
