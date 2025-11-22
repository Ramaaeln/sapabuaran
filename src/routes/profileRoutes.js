const express = require('express');
const router = express.Router();
const { getMe, updateMe } = require('../controllers/profileController');
const { authenticate } = require('../middlewares/authMiddleware');

// Get own profile
router.get('/me', authenticate, getMe);

// Update own profile
router.put('/me', authenticate, updateMe);

router.get('/profiles-test', async (req, res) => {
    const { data } = await supabase.from('profiles').select('*');
    res.json(data);
  });
  
module.exports = router;
