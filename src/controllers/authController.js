const { registerUser, verifyOTP, loginUser } = require('../services/authService');
const Joi = require('joi');

const registerSchema = Joi.object({
  full_name: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  birth_date: Joi.date().required()
});
const verifySchema = Joi.object({ user_id: Joi.string().uuid().required(), otp: Joi.string().required(), password: Joi.string().min(6).required() });
const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });

async function register(req, res, next) {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const user = await registerUser(req.body);
    res.json({ message: 'OTP sent', user_id: user.id });
  } catch (err) { next(err); }
}

async function verify(req, res, next) {
  try {
    const { error } = verifySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const user = await verifyOTP(req.body);
    res.json({ message: 'Account activated', user });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const result = await loginUser(req.body);
    res.json({ message: 'Login successful', ...result });
  } catch (err) { next(err); }
}

module.exports = { register, verify, login };
