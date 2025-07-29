import { describe, it, expect, beforeEach, vi } from 'vitest';
// Importamos la nueva API pública
import { createLoyaltySystem, defineRules } from '../src';
import { InMemoryAdapter } from './mocks/InMemoryAdapter';

const userId = 'test-user-123';

// Definimos los tipos de nuestros eventos de test.
// Esto simula lo que haría un desarrollador en su aplicación.
type TestEvents = {
  purchase: { amount: number };
  level_up_bonus: { newTierName: string };
  invalid_event: Record<string, never>;
};

// Definimos un conjunto de reglas de prueba usando la nueva API
const testRules = defineRules<TestEvents>({
  purchase: {
    condition: (payload) => payload.amount > 10,
    action: (payload) => ({
      points: Math.floor(payload.amount),
      actionName: `Compra por $${payload.amount}`,
    }),
  },
  level_up_bonus: {
    action: (payload) => ({
      points: 100,
      actionName: `Bonus por alcanzar el nivel ${payload.newTierName}`,
    }),
  },
  invalid_event: {
    action: () => ({
      points: 0,
      actionName: 'Invalid event',
    }),
  },
});

describe('BetterLoyalty v3 - ELITE DX', () => {
  let adapter: InMemoryAdapter;
  // El tipo del `loyaltySystem` ahora es inferido
  let loyaltySystem: ReturnType<typeof createLoyaltySystem<TestEvents>>;

  beforeEach(() => {
    adapter = new InMemoryAdapter();
    // Creamos el sistema con nuestro adaptador y reglas de prueba
    loyaltySystem = createLoyaltySystem({
      adapter,
      rules: testRules,
    });
  });

  describe('Rule Engine and Event Flow', () => {
    it('should process a valid event, award points, and update the profile', async () => {
      // Usamos el método `trigger` con la nueva firma
      await loyaltySystem.trigger('purchase', userId, { amount: 150.7 });

      const profile = await adapter.getUserProfile(userId);
      expect(profile?.points).toBe(150);
      expect(profile?.history[0].action).toBe('Compra por $150.7');
    });

    it('should not award points if a condition is not met', async () => {
      await loyaltySystem.trigger('purchase', userId, { amount: 5 });

      const profile = await adapter.getUserProfile(userId);
      // El perfil no debería existir porque no se otorgaron puntos
      expect(profile).toBeNull();
    });

    it('should correctly trigger a tier change and emit a `tier_changed` event', async () => {
      const tierChangeSpy = vi.fn();
      loyaltySystem.on('tier_changed', tierChangeSpy);

      await loyaltySystem.trigger('purchase', userId, { amount: 550 });

      const profile = await adapter.getUserProfile(userId);
      expect(profile?.tierId).toBe('silver');

      expect(tierChangeSpy).toHaveBeenCalledOnce();
      expect(tierChangeSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          from: null,
          to: expect.objectContaining({ id: 'silver' }),
        }),
      );
    });

    it('should emit a `points_updated` event with the correct payload', async () => {
      const pointsUpdatedSpy = vi.fn();
      loyaltySystem.on('points_updated', pointsUpdatedSpy);

      await loyaltySystem.trigger('purchase', userId, { amount: 80 });

      expect(pointsUpdatedSpy).toHaveBeenCalledOnce();
      expect(pointsUpdatedSpy).toHaveBeenCalledWith({
        userId,
        points: 80,
        action: 'Compra por $80',
        newBalance: 80,
      });
    });

    it('should ignore events that are not defined in the rules', async () => {
      // TypeScript nos daría un error aquí si no usamos `as any`,
      // lo cual demuestra que el tipado funciona. Hacemos el casting para el test.
      await loyaltySystem.trigger(
        'non_existent_event' as keyof TestEvents,
        userId,
        {} as TestEvents['purchase'],
      );

      const profile = await adapter.getUserProfile(userId);
      expect(profile).toBeNull();
    });
  });

  describe('Manual Point Operations', () => {
    it('should allow manual point addition via the points module', async () => {
      await loyaltySystem.points.add(userId, 25, 'Bonus manual');

      const balance = await loyaltySystem.points.getBalance(userId);
      expect(balance).toBe(25);
    });

    it('should trigger a tier evaluation even after a manual operation', async () => {
      const tierChangeSpy = vi.fn();
      loyaltySystem.on('tier_changed', tierChangeSpy);

      await loyaltySystem.points.add(userId, 600, 'Carga inicial masiva');

      // Después de una operación manual, la evaluación de tier no es automática.
      // Podemos forzarla llamando a trigger con un evento no existente.
      await loyaltySystem.trigger(
        '__evaluate' as unknown as keyof TestEvents,
        userId,
        {},
      );

      const profile = await adapter.getUserProfile(userId);
      expect(profile?.tierId).toBe('silver');
      expect(tierChangeSpy).toHaveBeenCalledOnce();
    });
  });
});
