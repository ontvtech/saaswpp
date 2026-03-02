import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import si from 'systeminformation';
import fs from 'fs';
import path from 'path';
import { callUniversalAI } from '../services/aiOrchestrator';
import { requireAuth } from './auth';

const prisma = new PrismaClient();
export const adminRoutes = Router();

// Require Admin Role
adminRoutes.use(requireAuth(['ADMIN']));

// Testar Chave API
adminRoutes.post('/keys/test', async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: 'Chave não fornecida' });

  try {
    const response = await callUniversalAI('You are a validator. Respond with "OK" if you receive this.', 'Hello World', key);
    if (response && response.includes('OK')) {
      res.json({ success: true, message: 'Chave validada com sucesso!' });
    } else {
      res.status(400).json({ success: false, message: 'Resposta inválida da API.', debug: response });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Global Config
adminRoutes.get('/config', async (req, res) => {
  try {
    const config = await prisma.globalConfig.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton', trial_enabled: true }
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

adminRoutes.post('/config', async (req, res) => {
  try {
    const { trial_enabled } = req.body;
    const config = await prisma.globalConfig.update({
      where: { id: 'singleton' },
      data: { trial_enabled }
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// Key Rotation Service
const apiKeys = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
  process.env.GEMINI_KEY_3,
];
let currentKeyIndex = 0;

export function rotateApiKey() {
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  console.log(`[SECURITY] Rotating API Key to Index: ${currentKeyIndex}`);
  return apiKeys[currentKeyIndex];
}

// Admin Endpoints
adminRoutes.post('/keys/rotate', async (req, res) => {
  rotateApiKey();
  
  // Audit Log
  await (prisma as any).auditLog.create({
    data: {
      action: 'KEY_ROTATION',
      details: `Manual key rotation triggered. New index: ${currentKeyIndex}`,
      ipAddress: req.ip
    }
  });

  res.json({ status: 'ROTATED', current: currentKeyIndex });
});

adminRoutes.get('/keys/status', (req, res) => {
  res.json({
    total: apiKeys.length,
    active: currentKeyIndex,
    health: 'OPTIMAL'
  });
});

// Module 5: Command Center and Telemetry
adminRoutes.get('/telemetry', async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    
    // Node 16GB (Current Node)
    const node16gb = {
      cpu: cpu.currentLoad.toFixed(2),
      memory: {
        used: (mem.active / 1024 / 1024 / 1024).toFixed(2),
        total: (mem.total / 1024 / 1024 / 1024).toFixed(2)
      }
    };

    // Node 8GB (Remote Node)
    // In a real scenario, this would be a fetch to the other node's /api/admin/telemetry
    // For now, we leave it as N/A until the monitoring agent is configured
    const node8gb = {
      cpu: "N/A",
      memory: {
        used: "N/A",
        total: "8.00"
      }
    };

    res.json({ node16gb, node8gb });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch telemetry' });
  }
});

adminRoutes.get('/logs', (req, res) => {
  const logType = req.query.type as string || 'backend';
  const logPaths: Record<string, string> = {
    backend: path.join(process.cwd(), 'combined.log'),
    evolution: path.join(process.cwd(), 'evolution.log')
  };

  const logPath = logPaths[logType];
  
  if (fs.existsSync(logPath)) {
    const logs = fs.readFileSync(logPath, 'utf8').split('\n').slice(-100).join('\n');
    res.json({ logs });
  } else {
    res.json({ logs: `[SYSTEM] Log file not found at ${logPath}. Ensure production logging is active.` });
  }
});

adminRoutes.get('/ai-stats', async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const stats = await prisma.interactionLog.aggregate({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo
        }
      },
      _sum: {
        tokensUsed: true
      },
      _count: {
        id: true
      }
    });

    const totalTokens = stats._sum.tokensUsed || 0;
    const totalMessages = stats._count.id || 0;
    
    // Estimated cost: $0.075 per 1M tokens (Gemini 1.5 Flash pricing approx)
    const estimatedCost = (totalTokens / 1000000) * 0.075;

    res.json({
      totalMessages,
      totalTokens,
      estimatedCost: estimatedCost.toFixed(4),
      period: '24h'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch AI stats' });
  }
});

// --- PLAN MANAGEMENT ---
adminRoutes.get('/plans', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' });
  }
});

adminRoutes.post('/plans', async (req, res) => {
  try {
    const { name, price, description, type, maxTenants, maxMessages, modules, tokenLimit, instanceLimit, stripePriceId } = req.body;
    const plan = await prisma.plan.create({
      data: { name, price: Number(price), description, type, maxTenants: Number(maxTenants), maxMessages: Number(maxMessages), modules, tokenLimit: Number(tokenLimit || 50000), instanceLimit: Number(instanceLimit || 1), stripePriceId }
    });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

adminRoutes.put('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, type, maxTenants, maxMessages, modules, tokenLimit, instanceLimit, stripePriceId } = req.body;
    const plan = await prisma.plan.update({
      where: { id },
      data: { name, price: Number(price), description, type, maxTenants: Number(maxTenants), maxMessages: Number(maxMessages), modules, tokenLimit: Number(tokenLimit || 50000), instanceLimit: Number(instanceLimit || 1), stripePriceId }
    });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

adminRoutes.delete('/plans/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.plan.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

// --- NICHE MANAGEMENT ---
adminRoutes.get('/niches', async (req, res) => {
  try {
    const niches = await prisma.nicheTemplate.findMany();
    res.json(niches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch niches' });
  }
});

adminRoutes.post('/niches', async (req, res) => {
  try {
    const { name, basePrompt } = req.body;
    const niche = await prisma.nicheTemplate.create({
      data: { name, basePrompt }
    });
    res.json(niche);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create niche' });
  }
});

adminRoutes.put('/niches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, basePrompt } = req.body;
    const niche = await prisma.nicheTemplate.update({
      where: { id },
      data: { name, basePrompt }
    });
    res.json(niche);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update niche' });
  }
});

adminRoutes.delete('/niches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.nicheTemplate.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete niche' });
  }
});

// --- GLOBAL CONFIG ---
adminRoutes.get('/config', async (req, res) => {
  try {
    let config = await prisma.globalConfig.findUnique({ where: { id: 'singleton' } });
    if (!config) {
      config = await prisma.globalConfig.create({ data: { id: 'singleton' } });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

adminRoutes.put('/config', async (req, res) => {
  try {
    const { trial_enabled, stripeSecretKey, stripePublicKey, stripeWebhookSecret } = req.body;
    const config = await prisma.globalConfig.upsert({
      where: { id: 'singleton' },
      update: { trial_enabled, stripeSecretKey, stripePublicKey, stripeWebhookSecret },
      create: { id: 'singleton', trial_enabled, stripeSecretKey, stripePublicKey, stripeWebhookSecret }
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// --- TRIAL LINKS ---
adminRoutes.get('/trial-links', async (req, res) => {
  try {
    const links = await prisma.trialLink.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trial links' });
  }
});

adminRoutes.post('/trial-links', async (req, res) => {
  try {
    const { code, days, tokenLimit, instanceLimit, expiresAt } = req.body;
    const link = await prisma.trialLink.create({
      data: { 
        code: code || Math.random().toString(36).substring(2, 10).toUpperCase(),
        days: days || 7, 
        tokenLimit: tokenLimit || 50000, 
        instanceLimit: instanceLimit || 1, 
        expiresAt: expiresAt ? new Date(expiresAt) : null 
      }
    });
    res.json(link);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create trial link' });
  }
});

adminRoutes.delete('/trial-links/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.trialLink.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete trial link' });
  }
});
