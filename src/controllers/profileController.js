const { getProfileById, updateProfile } = require('../services/profileService');
const Joi = require('joi');

const updateSchema = Joi.object({
  full_name: Joi.string(),
  phone: Joi.string(),
  birth_date: Joi.date()
});

async function getMe(req, res, next) {
  try {
    const profile = await getProfileById(req.user.id);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const { error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const updatedProfile = await updateProfile(req.user.id, req.body);
    res.json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe };
