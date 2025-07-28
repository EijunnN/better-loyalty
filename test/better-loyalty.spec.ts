// test/better-loyalty.spec.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BetterLoyalty, LoyaltyRule } from '../src';
import { InMemoryAdapter } from './mocks/InMemoryAdapter';

const userId = 'test-user-123';

describe('BetterLoyalty - Manual Point Operations', () => {
  let adapter: InMemoryAdapter;
  let loyaltySystem: BetterLoyalty;

  beforeEach(() => {
    adapter = new InMemoryAdapter();
    loyaltySystem = new BetterLoyalty(adapter);
  });

  it('should award points correctly and create a profile if non-existent', async () => {
    await loyaltySystem.points.add(userId, 100, 'Initial deposit');
    const balance = await loyaltySystem.points.getBalance(userId);
    expect(balance).toBe(100);

    const profile = await adapter.getUserProfile(userId);
    expect(profile?.history).toHaveLength(1);
    expect(profile?.history[0].action).toBe('Initial deposit');
  });

  it('should subtract points and throw an error for insufficient balance', async () => {
    await loyaltySystem.points.add(userId, 100, 'Deposit');
    await loyaltySystem.points.subtract(userId, 30, 'Redeem');

    const balance = await loyaltySystem.points.getBalance(userId);
    expect(balance).toBe(70);

    await expect(loyaltySystem.points.subtract(userId, 100, 'Overdraft')).rejects.toThrow('Insufficient points.');
  });
});

describe('BetterLoyalty - Rule Engine and Event-Driven Flow', () => {
  let adapter: InMemoryAdapter;
  let loyaltySystem: BetterLoyalty;

  const purchaseRule: LoyaltyRule<{ amount: number }> = {
    name: 'Points for purchase',
    event: 'purchase',
    condition: (ctx) => ctx.payload.amount > 50,
    action: (ctx) => ({
      points: Math.floor(ctx.payload.amount),
      actionName: `Compra de $${ctx.payload.amount}`,
    }),
  };

  beforeEach(() => {
    adapter = new InMemoryAdapter();
    loyaltySystem = new BetterLoyalty(adapter, [purchaseRule]);
  });

  it('should process an event, award points if condition is met, and emit points_updated', async () => {
    const pointsSpy = vi.fn();
    loyaltySystem.on('points_updated', pointsSpy);

    await loyaltySystem.processEvent({
      userId,
      event: 'purchase',
      payload: { amount: 75.5 },
    });

    const balance = await loyaltySystem.points.getBalance(userId);
    expect(balance).toBe(75);

    expect(pointsSpy).toHaveBeenCalledOnce();
    expect(pointsSpy).toHaveBeenCalledWith({
      userId,
      points: 75,
      action: 'Compra de $75.5',
      newBalance: 75,
    });
  });

  it('should not award points if condition is not met', async () => {
    const pointsSpy = vi.fn();
    loyaltySystem.on('points_updated', pointsSpy);

    await loyaltySystem.processEvent({
      userId,
      event: 'purchase',
      payload: { amount: 30 },
    });

    const balance = await loyaltySystem.points.getBalance(userId);
    expect(balance).toBe(0);
    expect(pointsSpy).not.toHaveBeenCalled();
  });

  it('should trigger a tier change and emit an event as a result of a rule', async () => {
    const tierChangeSpy = vi.fn();
    loyaltySystem.on('tier_changed', tierChangeSpy);

    await loyaltySystem.processEvent({
      userId,
      event: 'purchase',
      payload: { amount: 600 },
    });

    const profile = await adapter.getUserProfile(userId);
    expect(profile?.points).toBe(600);
    expect(profile?.tierId).toBe('silver');

    expect(tierChangeSpy).toHaveBeenCalledOnce();
    expect(tierChangeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        from: null,
        to: expect.objectContaining({ id: 'silver' }),
      }),
    );
  });
});