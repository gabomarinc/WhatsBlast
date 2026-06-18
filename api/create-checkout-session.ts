import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, plan } = req.body;
  if (!email || !plan) {
    return res.status(400).json({ error: 'Missing email or plan' });
  }

  try {
    // 1. Get prices for our product
    const prices = await stripe.prices.list({
      product: 'prod_SyVCL3AYGKspfE',
      active: true,
    });

    let targetPrice = null;
    if (plan === 'monthly') {
      targetPrice = prices.data.find(p => p.recurring?.interval === 'month');
    } else if (plan === 'lifetime') {
      targetPrice = prices.data.find(p => p.type === 'one_time');
    }

    if (!targetPrice) {
      return res.status(400).json({ error: `No active price found for plan: ${plan}` });
    }

    // 2. Get origin to redirect back to local or production domain
    const origin = req.headers.origin || 'https://reactivaleads.com';

    // 3. Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: targetPrice.id,
          quantity: 1,
        },
      ],
      mode: plan === 'lifetime' ? 'payment' : 'subscription',
      customer_email: email,
      client_reference_id: email,
      success_url: `${origin}/?payment_success=true`,
      cancel_url: `${origin}/`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('❌ Error creating checkout session:', err);
    return res.status(500).json({ error: err.message });
  }
}
