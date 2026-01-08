require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { MONGO_URL = 'mongodb://localhost:27017/mythos', PORT = 5000 } = process.env;

async function start() {
  await mongoose.connect(MONGO_URL);
  app.listen(PORT, () => console.log(`lore-service listening on port ${PORT}`));
}

start().catch(err => {
  console.error('Failed to start lore-service', err);
  process.exit(1);
});
