import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SendMessageParams {
  merchantId: string;
  to: string;
  text: string;
}

/**
 * Envia uma mensagem para o cliente usando o motor configurado para o lojista (Evolution ou Meta).
 */
export async function sendMessage(params: SendMessageParams) {
  const { merchantId, to, text } = params;

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId }
  });

  if (!merchant) throw new Error("Lojista não encontrado.");

  // Limpeza do número (remover caracteres não numéricos)
  const cleanPhone = to.replace(/\D/g, '');

  if (merchant.whatsappApiType === 'META') {
    return sendViaMeta(merchant, cleanPhone, text);
  } else {
    return sendViaEvolution(merchant, cleanPhone, text);
  }
}

/**
 * Envio via WhatsApp Business API (Meta Oficial)
 */
async function sendViaMeta(merchant: any, to: string, text: string) {
  if (!merchant.metaAccessToken || !merchant.metaPhoneNumberId) {
    throw new Error("Configurações da Meta API incompletas.");
  }

  const url = `https://graph.facebook.com/v21.0/${merchant.metaPhoneNumberId}/messages`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${merchant.metaAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: "text",
      text: { body: text }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("[META API ERROR]", error);
    throw new Error(`Erro Meta API: ${error.error?.message || 'Erro desconhecido'}`);
  }

  return response.json();
}

/**
 * Envio via Evolution API (Instâncias)
 */
async function sendViaEvolution(merchant: any, to: string, text: string) {
  if (!merchant.evolutionInstance) {
    throw new Error("Nenhuma instância Evolution conectada.");
  }

  const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://192.168.88.6:8080';
  const apiKey = process.env.EVOLUTION_API_KEY;

  const response = await fetch(`${evolutionUrl}/message/sendText/${merchant.evolutionInstance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': apiKey || ''
    },
    body: JSON.stringify({
      number: to,
      options: {
        delay: 1200,
        presence: "composing",
        linkPreview: false
      },
      textMessage: {
        text: text
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[EVOLUTION API ERROR]", error);
    throw new Error(`Erro Evolution API: ${error}`);
  }

  return response.json();
}
