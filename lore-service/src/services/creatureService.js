const Creature = require('../models/Creature');
const Testimony = require('../models/Testimony');

async function createCreature({ authorId, name, origin }) {
  return Creature.create({ authorId, name, origin });
}

async function getCreature(id) {
  const creature = await Creature.findById(id);
  if (!creature) return null;
  const validatedCount = await Testimony.countDocuments({ creatureId: creature._id, status: 'VALIDATED' });
  const legendScore = 1 + validatedCount / 5;
  return { ...creature.toObject(), legendScore };
}

async function listCreatures(sort) {
  // Compute legendScore per creature via aggregation
  const pipeline = [
    { $lookup: { from: 'testimonies', localField: '_id', foreignField: 'creatureId', as: 'testimonies' } },
    { $addFields: { legendScore: { $add: [1, { $divide: [{ $size: { $filter: { input: '$testimonies', as: 't', cond: { $eq: ['$$t.status', 'VALIDATED'] } } } }, 5] }] } } },
    { $project: { testimonies: 0 } },
  ];
  if (sort === 'legendScore') pipeline.push({ $sort: { legendScore: -1, createdAt: -1 } });
  else pipeline.push({ $sort: { createdAt: -1 } });
  return Creature.aggregate(pipeline);
}

module.exports = { createCreature, getCreature, listCreatures };
