import { UserId } from '../types/loyalty.types';

export interface RuleContext<
  P extends Record<string, unknown> = Record<string, unknown>,
> {
  userId: UserId;
  event: string;
  payload: P;
}

export interface RuleResult {
  points: number;
  actionName: string;
}

export interface LoyaltyRule<
  P extends Record<string, unknown> = Record<string, unknown>,
> {
  name: string;
  event: string;
  condition: (context: RuleContext<P>) => boolean | Promise<boolean>;
  action: (context: RuleContext<P>) => RuleResult | Promise<RuleResult>;
}
