const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

const RATE_LIMIT_WINDOW_MS = Number.isFinite(Number(process.env.CONTACT_FORM_RATE_LIMIT_WINDOW_MS))
  ? Number(process.env.CONTACT_FORM_RATE_LIMIT_WINDOW_MS)
  : 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = Number.isFinite(Number(process.env.CONTACT_FORM_RATE_LIMIT_MAX_REQUESTS))
  ? Number(process.env.CONTACT_FORM_RATE_LIMIT_MAX_REQUESTS)
  : 5;
const SAFE_RATE_LIMIT_WINDOW_MS = Math.max(1000, Math.floor(RATE_LIMIT_WINDOW_MS));
const SAFE_RATE_LIMIT_MAX_REQUESTS = Math.max(1, Math.floor(RATE_LIMIT_MAX_REQUESTS));
const MAX_REQUEST_BODY_BYTES = Number.isFinite(Number(process.env.CONTACT_FORM_MAX_BODY_BYTES))
  ? Math.max(1024, Math.floor(Number(process.env.CONTACT_FORM_MAX_BODY_BYTES)))
  : 16 * 1024;
const rateLimitStore = new Map();

const SERVICE_LABELS = {
  start: 'Start (AI Training)',
  growth: 'Growth (MVP Development)',
  scale: 'Scale (AI Business Transformation)'
};
const SERVICE_LABELS_UK = {
  start: 'Старт (Навчання по АІ)',
  growth: 'Ріст (Розробка MVP)',
  scale: 'Масштаб (АІ трансформація бізнесу)'
};
const CHECKLIST_FILE_NAME = 'AI_Readiness_Checklist_Latwo.pdf';
const CHECKLIST_FILE_PATH = path.join(process.cwd(), 'files', 'ai-readiness-checklist-latwo.pdf');
const DEFAULT_SITE_URL = 'https://latwo.eu';
const LINKEDIN_URL = 'https://www.linkedin.com/company/latwo-ai-consulting/';
const INSTAGRAM_URL = 'https://www.instagram.com/latwo.aiconsulting?igsh=OTBqMGtrdnpoMXRp';

function setJsonHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function trimString(value, max = 4000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function normalizeSiteUrl(value) {
  const url = trimString(value, 300) || DEFAULT_SITE_URL;
  return url.replace(/\/+$/, '');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeMessagePreview(value, max = 600) {
  const cleaned = trimString(value, 4000)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\n{3,}/g, '\n\n');
  const chars = Array.from(cleaned);
  if (chars.length <= max) return cleaned;
  return `${chars.slice(0, max).join('').trimEnd()}...`;
}

function validatePayload(payload) {
  const name = trimString(payload?.name, 120);
  const email = trimString(payload?.email, 160).toLowerCase();
  const company = trimString(payload?.company, 160);
  const service = trimString(payload?.service, 40);
  const message = trimString(payload?.message, 4000);
  const discoveryCall = Boolean(payload?.discovery_call);
  const website = trimString(payload?.website, 200);
  const formStartedAt = Number(payload?.form_started_at || 0);
  const consentId = trimString(payload?.consent_id, 120);
  const consentVersion = trimString(payload?.consent_version, 60);
  const consentTimestamp = trimString(payload?.consent_timestamp, 60);
  const consentSource = trimString(payload?.consent_source, 80);
  const consentSnapshotRaw = trimString(payload?.consent_snapshot, 1000);
  const lang = trimString(payload?.lang, 8).toLowerCase();

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!name || name.length < 2) return { error: 'invalid-name' };
  if (!emailOk) return { error: 'invalid-email' };
  if (!service || !SERVICE_LABELS[service]) return { error: 'invalid-service' };
  if (!message || message.length < 10) return { error: 'invalid-message' };

  let consentSnapshot = null;
  if (consentSnapshotRaw) {
    try {
      const parsed = JSON.parse(consentSnapshotRaw);
      if (parsed && typeof parsed === 'object') {
        consentSnapshot = {
          essential: parsed.essential === true,
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing)
        };
      }
    } catch (_error) {
      consentSnapshot = null;
    }
  }

  const consent = (consentId && consentVersion && consentTimestamp)
    ? {
        id: consentId,
        version: consentVersion,
        timestamp: consentTimestamp,
        source: consentSource || '',
        snapshot: consentSnapshot
      }
    : null;

  return {
    data: {
      name,
      email,
      company,
      service,
      serviceLabel: SERVICE_LABELS[service],
      serviceLabelUk: SERVICE_LABELS_UK[service],
      message,
      discoveryCall,
      website,
      formStartedAt,
      lang: lang === 'en' ? 'en' : 'uk',
      consent
    }
  };
}

function checkRateLimit(ip) {
  const now = Date.now();
  const current = rateLimitStore.get(ip) || [];
  const recent = current.filter((ts) => now - ts < SAFE_RATE_LIMIT_WINDOW_MS);

  if (recent.length >= SAFE_RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(ip, recent);
    return false;
  }

  recent.push(now);
  rateLimitStore.set(ip, recent);
  return true;
}

