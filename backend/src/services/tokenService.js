const crypto = require('crypto');

const TOKEN_SALT = process.env.TOKEN_SALT || 'pay_unlock_secure_salt_87a4df92e';
const SIGNED_URL_SECRET = process.env.JWT_SECRET || 'pay_unlock_media_stream_secret_99';

/**
 * Generates an anonymous purchase token, its hash, and a recovery code.
 */
function generatePurchaseToken() {
  // 32 random bytes -> 64 hex characters (high entropy)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  // Generate friendly recovery code: UNLK-XXXX-XXXX-XXXX
  const codeBytes = crypto.randomBytes(6).toString('hex').toUpperCase();
  const recoveryCode = `UNLK-${codeBytes.slice(0, 4)}-${codeBytes.slice(4, 8)}-${codeBytes.slice(8, 12)}`;

  return { rawToken, tokenHash, recoveryCode };
}

/**
 * Generates a SHA-256 hash of the token.
 */
function hashToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string') return '';
  return crypto.createHmac('sha256', TOKEN_SALT).update(rawToken.trim()).digest('hex');
}

/**
 * Generates a short-lived signed access token for streaming protected media.
 * Expires by default in 10 minutes (600 seconds).
 */
function generateSignedMediaToken(mediaId, purchaseId, expiresInSeconds = 600) {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const payload = `${mediaId}:${purchaseId}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', SIGNED_URL_SECRET).update(payload).digest('hex');
  const token = Buffer.from(JSON.stringify({ payload, signature })).toString('base64url');
  return { token, expiresAt };
}

/**
 * Verifies a short-lived signed media token.
 */
function verifySignedMediaToken(signedToken) {
  try {
    const decoded = JSON.parse(Buffer.from(signedToken, 'base64url').toString('utf8'));
    const { payload, signature } = decoded;
    if (!payload || !signature) return null;

    const expectedSignature = crypto.createHmac('sha256', SIGNED_URL_SECRET).update(payload).digest('hex');
    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature)) === false) {
      return null;
    }

    const [mediaId, purchaseId, expiresAtStr] = payload.split(':');
    const expiresAt = parseInt(expiresAtStr, 10);
    if (Date.now() / 1000 > expiresAt) {
      return null; // Expired
    }

    return { mediaId, purchaseId, expiresAt };
  } catch (err) {
    return null;
  }
}

module.exports = {
  generatePurchaseToken,
  hashToken,
  generateSignedMediaToken,
  verifySignedMediaToken
};
