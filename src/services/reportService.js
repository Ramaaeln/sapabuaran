const supabase = require('../utils/supabaseClient');

async function createReport(report) {
  const { data, error } = await supabase.from('reports').insert([report]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

async function getAllReports() {
  const { data, error } = await supabase.from('reports').select(`
    *,
    profiles!reports_user_id_fkey(full_name)
  `);
  if (error) throw new Error(error.message);
  return data;
}
module.exports = { createReport, getAllReports };