function parseHostHeader(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim().toLowerCase();
  return host.split(',')[0].trim();
}

function isCrossSiteRequest(req) {
  const secFetchSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  return secFetchSite === 'cross-site';
}

function isOriginAllowed(req) {
  const origin = String(req.headers.origin || '').trim();
  if (!origin || origin === 'null') return true;

  let originHost = '';
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch (_error) {
    return false;
  }

  const requestHost = parseHostHeader(req);
  if (!requestHost) return false;

  return originHost === requestHost;
}

function getPayloadBytes(payload) {
  try {
    return Buffer.byteLength(JSON.stringify(payload || {}), 'utf8');
  } catch (_error) {
    return Number.POSITIVE_INFINITY;
  }
}

async function sendWithResend(payload) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_FORM_TO_EMAIL || 'latwo.eu@gmail.com';
  const fromEmail = process.env.CONTACT_FORM_FROM_EMAIL;
  const subjectPrefix = process.env.CONTACT_FORM_SUBJECT_PREFIX || 'Latwo';

  if (!resendApiKey) {
    throw new Error('missing-RESEND_API_KEY');
  }
  if (!fromEmail) {
    throw new Error('missing-CONTACT_FORM_FROM_EMAIL');
  }

  const submittedAt = new Date().toISOString();
  const subject = `[${subjectPrefix}] Нова заявка: ${payload.name}`;
  const replyTo = payload.email;
  const discoveryLabel = payload.discoveryCall ? 'Так' : 'Ні';
  const consentLine = payload.consent
    ? `id=${payload.consent.id}; version=${payload.consent.version}; timestamp=${payload.consent.timestamp}; source=${payload.consent.source || '-'}; choices=${payload.consent.snapshot ? JSON.stringify(payload.consent.snapshot) : '-'}`
    : 'не надано';

  const text = [
    'Нова заявка з контактної форми Latwo',
    '',
    `Ім'я: ${payload.name}`,
    `Email: ${payload.email}`,
    `Компанія: ${payload.company || '-'}`,
    `Послуга: ${payload.serviceLabel}`,
    `Безкоштовна консультація: ${discoveryLabel}`,
    '',
    'Повідомлення:',
    payload.message,
    '',
    'Cookie consent:',
    consentLine,
    '',
    `Дата: ${submittedAt}`
  ].join('\n');

  const html = `
    <h2>Нова заявка з контактної форми Latwo</h2>
    <p><strong>Ім'я:</strong> ${escapeHtml(payload.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Компанія:</strong> ${escapeHtml(payload.company || '-')}</p>
    <p><strong>Послуга:</strong> ${escapeHtml(payload.serviceLabel)}</p>
    <p><strong>Безкоштовна консультація:</strong> ${escapeHtml(discoveryLabel)}</p>
    <p><strong>Повідомлення:</strong></p>
    <p style="white-space:pre-wrap;">${escapeHtml(payload.message)}</p>
    <p><strong>Cookie consent:</strong> ${escapeHtml(consentLine)}</p>
    <hr />
    <p><small>Дата: ${escapeHtml(submittedAt)}</small></p>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': randomUUID()
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject,
      reply_to: [replyTo],
      text,
      html
    })
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`resend-error:${response.status}:${raw}`);
  }
}

async function sendChecklistAutoReply(payload) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FORM_FROM_EMAIL;
  const replyToEmail = process.env.CONTACT_FORM_REPLY_TO_EMAIL
    || process.env.CONTACT_FORM_TO_EMAIL
    || 'latwo.eu@gmail.com';
  const siteUrl = normalizeSiteUrl(process.env.CONTACT_FORM_SITE_URL);
  const checklistUrl = `${siteUrl}/files/ai-readiness-checklist-latwo.pdf`;

  if (!resendApiKey) {
    throw new Error('missing-RESEND_API_KEY');
  }
  if (!fromEmail) {
    throw new Error('missing-CONTACT_FORM_FROM_EMAIL');
  }

  const messagePreview = sanitizeMessagePreview(payload.message);
  const escapedName = escapeHtml(payload.name);
  const escapedMessage = escapeHtml(messagePreview).replace(/\n/g, '<br />');
  const autoReplyServiceLabel = payload.serviceLabelUk || payload.serviceLabel;
  const escapedService = escapeHtml(autoReplyServiceLabel);
  const attachment = fs.readFileSync(CHECKLIST_FILE_PATH).toString('base64');

  const subject = 'Ваш AI Readiness Checklist всередині';
  const text = [
    `Вітаю, ${payload.name}!`,
    '',
    'Дякуємо за звернення до Latwo.',
    '',
    'Ми отримали ваш запит:',
    '',
    `"${messagePreview}"`,
    '',
    'Команда вже опрацьовує його, і найближчим часом з вами зв’яжеться менеджер.',
    '',
    'Також надсилаємо вам AI Readiness Checklist — короткий практичний матеріал, який допоможе зрозуміти:',
    '',
    '• чи готовий ваш бізнес до AI',
    '• які процеси варто автоматизувати першими',
    '• де AI реально економить час і ресурси',
    '• які задачі не варто автоматизувати поспіхом',
    '',
    'Ви обрали пакет послуги:',
    `"${autoReplyServiceLabel}"`,
    '',
    'Це хороший момент, щоб системно подивитись на процеси компанії й знайти точки росту без зайвої складності та хаосу.',
    '',
    `Відкрити AI Readiness Checklist: ${checklistUrl}`,
    '',
    'Команда Latwo',
    'AI Consulting & Automation',
    '',
    siteUrl,
    LINKEDIN_URL,
    INSTAGRAM_URL
  ].join('\n');

  const html = `
    <div style="margin:0;padding:0;background:#f5f7f9;color:#292929;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
        <div style="background:#ffffff;border:1px solid #e3e7eb;border-radius:16px;padding:32px;">
          <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Вітаю, ${escapedName}!</p>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Дякуємо за звернення до Latwo.</p>
          <p style="margin:0 0 10px;font-size:16px;line-height:1.6;">Ми отримали ваш запит:</p>
          <blockquote style="margin:0 0 22px;padding:16px 18px;border-left:3px solid #ef6c3a;background:#f7f8fa;color:#4b5563;font-size:15px;line-height:1.6;">${escapedMessage}</blockquote>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Команда вже опрацьовує його, і найближчим часом з вами зв’яжеться менеджер.</p>
          <p style="margin:0 0 10px;font-size:16px;line-height:1.6;">Також надсилаємо вам AI Readiness Checklist — короткий практичний матеріал, який допоможе зрозуміти:</p>
          <ul style="margin:0 0 22px;padding-left:22px;font-size:16px;line-height:1.7;">
            <li>чи готовий ваш бізнес до AI</li>
            <li>які процеси варто автоматизувати першими</li>
            <li>де AI реально економить час і ресурси</li>
            <li>які задачі не варто автоматизувати поспіхом</li>
          </ul>
          <p style="margin:0 0 8px;font-size:16px;line-height:1.6;">Ви обрали пакет послуги:</p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.6;"><strong>“${escapedService}”</strong></p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Це хороший момент, щоб системно подивитись на процеси компанії й знайти точки росту без зайвої складності та хаосу.</p>
          <p style="margin:0 0 28px;">
            <a href="${checklistUrl}" style="display:inline-block;background:#ef6c3a;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:16px;font-weight:600;line-height:1.3;text-align:center;">Відкрити AI Readiness Checklist</a>
          </p>
          <p style="margin:0;font-size:16px;line-height:1.6;">Команда Latwo<br />AI Consulting &amp; Automation</p>
        </div>
        <div style="padding:18px 8px 0;color:#6b7280;font-size:14px;line-height:1.7;">
          <a href="${siteUrl}" style="color:#6b7280;">${siteUrl}</a><br />
          <a href="${LINKEDIN_URL}" style="color:#6b7280;">LinkedIn</a> ·
          <a href="${INSTAGRAM_URL}" style="color:#6b7280;">Instagram</a>
        </div>
      </div>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': randomUUID()
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [payload.email],
      subject,
      reply_to: [replyToEmail],
      text,
      html,
      attachments: [
        {
          content: attachment,
          filename: CHECKLIST_FILE_NAME
        }
      ]
    })
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`resend-autoreply-error:${response.status}:${raw}`);
  }
}

