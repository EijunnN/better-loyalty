// src/index.ts

// La API principal para el desarrollador
export { createLoyaltySystem } from './core/system';
export { defineRules } from './core/rule';

// Tipos necesarios para la implementación
export type { IDatabaseAdapter } from './interfaces/IDatabaseAdapter';
export type { IBenefit } from './interfaces/IBenefit';
export type {
  UserId,
  UserLoyaltyProfile,
  Tier,
  LoyaltyEvent,
} from './types/loyalty.types';
