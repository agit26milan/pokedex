import type { BattleAction, BattleSide } from './turnEngine';

export interface SideSync {
  memberId: number;
  side: BattleSide;
}

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
