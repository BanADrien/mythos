const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const userService = require('../services/userService');

const router = Router();

// ADMIN: change role
router.patch('/:id/role', authenticate, requireRole('ADMIN'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['USER', 'EXPERT', 'ADMIN'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const updated = await userService.updateRole(parseInt(req.params.id, 10), role);
    res.json({ id: updated.id, role: updated.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reputation updates (called by lore-service using validator's JWT)
router.post('/:id/reputation', authenticate, requireRole('EXPERT', 'ADMIN'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { delta } = req.body;
    if (typeof delta !== 'number') return res.status(400).json({ error: 'delta must be a number' });
    const updated = await userService.updateReputation(userId, delta);
    res.json({ id: updated.id, reputation: updated.reputation, role: updated.role });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
