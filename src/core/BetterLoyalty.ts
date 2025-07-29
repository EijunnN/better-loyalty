// src/core/BetterLoyalty.ts
// (El código interno de esta clase es casi idéntico al de v2, pero lo adaptamos para que lo use nuestro nuevo sistema)
import mitt, { Emitter } from 'mitt';
import { IDatabaseAdapter } from '../interfaces/IDatabaseAdapter';
import { PointsModule } from '../modules/PointsModule';
import { TiersModule } from '../modules/TiersModule';
import { RulesConfig } from './rule'; // <-- Usamos el nuevo tipo
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

interface LoyaltyRule {
  condition?: (payload: unknown, userId: UserId) => boolean | Promise<boolean>;
  action: (
    payload: unknown,
    userId: UserId,
  ) =>
    | { points: number; actionName?: string }
    | Promise<{ points: number; actionName?: string }>;
}

// Esta clase ya no se exporta desde index.ts
export class BetterLoyalty<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  public readonly points: PointsModule;
  private readonly tiers: TiersModule;
  private readonly emitter: Emitter<LoyaltyEvents> = mitt<LoyaltyEvents>();
  private readonly rules: Map<string, LoyaltyRule>;

  constructor(
    dbAdapter: IDatabaseAdapter,
    config: RulesConfig<T> = {} as RulesConfig<T>,
  ) {
    this.points = new PointsModule(dbAdapter);
    this.tiers = new TiersModule(dbAdapter);
    this.rules = new Map(Object.entries(config));
  }

  // El método se mantiene para la lógica interna
  async trigger<P>(
    eventName: string,
    userId: UserId,
    payload: P,
  ): Promise<void> {
    const rule = this.rules.get(eventName);
    if (!rule) {
      await this.evaluateTier(userId); // Aún evaluamos el tier por si hay operaciones manuales
      return;
    }

    const conditionMet = rule.condition
      ? await Promise.resolve(rule.condition(payload, userId))
      : true;

    if (conditionMet) {
      const result = await Promise.resolve(rule.action(payload, userId));
      const actionName = result.actionName || eventName;

      const updatedProfile = await this.points.add(
        userId,
        result.points,
        actionName,
      );
      this.emitter.emit('points_updated', {
        userId,
        points: result.points,
        action: actionName,
        newBalance: updatedProfile.points,
      });
    }

    await this.evaluateTier(userId);
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

  // Los métodos de eventos se mantienen para uso avanzado
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
