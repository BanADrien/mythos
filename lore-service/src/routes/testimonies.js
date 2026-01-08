const { Router } = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const controller = require('../controllers/testimonyController');

const router = Router();

router.post('/testimonies', authenticate, controller.post);
router.get('/creatures/:id/testimonies', authenticate, controller.listByCreature);
router.post('/testimonies/:id/validate', authenticate, requireRole('EXPERT', 'ADMIN'), controller.validate);
router.post('/testimonies/:id/reject', authenticate, requireRole('EXPERT', 'ADMIN'), controller.reject);

module.exports = router;