module.exports = async function handler(req, res) {
  setJsonHeaders(res);

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'method-not-allowed' });
  }

  if (isCrossSiteRequest(req) || !isOriginAllowed(req)) {
    return res.status(403).json({ ok: false, error: 'forbidden-origin' });
  }

  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ ok: false, error: 'rate-limited' });
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch (_error) {
      payload = {};
    }
  }
  if (!payload || typeof payload !== 'object') {
    payload = {};
  }

  if (getPayloadBytes(payload) > MAX_REQUEST_BODY_BYTES) {
    return res.status(413).json({ ok: false, error: 'payload-too-large' });
  }

  const validation = validatePayload(payload);
  if (validation.error) {
    return res.status(400).json({ ok: false, error: validation.error });
  }

  const data = validation.data;

  // Honeypot: if bots fill hidden field, reply with success but do nothing.
  if (data.website) {
    return res.status(200).json({ ok: true });
  }

  // Time trap: suspiciously fast submit.
  if (Number.isFinite(data.formStartedAt) && data.formStartedAt > 0) {
    const elapsed = Date.now() - data.formStartedAt;
    if (elapsed < 2500) {
      return res.status(200).json({ ok: true });
    }
  }

  try {
    await sendWithResend(data);
    try {
      await sendChecklistAutoReply(data);
    } catch (error) {
      console.error('[contact-autoreply]', error);
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[contact-api]', error);
    return res.status(500).json({ ok: false, error: 'send-failed' });
  }
};
