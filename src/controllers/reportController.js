const { 
  createReport, 
  getAllReports, 
  getReportsByUserId, 
  updateStatus, 
  getReportById 
} = require('../services/reportService');
const Joi = require('joi');
const supabase = require('../supabase');
const { sendNotification } = require('../utils/fcm'); // Pastikan fcm.js pakai ENV safe Firebase Admin

// ====================
// Schema Validation
// ====================
const reportSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  category: Joi.string().allow(''),
  sub_category: Joi.string().allow(''),
  description: Joi.string().allow(''),
  image_url: Joi.string().uri().allow(''),
  gps_lat: Joi.number().allow(null),
  gps_lng: Joi.number().allow(null),
  type: Joi.string().allow(''),
  status: Joi.string().allow('')
});

// ====================
// Handlers
// ====================

// Create new report
async function addReport(req, res, next) {
  try {
    const { error } = reportSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const report = await createReport(req.body);
    res.status(201).json({ message: 'Report created', report });
  } catch (err) {
    next(err);
  }
}

// List all reports
async function listReports(req, res, next) {
  try {
    const reports = await getAllReports();
    res.json(reports);
  } catch (err) {
    next(err);
  }
}

// List reports for current user
async function listMyReports(req, res, next) {
  try {
    const userId = req.user.id;
    const reports = await getReportsByUserId(userId);
    res.json(reports);
  } catch (err) {
    next(err);
  }
}

// Get report detail
async function getReportDetail(req, res, next) {
  try {
    const { id } = req.params;
    const report = await getReportById(id);

    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (err) {
    next(err);
  }
}

// Update report status & send FCM notification
async function updateReportStatus(req, res, next) {
  try {
    const reportId = req.params.id;
    const { status } = req.body;

    // Update status in Supabase
    const { data: updated, error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId)
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });
    if (!updated) return res.status(404).json({ message: "Report not found" });

    // Get user FCM token
    const { data: user, error: userErr } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', updated.user_id)
      .single();

    if (userErr) console.log('Supabase user fetch error:', userErr);

    // Send notification if token exists
    if (user?.fcm_token) {
      try {
        await sendNotification(
          user.fcm_token,
          "Status Laporan Berubah",
          `Laporan #${reportId} sekarang ${status}`,
          { reportId }
        );
      } catch (fcmErr) {
        console.log('FCM send error:', fcmErr.message);
      }
    }

    res.json(updated);

  } catch (err) {
    next(err);
  }
}

module.exports = { 
  addReport, 
  listReports, 
  listMyReports, 
  getReportDetail, 
  updateReportStatus, 
  updateStatus 
};
