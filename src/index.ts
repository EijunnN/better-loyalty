
export { BetterLoyalty } from './core/BetterLoyalty';

export type { IDatabaseAdapter } from './interfaces/IDatabaseAdapter';
export type { IBenefit } from './interfaces/IBenefit';

export type {
  UserId,
  UserLoyaltyProfile,
  Tier,
  LoyaltyEvent,
} from './types/loyalty.types';

export type {
  LoyaltyRule,
  RuleContext,
  RuleResult,
} from './core/RuleProcessor';
