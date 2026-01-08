const axios = require('axios');
const { AUTH_SERVICE_URL } = require('../config');

async function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    const { data } = await axios.get(`${AUTH_SERVICE_URL}/auth/me`, {
      headers: { authorization: auth },
      timeout: 5000,
    });
    req.user = data;
    next();
  } catch (e) {
    if (e.response) return res.status(e.response.status || 401).json(e.response.data);
    console.error(e);
    return res.status(401).json({ error: 'Token validation failed' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

module.exports = { authenticate, requireRole };
