/**
 * Calculates a Set of 0-based indices in a list where ad cards should be inserted.
 * Ensures a minimum gap (default 3) and maximum gap (default 6) between consecutive ads,
 * providing organic, non-robotic randomized ad placements across feeds, reply threads, and video scrolls.
 */
export function getRandomizedAdIndices(
  totalItems: number,
  minGap: number = 8,
  maxGap: number = 15,
  seedStr?: string
): Set<number> {
  const adIndices = new Set<number>();
  if (totalItems <= 0) return adIndices;

  // Simple deterministic seed generator from string if provided
  let seed = 0;
  if (seedStr) {
    for (let i = 0; i < seedStr.length; i++) {
      seed = (seed << 5) - seed + seedStr.charCodeAt(i);
      seed |= 0;
    }
  }

  const pseudoRandom = () => {
    if (!seedStr) return Math.random();
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // First ad position (e.g. index 2 to 4)
  let currentIndex = Math.floor(pseudoRandom() * 3) + (minGap - 1);

  while (currentIndex < totalItems) {
    adIndices.add(currentIndex);
    // Next ad gap between minGap and maxGap
    const gap = Math.floor(pseudoRandom() * (maxGap - minGap + 1)) + minGap;
    currentIndex += gap;
  }

  return adIndices;
}
