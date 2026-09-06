import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function validateForm(data: ContactFormData): string[] {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.subject || data.subject.trim().length < 5) {
    errors.push('Subject must be at least 5 characters');
  }

  if (!data.message || data.message.trim().length < 20) {
    errors.push('Message must be at least 20 characters');
  }

  return errors;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, message } = req.body as ContactFormData;
  const errors = validateForm({ name, email, subject, message });

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const emailContent = `
New contact form submission from DEEPSIX portfolio:

Name: ${name}
Email: ${email}
Subject: ${subject}
Message:
${message}

---
Submitted at: ${new Date().toISOString()}
User Agent: ${req.headers['user-agent'] || 'unknown'}
  `.trim();

  try {
    if (process.env.SENDGRID_API_KEY && process.env.CONTACT_EMAIL) {
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.default.send({
        to: process.env.CONTACT_EMAIL,
        from: process.env.CONTACT_EMAIL,
        subject: `DEEPSIX Portfolio: ${subject}`,
        text: emailContent,
        html: emailContent.replace(/\n/g, '<br>'),
      });
    } else {
      console.log('Contact form submission:', { name, email, subject, message });
    }

    return res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
}