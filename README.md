# better-loyalty

[![NPM Version](https://img.shields.io/npm/v/better-loyalty.svg)](https://www.npmjs.com/package/better-loyalty)
[![Build Status](https://img.shields.io/github/actions/workflow/status/tu-usuario/better-loyalty/main.yml?branch=main)](https://github.com/tu-usuario/better-loyalty/actions)
[![License](https://img.shields.io/npm/l/better-loyalty.svg)](https://github.com/tu-usuario/better-loyalty/blob/main/LICENSE)

A declarative framework for modeling and executing customer loyalty business logic, completely agnostic to technology and application domain.

With `better-loyalty`, you stop writing scattered loyalty logic in your code. Instead, you define your business rules and let the framework orchestrate the rest.

## The Philosophy: From Imperative to Declarative

The traditional approach forces you to write code like this throughout your application:

```typescript
// The traditional way 👎
if (userCompletedPurchase) {
  const points = calculatePoints(purchase.amount);
  await loyaltyService.addPoints(user.id, points);
  const newTier = await loyaltyService.checkTier(user.id);
  if (newTier) {
    await emailService.sendTierUpEmail(user.id, newTier);
  }
}
```

With `better-loyalty`, your business logic lives outside your controllers. It's clean, centralized, and declarative:

```typescript
// The better-loyalty way 👍
loyaltySystem.processEvent({
  userId: 'user-123',
  event: 'purchase_completed',
  payload: { amount: 120, items: ['book', 'pen'] },
});
```

## Key Features

- 🚀 **Declarative Rule Engine**: Define your business logic (e.g., "award 100 points for purchases > $50") in simple configuration.
- 🔌 **Database Agnostic**: Connect your own database (PostgreSQL, MongoDB, Firebase, etc.) by implementing a simple and clean `IDatabaseAdapter` interface.
- ⚛️ **Reactive Event System**: Subscribe to events like `tier_changed` or `points_updated` to trigger notifications, send emails, or update the UI.
- 🔒 **First-Class TypeScript**: Framework written 100% in TypeScript, with generics for complete type safety in your event payloads.
- ✨ **Zero Production Dependencies (almost)**: Ultralight. Only `mitt` for the event emitter.

## Installation

```bash
# With pnpm
pnpm add better-loyalty

# With npm
npm install better-loyalty

# With yarn
yarn add better-loyalty
```

## Quick Start Guide

Let's create a functional loyalty system in 3 steps.

### Step 1: Implement the `IDatabaseAdapter`

`better-loyalty` knows nothing about your database. You must teach it to communicate by implementing an interface. Here's a simple example using an in-memory object (in a real app, you'd use Prisma, Mongoose, TypeORM, etc.).

```typescript
// src/myAdapter.ts
import {
  IDatabaseAdapter,
  UserLoyaltyProfile,
  Tier,
  UserId,
} from 'better-loyalty';

// Simulation of an in-memory database for the example
const db = {
  users: new Map<UserId, UserLoyaltyProfile>(),
  tiers: [
    { id: 'bronze', name: 'Bronze', minPoints: 0, benefits: [] },
    {
      id: 'silver',
      name: 'Silver',
      minPoints: 500,
      benefits: ['free_shipping'],
    },
    { id: 'gold', name: 'Gold', minPoints: 2000, benefits: ['early_access'] },
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

### Step 2: Define Your Loyalty Rules

This is the heart of the framework. Define which events in your application should generate points. Thanks to generics, you'll get complete type safety in your `payloads`!

```typescript
// src/loyaltyRules.ts
import { LoyaltyRule } from 'better-loyalty';

// Define payload types for your events
interface PurchasePayload {
  amount: number;
  category: 'electronics' | 'books' | 'other';
}

interface ReviewPayload {
  rating: number;
  textLength: number;
}

// Create your rules array
export const myRules: LoyaltyRule<any>[] = [
  {
    name: 'Points for purchase',
    event: 'purchase_completed',
    condition: (ctx: { payload: PurchasePayload }) => ctx.payload.amount > 10,
    action: (ctx: { payload: PurchasePayload }) => ({
      points: Math.floor(ctx.payload.amount),
      actionName: `Purchase of $${ctx.payload.amount}`,
    }),
  },
  {
    name: 'Bonus for quality review',
    event: 'review_created',
    condition: (ctx: { payload: ReviewPayload }) =>
      ctx.payload.rating >= 4 && ctx.payload.textLength > 50,
    action: () => ({
      points: 50,
      actionName: 'Quality review',
    }),
  },
];
```

### Step 3: Initialize, Process Events, and React

Now, put it all together in your application logic.

```typescript
// src/main.ts
import { BetterLoyalty } from 'better-loyalty';
import { myDbAdapter } from './myAdapter';
import { myRules } from './loyaltyRules';

// 1. Initialize the system
const loyaltySystem = new BetterLoyalty(myDbAdapter, myRules);
const userId = 'customer-007';

// 2. Subscribe to events to react
loyaltySystem.on('tier_changed', ({ userId, to }) => {
  console.log(
    `🎉 Congratulations, ${userId}! You've ascended to ${to?.name} level!`,
  );
  // Here you could send an email, push notification, etc.
});

loyaltySystem.on('points_updated', ({ userId, points, action, newBalance }) => {
  console.log(
    `✅ ${userId} has received ${points} points for "${action}". Current balance: ${newBalance}`,
  );
});

// 3. Process events from your application
async function runDemo() {
  console.log('--- Processing a purchase ---');
  await loyaltySystem.processEvent({
    userId,
    event: 'purchase_completed',
    payload: { amount: 600, category: 'electronics' },
  });

  console.log('\n--- Processing a review ---');
  await loyaltySystem.processEvent({
    userId,
    event: 'review_created',
    payload: { rating: 5, textLength: 150 },
  });
}

runDemo();
```

And that's it! You've implemented a robust loyalty system decoupled from your main business logic.

## Main API

### `new BetterLoyalty(adapter, rules)`

Creates a new instance of the framework.

- `adapter: IDatabaseAdapter`: Your implementation for database communication.
- `rules?: LoyaltyRule<any>[]`: An optional array with your business rules.

### `loyaltySystem.processEvent(context)`

The main method to interact with the framework. Processes an event and executes the corresponding rules.

- `context: RuleContext<P>`: An object with `userId`, `event` (string) and `payload` (your data).

### `loyaltySystem.on(eventName, handler)`

Subscribe to the framework's internal events.

- `eventName: 'tier_changed' | 'points_updated'`
- `handler`: A callback function that receives the event payload.

### `loyaltySystem.points`

For manual point operations (less common, but available).

- `.add(userId, points, action)`: Award points directly.
- `.subtract(userId, points, action)`: Redeem points directly.
- `.getBalance(userId)`: Query a user's balance.

## Contributions

Contributions are welcome. Please open an _issue_ to discuss major changes or a _pull request_ for fixes.

## License

[MIT](./LICENSE)
