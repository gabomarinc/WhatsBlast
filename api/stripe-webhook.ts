import { neon } from '@neondatabase/serverless';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`❌ Webhook signature verification failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    
    // Stripe client_reference_id holds our user email
    const email = session.client_reference_id || session.customer_details?.email;
    
    if (email && sql) {
      const cleanEmail = email.toLowerCase().trim();
      try {
        console.log(`⭐ Webhook: Upgrading user ${cleanEmail} to PRO`);
        // Update user plan to 'pro' and role to 'user'
        const result = await sql`
          UPDATE users 
          SET plan = 'pro', role = 'user'
          WHERE LOWER(email) = ${cleanEmail}
          RETURNING email, plan, role
        `;
        console.log(`✅ Webhook: User ${cleanEmail} upgraded successfully`, result);
      } catch (dbErr) {
        console.error(`❌ Webhook Database Error:`, dbErr);
        return res.status(500).json({ error: 'Database update failed' });
      }
    } else {
      console.warn(`⚠️ Webhook: No email found in session or DB client is null`, session.id);
    }
  }

  return res.status(200).json({ received: true });
}
