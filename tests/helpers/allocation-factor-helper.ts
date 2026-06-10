type SnapshotEntry = {
  allocatedVolume: number;
  allocatedPercentage: number;
  targetPercentage: number;
  weighting: number;
};

export function buildWeightingSnapshot(
  allocations: Record<string, number>,
  targetPercentages: Record<string, number>,
): Record<string, SnapshotEntry> {
  const allocationsMap = new Map(Object.entries(allocations));
  let totalAllocated = 0;
  for (const value of allocationsMap.values()) {
    totalAllocated += value;
  }

  return Object.fromEntries(
    Object.entries(targetPercentages).map(([supplierId, targetPercentage]) => {
      const allocatedVolume = allocationsMap.get(supplierId) ?? 0;
      const allocatedPercentage =
        totalAllocated > 0 ? (allocatedVolume / totalAllocated) * 100 : 0;
      const weighting = allocatedPercentage / targetPercentage;

      return [
        supplierId,
        {
          allocatedVolume,
          allocatedPercentage,
          targetPercentage,
          weighting,
        },
      ];
    }),
  );
}

export function getLowestWeightingSupplier(
  snapshot: Record<string, SnapshotEntry>,
): string {
  const entries = Object.entries(snapshot);
  if (entries.length === 0) {
    throw new Error("Weighting snapshot is empty");
  }

  let lowestSupplierId = entries[0][0];
  let lowestWeighting = entries[0][1].weighting;

  for (const [supplierId, snapshotEntry] of entries) {
    if (snapshotEntry.weighting < lowestWeighting) {
      lowestWeighting = snapshotEntry.weighting;
      lowestSupplierId = supplierId;
    }
  }

  return lowestSupplierId;
}
