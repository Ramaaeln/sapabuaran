const supabase = require('../utils/supabaseClient');

async function getProfileById(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('-password, -otp, -otp_expires_at')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

async function updateProfile(userId, payload) {
  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('-password, -otp, -otp_expires_at')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

module.exports = { getProfileById, updateProfile };
