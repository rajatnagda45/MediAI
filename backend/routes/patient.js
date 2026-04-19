const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// Register a new patient
router.post('/register', async (req, res) => {
  try {
    const { personal, medical, symptoms, aiAnalysis, appointment } = req.body;
    
    // Generate token number
    const tokenNumber = 'TKN-' + Math.floor(1000 + Math.random() * 9000);
    
    // Generate simple dummy QR code payload
    const qrCode = JSON.stringify({ tokenNumber, fullName: personal.fullName });

    const patient = new Patient({
      personal,
      medical,
      symptoms,
      aiAnalysis,
      appointment,
      tokenNumber,
      qrCode
    });

    await patient.save();
    res.json({ success: true, message: 'Patient registered successfully', patient });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all patients (protected)
router.get('/', auth, async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json({ success: true, patients });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get patient by ID
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
    res.json({ success: true, patient });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
