import { UserId, UserLoyaltyProfile } from '../types/loyalty.types';
import { IDatabaseAdapter } from '../interfaces/IDatabaseAdapter';

export class PointsModule {
  constructor(private dbAdapter: IDatabaseAdapter) {}

  async getOrCreateProfile(userId: UserId): Promise<UserLoyaltyProfile> {
    const profile = await this.dbAdapter.getUserProfile(userId);
    if (profile) return profile;

    const newProfile: UserLoyaltyProfile = {
      userId,
      points: 0,
      tierId: null,
      history: [],
    };
    return this.dbAdapter.saveUserProfile(newProfile);
  }

  async add(
    userId: UserId,
    points: number,
    action: string,
  ): Promise<UserLoyaltyProfile> {
    if (points <= 0) throw new Error('Points must be positive.');
    const profile = await this.getOrCreateProfile(userId);
    profile.points += points;
    profile.history.push({
      action,
      pointsChange: points,
      timestamp: new Date(),
    });
    return this.dbAdapter.saveUserProfile(profile);
  }

  async subtract(
    userId: UserId,
    points: number,
    action: string,
  ): Promise<UserLoyaltyProfile> {
    if (points <= 0) throw new Error('Points must be positive.');
    const profile = await this.getOrCreateProfile(userId);
    if (profile.points < points) throw new Error('Insufficient points.');
    profile.points -= points;
    profile.history.push({
      action,
      pointsChange: -points,
      timestamp: new Date(),
    });
    return this.dbAdapter.saveUserProfile(profile);
  }

  async getBalance(userId: UserId): Promise<number> {
    const profile = await this.dbAdapter.getUserProfile(userId);
    return profile?.points ?? 0;
  }
}
