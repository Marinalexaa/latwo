const { createHash } = require('crypto');

const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = String(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ''
).trim();
const SUPABASE_CONSENT_TABLE = String(process.env.SUPABASE_CONSENT_TABLE || 'cookie_consents').trim();
const SUPABASE_TIMEOUT_MS = Number.isFinite(Number(process.env.SUPABASE_TIMEOUT_MS))
  ? Math.max(1000, Math.floor(Number(process.env.SUPABASE_TIMEOUT_MS)))
  : 5000;

function setJsonHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

function parseHostHeader(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').trim().toLowerCase();
  return host.split(',')[0].trim();
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

function trimString(value, max = 300) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function safeConsentShape(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  return {
    essential: true,
    analytics: Boolean(input.analytics),
    marketing: Boolean(input.marketing)
  };
}

function hashIp(ip) {
  const salt = String(process.env.CONSENT_LOG_SALT || 'latwo-consent-salt');
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

function hashUserAgent(userAgent) {
  const salt = String(process.env.CONSENT_LOG_SALT || 'latwo-consent-salt');
  return createHash('sha256').update(`${salt}:ua:${userAgent || ''}`).digest('hex');
}

function getSupabaseInsertEndpoint() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_CONSENT_TABLE) return null;
  return `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${SUPABASE_CONSENT_TABLE}`;
}

async function persistConsentToSupabase(row) {
  const endpoint = getSupabaseInsertEndpoint();
  if (!endpoint) {
    return {
      stored: false,
      mode: 'log-only',
      reason: 'supabase-not-configured'
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(row),
      signal: controller.signal
    });

    if (!response.ok) {
      const details = await response.text().catch(() => '');
      throw new Error(`supabase-insert-failed:${response.status}:${details}`);
    }

    return {
      stored: true,
      mode: 'supabase'
    };
  } finally {
    clearTimeout(timeout);
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

  if (!isOriginAllowed(req)) {
    return res.status(403).json({ ok: false, error: 'forbidden-origin' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_error) {
      body = {};
    }
  }
  if (!body || typeof body !== 'object') body = {};

  const consentId = trimString(body.consent_id, 120);
  const consentVersion = trimString(body.consent_version, 60);
  const consentTimestamp = trimString(body.consent_timestamp, 60);
  const consentSource = trimString(body.consent_source, 80);
  const consentLocale = trimString(body.consent_locale, 20);
  const consentPath = trimString(body.consent_path, 300);
  const consent = safeConsentShape(body.consent);

  if (!consentId || !consentVersion || !consentTimestamp) {
    return res.status(400).json({ ok: false, error: 'invalid-payload' });
  }

  const forwarded = String(req.headers['x-forwarded-for'] || '').trim();
  const rawIp = (forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress) || 'unknown';
  const ipHash = hashIp(rawIp);
  const userAgent = trimString(req.headers['user-agent'], 300);
  const userAgentHash = hashUserAgent(userAgent);
  const loggedAt = new Date().toISOString();
  const consentTimestampIso = Number.isNaN(Date.parse(consentTimestamp))
    ? loggedAt
    : new Date(consentTimestamp).toISOString();

  const row = {
    consent_id: consentId,
    consent_version: consentVersion,
    consent_timestamp: consentTimestampIso,
    consent_source: consentSource || null,
    consent_locale: consentLocale || null,
    consent_path: consentPath || null,
    consent_essential: true,
    consent_analytics: consent.analytics,
    consent_marketing: consent.marketing,
    ip_hash: ipHash,
    user_agent: userAgent || null,
    user_agent_hash: userAgentHash,
    logged_at: loggedAt
  };

  let storeResult = {
    stored: false,
    mode: 'log-only',
    reason: 'not-attempted'
  };

  try {
    storeResult = await persistConsentToSupabase(row);
  } catch (error) {
    storeResult = {
      stored: false,
      mode: 'log-only',
      reason: error && error.message ? error.message : 'supabase-error'
    };
    console.error('[cookie-consent-store]', error);
  }

  console.info(
    '[cookie-consent]',
    JSON.stringify({
      consent_id: consentId,
      consent_version: consentVersion,
      consent_timestamp: consentTimestampIso,
      consent_source: consentSource,
      consent_locale: consentLocale,
      consent_path: consentPath,
      consent,
      ip_hash: ipHash,
      user_agent_hash: userAgentHash,
      user_agent: userAgent,
      logged_at: loggedAt
      ,
      storage_mode: storeResult.mode,
      stored: storeResult.stored,
      store_reason: storeResult.reason || null
    })
  );

  return res.status(200).json({ ok: true, stored: storeResult.stored });
};
