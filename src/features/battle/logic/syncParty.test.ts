import { createMember } from '@/features/party/store/partySlice';
import { createSide, sideFromMember } from './createSide';
import { sideSync } from './syncParty';
import type { BattleAction } from './turnEngine';

const pikachu = () => createSide(25, 12)!;
const rattata = () => createSide(19, 8)!;

describe('sideSync', () => {
  it('writes back the acting member with the HP the turn left it at', () => {
    const before = pikachu();
    const after = { ...before, hp: before.hp - 6 };
    const sync = sideSync({ kind: 'move', move: before.moves[0]!.name }, before.id, before, after);

    expect(sync?.memberId).toBe(before.id);
    expect(sync?.side.hp).toBe(before.hp - 6);
  });

  it('writes back the member that LEFT the field when the action is a switch', () => {
    const leaving = { ...pikachu(), hp: 4 };
    const incoming = rattata();
    const action: BattleAction = { kind: 'switch', to: incoming };
    const sync = sideSync(action, leaving.id, leaving, incoming);

    expect(sync?.memberId).toBe(leaving.id);
    expect(sync?.side.hp).toBe(4);
    expect(sync?.side.id).toBe(leaving.id);
  });

  it('syncs nothing when no member is active', () => {
    const side = pikachu();
    expect(sideSync({ kind: 'run' }, null, side, side)).toBeNull();
  });

  it('carries spent PP through the sync, not just HP', () => {
    const member = createMember(25, 12)!;
    const before = sideFromMember(member)!;
    const after = { ...before, moves: before.moves.map((move, index) => (index === 0 ? { ...move, pp: 1 } : move)) };
    const sync = sideSync({ kind: 'item', item: 'potion' }, member.id, before, after);

    expect(sync?.side.moves[0]!.pp).toBe(1);
  });
});
