import { UserId, UserLoyaltyProfile, Tier } from '../types/loyalty.types';

export interface IDatabaseAdapter {
  getUserProfile(userId: UserId): Promise<UserLoyaltyProfile | null>;
  saveUserProfile(profile: UserLoyaltyProfile): Promise<UserLoyaltyProfile>;
  getTiers(): Promise<Tier[]>;
}
