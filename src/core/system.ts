// src/core/system.ts
import { BetterLoyalty } from './BetterLoyalty';
import { RulesConfig } from './rule';
import { IDatabaseAdapter } from '../interfaces/IDatabaseAdapter';
import { UserId } from '../types/loyalty.types';

// La nueva forma de definir el Trigger, con tipos inferidos mágicamente
export type TypedTrigger<T extends Record<string, unknown>> = <
  K extends keyof T,
>(
  eventName: K,
  userId: UserId,
  payload: T[K],
) => Promise<void>;

/**
 * Crea y configura tu sistema de lealtad.
 * @param options Un objeto con tu adaptador de base de datos y tus reglas.
 * @returns Un objeto con una función `trigger` y acceso al sistema de eventos.
 */
export function createLoyaltySystem<
  T extends Record<string, unknown>,
>(options: { adapter: IDatabaseAdapter; rules: RulesConfig<T> }) {
  const loyaltyInstance = new BetterLoyalty(options.adapter, options.rules);

  const trigger: TypedTrigger<T> = (eventName, userId, payload) => {
    return loyaltyInstance.trigger(eventName as string, userId, payload);
  };

  return {
    /**
     * Dispara un evento de negocio para ser procesado por el motor de reglas.
     */
    trigger,
    /**
     * Acceso al sistema de eventos para suscribirse a cambios.
     */
    on: loyaltyInstance.on.bind(loyaltyInstance),
    off: loyaltyInstance.off.bind(loyaltyInstance),
    /**
     * Acceso directo al módulo de puntos para operaciones manuales.
     */
    points: loyaltyInstance.points,
  };
}
