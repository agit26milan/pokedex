import { getMoney } from "./getMoney";

describe("getMoney", () => {
  it("matches the documented formula across a spread of levels", () => {
    const cases: [number, number, number][] = [
      [10, 5, 30],
      [20, 10, 30],
      [5, 10, 15],
      [3, 5, 16],
      [9, 10, 19],
      [100, 1, 1010],
      [1, 30, 10],
    ];

    for (const [foeLevel, winnerLevel, expected] of cases) {
      expect(getMoney(foeLevel, winnerLevel)).toBe(expected);
    }
  });

  it("pays a flat 20 whenever both sides are at the same level", () => {
    for (const level of [1, 5, 20, 50, 100]) {
      expect(getMoney(level, level)).toBe(20);
    }
  });

  it("grows with the defeated level", () => {
    expect(getMoney(20, 10)).toBeGreaterThan(getMoney(5, 10));
    expect(getMoney(9, 10)).toBeGreaterThan(getMoney(8, 10));
  });

  it("shrinks as the winner outranks the foe", () => {
    expect(getMoney(20, 40)).toBeLessThan(getMoney(20, 10));
    expect(getMoney(20, 11)).toBeLessThan(getMoney(20, 10));
  });

  it("always returns a whole number, truncating rather than rounding", () => {
    for (const [foeLevel, winnerLevel] of [
      [1, 4],
      [3, 4],
      [5, 4],
      [1, 3],
      [7, 3],
    ] as const) {
      expect(Number.isInteger(getMoney(foeLevel, winnerLevel))).toBe(true);
    }

    expect(getMoney(1, 4)).toBe(12); 
    expect(getMoney(3, 4)).toBe(17); 
  });

  it("adds a base payout of 10 on top of the level ratio", () => {
    expect(getMoney(0, 5)).toBe(10);
    expect(getMoney(1, 100)).toBe(10);
  });

  it("drops below the base once the foe level is negative", () => {
    expect(getMoney(-5, 10)).toBe(0);
    expect(getMoney(-100, 10)).toBe(0);
  });

  it("never returns NaN for a positive foe level", () => {
    for (const winnerLevel of [1, 3, 25, 100]) {
      expect(Number.isNaN(getMoney(12, winnerLevel))).toBe(false);
    }
  });

  it("returns Infinity when the winner level is zero", () => {
    expect(getMoney(20, 0)).toBe(0);
  });
});
