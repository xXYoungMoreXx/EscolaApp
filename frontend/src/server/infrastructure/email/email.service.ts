import nodemailer, { type Transporter } from 'nodemailer';
import { logger } from '../../shared/logger';

/**
 * EmailService (esqueleto — Mautic Fase 0).
 * Sem SMTP configurado, não envia nada: registra aviso e retorna false,
 * para o fluxo do chamador nunca falhar por falta de email.
 * Integração real com Mautic (campanhas/listas) entra nas fases seguintes —
 * esta é a fronteira de infraestrutura onde o transporte vive.
 */
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!smtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
    });
  }
  return transporter;
}

export const emailService = {
  async send(message: EmailMessage): Promise<boolean> {
    if (!smtpConfigured()) {
      logger.warn(
        { to: message.to, subject: message.subject },
        'Email não enviado — SMTP_HOST/SMTP_PORT não configurados',
      );
      return false;
    }
    try {
      const transport = getTransporter();
      if (!transport) return false;
      await transport.sendMail({
        from: process.env.SMTP_FROM || 'nao-responda@escola.app',
        ...message,
      });
      logger.info({ to: message.to, subject: message.subject }, 'Email enviado');
      return true;
    } catch (error) {
      logger.error({ err: error, to: message.to }, 'Falha ao enviar email');
      return false;
    }
  },
};
