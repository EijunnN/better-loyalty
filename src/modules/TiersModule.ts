// src/modules/TiersModule.ts

import { UserId, Tier } from '../types/loyalty.types';
import { IDatabaseAdapter } from '../interfaces/IDatabaseAdapter';

export class TiersModule {
  constructor(private dbAdapter: IDatabaseAdapter) {}

  async evaluateAndAssign(userId: UserId): Promise<{
    previousTier: Tier | null;
    currentTier: Tier | null;
    tierChanged: boolean;
  }> {
    const profile = await this.dbAdapter.getUserProfile(userId);

    if (!profile) {
      return { previousTier: null, currentTier: null, tierChanged: false };
    }

    const allTiers = await this.dbAdapter.getTiers();
    const sortedTiers = allTiers.sort((a, b) => b.minPoints - a.minPoints);

    const previousTier =
      sortedTiers.find((t) => t.id === profile.tierId) || null;
    const currentTier =
      sortedTiers.find((t) => profile.points >= t.minPoints) || null;

    const tierChanged = previousTier?.id !== currentTier?.id;
    if (tierChanged) {
      profile.tierId = currentTier?.id ?? null;
      await this.dbAdapter.saveUserProfile(profile);
    }

    return { previousTier, currentTier, tierChanged };
  }
}
