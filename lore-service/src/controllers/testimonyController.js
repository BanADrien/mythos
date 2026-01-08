const testimonyService = require('../services/testimonyService');

async function post(req, res) {
  try {
    const { creatureId, description } = req.body;
    if (!creatureId || !description) return res.status(400).json({ error: 'Missing fields' });
    const created = await testimonyService.postTestimony({ creatureId, authorId: String(req.user.id), description });
    res.status(201).json(created);
  } catch (e) {
    if (e.message && e.message.includes('5 minutes')) return res.status(429).json({ error: e.message });
    if (e.message === 'Creature not found') return res.status(404).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function listByCreature(req, res) {
  try {
    const testimonies = await testimonyService.getTestimoniesByCreature(req.params.id);
    res.json(testimonies);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function validate(req, res) {
  try {
    const auth = req.headers.authorization || '';
    const updated = await testimonyService.validateTestimony({ testimonyId: req.params.id, validator: { id: req.user.id, role: req.user.role, token: auth.replace('Bearer ', '') } });
    res.json(updated);
  } catch (e) {
    if (e.message && e.message.includes('own testimony')) return res.status(403).json({ error: e.message });
    if (e.message && e.message.includes('Already decided')) return res.status(400).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function reject(req, res) {
  try {
    const auth = req.headers.authorization || '';
    const updated = await testimonyService.rejectTestimony({ testimonyId: req.params.id, validator: { id: req.user.id, role: req.user.role, token: auth.replace('Bearer ', '') } });
    res.json(updated);
  } catch (e) {
    if (e.message && e.message.includes('own testimony')) return res.status(403).json({ error: e.message });
    if (e.message && e.message.includes('Already decided')) return res.status(400).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { post, listByCreature, validate, reject };
