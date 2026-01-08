const { Schema, model } = require('mongoose');

const CreatureSchema = new Schema({
  authorId: { type: String, required: true },
  name: { type: String, required: true, unique: true },
  origin: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = model('Creature', CreatureSchema);
