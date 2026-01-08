const express = require('express');
const cors = require('cors');
const { json } = require('express');
const router = require('./router');

const app = express();
app.use(cors());
app.use(json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));

app.use(router);

module.exports = app;
