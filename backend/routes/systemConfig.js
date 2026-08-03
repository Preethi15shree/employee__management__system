const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/systemConfigController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', authorize('system_admin'), ctrl.create);
router.put('/:id', authorize('system_admin'), ctrl.update);
router.patch('/:id', authorize('system_admin'), ctrl.patch);
router.delete('/:id', authorize('system_admin'), ctrl.remove);

module.exports = router;
