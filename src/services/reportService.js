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
async function getReportsByUserId(userId) {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      profiles!reports_user_id_fkey(full_name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
async function getReportById(id) {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      profiles:profiles!reports_user_id_fkey(full_name, email, phone, avatar_url)
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function updateStatus(reportId, status, adminId) {
  const fields = { 
    status, 
    handled_by: adminId
  };

  if (status === "resolved") {
    fields.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('reports')
    .update(fields)
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

module.exports = { createReport, getAllReports, getReportsByUserId, getReportById, updateStatus };