import { GoogleGenAI } from '@google/genai';
import { PrismaClient } from '@prisma/client';
import { isPaused, checkRateLimit, setBotExpectation } from './redisService';
import { sendMessage } from './whatsappService';

const prisma = new PrismaClient();

/**
 * Ponto de entrada central para mensagens recebidas (Evolution ou Meta)
 */
export async function processIncomingMessage(params: {
  merchantId: string;
  sender: string;
  text: string;
  apiType: 'EVOLUTION' | 'META';
  instanceId?: string;
}) {
  const { merchantId, sender, text, apiType, instanceId } = params;

  try {
    // 1. Retrieve Merchant Context
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      include: { 
        knowledgeBase: true,
        reseller: true,
        niche: true,
        plan: true
      }
    });

    if (!merchant) {
      console.warn(`[AI-ORCHESTRATOR] Merchant not found: ${merchantId}`);
      return null;
    }

    // 1.1. Check Handoff (Smart Pause)
    const paused = await isPaused(merchant.id, sender);
    if (paused) {
      console.log(`[AI-ORCHESTRATOR] Merchant ${merchant.id} is in handoff mode for ${sender}. AI paused.`);
      return null;
    }

    // 1.2. Check Rate Limit (Anti-Loop)
    const underLimit = await checkRateLimit(merchant.id, sender, 5);
    if (!underLimit) {
      console.warn(`[AI-ORCHESTRATOR] Rate limit exceeded for ${sender}. Anti-loop triggered.`);
      return null;
    }

    // 2. Check Subscription Status
    const isAdminMerchant = merchant.resellerId === 'admin-id-000';
    if (!isAdminMerchant && merchant.status !== 'active' && merchant.status !== 'trial') {
      return null;
    }

    // 2.1. Check Trial Expiration
    const m = merchant as any;
    if (!isAdminMerchant && m.status === 'trial' && m.trialEndsAt && new Date() > m.trialEndsAt) {
      await prisma.merchant.update({
        where: { id: m.id },
        data: { status: 'suspended' }
      });
      return null;
    }

    // 2.2. Check Token Quota
    const tokenQuota = merchant.plan?.tokenLimit || merchant.tokenQuota;
    if (!isAdminMerchant && merchant.tokenUsage >= tokenQuota) {
      await sendMessage({
        merchantId: merchant.id,
        to: sender,
        text: "Seu limite mensal de mensagens foi atingido. Entre em contato com o suporte para fazer um upgrade."
      });
      return null;
    }

    // 3. Retrieve History (Last 5 messages)
    const history = await prisma.interactionLog.findMany({
      where: { merchantId: merchant.id, sender: sender },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const historyContext = history.reverse().map(log => `Cliente: ${log.question}\nIA: ${log.answer}`).join('\n');

    // 4. Retrieve & Merge Prompts
    const adminGlobalPrompt = "Você é um assistente virtual de elite focado em conversão e atendimento humanizado.";
    const resellerInstruction = merchant.reseller?.status === 'active' 
      ? `DIRETRIZ DO PROVEDOR (${merchant.reseller.name}): Siga as normas de excelência regional.` 
      : "";
    
    const nichePrompt = merchant.niche?.basePrompt || "";
    const aiConfig = merchant.aiConfig as any || {};
    const merchantPrompt = aiConfig.prompt || nichePrompt || "Atenda o cliente com educação e agilidade.";
    
    // 5. Knowledge Base
    let knowledgeBaseContent = merchant.knowledgeBase.map(kb => kb.content).join('\n');
    const isKbEmpty = !knowledgeBaseContent.trim();
    
    if (knowledgeBaseContent.length > 4000) {
      knowledgeBaseContent = knowledgeBaseContent.substring(0, 4000) + "... [CONTEÚDO TRUNCADO]";
    }

    // 6. Construct the "Super Prompt"
    const mindset = (merchant as any).mindset || 'GROUNDING';
    const activeModules = (merchant as any).activeModules || ['ESSENTIAL'];

    const mindsetInstruction = mindset === 'GROUNDING'
      ? `MODO ESTRITO (GROUNDING): Use APENAS as informações da base de conhecimento. Se a informação não estiver lá, diga educadamente que não sabe e peça para aguardar um humano. NUNCA INVENTE NADA.`
      : `MODO CONSULTOR: Use a base de conhecimento como fonte primária, mas sinta-se à vontade para usar sua inteligência para sugerir soluções criativas.`;

    // Regra de Não Banimento (Específica para Meta se necessário, mas boa para todos)
    const antiBanInstruction = apiType === 'META' 
      ? "REGRAS META: Evite mensagens excessivamente longas, não envie links suspeitos e mantenha um tom profissional para evitar denúncias de spam."
      : "";

    const systemInstruction = `
      ${adminGlobalPrompt}
      ${resellerInstruction}
      ${antiBanInstruction}
      
      CONTEXTO DO LOJISTA (${merchant.name}):
      ${merchantPrompt}
      
      BASE DE CONHECIMENTO (RAG):
      ${isKbEmpty ? '[VAZIA]' : knowledgeBaseContent}
      
      HISTÓRICO DE CONVERSA:
      ${historyContext}
      
      INSTRUÇÃO FINAL: 
      - Responda de forma natural, curta e objetiva.
      - ${isKbEmpty ? "Base vazia: Diga que não possui a informação e peça para aguardar um humano." : mindsetInstruction}
    `;

    // 7. AI Generation
    const apiKey = await rotateApiKey();
    let model = 'gemini-flash-lite-latest';
    if (activeModules.includes('ELITE')) model = 'gemini-3.1-pro-preview';
    else if (activeModules.includes('SALES_PRO')) model = 'gemini-3-flash-preview';

    let responseText = await callUniversalAI(systemInstruction, text, apiKey, model);

    if (responseText) {
      const tokensUsed = Math.ceil((text.length + responseText.length + systemInstruction.length) / 4);
      
      await prisma.interactionLog.create({
        data: {
          merchantId: merchant.id,
          sender: sender,
          question: text,
          answer: responseText,
          tokensUsed: tokensUsed
        }
      });

      await prisma.merchant.update({
        where: { id: merchant.id },
        data: { tokenUsage: { increment: tokensUsed } } as any
      });

      // 8. Enviar resposta via WhatsApp
      if (apiType === 'EVOLUTION' && instanceId) {
        await setBotExpectation(instanceId, sender);
      }

      await sendMessage({
        merchantId: merchant.id,
        to: sender,
        text: responseText
      });
    }

    return responseText;

  } catch (error) {
    console.error('[AI-ORCHESTRATOR] Error:', error);
    return null;
  }
}

