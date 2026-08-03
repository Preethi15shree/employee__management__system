const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', authorize('system_admin', 'hr_admin'), ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', authorize('system_admin', 'hr_admin'), ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id', ctrl.patch);
router.delete('/:id', authorize('system_admin'), ctrl.remove);

module.exports = router;
