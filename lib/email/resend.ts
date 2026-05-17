import { Resend } from 'resend';

export interface SendAccessCodeArgs {
  to: string;
  token: string;
  expiresAt: Date;
}

function getClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set.');
  return new Resend(key);
}

function getFrom(): string {
  return process.env.RESEND_FROM || 'Aula <acceso@aula.mx>';
}

function getBaseUrl(): string {
  return process.env.APP_BASE_URL || 'http://localhost:3000';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export async function sendAccessCodeEmail(args: SendAccessCodeArgs): Promise<void> {
  const baseUrl = getBaseUrl();
  const deepLink = `${baseUrl}/acceso?code=${encodeURIComponent(args.token)}`;
  const expires = formatDate(args.expiresAt);

  const html = `<!DOCTYPE html>
<html lang="es">
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f7f7fb;margin:0;padding:24px;color:#1a1a2e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e8e8ef;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="padding:32px 32px 16px 32px;">
        <h1 style="font-size:22px;margin:0 0 8px 0;">¡Bienvenido a Aula!</h1>
        <p style="margin:0;color:#5a5a72;font-size:15px;line-height:1.5;">
          Tu suscripción Pro está activa. Usa el botón de abajo para entrar a la app y generar tus clases.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 32px 24px 32px;">
        <a href="${deepLink}" style="display:inline-block;background:#5b21b6;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:10px;font-size:15px;">
          Activar mi acceso
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 24px 32px;">
        <p style="margin:0 0 8px 0;color:#5a5a72;font-size:13px;">Si el botón no funciona, copia y pega este código en la pantalla de "Ingresa tu código":</p>
        <pre style="background:#f4f4f8;border:1px solid #e8e8ef;border-radius:8px;padding:12px;font-size:11px;overflow:auto;word-break:break-all;white-space:pre-wrap;margin:0;">${args.token}</pre>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px 32px;border-top:1px solid #e8e8ef;">
        <p style="margin:16px 0 4px 0;color:#5a5a72;font-size:13px;">
          <strong>Vigencia del código:</strong> hasta el ${expires}.
        </p>
        <p style="margin:4px 0 0 0;color:#5a5a72;font-size:13px;">
          Cuando se renueve tu suscripción, te enviaremos un nuevo código automáticamente.
        </p>
        <p style="margin:16px 0 0 0;color:#9090a8;font-size:12px;">
          ¿Necesitas ayuda? Responde a este correo y te asistimos.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Bienvenido a Aula.

Tu suscripción Pro está activa. Activa tu acceso aquí:
${deepLink}

O copia este código en la pantalla "Ingresa tu código":

${args.token}

Vigencia: hasta el ${expires}.

Cuando se renueve tu suscripción, te enviaremos un nuevo código automáticamente.`;

  const client = getClient();
  const { error } = await client.emails.send({
    from: getFrom(),
    to: args.to,
    subject: 'Tu acceso a Aula está listo',
    html,
    text,
  });
  if (error) {
    throw new Error(`Resend error: ${error.message ?? JSON.stringify(error)}`);
  }
}
