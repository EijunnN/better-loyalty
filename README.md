# better-loyalty

[![NPM Version](https://img.shields.io/npm/v/better-loyalty.svg)](https://www.npmjs.com/package/better-loyalty)
[![Build Status](https://img.shields.io/github/actions/workflow/status/tu-usuario/better-loyalty/main.yml?branch=main)](https://github.com/tu-usuario/better-loyalty/actions)
[![License](https://img.shields.io/npm/l/better-loyalty.svg)](https://github.com/tu-usuario/better-loyalty/blob/main/LICENSE)

Un framework declarativo para modelar y ejecutar la lógica de negocio de la fidelización de clientes, totalmente agnóstico a la tecnología y al dominio de la aplicación.

Con `better-loyalty`, dejas de escribir lógica de lealtad dispersa en tu código. En su lugar, defines las reglas de tu negocio y dejas que el framework orqueste el resto.

## La Filosofía: De Imperativo a Declarativo

El enfoque tradicional te obliga a escribir código como este en toda tu aplicación:

```typescript
// El modo tradicional 👎
if (userCompletedPurchase) {
  const points = calculatePoints(purchase.amount);
  await loyaltyService.addPoints(user.id, points);
  const newTier = await loyaltyService.checkTier(user.id);
  if (newTier) {
    await emailService.sendTierUpEmail(user.id, newTier);
  }
}
```

Con `better-loyalty`, tu lógica de negocio vive fuera de tus controladores. Es limpia, centralizada y declarativa:

```typescript
// El modo better-loyalty 👍
loyaltySystem.processEvent({
  userId: 'user-123',
  event: 'purchase_completed',
  payload: { amount: 120, items: ['book', 'pen'] }
});
```

## Características Principales

-   🚀 **Motor de Reglas Declarativo**: Define la lógica de tu negocio (ej: "otorgar 100 puntos por compras > $50") en una configuración simple.
-   🔌 **Agnóstico a la Base de Datos**: Conecta tu propia base de datos (PostgreSQL, MongoDB, Firebase, etc.) implementando una interfaz `IDatabaseAdapter` simple y limpia.
-   ⚛️ **Sistema de Eventos Reactivo**: Suscríbete a eventos como `tier_changed` o `points_updated` para disparar notificaciones, enviar emails o actualizar la UI.
-   🔒 **TypeScript de Primer Nivel**: Framework escrito 100% en TypeScript, con genéricos para una seguridad de tipos total en tus payloads de eventos.
-   ✨ **Cero Dependencias de Producción (casi)**: Ultraligero. Solo `mitt` para el emisor de eventos.

## Instalación

```bash
# Con pnpm
pnpm add better-loyalty

# Con npm
npm install better-loyalty

# Con yarn
yarn add better-loyalty
```

## Guía de Inicio Rápido

Vamos a crear un sistema de lealtad funcional en 3 pasos.

### Paso 1: Implementa el `IDatabaseAdapter`

`better-loyalty` no sabe nada de tu base de datos. Debes enseñarle a comunicarse implementando una interfaz. Aquí tienes un ejemplo simple usando un objeto en memoria (en una app real, usarías Prisma, Mongoose, TypeORM, etc.).

```typescript
// src/myAdapter.ts
import { 
  IDatabaseAdapter, 
  UserLoyaltyProfile, 
  Tier, 
  UserId 
} from 'better-loyalty';

// Simulación de una base de datos en memoria para el ejemplo
const db = {
  users: new Map<UserId, UserLoyaltyProfile>(),
  tiers: [
    { id: 'bronze', name: 'Bronce', minPoints: 0, benefits: [] },
    { id: 'silver', name: 'Plata', minPoints: 500, benefits: ['free_shipping'] },
    { id: 'gold', name: 'Oro', minPoints: 2000, benefits: ['early_access'] },
  ],
};

export const myDbAdapter: IDatabaseAdapter = {
  async getUserProfile(userId) {
    return db.users.get(userId) || null;
  },
  async saveUserProfile(profile) {
    db.users.set(profile.userId, profile);
    return profile;
  },
  async getTiers() {
    return db.tiers;
  },
};
```

### Paso 2: Define tus Reglas de Lealtad

Este es el corazón del framework. Define qué eventos de tu aplicación deben generar puntos. Gracias a los genéricos, ¡obtendrás seguridad de tipo en tus `payloads`!

```typescript
// src/loyaltyRules.ts
import { LoyaltyRule } from 'better-loyalty';

// Define los tipos de payload para tus eventos
interface PurchasePayload {
  amount: number;
  category: 'electronics' | 'books' | 'other';
}

interface ReviewPayload {
  rating: number;
  textLength: number;
}

// Crea tu array de reglas
export const myRules: LoyaltyRule<any>[] = [
  {
    name: 'Puntos por compra',
    event: 'purchase_completed',
    condition: (ctx: { payload: PurchasePayload }) => ctx.payload.amount > 10,
    action: (ctx: { payload: PurchasePayload }) => ({
      points: Math.floor(ctx.payload.amount),
      actionName: `Compra de $${ctx.payload.amount}`,
    }),
  },
  {
    name: 'Bonus por reseña de calidad',
    event: 'review_created',
    condition: (ctx: { payload: ReviewPayload }) => ctx.payload.rating >= 4 && ctx.payload.textLength > 50,
    action: () => ({
      points: 50,
      actionName: 'Reseña de calidad',
    }),
  },
];
```

### Paso 3: Inicializa, Procesa Eventos y Reacciona

Ahora, junta todo en la lógica de tu aplicación.

```typescript
// src/main.ts
import { BetterLoyalty } from 'better-loyalty';
import { myDbAdapter } from './myAdapter';
import { myRules } from './loyaltyRules';

// 1. Inicializa el sistema
const loyaltySystem = new BetterLoyalty(myDbAdapter, myRules);
const userId = 'customer-007';

// 2. Suscríbete a eventos para reaccionar
loyaltySystem.on('tier_changed', ({ userId, to }) => {
  console.log(`🎉 ¡Felicidades, ${userId}! Has ascendido al nivel ${to?.name}!`);
  // Aquí podrías enviar un email, una notificación push, etc.
});

loyaltySystem.on('points_updated', ({ userId, points, action, newBalance }) => {
  console.log(`✅ ${userId} ha recibido ${points} puntos por "${action}". Saldo actual: ${newBalance}`);
});


// 3. Procesa eventos de tu aplicación
async function runDemo() {
  console.log('--- Procesando una compra ---');
  await loyaltySystem.processEvent({
    userId,
    event: 'purchase_completed',
    payload: { amount: 600, category: 'electronics' },
  });

  console.log('\n--- Procesando una reseña ---');
  await loyaltySystem.processEvent({
    userId,
    event: 'review_created',
    payload: { rating: 5, textLength: 150 },
  });
}

runDemo();
```

¡Y eso es todo! Has implementado un sistema de fidelización robusto y desacoplado de tu lógica de negocio principal.

## API Principal

### `new BetterLoyalty(adapter, rules)`
Crea una nueva instancia del framework.
-   `adapter: IDatabaseAdapter`: Tu implementación para la comunicación con la base de datos.
-   `rules?: LoyaltyRule<any>[]`: Un array opcional con las reglas de tu negocio.

### `loyaltySystem.processEvent(context)`
El método principal para interactuar con el framework. Procesa un evento y ejecuta las reglas correspondientes.
-   `context: RuleContext<P>`: Un objeto con `userId`, `event` (string) y `payload` (tus datos).

### `loyaltySystem.on(eventName, handler)`
Te suscribes a los eventos internos del framework.
-   `eventName: 'tier_changed' | 'points_updated'`
-   `handler`: Una función callback que recibe el payload del evento.

### `loyaltySystem.points`
Para operaciones manuales de puntos (menos común, pero disponible).
-   `.add(userId, points, action)`: Otorga puntos directamente.
-   `.subtract(userId, points, action)`: Canjea puntos directamente.
-   `.getBalance(userId)`: Consulta el saldo de un usuario.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un *issue* para discutir cambios importantes o un *pull request* para correcciones.

## Licencia

[MIT](./LICENSE)