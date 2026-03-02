import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { processIncomingMessage } from '../services/aiOrchestrator';

const prisma = new PrismaClient();

/**
 * Validação do Webhook (Meta exige um GET para verificar o token)
 */
export const verifyMetaWebhook = async (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Precisamos encontrar o lojista que possui este verifyToken
  // Ou usar um token global definido no .env para simplificar o setup inicial
  const globalVerifyToken = process.env.META_VERIFY_TOKEN || 'saaswpp_verify_token';

  if (mode === 'subscribe' && token === globalVerifyToken) {
    console.log("[META] Webhook verificado com sucesso.");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

/**
 * Recebimento de Mensagens da Meta
 */
export const handleMetaWebhook = async (req: Request, res: Response) => {
  const body = req.body;

  if (body.object === 'whatsapp_business_account') {
    try {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.value.messages) {
            for (const message of change.value.messages) {
              const phone = message.from;
              const text = message.text?.body;
              const wabaId = entry.id; // ID da conta comercial
              const phoneNumberId = change.value.metadata.phone_number_id;

              if (text) {
                // Localizar o lojista pelo Phone Number ID ou WABA ID
                const merchant = await prisma.merchant.findFirst({
                  where: {
                    metaPhoneNumberId: phoneNumberId,
                    whatsappApiType: 'META'
                  }
                });

                if (merchant) {
                  console.log(`[META] Mensagem de ${phone} para lojista ${merchant.name}`);
                  
                  // Orquestrar resposta da IA
                  // Note: processIncomingMessage deve ser adaptado para aceitar o motor correto
                  await processIncomingMessage({
                    merchantId: merchant.id,
                    sender: phone,
                    text: text,
                    apiType: 'META'
                  });
                }
              }
            }
          }
        }
      }
      return res.sendStatus(200);
    } catch (error) {
      console.error("[META WEBHOOK ERROR]", error);
      return res.sendStatus(500);
    }
  }

  return res.sendStatus(404);
};
