const { createReport, getAllReports, getReportsByUserId, updateStatus } = require('../services/reportService');
const Joi = require('joi');
const supabase = require('../supabase');
const { createAndSendNotification } = require('../services/notificationService');
const { sendNotification } = require('../utils/fcm');

const reportSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  category: Joi.string(),
  sub_category: Joi.string(),
  description: Joi.string(),
  image_url: Joi.string().uri(),
  gps_lat: Joi.number(),
  gps_lng: Joi.number(),
  type: Joi.string(),
  status: Joi.string()
});

async function addReport(req, res, next) {
  try {
    const { error } = reportSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const report = await createReport(req.body);
    res.status(201).json({ message: 'Report created', report });
  } catch (err) { next(err); }
}

async function listReports(req, res, next) {
  try {
    const reports = await getAllReports();
    res.json(reports);
  } catch (err) { next(err); }
}

async function listMyReports(req, res, next) {
  try {
    const userId = req.user.id; 
    const reports = await getReportsByUserId(userId);
    res.json(reports);
  } catch (err) { next(err); }
}
async function getReportDetail(req, res, next) {
  try {
    const { id } = req.params;
    const report = await getReportById(id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (err) { next(err); }
}

async function updateReportStatus(req, res, next) {
  try {
    const reportId = req.params.id;
    const { status } = req.body;

    const { data: updated, error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId)
      .select()
      .single();

    if (error) return res.status(400).json({ message: error.message });

    const { data: user, error: userErr } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', updated.user_id)
      .single();

    if (userErr) console.log(userErr);

    if (user?.fcm_token) {
      await sendNotification(
        user.fcm_token,
        "Status Laporan Berubah",
        `Laporan #${reportId} sekarang ${status}`,
        { reportId }
      );
    }

    res.json(updated);

  } catch (err) { next(err); }
}


module.exports = { addReport, listReports, listMyReports, getReportDetail, updateReportStatus, updateStatus };