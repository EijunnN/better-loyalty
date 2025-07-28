export type UserId = string | number;

export interface LoyaltyEvent {
  action: string;
  pointsChange: number;
  timestamp: Date;
}

export interface UserLoyaltyProfile {
  userId: UserId;
  points: number;
  tierId: string | null;
  history: LoyaltyEvent[];
}

export interface Tier {
  id: string;
  name: string;
  minPoints: number;
  benefits: string[];
}
