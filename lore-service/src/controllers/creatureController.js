const creatureService = require('../services/creatureService');

async function create(req, res) {
  try {
    const { name, origin } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const created = await creatureService.createCreature({ authorId: String(req.user.id), name, origin });
    res.status(201).json(created);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'Creature name must be unique' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getOne(req, res) {
  try {
    const creature = await creatureService.getCreature(req.params.id);
    if (!creature) return res.status(404).json({ error: 'Not found' });
    res.json(creature);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}

async function list(req, res) {
  try {
    const sort = req.query.sort === 'legendScore' ? 'legendScore' : undefined;
    const creatures = await creatureService.listCreatures(sort);
    res.json(creatures);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { create, getOne, list };
