import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from './auth';
import { callUniversalAI } from '../services/aiOrchestrator';

const prisma = new PrismaClient();
export const whatsappRoutes = Router();

// Use real requireAuth for all whatsapp routes
whatsappRoutes.use(requireAuth(['merchant', 'admin']));

// Middleware to check if user owns the instance
const checkInstanceOwnership = async (req: any, res: any, next: any) => {
  const { id } = req.params;
  if (req.user.role === 'admin') return next();
  
  const merchant = await prisma.merchant.findUnique({
    where: { email: req.user.email }
  });
  
  if (!merchant || merchant.evolutionInstance !== id) {
    return res.status(403).json({ error: 'Forbidden: You do not own this instance' });
  }
  next();
};

whatsappRoutes.get('/instances', async (req: any, res) => {
  try {
    const targetEmail = req.user.impersonatedMerchantId ? undefined : req.user.email;
    const targetId = req.user.impersonatedMerchantId;

    const merchant = await prisma.merchant.findUnique({
      where: targetId ? { id: targetId } : { email: targetEmail }
    });

    if (!merchant || !merchant.evolutionInstance) {
      return res.json([]);
    }

    // Fetch instance status from Evolution API
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://192.168.88.6:8080';
    const apiKey = process.env.EVOLUTION_API_KEY;

    const response = await fetch(`${evolutionUrl}/instance/connectionState/${merchant.evolutionInstance}`, {
      headers: { 'apikey': apiKey || '' }
    });

    if (response.ok) {
      const data = await response.json();
      
      let status = 'disconnected';
      if (data.instance?.state === 'open') status = 'connected';
      else if (data.instance?.state === 'connecting') status = 'connecting';

      // If it's connected, we might want to get the QR code if it was qr_ready
      // But usually Evolution API sends QR via webhook or we fetch it separately
      
      res.json([{
        id: merchant.evolutionInstance,
        name: 'Principal',
        status: status,
        qrCode: null
      }]);
    } else {
      res.json([{
        id: merchant.evolutionInstance,
        name: 'Principal',
        status: 'disconnected',
        qrCode: null
      }]);
    }
  } catch (error) {
    console.error('Error fetching instances:', error);
    res.status(500).json({ error: 'Failed to fetch instances' });
  }
});

whatsappRoutes.post('/instances', async (req: any, res) => {
  try {
    const { name } = req.body;
    const targetEmail = req.user.impersonatedMerchantId ? undefined : req.user.email;
    const targetId = req.user.impersonatedMerchantId;

    const merchant = await prisma.merchant.findUnique({
      where: targetId ? { id: targetId } : { email: targetEmail }
    });

    if (!merchant) return res.status(404).json({ error: 'Merchant not found' });

    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://192.168.88.6:8080';
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instanceName = `inst_${merchant.id.substring(0, 8)}`;

    // 1. Create instance in Evolution API
    const createRes = await fetch(`${evolutionUrl}/instance/create`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'apikey': apiKey || ''
      },
      body: JSON.stringify({
        instanceName: instanceName,
        token: apiKey, // Optional, can be random
        qrcode: true
      })
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Evolution API Error: ${err}`);
    }

    const data = await createRes.json();

    // 2. Set Webhook URL
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const webhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET || 'default-secret';
    
    await fetch(`${evolutionUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'apikey': apiKey || ''
      },
      body: JSON.stringify({
        url: `${appUrl}/api/webhooks/evolution`,
        enabled: true,
        events: ['messages.upsert'],
        headers: {
          'x-evolution-secret': webhookSecret
        }
      })
    });

    // 3. Save instance name to Merchant
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { evolutionInstance: instanceName }
    });

    res.json({
      id: instanceName,
      name: name || 'Principal',
      status: 'connecting',
      qrCode: data.qrcode?.base64 || null
    });
  } catch (error: any) {
    console.error('Error creating instance:', error);
    res.status(500).json({ error: error.message });
  }
});

whatsappRoutes.post('/instances/:id/connect', checkInstanceOwnership, async (req: any, res) => {
  // Mock connect
  res.json({ success: true });
});

whatsappRoutes.post('/instances/:id/disconnect', checkInstanceOwnership, async (req: any, res) => {
  // Mock disconnect
  res.json({ success: true });
});

whatsappRoutes.post('/instances/:id/study', checkInstanceOwnership, async (req: any, res) => {
  const { id } = req.params;
  const { remoteJid } = req.body;

  if (!remoteJid) {
    return res.status(400).json({ error: 'remoteJid is required' });
  }

  try {
    const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://192.168.88.6:8080';
    const apiKey = process.env.EVOLUTION_API_KEY;

    // 1. Fetch last 100 messages (Evolution API limit/performance)
    const response = await fetch(`${evolutionUrl}/chat/findMessages/${id}?remoteJid=${remoteJid}&count=100`, {
      headers: { 'apikey': apiKey || '' }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch messages from Evolution API');
    }

    const data = await response.json();
    const messages = data.messages || [];

    if (messages.length === 0) {
      return res.status(400).json({ error: 'No messages found in this chat/group' });
    }

    // 2. Format messages for AI
    const conversationText = messages
      .map((m: any) => `${m.pushName || m.key.remoteJid}: ${m.message?.conversation || m.message?.extendedTextMessage?.text || ''}`)
      .filter((t: string) => t.length > 5)
      .join('\n');

    // 3. AI Study (Summarization)
    const systemInstruction = `
      Você é um especialista em treinamento de IAs de atendimento.
      Analise a conversa abaixo e extraia o CONHECIMENTO necessário para atender futuros clientes.
      Identifique:
      - Produtos e serviços mencionados.
      - Preços e condições.
      - Tom de voz da equipe.
      - Perguntas frequentes e suas respostas.
      
      Gere um texto estruturado e direto que servirá de base de conhecimento.
    `;

    const aiKey = process.env.GEMINI_API_KEY || '';
    const knowledge = await callUniversalAI(systemInstruction, `CONVERSA:\n${conversationText}`, aiKey, 'gemini-3-flash-preview');

    if (!knowledge) {
      throw new Error('AI failed to process the conversation');
    }

    // 4. Update KnowledgeBase
    const targetEmail = req.user.impersonatedMerchantId ? undefined : req.user.email;
    const targetId = req.user.impersonatedMerchantId;

    const merchant = await prisma.merchant.findUnique({
      where: targetId ? { id: targetId } : { email: targetEmail }
    });

    if (merchant) {
      await prisma.knowledgeBase.create({
        data: {
          merchantId: merchant.id,
          content: `[ESTUDO DE GRUPO - ${new Date().toLocaleDateString()}]\n${knowledge}`
        }
      });
    }

    res.json({ success: true, knowledge });
  } catch (error: any) {
    console.error('Error in Group Study:', error);
    res.status(500).json({ error: error.message });
  }
});
