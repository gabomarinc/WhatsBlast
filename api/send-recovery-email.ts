import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Faltan datos requeridos (email o código)' });
  }

  // 1. Check if SMTP configuration is present
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || '587';
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || `"WhatsBlast" <somos@konsul.digital>`;

  // 2. Check if Resend API Key is present
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFrom = process.env.RESEND_FROM || smtpFrom;

  const emailSubject = 'Código de recuperación de contraseña - WhatsBlast';
  const emailHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; margin-bottom: 16px;">Recuperación de Contraseña</h2>
      <p style="font-size: 16px; color: #374151; line-height: 1.5;">
        Has solicitado restablecer tu contraseña en <strong>WhatsBlast</strong>. Utiliza el siguiente código de seguridad de 4 dígitos para continuar:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <span style="font-size: 32px; font-weight: 800; tracking-widest: 4px; color: #4f46e5; background-color: #f3f4f6; padding: 12px 24px; border-radius: 8px; letter-spacing: 6px; display: inline-block;">
          ${code}
        </span>
      </div>
      <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">
        Este código expirará en 15 minutos por razones de seguridad. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
      </p>
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">
        WhatsBlast &copy; ${new Date().getFullYear()} - Todos los derechos reservados.
      </p>
    </div>
  `;

  // Option A: Use Resend API
  if (resendApiKey) {
    try {
      console.log('Sending recovery email via Resend API...');
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [email],
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (response.ok) {
        return res.status(200).json({ success: true, simulated: false, provider: 'resend' });
      } else {
        const errorData = await response.json();
        console.error('Error from Resend API:', errorData);
        throw new Error(errorData.message || 'Resend API failed');
      }
    } catch (err: any) {
      console.error('Failed to send email via Resend, falling back or returning error:', err);
      return res.status(500).json({ error: `Error enviando correo a través de Resend: ${err.message}` });
    }
  }

  // Option B: Use Nodemailer SMTP
  if (smtpHost && smtpUser && smtpPass) {
    try {
      console.log(`Sending recovery email via SMTP (${smtpHost})...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort, 10),
        secure: smtpPort === '465' || process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to: email,
        subject: emailSubject,
        html: emailHtml,
      });

      return res.status(200).json({ success: true, simulated: false, provider: 'smtp' });
    } catch (err: any) {
      console.error('Failed to send email via SMTP:', err);
      return res.status(500).json({ error: `Error enviando correo a través de SMTP: ${err.message}` });
    }
  }

  // Fallback / Simulation Mode
  console.log(`[SIMULACIÓN DE ENVÍO] Correo de recuperación para ${email} con código ${code}`);
  return res.status(200).json({
    success: true,
    simulated: true,
    message: 'Servicio de correo no configurado. Se muestra simulación.',
  });
}
