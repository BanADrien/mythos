const { Router } = require('express');
const axios = require('axios');
const Creature = require('./models/Creature');
const Testimony = require('./models/Testimony');
const { authenticate, requireRole } = require('./middleware/auth');
const { AUTH_SERVICE_URL } = require('./config');

const r = Router();

// Creatures
r.post('/creatures', authenticate, async (req, res) => {
  try {
    const { name, origin } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const creature = await Creature.create({ authorId: String(req.user.id), name, origin });
    res.status(201).json(creature);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Creature name must be unique' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.get('/creatures/:id', async (req, res) => {
  try {
    const c = await Creature.findById(req.params.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    res.json(c);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.get('/creatures', async (req, res) => {
  try {
    const sort = req.query.sort;
    const creatures = await Creature.find().lean();
    if (sort === 'legendScore') {
      const withScore = await Promise.all(creatures.map(async c => {
        const count = await Testimony.countDocuments({ creatureId: c._id, status: 'VALIDATED' });
        return { ...c, legendScore: 1 + count / 5 };
      }));
      withScore.sort((a, b) => (b.legendScore || 0) - (a.legendScore || 0));
      return res.json(withScore);
    }
    res.json(creatures);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Testimonies
r.post('/testimonies', authenticate, async (req, res) => {
  try {
    const { creatureId, description } = req.body;
    if (!creatureId || !description) return res.status(400).json({ error: 'creatureId and description required' });
    const last = await Testimony.findOne({ creatureId, authorId: String(req.user.id) }).sort({ createdAt: -1 });
    if (last && Date.now() - new Date(last.createdAt).getTime() < 5 * 60 * 1000) {
      return res.status(429).json({ error: 'Wait 5 minutes before submitting another testimony for this creature' });
    }
    const t = await Testimony.create({ creatureId, authorId: String(req.user.id), description });
    res.status(201).json(t);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.get('/creatures/:id/testimonies', async (req, res) => {
  try {
    const list = await Testimony.find({ creatureId: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.post('/testimonies/:id/validate', authenticate, requireRole('EXPERT', 'ADMIN'), async (req, res) => {
  try {
    const t = await Testimony.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (String(t.authorId) === String(req.user.id)) return res.status(403).json({ error: 'Cannot validate own testimony' });
    if (t.status !== 'PENDING') return res.status(409).json({ error: 'Already processed' });
    t.status = 'VALIDATED';
    t.validatedBy = String(req.user.id);
    t.validatedAt = new Date();
    await t.save();

    // Reputation updates: +3 validated, +1 if validator is EXPERT
    const headers = { authorization: `Bearer ${req.headers.authorization.split(' ')[1]}` };
    await axios.post(`${AUTH_SERVICE_URL}/users/${t.authorId}/reputation`, { delta: 3 }, { headers });
    if (req.user.role === 'EXPERT') {
      await axios.post(`${AUTH_SERVICE_URL}/users/${t.authorId}/reputation`, { delta: 1 }, { headers });
    }

    res.json(t);
  } catch (e) {
    if (e.response) return res.status(e.response.status || 500).json(e.response.data);
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

r.post('/testimonies/:id/reject', authenticate, requireRole('EXPERT', 'ADMIN'), async (req, res) => {
  try {
    const t = await Testimony.findById(req.params.id);
    if (!t) return res.status(404).json({ error: 'Not found' });
    if (String(t.authorId) === String(req.user.id)) return res.status(403).json({ error: 'Cannot reject own testimony' });
    if (t.status !== 'PENDING') return res.status(409).json({ error: 'Already processed' });
    t.status = 'REJECTED';
    t.validatedBy = String(req.user.id);
    t.validatedAt = new Date();
    await t.save();

    // Reputation -1 for rejection
    const headers = { authorization: `Bearer ${req.headers.authorization.split(' ')[1]}` };
    await axios.post(`${AUTH_SERVICE_URL}/users/${t.authorId}/reputation`, { delta: -1 }, { headers });

    res.json(t);
  } catch (e) {
    if (e.response) return res.status(e.response.status || 500).json(e.response.data);
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = r;
