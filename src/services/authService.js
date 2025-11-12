const supabase = require('../utils/supabaseClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otp) {
  await transporter.sendMail({
    from: `"SAPABUARAN" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Kode OTP Anda - SAPABUARAN',
    text: `Kode OTP Anda adalah ${otp}. Berlaku 10 menit.`,
  });
}

async function sendOTPWhatsApp(phone, otp) {
  const message = `Kode OTP Anda adalah *${otp}*. Berlaku 10 menit. Jangan berikan ke siapapun.`;
  await axios.post(
    'https://api.fonnte.com/send',
    { target: phone, message },
    { headers: { Authorization: process.env.FONNTE_TOKEN } }
  );
}

// REGISTER
async function registerUser({ full_name, phone, email, birth_date }) {
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
  if (existing) throw new Error('Email sudah terdaftar');

  const { data, error } = await supabase.from('profiles').insert([{
    full_name,
    phone,
    email,
    birth_date,
    status: 'pending',
    otp,
    otp_expires_at: otpExpires,
    otp_method: 'email', // default email
    role: 'user',
    created_at: new Date(),
    updated_at: new Date(),
  }]).select().single();

  if (error) throw new Error(error.message);

  await sendOTPEmail(email, otp);

  return { user_id: data.id, message: 'Kode OTP telah dikirim ke email.' };
}

// VERIFY OTP + simpan password
async function verifyOTP({ user_id, otp, password }) {
  const { data: user } = await supabase.from('profiles').select('*').eq('id', user_id).single();
  if (!user) throw new Error('User tidak ditemukan');
  if (user.otp !== otp) throw new Error('Kode OTP salah');
  if (new Date(user.otp_expires_at) < new Date()) throw new Error('Kode OTP kedaluwarsa');

  const hashedPassword = await bcrypt.hash(password, 10);

  const { error } = await supabase.from('profiles').update({
    password: hashedPassword,
    status: 'active',
    otp: null,
    otp_expires_at: null,
    updated_at: new Date(),
  }).eq('id', user_id);

  if (error) throw new Error(error.message);

  return { message: 'Verifikasi berhasil. Akun Anda telah aktif.' };
}

// RESEND OTP (bisa pilih metode)
async function resendOTP({ email, otp_method }) {
  const { data: user } = await supabase.from('profiles').select('*').eq('email', email).single();
  if (!user) throw new Error('User tidak ditemukan');

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  const { error } = await supabase.from('profiles').update({
    otp,
    otp_expires_at: otpExpires,
    updated_at: new Date(),
    otp_method: otp_method || user.otp_method, // gunakan pilihan user atau default
  }).eq('email', email);

  if (error) throw new Error(error.message);

  const methodToUse = otp_method || user.otp_method;

  if (methodToUse === 'email') await sendOTPEmail(email, otp);
  else await sendOTPWhatsApp(user.phone, otp);

  return { message: 'Kode OTP baru telah dikirim via ' + methodToUse };
}

// LOGIN
// LOGIN
async function loginUser({ identifier, password }) {
  // identifier bisa email atau phone
  const { data: user } = await supabase
    .from('profiles')
    .select('*')
    .or(`email.eq.${identifier},phone.eq.${identifier}`)
    .single();

  if (!user) throw new Error('User tidak ditemukan');
  if (user.status !== 'active') throw new Error('Akun belum aktif');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error('Password salah');

  const token = jwt.sign(
    { id: user.id, email: user.email, phone: user.phone, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  delete user.password;
  return { user, token };
}

module.exports = { registerUser, verifyOTP, resendOTP, loginUser };
