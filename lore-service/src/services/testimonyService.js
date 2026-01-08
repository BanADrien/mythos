const Testimony = require('../models/Testimony');
const Creature = require('../models/Creature');
const axios = require('axios');
const { AUTH_SERVICE_URL } = require('../config');

async function postTestimony({ creatureId, authorId, description }) {
  const creature = await Creature.findById(creatureId);
  if (!creature) throw new Error('Creature not found');
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recent = await Testimony.findOne({ creatureId, authorId, createdAt: { $gte: fiveMinAgo } });
  if (recent) throw new Error('Wait 5 minutes before posting again');
  return Testimony.create({ creatureId, authorId, description });
}

async function getTestimoniesByCreature(creatureId) {
  return Testimony.find({ creatureId }).sort({ createdAt: -1 });
}

async function validateTestimony({ testimonyId, validator }) {
  const t = await Testimony.findById(testimonyId);
  if (!t) throw new Error('Testimony not found');
  if (t.authorId === String(validator.id)) throw new Error('Cannot validate own testimony');
  if (t.status !== 'PENDING') throw new Error('Already decided');
  t.status = 'VALIDATED';
  t.validatedBy = String(validator.id);
  t.validatedAt = new Date();
  await t.save();
  // Reputation update: +3; +1 if validator EXPERT
  const delta = 3 + (validator.role === 'EXPERT' ? 1 : 0);
  await axios.post(`${AUTH_SERVICE_URL}/users/${t.authorId}/reputation`, { delta }, {
    headers: { authorization: `Bearer ${validator.token}` },
    timeout: 5000,
  });
  return t;
}

async function rejectTestimony({ testimonyId, validator }) {
  const t = await Testimony.findById(testimonyId);
  if (!t) throw new Error('Testimony not found');
  if (t.authorId === String(validator.id)) throw new Error('Cannot reject own testimony');
  if (t.status !== 'PENDING') throw new Error('Already decided');
  t.status = 'REJECTED';
  t.validatedBy = String(validator.id);
  t.validatedAt = new Date();
  await t.save();
  // Reputation update: -1
  const delta = -1;
  await axios.post(`${AUTH_SERVICE_URL}/users/${t.authorId}/reputation`, { delta }, {
    headers: { authorization: `Bearer ${validator.token}` },
    timeout: 5000,
  });
  return t;
}

module.exports = { postTestimony, getTestimoniesByCreature, validateTestimony, rejectTestimony };
