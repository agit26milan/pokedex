import { createMember } from '@/features/party/store/partySlice';
import { caughtIdsOf, createRunStore, isValidRun, mergePersisted, type RunState } from './index';

const current = (): RunState => createRunStore().getState();

const validRun = {
  party: [createMember(1, 5)],
  storage: [],
  bag: { pokeBall: 7, greatBall: 0, potion: 1 },
  leaderId: 1,
  worldSeed: 4242,
  position: { x: 12, y: 9 },
  steps: 14,
  encounterRisk: 0.18,
  firstEncounterDone: true,
};

describe('isValidRun', () => {
  it('accepts a well-formed run', () => {
    expect(isValidRun(validRun)).toBe(true);
  });

  it.each([
    ['null', null],
    ['a string', 'not-a-run'],
    ['a missing party', { ...validRun, party: undefined }],
    ['a party that is not an array', { ...validRun, party: {} }],
    ['a missing position', { ...validRun, position: undefined }],
    ['a non-numeric seed', { ...validRun, worldSeed: 'abc' }],
    ['a missing bag', { ...validRun, bag: undefined }],
    ['a member without hp', { ...validRun, party: [{ id: 1 }] }],
  ])('rejects %s', (_label, value) => {
    expect(isValidRun(value)).toBe(false);
  });
});

describe('mergePersisted', () => {
  it('keeps a valid run intact', () => {
    const merged = mergePersisted(validRun, current());

    expect(merged.party.map((member) => member.id)).toEqual([1]);
    expect(merged.steps).toBe(14);
    expect(merged.bag.pokeBall).toBe(7);
    expect(merged.position).toEqual({ x: 12, y: 9 });
  });

  it('falls back to a fresh run when storage is corrupt, and keeps every action working', () => {
    const merged = mergePersisted({ party: 'corrupt' }, current());

    expect(merged.party).toEqual([]);
    expect(merged.storage).toEqual([]);
    expect(merged.steps).toBe(0);
    expect(merged.firstEncounterDone).toBe(false);
    expect(typeof merged.choosePartner).toBe('function');
    expect(caughtIdsOf(merged)).toEqual([]);
  });

  it('never throws, whatever storage hands back', () => {
    for (const junk of [null, undefined, 0, '', [], {}, { party: null }, { position: 'x' }]) {
      expect(() => mergePersisted(junk, current())).not.toThrow();
    }
  });
});

describe('run state surface', () => {
  it('carries the party actions a restored run needs', () => {
    const state = current();
    for (const key of ['choosePartner', 'addCaught', 'updateMember', 'spendItem', 'grantItem', 'walk', 'setQuery'] as const) {
      expect(typeof state[key]).toBe('function');
    }
  });
});
