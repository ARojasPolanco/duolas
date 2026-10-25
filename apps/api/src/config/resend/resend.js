import { Resend } from 'resend';
import { envs, appUrl } from '../enviroments.js';
import logger from '../logger.js';

const resend = envs.RESEND_API_KEY ? new Resend(envs.RESEND_API_KEY) : null;
const from = envs.OWNER_EMAIL || 'onboarding@resend.dev';
const support = envs.SUPPORT_EMAIL || 'soporte@duolas.app';

const layout = (title, body) => `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
    <div style="background: #0b1220; border-radius: 12px; padding: 24px; text-align: center;">
      <h1 style="color: #00c2b8; margin: 0; font-size: 28px;">Duo LAS</h1>
      <p style="color: #94a3b8; margin: 8px 0 0; font-size: 13px;">Encontrá tu duo en LAS</p>
    </div>
    <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 12px 12px; padding: 28px;">
      <h2 style="color: #0f172a; margin: 0 0 12px; font-size: 22px;">${title}</h2>
      ${body}
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        ¿Dudas? Escribinos a ${support}. Duo LAS no está avalado por Riot Games.
      </p>
    </div>
  </div>
`;

export class MailService {
  async sendVerificationEmail(to, token) {
    if (!resend) {
      logger.info('Email de verificación omitido: falta RESEND_API_KEY', { to: '[email]' });
      return null;
    }

    const url = `${appUrl}/verify-email?token=${token}`;

    return resend.emails.send({
      from,
      to,
      subject: 'Verificá tu email - Duo LAS',
      text: `Verificá tu email en Duo LAS: ${url}`,
      html: layout(
        'Verificá tu email',
        `
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Estás a un paso de entrar a Duo LAS. Confirmá que este email es tuyo para activar las
            funciones sociales.
          </p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${url}" style="display: inline-block; background: #00c2b8; color: #0b1220; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Verificar mi email
            </a>
          </p>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; word-break: break-all;">
            ${url}
          </p>
          <p style="color: #9ca3af; font-size: 12px;">El enlace vence en 24 horas.</p>
        `
      ),
    });
  }

  async sendPasswordResetEmail(to, token) {
    if (!resend) {
      logger.info('Email de reset omitido: falta RESEND_API_KEY', { to: '[email]' });
      return null;
    }

    const url = `${appUrl}/reset-password?token=${token}`;

    return resend.emails.send({
      from,
      to,
      subject: 'Restablecé tu contraseña - Duo LAS',
      text: `Restablecé tu contraseña en Duo LAS: ${url}`,
      html: layout(
        'Restablecer contraseña',
        `
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
            Recibimos un pedido para restablecer tu contraseña. Si fuiste vos, elegí una nueva.
          </p>
          <p style="text-align: center; margin: 28px 0;">
            <a href="${url}" style="display: inline-block; background: #00c2b8; color: #0b1220; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              Restablecer mi contraseña
            </a>
          </p>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; word-break: break-all;">
            ${url}
          </p>
          <p style="color: #9ca3af; font-size: 12px;">
            El enlace vence en 1 hora y solo puede usarse una vez. Si no lo pediste, ignorá este mensaje.
          </p>
        `
      ),
    });
  }
}

export const mailService = new MailService();
