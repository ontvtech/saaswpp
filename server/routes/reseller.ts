import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';

const prisma = new PrismaClient();
export const resellerRoutes = Router();

// Require Reseller or Admin Role
resellerRoutes.use(requireAuth(['reseller', 'admin']));

// List Tenants (Merchants) for this Reseller
resellerRoutes.get('/tenants', async (req: any, res) => {
  try {
    const where: any = {};
    if (req.user.role === 'reseller') {
      where.resellerId = req.user.id;
    }

    const tenants = await prisma.merchant.findMany({
      where,
      include: {
        knowledgeBase: true
      }
    });

    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

// Create Tenant
resellerRoutes.post('/tenants', async (req: any, res) => {
  try {
    const { 
      name, 
      email, 
      plan, 
      tokenQuota, 
      whatsappApiType,
      metaAccessToken,
      metaPhoneNumberId,
      metaWabaId,
      metaVerifyToken
    } = req.body;
    
    // Ensure reseller can only create for themselves
    const resellerId = req.user.role === 'reseller' ? req.user.id : req.body.resellerId;

    const tenant = await prisma.merchant.create({
      data: {
        name,
        email,
        password: 'temporary-password-change-me', // In a real app, send a reset link
        plan,
        tokenQuota: tokenQuota || 1000,
        resellerId,
        status: 'active',
        whatsappApiType: whatsappApiType || 'EVOLUTION',
        metaAccessToken,
        metaPhoneNumberId,
        metaWabaId,
        metaVerifyToken
      } as any
    });

    res.json(tenant);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
