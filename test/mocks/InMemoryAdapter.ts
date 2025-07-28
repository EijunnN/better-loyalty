// test/mocks/InMemoryAdapter.ts

import { IDatabaseAdapter, UserLoyaltyProfile, Tier, UserId } from '../../src';

const DEFAULT_TIERS: Tier[] = [
  { id: 'bronze', name: 'Bronce', minPoints: 0, benefits: [] },
  { id: 'silver', name: 'Plata', minPoints: 500, benefits: ['free_shipping'] },
  {
    id: 'gold',
    name: 'Oro',
    minPoints: 2000,
    benefits: ['free_shipping', 'early_access'],
  },
];

export class InMemoryAdapter implements IDatabaseAdapter {
  private users = new Map<UserId, UserLoyaltyProfile>();
  private tiers: Tier[];

  constructor(initialTiers: Tier[] = DEFAULT_TIERS) {
    this.tiers = JSON.parse(JSON.stringify(initialTiers));
  }

  async getUserProfile(userId: UserId): Promise<UserLoyaltyProfile | null> {
    const profile = this.users.get(userId);
    if (!profile) {
      return null;
    }
    return JSON.parse(JSON.stringify(profile));
  }

  async saveUserProfile(
    profile: UserLoyaltyProfile,
  ): Promise<UserLoyaltyProfile> {
    const profileCopy = JSON.parse(JSON.stringify(profile));
    this.users.set(profile.userId, profileCopy);
    return JSON.parse(JSON.stringify(profileCopy));
  }

  async getTiers(): Promise<Tier[]> {
    return [...this.tiers];
  }

  clear() {
    this.users.clear();
  }
}
