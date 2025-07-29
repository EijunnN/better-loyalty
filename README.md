# better-loyalty

[![NPM Version](https://img.shields.io/npm/v/better-loyalty.svg)](https://www.npmjs.com/package/better-loyalty)
[![Build Status](https://img.shields.io/github/actions/workflow/status/EijunnN/better-loyalty/main.yml?branch=main)](https://github.com/EijunnN/better-loyalty/actions)
[![License](https://img.shields.io/npm/l/better-loyalty.svg)](https://github.com/EijunnN/better-loyalty/blob/main/LICENSE)

Un framework declarativo para sistemas de fidelización y recompensas en TypeScript, rediseñado con una **experiencia de desarrollo de élite** como máxima prioridad.

Con `better-loyalty`, la lógica de lealtad no solo se centraliza, sino que se define de una forma tan intuitiva y segura que parece magia.

## La Filosofía v2: La Simplicidad es Poder

El objetivo de la v2 es eliminar toda la complejidad. Compara la nueva forma de usar `better-loyalty` con el código tradicional.

#### El Modo Tradicional 👎

```typescript
// Lógica de lealtad dispersa, compleja y difícil de mantener...
if (userBoughtSomething) {
  // ... un montón de if/else y llamadas a la DB ...
}
```

#### El Modo `better-loyalty` v2.0 ✨

Tu lógica de negocio solo necesita **anunciar que algo ha sucedido**.

```typescript
// En tu API, después de que una compra es exitosa:
import { loyaltySystem } from '@/lib/loyalty';

// Una sola línea. Simple, legible y con tipado seguro.
await loyaltySystem.trigger('purchase_completed', userId, { amount: 150 });
```

Todo lo demás (cálculo de puntos, cambio de nivel, etc.) se define en un único lugar de forma declarativa.

## Características Clave

- ✨ **API de Élite (DX)**: Una interfaz mínima (`createLoyaltySystem`, `defineRules`, `trigger`) que es intuitiva y fácil de aprender.
- 🔒 **Inferencia de Tipos Mágica**: Autocompletado y seguridad total entre el nombre del evento y la forma de su payload. ¡No más castings ni `any`!
- 🔌 **Agnóstico a la Base de Datos**: Conecta tu propia base de datos (SQL, NoSQL, etc.) implementando una interfaz `IDatabaseAdapter` limpia.
- ⚛️ **Sistema de Eventos Reactivo**: Suscríbete a eventos como `tier_changed` para disparar notificaciones, emails o webhooks.
- 🚀 **Rendimiento y Ligereza**: Cero dependencias de producción (solo `mitt` para eventos) y una arquitectura optimizada.

## Instalación

```bash
pnpm add better-loyalty
```

## Guía de Inicio Rápido

Crea un sistema de lealtad completo en 3 pasos con la nueva API.

### Paso 1: Define tus Eventos y Reglas

Usa el helper `defineRules` para crear tu configuración de negocio. TypeScript te protegerá en cada paso.

```typescript
// src/lib/loyaltyRules.ts
import { defineRules } from 'better-loyalty';

// 1. Define la "forma" de los datos para cada evento
type LoyaltyEvents = {
  purchase_completed: { amount: number };
  review_created: { rating: number };
};

// 2. Define tus reglas. ¡Nota la simplicidad!
export const myRules = defineRules<LoyaltyEvents>({
  purchase_completed: {
    condition: (payload) => payload.amount > 10,
    action: (payload) => ({
      points: Math.floor(payload.amount),
      actionName: `Compra de $${payload.amount}`,
    }),
  },
  review_created: {
    condition: (payload) => payload.rating >= 4,
    action: () => ({
      points: 50,
      actionName: 'Reseña de calidad',
    }),
  },
});
```

### Paso 2: Implementa tu Adaptador de Base de Datos

Enséñale a `better-loyalty` cómo hablar con tu base de datos. (Este paso no ha cambiado, sigue siendo igual de simple).

```typescript
// src/lib/myAdapter.ts
import { IDatabaseAdapter, Tier, ... } from 'better-loyalty';

// ... (la implementación del adaptador es la misma que en la v1) ...

export const myDbAdapter: IDatabaseAdapter = {
  // ... getUserProfile, saveUserProfile, getTiers
};
```

### Paso 3: Crea el Sistema y Úsalo

Usa la función `createLoyaltySystem` para juntar todo.

```typescript
// src/lib/loyaltySystem.ts
import { createLoyaltySystem } from 'better-loyalty';
import { myRules } from './loyaltyRules';
import { myDbAdapter } from './myAdapter';

// 1. Crea el sistema con una sola llamada
const loyaltySystem = createLoyaltySystem({
  adapter: myDbAdapter,
  rules: myRules,
});

// 2. Exporta las funciones que usarás en tu aplicación
export const triggerLoyaltyEvent = loyaltySystem.trigger;
export const loyaltyEvents = loyaltySystem.on;

// --- Ejemplo de uso en otro archivo ---
// import { triggerLoyaltyEvent } from './loyaltySystem';
//
// await triggerLoyaltyEvent('purchase_completed', userId, { amount: 120 });
// await triggerLoyaltyEvent('review_created', userId, { rating: 5 });
```

¡Y eso es todo! Has implementado un sistema robusto con una API que es un placer usar.

## API Principal (v2.0.0)

### `defineRules<T>(config)`

Un helper para definir tu objeto de configuración de reglas con inferencia de tipos completa.

### `createLoyaltySystem(options)`

La función principal que crea tu sistema de lealtad.

- `options.adapter: IDatabaseAdapter`: Tu adaptador de base de datos.
- `options.rules: RulesConfig`: El objeto de reglas creado con `defineRules`.
- **Devuelve:** Un objeto con `{ trigger, on, off, points }`.

### `trigger(eventName, userId, payload)`

El método principal para procesar un evento de negocio.

- `eventName`: El nombre del evento (string).
- `userId`: El identificador del usuario.
- `payload`: El objeto de datos del evento. TypeScript se asegurará de que su forma coincida con la definida para `eventName`.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un _issue_ para discutir cambios importantes o un _pull request_ para correcciones. Revisa nuestro `CHANGELOG.md` para ver la evolución del proyecto.

## Licencia

[MIT](./LICENSE)
