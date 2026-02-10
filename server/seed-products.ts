import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  const existing = await stripe.products.search({ query: "name:'Mentorfy Premium'" });
  if (existing.data.length > 0) {
    console.log('Mentorfy Premium product already exists:', existing.data[0].id);
    const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
    for (const price of prices.data) {
      console.log(`  Price: ${price.id} - $${(price.unit_amount || 0) / 100}/${price.recurring?.interval || 'one-time'}`);
    }
    return;
  }

  const product = await stripe.products.create({
    name: 'Mentorfy Premium',
    description: 'Unlimited messaging with your mentors. Remove the 4-message limit and unlock deeper conversations.',
    metadata: {
      feature: 'premium_messaging',
      app: 'mentorfy',
    },
  });

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 999,
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  console.log('Created product:', product.id);
  console.log('Created monthly price:', monthlyPrice.id, '- $9.99/month');
}

createProducts().catch(console.error);
