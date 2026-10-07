import type { PartyMember } from '../types';

export function leadOf(
  party: readonly PartyMember[],
  leaderId: number | null,
): PartyMember | undefined {
  const chosen = leaderId === null ? undefined : party.find((member) => member.id === leaderId);
  if (chosen && chosen.hp > 0) return chosen;
  return party.find((member) => member.hp > 0) ?? chosen ?? party[0];
}
