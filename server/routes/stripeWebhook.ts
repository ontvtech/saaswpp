import { Router } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const stripeWebhookHandler = Router();

async function deleteEvolutionInstance(instanceName: string) {
  const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://192.168.88.6:8080';
  const apiKey = process.env.EVOLUTION_API_KEY;

  try {
    const response = await fetch(`${evolutionUrl}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': apiKey || ''
      }
    });
    if (!response.ok) {
      console.error(`[EVOLUTION] Failed to delete instance ${instanceName}: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`[EVOLUTION] Error deleting instance ${instanceName}:`, error);
  }
}

// Zero Touch Provisioning Logic
stripeWebhookHandler.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' });
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret!);
  } catch (err: any) {
    console.error(`[STRIPE] Webhook Signature Verification Failed: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_email || session.customer_details?.email;
      
      if (!email) {
        console.error('[ZERO TOUCH] No email found in session');
        break;
      }

      console.log(`[ZERO TOUCH] Payment successful for ${email}`);
      
      try {
        // 1. Create/Update Merchant Account
        const merchant = await prisma.merchant.upsert({
          where: { email },
          update: {
            status: 'active',
            stripeCustomerId: session.customer as string,
            subscriptionId: session.subscription as string,
            // Use connect for relations
            plan: { connect: { name: 'Pro' } }
          },
          create: {
            email,
            name: email.split('@')[0],
            status: 'active',
            stripeCustomerId: session.customer as string,
            subscriptionId: session.subscription as string,
            plan: { connect: { name: 'Pro' } }
          }
        });

        // 2. Provision Evolution Instance (Logic would call Evolution API here)
        // For now, we update the DB with a placeholder instance name
        const instanceName = `inst_${merchant.id.slice(0, 8)}`;
        await prisma.merchant.update({
          where: { id: merchant.id },
          data: { evolutionInstance: instanceName }
        });

        console.log(`[ZERO TOUCH] Merchant ${merchant.id} fully provisioned.`);
      } catch (dbError) {
        console.error('[ZERO TOUCH] DB Error:', dbError);
      }
      break;
    }

    case 'customer.subscription.deleted':
    case 'invoice.payment_failed': {
      const obj = event.data.object as any;
      const customerId = obj.customer as string;
      console.log(`[SUSPENSION] Action triggered for customer ${customerId} due to ${event.type}.`);
      
      try {
        // 1. Find Merchant
        const merchant = await prisma.merchant.findFirst({
          where: { stripeCustomerId: customerId }
        });

        if (merchant && merchant.evolutionInstance) {
          // 2. Delete Evolution Instance (Zero Touch Block)
          await deleteEvolutionInstance(merchant.evolutionInstance);
          
          // 3. Suspend Merchant in DB
          await prisma.merchant.update({
            where: { id: merchant.id },
            data: { 
              status: 'suspended',
              evolutionInstance: null // Free up for 16GB RAM
            }
          });
          
          console.log(`[SUSPENSION] Merchant ${merchant.id} suspended and instance ${merchant.evolutionInstance} deleted.`);
        }
      } catch (dbError) {
        console.error('[SUSPENSION] Error:', dbError);
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
});
