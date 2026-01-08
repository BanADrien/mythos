const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const userService = require('../services/userService');

const router = Router();

router.get('/users', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await userService.listUsers();
    res.json(users.map(u => ({ id: u.id, email: u.email, username: u.username, role: u.role, reputation: u.reputation })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
