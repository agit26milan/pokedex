


export function getMoney(foeLevel: number, winnerLevel: number): number {
    if (winnerLevel === 0) return 0;
    if (foeLevel < 0) return 0;
  return Math.floor((foeLevel / winnerLevel * 10) + 10);
}