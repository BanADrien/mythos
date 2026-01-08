require('dotenv').config();
const app = require('./app');
const { PORT = 4000 } = process.env;

app.listen(PORT, () => {
  console.log(`auth-service listening on port ${PORT}`);
});
