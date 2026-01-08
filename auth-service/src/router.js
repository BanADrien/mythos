const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { JWT_SECRET } = require('./config');
const { authenticate, requireRole } = require('./middleware/auth');

const prisma = new PrismaClient();
const r = Router();

// Auth
r.post('/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) return res.status(400).json({ error: 'Missing fields' });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, username, password: hash, role: 'USER', reputation: 0 } });
    res.status(201).json({ id: user.id, email: user.email, username: user.username, role: user.role, reputation: user.reputation });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email or username already exists' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.get('/auth/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, username: user.username, role: user.role, reputation: user.reputation });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin
r.get('/admin/users', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(users.map(u => ({ id: u.id, email: u.email, username: u.username, role: u.role, reputation: u.reputation })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Users
r.patch('/users/:id/role', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { role } = req.body;
    if (!['USER', 'EXPERT', 'ADMIN'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const updated = await prisma.user.update({ where: { id }, data: { role } });
    res.json({ id: updated.id, role: updated.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.post('/users/:id/reputation', authenticate, requireRole('EXPERT', 'ADMIN'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { delta } = req.body;
    if (typeof delta !== 'number') return res.status(400).json({ error: 'delta must be a number' });
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const reputation = (user.reputation || 0) + delta;
    const role = reputation >= 10 && user.role === 'USER' ? 'EXPERT' : user.role;
    const updated = await prisma.user.update({ where: { id }, data: { reputation, role } });
    res.json({ id: updated.id, reputation: updated.reputation, role: updated.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = r;
