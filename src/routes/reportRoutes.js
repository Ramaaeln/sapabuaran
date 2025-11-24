const express = require('express');
const router = express.Router();
const { 
    addReport, 
    listReports, 
    listMyReports,
    getReportDetail,
    updateReportStatus
  } = require('../controllers/reportController');
const { authenticate, authorizeRoles } = require('../middlewares/authMiddleware');

router.post('/', authenticate, authorizeRoles('admin','user'), addReport);
router.get('/dashboard', authenticate, authorizeRoles('admin','user'), listReports);
router.get('/me', authenticate, authorizeRoles('admin','user'), listMyReports);
router.get('/:id', authenticate, authorizeRoles('admin','user'), getReportDetail);
router.put('/:id/status', authenticate, authorizeRoles('admin'), updateReportStatus);



module.exports = router;
