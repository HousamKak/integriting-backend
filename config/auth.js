// config/auth.js
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Secrets that must never be accepted in production. These have all been
// committed to source control / baked into images at some point, so a JWT
// signed with any of them is trivially forgeable by anyone.
const WEAK_SECRETS = [
  'CHANGE_THIS_SECRET',
  'your-secret-key-here-change-in-production',
  'dev-jwt-secret-change-in-production',
  'CHANGE-THIS-TO-A-SECURE-SECRET'
];

const jwtSecret = process.env.JWT_SECRET;

if (isProduction) {
  // Fail loudly at startup rather than silently running with a guessable key.
  if (!jwtSecret || jwtSecret.trim().length < 32 || WEAK_SECRETS.includes(jwtSecret.trim())) {
    throw new Error(
      'FATAL: JWT_SECRET is missing, too short, or a known weak default. ' +
      'Set a strong (>=32 char) JWT_SECRET via the runtime environment before starting in production.'
    );
  }
}

module.exports = {
  // In non-production environments fall back to a clearly-marked dev key so
  // local development keeps working without extra setup.
  jwtSecret: jwtSecret || 'insecure-dev-only-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h'
};
