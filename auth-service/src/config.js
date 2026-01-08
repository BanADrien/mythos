const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';

module.exports = { JWT_SECRET, DATABASE_URL };
