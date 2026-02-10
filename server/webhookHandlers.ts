import { getStripeSync } from './stripeClient';
import { storage } from './storage';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { users } from '@shared/schema';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    try {
      const rawEvent = JSON.parse(payload.toString());
      const eventType = rawEvent.type;
      const data = rawEvent.data?.object;

      if (!data) return;

      switch (eventType) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const customerId = data.customer;
          const subscriptionId = data.id;
          const status = data.status;

          let user: any = await WebhookHandlers.findUserByStripeCustomer(customerId);
          if (!user) {
            user = await WebhookHandlers.findAndLinkUserByCustomer(customerId);
          }
          if (!user) {
            console.log(`[Stripe Webhook] No user found for customer ${customerId}`);
            return;
          }

          if (status === 'active' || status === 'trialing') {
            await storage.updateUserStripeInfo(user.id, { stripeSubscriptionId: subscriptionId });
            await storage.upgradeToPremium(user.id);
            console.log(`[Stripe Webhook] User ${user.id} upgraded to premium (subscription: ${status})`);
          } else if (status === 'canceled' || status === 'unpaid' || status === 'past_due' || status === 'incomplete_expired') {
            await storage.downgradeFromPremium(user.id);
            console.log(`[Stripe Webhook] User ${user.id} downgraded from premium (subscription: ${status})`);
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const customerId = data.customer;
          let user: any = await WebhookHandlers.findUserByStripeCustomer(customerId);
          if (!user) {
            user = await WebhookHandlers.findAndLinkUserByCustomer(customerId);
          }
          if (!user) return;

          await storage.downgradeFromPremium(user.id);
          console.log(`[Stripe Webhook] User ${user.id} subscription deleted, downgraded`);
          break;
        }

        case 'checkout.session.completed': {
          const customerId = data.customer;
          const subscriptionId = data.subscription;

          if (!customerId || !subscriptionId) break;

          const userId = data.metadata?.userId;
          let user;

          if (userId) {
            user = await storage.getUser(userId);
          }
          if (!user) {
            user = await WebhookHandlers.findUserByStripeCustomer(customerId);
          }

          if (user) {
            await storage.updateUserStripeInfo(user.id, {
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
            });
            await storage.upgradeToPremium(user.id);
            console.log(`[Stripe Webhook] Checkout completed, user ${user.id} upgraded`);
          }
          break;
        }
      }
    } catch (err: any) {
      console.error('[Stripe Webhook] Error processing event:', err.message);
    }
  }

  private static async findUserByStripeCustomer(customerId: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1);
    return result[0] || null;
  }

  private static async findAndLinkUserByCustomer(customerId: string) {
    try {
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();
      const customer = await stripe.customers.retrieve(customerId);

      if ('deleted' in customer && customer.deleted) return null;

      const userId = (customer as any).metadata?.userId;
      if (userId) {
        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customerId });
          console.log(`[Stripe Webhook] Linked customer ${customerId} to user ${user.id} via metadata`);
          return user;
        }
      }

      const email = (customer as any).email;
      if (email) {
        const user = await storage.getUserByEmail(email);
        if (user) {
          await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customerId });
          console.log(`[Stripe Webhook] Linked customer ${customerId} to user ${user.id} via email`);
          return user;
        }
      }
    } catch (err: any) {
      console.error('[Stripe Webhook] Error looking up customer:', err.message);
    }
    return null;
  }
}
