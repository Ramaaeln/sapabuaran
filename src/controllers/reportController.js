const { createReport, getAllReports } = require('../services/reportService');
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

module.exports = { addReport, listReports };
