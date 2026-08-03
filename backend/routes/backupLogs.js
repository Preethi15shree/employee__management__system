const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/backupLogsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', authorize('system_admin'), ctrl.create);
router.delete('/:id', authorize('system_admin'), ctrl.remove);

module.exports = router;
