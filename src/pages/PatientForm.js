import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Activity, AlertCircle, Calendar, CheckCircle, ChevronRight, ChevronLeft, Download, Plus, X } from 'lucide-react';
import { analyzeSymptoms, registerPatient } from '../utils/api';
import { jsPDF } from "jspdf";
import { QRCodeSVG } from 'qrcode.react';

const steps = [
  { id: 1, title: 'Personal', icon: User },
  { id: 2, title: 'Medical', icon: Activity },
  { id: 3, title: 'Symptoms', icon: AlertCircle },
  { id: 4, title: 'Appointment', icon: Calendar }
];

export default function PatientForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [tokenData, setTokenData] = useState(null);

  const [formData, setFormData] = useState({
    personal: { fullName: '', dob: '', gender: '', contact: '', email: '', address: '', emergencyContact: '', occupation: '' },
    lifestyle: { smoking: '', alcohol: '', exerciseFrequency: '' },
    medical: { bloodGroup: '', height: '', weight: '', existingConditions: [], allergies: [], currentMedications: [], pastSurgeries: '', familyHistory: [] },
    symptoms: { primary: '', secondary: [], duration: '', severity: 'Moderate', painScale: 5, pattern: '', triggers: [], notes: '' },
    appointment: { department: '', doctorName: '', date: '', time: '', mode: 'In-person' }
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('patientRegistrationForm');
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved form data', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('patientRegistrationForm', JSON.stringify(formData));
  }, [formData]);

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const bmiData = useMemo(() => {
    const h = parseFloat(formData.medical.height);
    const w = parseFloat(formData.medical.weight);
    if (h > 0 && w > 0) {
      const hm = h / 100;
      const bmi = w / (hm * hm);
      let status = 'Normal';
      let color = 'text-green-500';
      if (bmi < 18.5) { status = 'Underweight'; color = 'text-blue-500'; }
      else if (bmi > 25) { status = 'Overweight'; color = 'text-orange-500'; }
      return { value: bmi.toFixed(1), status, color };
    }
    return null;
  }, [formData.medical.height, formData.medical.weight]);

  const handleNext = async () => {
    if (currentStep === 3) {
      setLoading(true);
      try {
        const payload = { ...formData, bmi: bmiData?.value };
        const result = await analyzeSymptoms(payload);
        if (result.success && result.data) {
          setAiResult(result.data);
        }
      } catch (err) {
        console.error('Analysis failed', err);
        alert('Failed to analyze symptoms. Please try again.');
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = { ...formData, aiAnalysis: aiResult };
      if (bmiData) payload.medical.bmi = bmiData.value;
      const response = await registerPatient(payload);
      if (response.success) {
        setIsCompleted(true);
        setTokenData(response.patient);
        localStorage.removeItem('patientRegistrationForm');
      }
    } catch (err) {
      console.error('Registration failed', err);
      alert('Registration failed. Please try again.');
    }
    setLoading(false);
  };

  const downloadReceipt = () => {
    const doc = new jsPDF();
    let yPos = 20;

    const addText = (text, size, isBold = false) => {
      doc.setFontSize(size);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const splitText = doc.splitTextToSize(text, 170);
      doc.text(splitText, 20, yPos);
      yPos += (splitText.length * (size === 16 ? 8 : 6)) + 2;
    };

    addText("MediAI Medical Report & Receipt", 20, true);
    yPos += 5;
    
    addText(`Token Number: ${tokenData.tokenNumber}`, 12);
    addText(`Patient Name: ${tokenData.personal.fullName}`, 12);
    addText(`Department: ${tokenData.appointment.department} (${tokenData.appointment.mode})`, 12);
    addText(`Date: ${new Date(tokenData.appointment.date).toLocaleDateString()} ${tokenData.appointment.time}`, 12);
    yPos += 10;
    
    if (aiResult) {
        addText("PATIENT OVERVIEW:", 14, true);
        addText(aiResult.patientOverview || "N/A", 12);
        yPos += 5;

        addText("CLINICAL INTERPRETATION:", 14, true);
        addText(aiResult.clinicalInterpretation || "N/A", 12);
        yPos += 5;

        if (yPos > 250) { doc.addPage(); yPos = 20; }

        addText("DIFFERENTIAL DIAGNOSIS:", 14, true);
        const diagText = aiResult.differentialDiagnosis?.map(d => `- ${d.condition}: ${d.reasoning}`).join('\n') || "N/A";
        addText(diagText, 12);
        yPos += 5;

        if (yPos > 250) { doc.addPage(); yPos = 20; }

        addText("RISK ANALYSIS:", 14, true);
        addText(`${aiResult.riskAnalysis?.level || 'N/A'} - ${aiResult.riskAnalysis?.justification || ''}`, 12);
        yPos += 5;

        if (yPos > 250) { doc.addPage(); yPos = 20; }

        addText("TREATMENT PLAN (Short Term):", 14, true);
        const stText = aiResult.treatmentPlan?.shortTerm?.map(t => `- ${t}`).join('\n') || "N/A";
        addText(stText, 12);
        yPos += 5;

        addText("TREATMENT PLAN (Long Term):", 14, true);
        const ltText = aiResult.treatmentPlan?.longTerm?.map(t => `- ${t}`).join('\n') || "N/A";
        addText(ltText, 12);
        yPos += 5;

        if (yPos > 250) { doc.addPage(); yPos = 20; }

        addText("LIFESTYLE ADJUSTMENTS:", 14, true);
        const lifeText = aiResult.lifestyleAdjustments?.map(t => `- ${t}`).join('\n') || "N/A";
        addText(lifeText, 12);
        yPos += 5;

        addText("RED FLAG WARNINGS:", 14, true);
        const redText = aiResult.redFlagWarnings?.map(t => `- ${t}`).join('\n') || "N/A";
        addText(redText, 12);
        yPos += 5;

        addText("FOLLOW-UP:", 14, true);
        addText(aiResult.followUpPlan || "N/A", 12);
        yPos += 5;

        addText("HEALTH SCORE:", 14, true);
        addText(`${aiResult.healthScore}/100 - ${aiResult.healthScoreReasoning || ''}`, 12);
    }

    doc.save(`Medical_Report_${tokenData.tokenNumber}.pdf`);
  };

  if (isCompleted && tokenData) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto mt-12 glass-panel rounded-2xl p-8 text-center">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Registration Complete!</h2>
        <p className="text-muted-foreground mb-8">Your appointment has been successfully scheduled.</p>
        
        <div className="glass-panel bg-white/5 p-6 rounded-xl inline-block text-left w-full max-w-md">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
            <span className="text-sm text-gray-400">Token Number</span>
            <span className="text-xl font-bold text-gradient">{tokenData.tokenNumber}</span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-400">Patient</span>
            <span className="font-medium">{tokenData.personal.fullName}</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-gray-400">Schedule</span>
            <span className="font-medium">{new Date(tokenData.appointment.date).toLocaleDateString()} at {tokenData.appointment.time}</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm text-gray-400">Mode</span>
            <span className="font-medium px-2 py-1 bg-white/10 rounded-md text-sm">{tokenData.appointment.mode}</span>
          </div>
          
          <div className="flex justify-center mb-6 bg-white p-4 rounded-lg">
             <QRCodeSVG value={tokenData.qrCode} size={150} />
          </div>

          <button onClick={downloadReceipt} className="w-full py-3 bg-primary hover:bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(59,130,246,0.39)]">
            <Download size={20} /> Download Report & Receipt
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-8 mb-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">MediAI <span className="text-gradient">Intake</span></h1>
        <p className="text-gray-400">Comprehensive symptom analysis powered by clinical AI</p>
      </div>

      <div className="glass-panel rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Progress Stepper */}
        <div className="flex justify-between mb-12 relative z-10">
          {/* Progress Lines Container */}
          <div className="absolute top-6 left-6 right-6 h-1 -z-10 -translate-y-1/2">
            <div className="w-full h-full bg-white/10 rounded-full"></div>
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {steps.map(step => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isPassed = step.id < currentStep;
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 relative z-20">
                <motion.div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-300 relative z-20 ${
                    isActive ? 'border-primary bg-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 
                    isPassed ? 'border-primary bg-background text-primary' : 'border-white/20 bg-background text-gray-500'
                  }`}
                  animate={{ scale: isActive ? 1.1 : 1 }}
                >
                  <Icon size={20} />
                </motion.div>
                <span className={`text-sm hidden md:block ${isActive ? 'text-primary font-bold' : 'text-gray-500'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Content */}
        <div className="min-h-[500px] relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-white/10 pb-2">Basic Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField label="Full Name" value={formData.personal.fullName} onChange={e => handleChange('personal', 'fullName', e.target.value)} />
                      <InputField label="Date of Birth" type="date" value={formData.personal.dob} onChange={e => handleChange('personal', 'dob', e.target.value)} />
                      <SelectField label="Gender" value={formData.personal.gender} onChange={e => handleChange('personal', 'gender', e.target.value)} options={['Male', 'Female', 'Other']} />
                      <InputField label="Occupation" value={formData.personal.occupation} onChange={e => handleChange('personal', 'occupation', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-white/10 pb-2">Contact Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField label="Phone Number" type="tel" value={formData.personal.contact} onChange={e => handleChange('personal', 'contact', e.target.value)} />
                      <InputField label="Email Address" type="email" value={formData.personal.email} onChange={e => handleChange('personal', 'email', e.target.value)} />
                      <InputField label="Emergency Contact" type="tel" value={formData.personal.emergencyContact} onChange={e => handleChange('personal', 'emergencyContact', e.target.value)} />
                      <InputField label="Address" className="md:col-span-2" value={formData.personal.address} onChange={e => handleChange('personal', 'address', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-white/10 pb-2">Lifestyle</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <SelectField label="Smoking" value={formData.lifestyle.smoking} onChange={e => handleChange('lifestyle', 'smoking', e.target.value)} options={['No', 'Occasionally', 'Regularly']} />
                      <SelectField label="Alcohol" value={formData.lifestyle.alcohol} onChange={e => handleChange('lifestyle', 'alcohol', e.target.value)} options={['No', 'Occasionally', 'Regularly']} />
                      <SelectField label="Exercise Frequency" value={formData.lifestyle.exerciseFrequency} onChange={e => handleChange('lifestyle', 'exerciseFrequency', e.target.value)} options={['None', 'Light', 'Moderate', 'Intense']} />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-white/10 pb-2">Vitals</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <SelectField label="Blood Group" value={formData.medical.bloodGroup} onChange={e => handleChange('medical', 'bloodGroup', e.target.value)} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
                      <InputField label="Height (cm)" type="number" value={formData.medical.height} onChange={e => handleChange('medical', 'height', e.target.value)} />
                      <InputField label="Weight (kg)" type="number" value={formData.medical.weight} onChange={e => handleChange('medical', 'weight', e.target.value)} />
                      {bmiData && (
                        <div className="md:col-span-3 flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                          <span className="text-gray-400">BMI Indicator:</span>
                          <span className={`font-bold text-lg ${bmiData.color}`}>{bmiData.value} ({bmiData.status})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-white/10 pb-2">Conditions & History</h3>
                    <div className="space-y-6">
                      <TagInput label="Existing Conditions (e.g. Diabetes, Asthma)" tags={formData.medical.existingConditions} setTags={tags => handleChange('medical', 'existingConditions', tags)} suggestions={['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Thyroid']} />
                      <TagInput label="Allergies (e.g. Peanuts, Penicillin)" tags={formData.medical.allergies} setTags={tags => handleChange('medical', 'allergies', tags)} />
                      <TagInput label="Current Medications" tags={formData.medical.currentMedications} setTags={tags => handleChange('medical', 'currentMedications', tags)} />
                      <TagInput label="Family Medical History" tags={formData.medical.familyHistory} setTags={tags => handleChange('medical', 'familyHistory', tags)} suggestions={['Diabetes', 'Cancer', 'Heart Disease', 'Hypertension']} />
                      <InputField label="Past Surgeries (if any)" value={formData.medical.pastSurgeries} onChange={e => handleChange('medical', 'pastSurgeries', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-white/10 pb-2">Primary Symptom</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SelectField label="Main Symptom" value={formData.symptoms.primary} onChange={e => handleChange('symptoms', 'primary', e.target.value)} options={['Headache', 'Chest Pain', 'Fever', 'Cough', 'Stomach Ache', 'Fatigue', 'Dizziness', 'Shortness of Breath', 'Other']} />
                      <TagInput label="Additional Symptoms" tags={formData.symptoms.secondary} setTags={tags => handleChange('symptoms', 'secondary', tags)} suggestions={['Nausea', 'Vomiting', 'Chills', 'Sweating', 'Body Ache', 'Weakness']} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-white/10 pb-2">Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SelectField label="Duration" value={formData.symptoms.duration} onChange={e => handleChange('symptoms', 'duration', e.target.value)} options={['Hours', '1-3 Days', '1 Week', 'More than a week', 'Months']} />
                      <SelectField label="Severity" value={formData.symptoms.severity} onChange={e => handleChange('symptoms', 'severity', e.target.value)} options={['Mild', 'Moderate', 'Severe']} />
                      <SelectField label="Pattern" value={formData.symptoms.pattern} onChange={e => handleChange('symptoms', 'pattern', e.target.value)} options={['Constant', 'Intermittent', 'Worsening']} />
                      <TagInput label="Triggers (e.g. Food, Stress)" tags={formData.symptoms.triggers} setTags={tags => handleChange('symptoms', 'triggers', tags)} suggestions={['Food', 'Stress', 'Weather', 'Physical Activity', 'Dust']} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-white/10 pb-2">Pain Scale (1-10)</h3>
                    <div className="px-4">
                      <input type="range" min="1" max="10" value={formData.symptoms.painScale} onChange={e => handleChange('symptoms', 'painScale', e.target.value)} className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary" />
                      <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>1 (Mild)</span>
                        <span className="font-bold text-white text-lg">{formData.symptoms.painScale}</span>
                        <span>10 (Unbearable)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 min-h-[100px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none peer"
                        placeholder=" "
                        value={formData.symptoms.notes}
                        onChange={e => handleChange('symptoms', 'notes', e.target.value)}
                      ></textarea>
                      <label className="absolute left-4 top-4 text-gray-400 transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-background px-1 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-background pointer-events-none">
                        Additional Notes...
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8">
                  {aiResult && (
                    <div className={`p-6 rounded-2xl border bg-gradient-to-br ${aiResult.riskAnalysis?.level === 'Critical' || aiResult.riskAnalysis?.level === 'High' ? 'from-red-500/20 to-background border-red-500/50' : 'from-primary/20 to-background border-primary/50'}`}>
                      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Activity className={aiResult.riskAnalysis?.level === 'Critical' ? 'text-red-500' : 'text-primary'} size={28} />
                        AI Diagnostic Interpretation
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Risk Level</p>
                          <p className={`font-black text-3xl ${aiResult.riskAnalysis?.level === 'Critical' ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                            {aiResult.riskAnalysis?.level}
                          </p>
                          <p className="text-sm text-gray-300 mt-2 italic border-l-2 border-white/20 pl-3">{aiResult.riskAnalysis?.justification}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Health Score</p>
                          <p className="font-black text-3xl text-green-400">{aiResult.healthScore}/100</p>
                          <p className="text-sm text-gray-300 mt-2 italic border-l-2 border-white/20 pl-3">{aiResult.healthScoreReasoning}</p>
                        </div>
                        
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Patient Overview</p>
                          <p className="text-gray-200 text-lg leading-relaxed bg-white/5 p-4 rounded-xl">{aiResult.patientOverview}</p>
                        </div>
                        
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-400 uppercase tracking-wider mb-2">Differential Diagnosis</p>
                          <div className="space-y-3">
                            {aiResult.differentialDiagnosis?.map((item, i) => (
                              <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <span className="font-bold text-primary mr-2">{item.condition}:</span>
                                <span className="text-sm text-gray-300">{item.reasoning}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {aiResult.redFlagWarnings?.length > 0 && (
                          <div className="md:col-span-2 bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                            <p className="text-sm text-red-400 font-bold uppercase tracking-wider mb-2">Red Flag Warnings</p>
                            <ul className="list-disc list-inside text-red-200 space-y-1">
                              {aiResult.redFlagWarnings.map((warning, i) => <li key={i}>{warning}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-200 border-b border-white/10 pb-2">Schedule Appointment</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <SelectField label="Department" value={formData.appointment.department} onChange={e => handleChange('appointment', 'department', e.target.value)} options={['General Physician', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics']} />
                      <SelectField label="Mode" value={formData.appointment.mode} onChange={e => handleChange('appointment', 'mode', e.target.value)} options={['In-person', 'Online Telehealth']} />
                      <InputField label="Preferred Date" type="date" value={formData.appointment.date} onChange={e => handleChange('appointment', 'date', e.target.value)} />
                      <InputField label="Preferred Time" type="time" value={formData.appointment.time} onChange={e => handleChange('appointment', 'time', e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/10 relative z-10">
          <button 
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
            className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5"
          >
            <ChevronLeft size={20} /> Back
          </button>
          
          {currentStep < steps.length ? (
            <button 
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-lg font-medium bg-primary text-white hover:bg-blue-600 transition-all shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] disabled:opacity-70"
            >
              {loading ? 'Processing...' : 'Next'} <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-lg font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all shadow-lg disabled:opacity-70"
            >
              {loading ? 'Submitting...' : 'Confirm Registration'} <CheckCircle size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// UI Components
function InputField({ label, type = 'text', value, onChange, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <input 
        type={type} 
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-14 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all peer"
        placeholder=" "
        value={value}
        onChange={onChange}
      />
      <label className="absolute left-4 top-4 text-gray-400 transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-background px-1 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-background pointer-events-none">
        {label}
      </label>
    </div>
  );
}

function SelectField({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select 
        className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 h-14 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none relative z-10"
        value={value}
        onChange={onChange}
      >
        <option value="" disabled className="bg-background text-gray-400">Select {label}</option>
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-background text-foreground">{opt}</option>
        ))}
      </select>
      <label className="absolute left-4 -top-2 text-xs text-primary bg-background px-1 z-20">
        {label}
      </label>
      <div className="absolute inset-0 bg-white/5 rounded-xl z-0 pointer-events-none"></div>
    </div>
  );
}

function TagInput({ label, tags, setTags, suggestions = [], className = '' }) {
  const [input, setInput] = useState('');

  const handleAdd = (val) => {
    const newTag = val.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAdd(input);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative flex items-center">
        <input 
          type="text" 
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 h-14 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all peer"
          placeholder=" "
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <label className="absolute left-4 top-4 text-gray-400 transition-all peer-focus:-top-2 peer-focus:text-xs peer-focus:text-primary peer-focus:bg-background px-1 peer-[:not(:placeholder-shown)]:-top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-background pointer-events-none">
          {label} (Type and press Enter)
        </label>
        <button type="button" onClick={() => handleAdd(input)} className="absolute right-3 text-primary hover:text-blue-400">
          <Plus size={20} />
        </button>
      </div>
      
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {suggestions.filter(s => !tags.includes(s)).map(s => (
            <button key={s} type="button" onClick={() => handleAdd(s)} className="text-xs px-2 py-1 bg-white/5 hover:bg-white/10 rounded-md border border-white/10 text-gray-400 transition-colors">
              + {s}
            </button>
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          <AnimatePresence>
            {tags.map(tag => (
              <motion.div key={tag} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="flex items-center gap-1 bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm border border-primary/30">
                {tag}
                <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-400 ml-1">
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}