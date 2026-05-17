const { randomUUID } = require('crypto');

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
      message,
      discoveryCall,
      website,
      formStartedAt,
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
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[contact-api]', error);
    return res.status(500).json({ ok: false, error: 'send-failed' });
  }
};
