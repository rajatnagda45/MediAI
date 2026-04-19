const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  personal: {
    fullName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    address: String,
    emergencyContact: String,
    occupation: String,
  },
  lifestyle: {
    smoking: String,
    alcohol: String,
    exerciseFrequency: String,
  },
  medical: {
    bloodGroup: String,
    height: Number, // in cm
    weight: Number, // in kg
    bmi: Number,
    existingConditions: [String],
    allergies: [String],
    currentMedications: [String],
    pastSurgeries: String,
    familyHistory: [String],
  },
  symptoms: {
    primary: String,
    secondary: [String],
    duration: String,
    severity: String,
    painScale: Number,
    pattern: String,
    triggers: [String],
    notes: String,
  },
  aiAnalysis: {
    patientOverview: String,
    clinicalInterpretation: String,
    differentialDiagnosis: [{ condition: String, reasoning: String }],
    riskAnalysis: { level: String, justification: String },
    treatmentPlan: { shortTerm: [String], longTerm: [String] },
    recoveryTimeline: String,
    lifestyleAdjustments: [String],
    redFlagWarnings: [String],
    followUpPlan: String,
    healthScore: Number,
    healthScoreReasoning: String,
  },
  appointment: {
    department: String,
    doctorName: String,
    date: Date,
    time: String,
    mode: String,
  },
  tokenNumber: { type: String, unique: true },
  qrCode: String,
  status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
