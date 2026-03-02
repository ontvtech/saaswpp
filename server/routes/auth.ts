import express from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24-preview' as any,
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

const router = express.Router();

// Middleware to verify JWT and Role
export const requireAuth = (roles: string[] = []) => {
  return async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      // Admin Impersonation Support
      if (decoded.role === 'ADMIN') {
        const impersonateMerchantId = req.headers['x-impersonate-merchant'];
        const impersonateResellerId = req.headers['x-impersonate-reseller'];
        
        if (impersonateMerchantId) {
          req.user.impersonatedMerchantId = impersonateMerchantId;
        }
        if (impersonateResellerId) {
          req.user.impersonatedResellerId = impersonateResellerId;
        }
      }

      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};

// 0. Login Endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if it's an admin
    if (email === 'admin@saaswpp.com' && password === 'admin123') {
      const token = jwt.sign({ id: 'admin-id-000', email, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, user: { id: 'admin-id-000', email, role: 'ADMIN', name: 'Administrador' } });
    }

    // Check Merchant
    const merchant = await prisma.merchant.findUnique({ 
      where: { email },
      include: { plan: true, niche: true }
    });
    if (merchant && await bcrypt.compare(password, merchant.password)) {
      const token = jwt.sign({ id: merchant.id, email, role: 'MERCHANT' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ 
        token, 
        user: { id: merchant.id, email, role: 'MERCHANT', name: merchant.name },
        merchant: {
          id: merchant.id,
          name: merchant.name,
          plan: merchant.plan,
          niche: merchant.niche,
          tokenQuota: merchant.tokenQuota,
          tokenUsage: merchant.tokenUsage
        }
      });
    }

    // Check Reseller
    const reseller = await (prisma as any).reseller.findUnique({ where: { email } });
    if (reseller && await bcrypt.compare(password, reseller.password)) {
      const token = jwt.sign({ id: reseller.id, email, role: 'RESELLER' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, user: { id: reseller.id, email, role: 'RESELLER', name: reseller.name } });
    }

    res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 0.1 Get Current User
