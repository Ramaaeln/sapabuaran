const { getProfileById, updateProfile } = require('../services/profileService');
const supabase = require('../utils/supabaseClient'); 
const Joi = require('joi');

const updateSchema = Joi.object({
  full_name: Joi.string(),
  phone: Joi.string(),
  birth_date: Joi.date(),
  address: Joi.string().allow(''),
  avatar_url: Joi.string().uri().allow('')
});

async function getMe(req, res, next) {
  try {
    let profile;
    try {
      profile = await getProfileById(req.user.id);
    } catch (err) {
      // Kalau tidak ada profil, buat otomatis
      const { data, error } = await supabase
        .from('profiles')
        .insert({ id: req.user.id, email: req.user.email })
        .select('-password, -otp, -otp_expires_at')
        .single();
      if (error) throw error;
      profile = data;
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const { error } = updateSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Cek apakah profil ada, jika tidak buat dulu
    let profile;
    try {
      profile = await getProfileById(req.user.id);
    } catch (err) {
      const { data, error } = await supabase
        .from('profiles')
        .insert({ id: req.user.id, email: req.user.email })
        .select('-password, -otp, -otp_expires_at')
        .single();
      if (error) throw error;
      profile = data;
    }

    // Update profil
    const updatedProfile = await updateProfile(req.user.id, req.body);
    res.json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMe, updateMe };
