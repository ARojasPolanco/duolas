import { Resend } from 'resend';
import { envs, appUrl } from '../enviroments.js';
import logger from '../logger.js';

const mailEnabled = Boolean(envs.RESEND_API_KEY) && envs.NODE_ENV !== 'test';
const resend = mailEnabled ? new Resend(envs.RESEND_API_KEY) : null;
const from = envs.OWNER_EMAIL || 'onboarding@resend.dev';
const support = envs.SUPPORT_EMAIL || 'soporte@duolas.app';

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (character) => HTML_ESCAPES[character]);

const layout = (title, preheader, body) => `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;padding:0;background:#030407;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#060b14;border:1px solid #1558c9;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 0;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:24px;font-weight:800;letter-spacing:-0.4px;color:#f4f7fb;">
                Duo<span style="color:#b0cf5c;">LAS</span>
                <span style="display:inline-block;margin-left:8px;padding:3px 7px;border:1px solid #b0cf5c;border-radius:999px;font-size:9px;font-weight:700;letter-spacing:1.5px;line-height:1.4;color:#b0cf5c;vertical-align:middle;">
                  BETA
                </span>
              </div>
              <div style="padding-top:4px;font-size:12px;color:#94a3b8;">
                Encontrá tu duo en LAS · Beta
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-family:Arial,Helvetica,sans-serif;color:#f4f7fb;">
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#f4f7fb;">
                ${title}
              </h1>
              ${body}
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #1558c9;padding:18px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#94a3b8;">
              ¿Dudas? Escribinos a ${escapeHtml(support)}.<br />
              Duo LAS no está avalado por Riot Games. ·
              <a href="${escapeHtml(appUrl)}" style="color:#b0cf5c;text-decoration:none;">duolas.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

const paragraph = (text) =>
  `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#cbd5e1;">${text}</p>`;

const button = (url, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td align="center" style="border-radius:8px;background:#b0cf5c;">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 26px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;line-height:1;color:#030407;text-decoration:none;border-radius:8px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>
`;

const fallbackLink = (url) => `
  <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#94a3b8;word-break:break-all;">
    Si el botón no funciona, copiá este enlace:<br />
    <a href="${escapeHtml(url)}" style="color:#b0cf5c;text-decoration:underline;">${escapeHtml(url)}</a>
  </p>
`;

const note = (text) =>
  `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#94a3b8;">${text}</p>`;

export class MailService {
  async #send(payload) {
    try {
      const { data, error } = await resend.emails.send(payload);

      if (error) {
        logger.error('Resend rechazó el email', {
          name: error.name,
          message: error.message,
        });
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error inesperado al enviar email', { message: error.message });
      return null;
    }
  }

  async sendVerificationEmail(to, token) {
    if (!resend) {
      logger.info('Email de verificación omitido: Resend no está habilitado', { to: '[email]' });
      return null;
    }

    const url = `${appUrl}/verify-email?token=${token}`;

    return this.#send({
      from,
      to,
      replyTo: support,
      subject: 'Verificá tu email - Duo LAS',
      text: `Verificá tu email en Duo LAS: ${url}\n\nEl enlace vence en 24 horas. Si no creaste una cuenta, ignorá este mensaje.`,
      html: layout(
        'Verificá tu email',
        'Confirmá tu email para activar las funciones sociales de Duo LAS.',
        `
          ${paragraph('Estás a un paso de entrar a Duo LAS. Confirmá que este email es tuyo para activar tu perfil y empezar a buscar duo.')}
          ${button(url, 'Verificar mi email')}
          ${fallbackLink(url)}
          ${note('El enlace vence en 24 horas y solo puede usarse una vez. Si no creaste una cuenta, ignorá este mensaje.')}
        `
      ),
    });
  }

  async sendPasswordResetEmail(to, token) {
    if (!resend) {
      logger.info('Email de reset omitido: Resend no está habilitado', { to: '[email]' });
      return null;
    }

    const url = `${appUrl}/reset-password?token=${token}`;

    return this.#send({
      from,
      to,
      replyTo: support,
      subject: 'Restablecé tu contraseña - Duo LAS',
      text: `Restablecé tu contraseña en Duo LAS: ${url}\n\nEl enlace vence en 1 hora y solo puede usarse una vez. Si no lo pediste, ignorá este mensaje.`,
      html: layout(
        'Restablecé tu contraseña',
        'Recibimos un pedido para restablecer tu contraseña de Duo LAS.',
        `
          ${paragraph('Recibimos un pedido para restablecer tu contraseña. Si fuiste vos, elegí una nueva.')}
          ${button(url, 'Restablecer mi contraseña')}
          ${fallbackLink(url)}
          ${note('El enlace vence en 1 hora y solo puede usarse una vez. Si no lo pediste, ignorá este mensaje.')}
        `
      ),
    });
  }

  async sendSuspensionEmail(to, reason, suspendedUntil) {
    if (!resend) {
      logger.info('Email de suspensión omitido: Resend no está habilitado', { to: '[email]' });
      return null;
    }

    const untilText = suspendedUntil
      ? `Hasta el ${new Intl.DateTimeFormat('es-AR', {
          dateStyle: 'long',
          timeZone: 'America/Argentina/Buenos_Aires',
        }).format(new Date(suspendedUntil))}.`
      : 'La suspensión es permanente.';

    return this.#send({
      from,
      to,
      replyTo: support,
      subject: 'Tu cuenta fue suspendida - Duo LAS',
      text: `Tu cuenta de Duo LAS fue suspendida. Motivo: ${reason}. ${untilText}\n\nSi creés que fue un error, escribinos a ${support}.`,
      html: layout(
        'Tu cuenta fue suspendida',
        'Información sobre la suspensión de tu cuenta de Duo LAS.',
        `
          ${paragraph('Tu cuenta de Duo LAS fue suspendida por moderación.')}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;border:1px solid #1558c9;border-radius:10px;background:#030407;">
            <tr>
              <td style="padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#cbd5e1;">
                <strong style="color:#f4f7fb;">Motivo:</strong> ${escapeHtml(reason)}<br />
                <strong style="color:#f4f7fb;">Duración:</strong> ${untilText}
              </td>
            </tr>
          </table>
          ${paragraph(`Si creés que fue un error, escribinos a ${escapeHtml(support)}.`)}
        `
      ),
    });
  }
}

export const mailService = new MailService();
