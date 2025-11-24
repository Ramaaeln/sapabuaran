const { createReport, getAllReports, getReportsByUserId } = require('../services/reportService');
const Joi = require('joi');

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
    const { id } = req.params;
    const { status } = req.body;

    const updated = await updateStatus(id, status, req.user.id);
    res.json({ message: "Status updated", updated });
  } catch (err) { next(err); }
}

module.exports = { addReport, listReports, listMyReports, getReportDetail, updateReportStatus };