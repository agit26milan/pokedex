import type { BattleAction, BattleSide } from './turnEngine';

export interface SideSync {
  memberId: number;
  side: BattleSide;
}

/**
 * Which member's HP and PP have to be written back for a resolved turn, and with which side.
 *
 * A switch replaces the active member *inside* the engine, so for a switch the member that took part in the turn is
 * the one from before it. Writing the side from after a switch would stamp the incoming member's HP and PP onto the
 * member that left the field — which is exactly the free healing this rule exists to prevent.
 */
export function sideSync(
  action: BattleAction,
  activeMemberId: number | null,
  before: BattleSide,
  after: BattleSide,
): SideSync | null {
  if (activeMemberId === null) return null;
  if (action.kind === 'switch' && before.id === activeMemberId) return { memberId: activeMemberId, side: before };
  return { memberId: activeMemberId, side: after };
}
