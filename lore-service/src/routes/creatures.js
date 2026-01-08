const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/creatureController');

const router = Router();

router.post('/', authenticate, controller.create);
router.get('/:id', authenticate, controller.getOne);
router.get('/', authenticate, controller.list);

module.exports = router;
