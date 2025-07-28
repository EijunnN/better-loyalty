import mitt, { Emitter } from 'mitt';
import { IDatabaseAdapter } from '../interfaces/IDatabaseAdapter';
import { PointsModule } from '../modules/PointsModule';
import { TiersModule } from '../modules/TiersModule';
import { LoyaltyRule, RuleContext } from './RuleProcessor';
import { Tier, UserId } from '../types/loyalty.types';

type LoyaltyEvents = {
  points_updated: {
    userId: UserId;
    points: number;
    action: string;
    newBalance: number;
  };
  tier_changed: { userId: UserId; from: Tier | null; to: Tier | null };
};

export class BetterLoyalty {
  public readonly points: PointsModule;
  private readonly tiers: TiersModule;
  private readonly emitter: Emitter<LoyaltyEvents> = mitt<LoyaltyEvents>();

  constructor(
    dbAdapter: IDatabaseAdapter,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly rules: LoyaltyRule<any>[] = [],
  ) {
    this.points = new PointsModule(dbAdapter);
    this.tiers = new TiersModule(dbAdapter);
  }

  async processEvent<P extends Record<string, unknown>>(
    context: RuleContext<P>,
  ): Promise<void> {
    for (const rule of this.rules) {
      if (rule.event === context.event) {
        const conditionMet = await Promise.resolve(rule.condition(context));
        if (conditionMet) {
          const result = await Promise.resolve(rule.action(context));
          const updatedProfile = await this.points.add(
            context.userId,
            result.points,
            result.actionName,
          );
          this.emitter.emit('points_updated', {
            userId: context.userId,
            points: result.points,
            action: result.actionName,
            newBalance: updatedProfile.points,
          });
        }
      }
    }
    await this.evaluateTier(context.userId);
  }

  private async evaluateTier(userId: UserId): Promise<void> {
    const { previousTier, currentTier, tierChanged } =
      await this.tiers.evaluateAndAssign(userId);
    if (tierChanged) {
      this.emitter.emit('tier_changed', {
        userId,
        from: previousTier,
        to: currentTier,
      });
    }
  }

  on<Key extends keyof LoyaltyEvents>(
    event: Key,
    handler: (payload: LoyaltyEvents[Key]) => void,
  ) {
    this.emitter.on(event, handler);
  }

  off<Key extends keyof LoyaltyEvents>(
    event: Key,
    handler: (payload: LoyaltyEvents[Key]) => void,
  ) {
    this.emitter.off(event, handler);
  }
}
