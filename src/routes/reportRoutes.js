const express = require('express');
const router = express.Router();
const { addReport, listReports } = require('../controllers/reportController');
const { authenticate, authorizeRoles } = require('../middlewares/authMiddleware');

router.get('/dashboard', authenticate, authorizeRoles('admin','user'), listReports);
router.post('/', authenticate, authorizeRoles('admin','user'), addReport);

module.exports = router;
