const { Schema, model } = require('mongoose');

const TestimonySchema = new Schema({
  creatureId: { type: Schema.Types.ObjectId, ref: 'Creature', required: true },
  authorId: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'VALIDATED', 'REJECTED'], default: 'PENDING' },
  validatedBy: { type: String, default: null },
  validatedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = model('Testimony', TestimonySchema);