export async function callUniversalAI(systemInstruction: string, userMessage: string, apiKey: string, modelOverride?: string): Promise<string | null> {
  try {
    // 1. Detect Provider
    if (apiKey.startsWith('sk-ant-')) {
      // Anthropic (Claude)
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: modelOverride || 'claude-3-5-sonnet-20240620',
          max_tokens: 1024,
          system: systemInstruction,
          messages: [{ role: 'user', content: userMessage }]
        })
      });
      const data = await response.json();
      return data.content[0].text;
    } 
    
    if (apiKey.startsWith('sk-')) {
      // OpenAI / DeepSeek / Groq (OpenAI Compatible)
      const isDeepSeek = apiKey.includes('ds-'); // Hypothetical check or just use OpenAI structure
      const baseUrl = isDeepSeek ? 'https://api.deepseek.com/v1' : 'https://api.openai.com/v1';
      
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelOverride || (isDeepSeek ? 'deepseek-chat' : 'gpt-4o-mini'),
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userMessage }
          ]
        })
      });
      const data = await response.json();
      return data.choices[0].message.content;
    }

    // Default: Gemini
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelOverride || 'gemini-flash-lite-latest',
      contents: userMessage,
      config: {
        systemInstruction,
        maxOutputTokens: 400,
        temperature: 0.3,
      }
    });
    return response.text || null;

  } catch (error: any) {
    console.error('[UNIVERSAL-AI] Error:', error);
    
    // Handle 429 Rate Limit
    if (error.status === 429 || error.message?.includes('429')) {
      console.warn('[SECURITY] Gemini API Rate Limit (429) reached. Rotating key or failing gracefully.');
      return "Estou processando muitas mensagens agora. Por favor, tente novamente em um minuto.";
    }
    
    return null;
  }
}

async function rotateApiKey() {
  const keyRecord = await prisma.aiKey.findFirst({
    where: { status: 'active' },
    orderBy: { lastUsed: 'asc' }
  });

  if (!keyRecord) {
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
    throw new Error('No active AI keys found in database or environment');
  }

  await prisma.aiKey.update({
    where: { id: keyRecord.id },
    data: { 
      usageCount: { increment: 1 },
      lastUsed: new Date()
    }
  });

  return keyRecord.key;
}

async function sendWhatsAppMessage(instance: string, to: string, text: string, apiKey?: string | null) {
  const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://192.168.88.6:8080';
  const globalApiKey = process.env.EVOLUTION_API_KEY;
  
  try {
    const response = await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey || globalApiKey || ''
      },
      body: JSON.stringify({
        number: to,
        options: { delay: 1000, presence: 'composing' },
        text: text
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[EVOLUTION] API Error: ${response.status} - ${errorData}`);
    } else {
      console.log(`[EVOLUTION] Message sent to ${to} via ${instance}`);
    }
  } catch (e) {
    console.error(`[EVOLUTION] Fetch failed:`, e);
  }
}