router.get('/me', requireAuth(), async (req: any, res) => {
  try {
    const { id, role } = req.user;
    
    if (role === 'ADMIN') {
      return res.json({
        user: { id, name: 'Administrador', email: req.user.email, role: 'ADMIN' }
      });
    }

    if (role === 'MERCHANT') {
      const merchant = await prisma.merchant.findUnique({
        where: { id },
        include: { plan: true, niche: true }
      });
      if (!merchant) return res.status(404).json({ error: 'Merchant not found' });
      return res.json({
        user: { id: merchant.id, name: merchant.name, email: merchant.email, role: 'MERCHANT' },
        merchant: {
          id: merchant.id,
          name: merchant.name,
          plan: merchant.plan,
          niche: merchant.niche,
          tokenQuota: merchant.tokenQuota,
          tokenUsage: merchant.tokenUsage
        }
      });
    }

    if (role === 'RESELLER') {
      const reseller = await (prisma as any).reseller.findUnique({ where: { id } });
      if (!reseller) return res.status(404).json({ error: 'Reseller not found' });
      return res.json({
        user: { id: reseller.id, name: reseller.name, email: reseller.email, role: 'RESELLER' }
      });
    }

    res.status(400).json({ error: 'Invalid role' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 1. Checkout de Validação (Stripe SetupIntent)
router.post('/setup-intent', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Create or retrieve customer
    let customer = await stripe.customers.list({ email, limit: 1 });
    let customerId = customer.data.length > 0 ? customer.data[0].id : null;

    if (!customerId) {
      const newCustomer = await stripe.customers.create({ email });
      customerId = newCustomer.id;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Rota /register/beta10
router.get('/beta10/check', async (req, res) => {
  try {
    const config = await prisma.globalConfig.findUnique({ where: { id: 'singleton' } });
    const count = await prisma.merchant.count();

    if (!config?.trial_enabled || count >= 10) {
      return res.json({ eligible: false, reason: count >= 10 ? 'Limite de 10 lojistas atingido.' : 'Trial desativado.' });
    }

    res.json({ eligible: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/beta10/register', async (req, res) => {
  try {
    const { name, email, password, paymentMethodId } = req.body;

    // Double check eligibility
    const config = await prisma.globalConfig.findUnique({ where: { id: 'singleton' } });
    const count = await prisma.merchant.count();
    if (!config?.trial_enabled || count >= 10) {
      return res.status(403).json({ error: 'Inscrições Beta-10 encerradas.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const merchant = await prisma.merchant.create({
      data: {
        name,
        email,
        password: hashedPassword,
        stripePaymentMethod: paymentMethodId,
        verificationCode,
        status: 'pending_verification',
        plan: { connect: { name: 'Start' } }
      }
    });

    // Send Verification Email
    await sendVerificationEmail(email, verificationCode);

    // Send WhatsApp Alert (Evolution API)
    await sendWhatsAppAlert(name, verificationCode);

    res.json({ success: true, merchantId: merchant.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    const merchant = await prisma.merchant.findUnique({ where: { email } });

    if (!merchant || merchant.verificationCode !== code) {
      return res.status(400).json({ error: 'Código inválido.' });
    }

    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { 
        status: 'active',
        verificationCode: null 
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/trial/validate', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      const config = await prisma.globalConfig.findUnique({ where: { id: 'singleton' } });
      if (config?.trial_enabled) {
        return res.json({ days: 7, tokenLimit: 50000, isDefault: true });
      }
      return res.status(400).json({ error: 'Trial gratuito desativado. Você precisa de um código de convite.' });
    }

    const link = await prisma.trialLink.findUnique({
      where: { code: String(code) }
    });

    if (!link || link.used) {
      return res.status(400).json({ error: 'Link inválido ou já utilizado.' });
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.status(400).json({ error: 'Link expirado.' });
    }

    res.json(link);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/trial/register', async (req, res) => {
  try {
    const { name, email, password, code } = req.body;
    let days = 7;
    let tokenLimit = 50000;
    let linkId = null;

    if (code) {
      const link = await prisma.trialLink.findUnique({
        where: { code: String(code) }
      });

      if (!link || link.used) {
        return res.status(400).json({ error: 'Link inválido.' });
      }
      days = link.days;
      tokenLimit = link.tokenLimit;
      linkId = link.id;
    } else {
      const config = await prisma.globalConfig.findUnique({ where: { id: 'singleton' } });
      if (!config?.trial_enabled) {
        return res.status(400).json({ error: 'Trial gratuito desativado.' });
      }
    }

    const existing = await prisma.merchant.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'E-mail já cadastrado.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + days);

    const merchant = await prisma.merchant.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verificationCode,
        status: 'pending_verification',
        tokenQuota: tokenLimit,
        trialEndsAt,
        plan: { connect: { name: 'Start' } }
      }
    });

    // Mark link as used if applicable
    if (linkId) {
      await prisma.trialLink.update({
        where: { id: linkId },
        data: { used: true, usedBy: merchant.id }
      });
    }

    await sendVerificationEmail(email, verificationCode);
    await sendWhatsAppAlert(name, verificationCode);

    res.json({ success: true, merchantId: merchant.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany();
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/checkout/session', async (req, res) => {
  try {
    const { planId, email } = req.body;
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) return res.status(404).json({ error: 'Plano não encontrado.' });

    const config = await prisma.globalConfig.findUnique({ where: { id: 'singleton' } });
    const stripeKey = config?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) return res.status(500).json({ error: 'Gateway de pagamento não configurado.' });

    const stripeInstance = new Stripe(stripeKey, { apiVersion: '2025-02-24-preview' as any });

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: plan.name,
            description: plan.description || '',
          },
          unit_amount: Math.round(plan.price * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/register/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/my-plan`,
      customer_email: email,
      metadata: {
        planId: plan.id,
        email: email
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/checkout/verify', async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'Session ID is required' });

    const config = await prisma.globalConfig.findUnique({ where: { id: 'singleton' } });
    const stripeKey = config?.stripeSecretKey || process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) return res.status(500).json({ error: 'Gateway de pagamento não configurado.' });

    const stripeInstance = new Stripe(stripeKey, { apiVersion: '2025-02-24-preview' as any });
    const session = await stripeInstance.checkout.sessions.retrieve(String(session_id));

    if (session.payment_status === 'paid') {
      const { planId, email } = session.metadata || {};
      
      if (email && planId) {
        const merchant = await prisma.merchant.findUnique({ where: { email } });
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        
        if (merchant && plan) {
          await prisma.merchant.update({
            where: { id: merchant.id },
            data: { 
              planId: plan.id,
              tokenQuota: plan.tokenLimit,
              status: 'active'
            }
          });
        }
      }
      
      res.json({ success: true, status: session.payment_status });
    } else {
      res.status(400).json({ error: 'Pagamento não confirmado.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function sendVerificationEmail(email: string, code: string) {
  // Placeholder SMTP Config - In a real app, use env vars
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || 'beta10@saaswpp.com',
      pass: process.env.SMTP_PASS || 'password'
    }
  });

  await transporter.sendMail({
    from: '"SaaSWpp Beta-10" <beta10@saaswpp.com>',
    to: email,
    subject: "Seu Código de Ativação Beta-10",
    text: `Seu código de ativação é: ${code}`,
    html: `<b>Seu código de ativação é: ${code}</b>`
  });
}

async function sendWhatsAppAlert(name: string, code: string) {
  const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://192.168.88.6:8080';
  const apiKey = process.env.EVOLUTION_API_KEY;
  const adminNumber = process.env.ADMIN_WHATSAPP || '5511999999999';

  try {
    await fetch(`${evolutionUrl}/message/sendText/MainInstance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': apiKey || '' },
      body: JSON.stringify({
        number: adminNumber,
        text: `🚀 [BETA-10] Novo cadastro: ${name}\nCódigo enviado: ${code}`
      })
    });
  } catch (e) {
    console.error("Failed to send WhatsApp alert", e);
  }
}

export { router as authRoutes };
