import React, { useState } from 'react';
import { generateGroqResponse } from '../utils/groqService';
import LoadingSpinner from '../components/LoadingSpinner';

const PatientAnalysis = ({ formData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to determine severity based on symptoms and vitals
  const determineSeverity = (formData) => {
    // Check disease type first for high-severity conditions
    if (formData.diseaseType) {
      const severeConditions = ["cancer", "heart attack", "stroke", "sepsis", "organ failure",
        "trauma", "hemorrhage", "respiratory failure", "shock"];
      
      const diseaseLower = formData.diseaseType.toLowerCase();
      for (const condition of severeConditions) {
        if (diseaseLower.includes(condition)) {
          return "Severe";
        }
      }
    }
    
    // Check previous medical records for severity indications
    if (formData.previousReport) {
      const severeHistory = ["icu", "critical", "severe", "emergency", 
        "hospitalized", "surgery", "transplant"];
      
      const historyLower = formData.previousReport.toLowerCase();
      for (const term of severeHistory) {
        if (historyLower.includes(term)) {
          return "Moderate"; // At least moderate if previous severe history
        }
      }
    }
    
    // Critical symptoms
    const criticalSymptoms = ["chestPain", "shortnessOfBreath", "severePain", "seizures"];
    
    // Check for critical symptoms
    for (const symptom of criticalSymptoms) {
      if (formData.symptoms && formData.symptoms[symptom]) {
        return "Critical";
      }
    }
    
    // Check vital signs
    if (formData.bloodPressure) {
      const systolic = parseInt(formData.bloodPressure.split('/')[0]);
      const diastolic = parseInt(formData.bloodPressure.split('/')[1]);
      
      if ((systolic > 180 || systolic < 90) || (diastolic > 120 || diastolic < 60)) {
        return "Severe";
      }
    }
    
    if (formData.heart_rate && (parseInt(formData.heart_rate) > 120 || parseInt(formData.heart_rate) < 50)) {
      return "Severe";
    }
    
    if (formData.temperature && (parseFloat(formData.temperature) > 103 || parseFloat(formData.temperature) < 95)) {
      return "Severe";
    }
    
    // Count moderate symptoms
    const moderateSymptoms = ["fever", "vomiting", "dizziness", "headache", "abdominalPain"];
    let moderateCount = 0;
    
    if (formData.symptoms) {
      for (const symptom of moderateSymptoms) {
        if (formData.symptoms[symptom]) {
          moderateCount++;
        }
      }
    }
    
    if (moderateCount >= 2) {
      return "Moderate";
    }
    
    // Default to mild
    return "Mild";
  };

  // Function to check if patient should be automatically directed to specific departments
  const checkSpecialCases = (formData) => {
    // Disease Type-based routing (high priority)
    const diseaseTypeMappings = {
      "cancer": "Oncology",
      "tumor": "Oncology", 
      "leukemia": "Oncology",
      "lymphoma": "Oncology",
      "heart": "Cardiology",
      "cardiac": "Cardiology",
      "brain": "Neurology",
      "nerve": "Neurology",
      "stroke": "Neurology",
      "bone": "Orthopedics",
      "joint": "Orthopedics",
      "fracture": "Orthopedics",
      "kidney": "Nephrology",
      "renal": "Nephrology",
      "liver": "Gastroenterology",
      "stomach": "Gastroenterology",
      "intestine": "Gastroenterology",
      "diabetes": "Endocrinology",
      "thyroid": "Endocrinology",
      "hormone": "Endocrinology",
      "lung": "Pulmonology",
      "respiratory": "Pulmonology",
      "asthma": "Pulmonology",
      "skin": "Dermatology",
      "eye": "Ophthalmology",
      "vision": "Ophthalmology",
      "ear": "ENT",
      "nose": "ENT",
      "throat": "ENT",
      "urinary": "Urology",
      "prostate": "Urology",
      "blood": "Hematology",
      "anemia": "Hematology",
      "arthritis": "Rheumatology",
      "lupus": "Rheumatology",
      "depression": "Psychiatry",
      "anxiety": "Psychiatry",
      "mental": "Psychiatry"
    };
    
    // Check disease type for direct department mapping
    if (formData.diseaseType) {
      const diseaseLower = formData.diseaseType.toLowerCase();
      
      for (const [keyword, department] of Object.entries(diseaseTypeMappings)) {
        if (diseaseLower.includes(keyword)) {
          return department;
        }
      }
    }
    
    // Check previous medical records for department indicators
    if (formData.previousReport) {
      const historyLower = formData.previousReport.toLowerCase();
      
      // Keywords in previous report that strongly indicate a department
      for (const [keyword, department] of Object.entries(diseaseTypeMappings)) {
        if (historyLower.includes(keyword)) {
          return department;
        }
      }
      
      // Special handling for cancer treatment in medical history
      if (historyLower.includes("cancer treatment") || 
          historyLower.includes("chemotherapy") || 
          historyLower.includes("radiation therapy") ||
          historyLower.includes("oncology")) {
        return "Oncology";
      }
    }
    
    // Pediatric cases (under 18)
    if (formData.age < 18) {
      return "Pediatrics";
    }
    
    // Return null if no special case applies
    return null;
  };

  const analyzePatientData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check for special cases that should automatically determine department
      const specialDepartment = checkSpecialCases(formData);
      
      // Extract symptom list for the summary
      let symptomsList = "None reported";
      if (formData.symptoms) {
        const activeSymptoms = Object.entries(formData.symptoms)
          .filter(([_, value]) => value)
          .map(([symptom]) => symptom.replace(/([A-Z])/g, ' $1').trim());
          
        if (activeSymptoms.length > 0) {
          symptomsList = activeSymptoms.join(', ');
        }
      }
      
      // Prepare patient data summary with emphasis on disease type and medical history
      const patientSummary = `
        PATIENT INFORMATION:
        Name: ${formData.name}
        Age: ${formData.age}
        Gender: ${formData.gender}
        Token/ID: ${formData.tokenNumber || 'Not assigned'}
        
        DISEASE TYPE / CONDITION (HIGH PRIORITY): 
        ${formData.diseaseType || 'None reported'}
        
        PREVIOUS MEDICAL RECORDS (HIGH PRIORITY):
        ${formData.previousReport || 'None provided'}
        
        CURRENT SYMPTOMS: 
        ${symptomsList}
        
        LABORATORY TESTS:
        Blood Sample: ${formData.bloodSampleCollected ? 'Collected' : 'Not collected'}
        
        VITAL SIGNS:
        - Blood Pressure: ${formData.bloodPressure || 'Not recorded'}
        - Sugar Level: ${formData.sugarLevel || 'Not recorded'}
        - Heart Rate: ${formData.heart_rate || 'Not recorded'}
        - Temperature: ${formData.temperature || 'Not recorded'}
        - Weight: ${formData.weight || 'Not recorded'}
      `;

      let recommendedDepartment;
      
      // If we have a special department, use it directly
      if (specialDepartment) {
        recommendedDepartment = specialDepartment;
      } else {
        // Create a more structured prompt for department selection with emphasis on disease type
        const departmentPrompt = `
        You are a hospital triage specialist tasked with determining the most appropriate department for each patient.
        
        IMPORTANT INSTRUCTIONS:
        1. DISEASE TYPE and PREVIOUS MEDICAL RECORDS should be given the HIGHEST PRIORITY in your decision.
        2. Analyze the patient information carefully.
        3. Select EXACTLY ONE department from the list below.
        4. Do not recommend Emergency Medicine unless the patient has life-threatening symptoms.
        
        AVAILABLE DEPARTMENTS:
        - Cardiology: For heart diseases and treatments
        - Neurology: For brain and nervous system disorders
        - Orthopedics: For bone, joint, and muscle conditions
        - Pediatrics: For children (under 18 years)
        - Gynecology: For women's reproductive health issues
        - Oncology: For cancer diagnosis and treatments
        - Urology: For urinary tract and male reproductive system diseases
        - Gastroenterology: For digestive system issues
        - Nephrology: For kidney-related diseases
        - Pulmonology: For lung and respiratory disorders
        - Endocrinology: For hormone-related conditions like diabetes
        - Dermatology: For skin, hair, and nail diseases
        - Ophthalmology: For eye care and diseases
        - ENT (Otolaryngology): For ear, nose, and throat conditions
        - Psychiatry: For mental health conditions
        - Hematology: For blood disorders
        - Rheumatology: For autoimmune and inflammatory diseases
        - General Medicine: For unclear cases or multiple issues

        CRITICALLY IMPORTANT: If the patient has ANY cancer-related conditions or is undergoing cancer treatment, 
        the department MUST be Oncology regardless of current symptoms.

        PATIENT INFORMATION:
        ${patientSummary}

        First, analyze the disease type and previous medical records for strong department indicators.
        Then, consider current symptoms in your analysis.
        Finally, conclude with:
        "Based on this analysis, I recommend the [DEPARTMENT NAME] department."
        `;

        // Get department recommendation from Groq
        const deptResponse = await generateGroqResponse(departmentPrompt);

        // Extract just the department name from the response
        recommendedDepartment = "General Medicine"; // Default
        
        // Look for the recommendation format in the response
        const deptMatch = deptResponse.match(/recommend the\s+(\w+(?:\s+\&\s+\w+|\s+\w+)*)\s+department/i) || 
                          deptResponse.match(/(\w+(?:\s+\&\s+\w+|\s+\w+)*)\s+department/i);
        
        if (deptMatch && deptMatch[1]) {
          recommendedDepartment = deptMatch[1].trim();
        }

        // Validate that we got a valid department
        const validDepartments = [
          "Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Gynecology", 
          "Oncology", "Urology", "Gastroenterology", "Nephrology", "Pulmonology", 
          "Endocrinology", "Dermatology", "Ophthalmology", "ENT", "Otolaryngology", 
          "Psychiatry", "Hematology", "Rheumatology", "General Medicine"
        ];

        // Clean up department name and verify it's valid
        if (!validDepartments.includes(recommendedDepartment)) {
          // Try to find any valid department name in the response
          for (const dept of validDepartments) {
            if (deptResponse.includes(dept)) {
              recommendedDepartment = dept;
              break;
            }
          }
        }

        // Double-check cancer-related conditions even if the LLM missed it
        if (formData.diseaseType && 
            (formData.diseaseType.toLowerCase().includes('cancer') || 
             formData.diseaseType.toLowerCase().includes('tumor')) || 
            (formData.previousReport && 
             (formData.previousReport.toLowerCase().includes('cancer') ||
              formData.previousReport.toLowerCase().includes('chemo')))) {
          recommendedDepartment = "Oncology";
        }
      }

      // Determine severity level using our algorithm
      const severityLevel = determineSeverity(formData);

      // Get detailed analysis from LLM with deepseek-r1:8b model
      const analysisPrompt = `
        You are a medical assistant providing analysis of a patient case.
        
        PATIENT INFORMATION:
        ${patientSummary}
        
        DEPARTMENT ASSIGNMENT: ${recommendedDepartment}
        SEVERITY LEVEL: ${severityLevel}
        
        INSTRUCTIONS:
        1. Focus your analysis on the specified department (${recommendedDepartment}) and the patient's condition.
        2. Pay special attention to the disease type and previous medical records.
        3. Provide a concise but thorough medical analysis with the following sections:
        
        SECTIONS TO INCLUDE:
        1. Probable Diagnosis (2-3 most likely conditions)
        2. Recommended Tests & Investigations
        3. Treatment Recommendations
        4. Follow-up Plan
        5. Special Considerations or Warnings
        
        Keep your response focused, professional, and appropriate for a medical report.
      `;
      
      const analysisText = await generateGroqResponse(analysisPrompt);
      const analysisResponse = { data: { response: analysisText } };

      // Extract symptom tags for display
      const symptomTags = formData.symptoms ? 
        Object.entries(formData.symptoms)
          .filter(([_, value]) => value)
          .map(([symptom]) => `
            <span class="symptom-tag">
              ${symptom.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          `).join('') : '';

      // Generate appropriate CSS class for department
      const getDeptClass = (dept) => {
        const deptClasses = {
          "Oncology": "dept-oncology",
          "Cardiology": "dept-cardiology",
          "Neurology": "dept-neurology",
          "Orthopedics": "dept-orthopedics",
          "Pediatrics": "dept-pediatrics"
        };
        
        return deptClasses[dept] || "dept-general";
      };

      // Open new window with analysis results
      const analysisWindow = window.open('', '_blank');
      analysisWindow.document.write(`
        <html>
          <head>
            <title>Medical Analysis Report - ${formData.name}</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                line-height: 1.6;
                padding: 2rem;
                max-width: 800px;
                margin: 0 auto;
                background: #f0f9ff;
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
                color: white;
                padding: 1.5rem;
                border-radius: 6px;
                margin-bottom: 2rem;
              }
              .summary {
                background: #f8fafc;
                padding: 1.5rem;
                border-radius: 6px;
                margin-bottom: 2rem;
              }
              .department {
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                font-weight: 600;
                display: inline-block;
                margin-right: 1rem;
              }
              .dept-general { background: #dbeafe; color: #1e40af; }
              .dept-oncology { background: #fecaca; color: #b91c1c; }
              .dept-cardiology { background: #fee2e2; color: #991b1b; }
              .dept-neurology { background: #e0e7ff; color: #4338ca; }
              .dept-orthopedics { background: #d1fae5; color: #047857; }
              .dept-pediatrics { background: #fef3c7; color: #92400e; }
              
              .severity {
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                font-weight: 600;
                display: inline-block;
              }
              .critical { background: #fee2e2; color: #991b1b; }
              .severe { background: #fef3c7; color: #92400e; }
              .moderate { background: #dbeafe; color: #1e40af; }
              .mild { background: #d1fae5; color: #065f46; }
              .grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
              }
              .vitals {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                margin: 1.5rem 0;
              }
              .vital-card {
                background: #f1f5f9;
                padding: 1rem;
                border-radius: 6px;
                min-width: 120px;
                text-align: center;
              }
              .vital-value {
                font-size: 1.25rem;
                font-weight: 600;
                color: #1e40af;
              }
              .vital-label {
                font-size: 0.875rem;
                color: #64748b;
              }
              .symptoms {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
              }
              .symptom-tag {
                background: #e0f2fe;
                color: #0284c7;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.875rem;
              }
              .analysis {
                margin-top: 2rem;
                white-space: pre-line;
              }
              .special-notice {
                background: #ffe4e4;
                color: #c53030;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-weight: 500;
                margin-top: 1rem;
                display: ${(formData.diseaseType && formData.diseaseType.toLowerCase().includes('cancer')) || 
                          (formData.previousReport && formData.previousReport.toLowerCase().includes('cancer')) ? 'block' : 'none'};
              }
              .medical-history-section {
                background: #f1f5f9;
                padding: 1rem;
                border-radius: 6px;
                margin: 1rem 0;
              }
              .disease-type {
                font-weight: 600;
                color: #b91c1c;
                font-size: 1.1rem;
                margin-bottom: 0.5rem;
              }
              .lab-tests {
                margin-top: 1.5rem;
                padding: 1rem;
                background: #f0fdf4;
                border-radius: 6px;
              }
              .lab-title {
                font-weight: 600;
                color: #047857;
                margin-bottom: 0.5rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Medical Analysis Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
              </div>

              <div class="summary">
                <div class="grid">
                  <div>
                    <strong>Name:</strong> ${formData.name}
                  </div>
                  <div>
                    <strong>Token:</strong> #${formData.tokenNumber || 'N/A'}
                  </div>
                  <div>
                    <strong>Age/Gender:</strong> ${formData.age}/${formData.gender}
                  </div>
                  <div>
                    <strong>Appointment:</strong> ${formData.opdSlot || 'Not scheduled'}
                  </div>
                </div>
                
                ${formData.diseaseType || formData.previousReport ? `
                <div class="medical-history-section">
                  ${formData.diseaseType ? `
                  <div class="disease-type">Disease Type: ${formData.diseaseType}</div>
                  ` : ''}
                  
                  ${formData.previousReport ? `
                  <div>
                    <strong>Medical History:</strong> ${formData.previousReport}
                  </div>
                  ` : ''}
                </div>
                ` : ''}
                
                <div class="special-notice">
                  Cancer treatment in progress - Priority patient
                </div>
              </div>

              <div>
                <span class="department ${getDeptClass(recommendedDepartment)}">${recommendedDepartment}</span>
                <span class="severity ${severityLevel.toLowerCase()}">${severityLevel}</span>
              </div>

              ${formData.bloodPressure || formData.heart_rate || formData.temperature || formData.sugarLevel || formData.weight ? `
              <h3>Vital Signs</h3>
              <div class="vitals">
                ${formData.bloodPressure ? `
                  <div class="vital-card">
                    <div class="vital-value">${formData.bloodPressure}</div>
                    <div class="vital-label">Blood Pressure</div>
                  </div>
                ` : ''}
                ${formData.heart_rate ? `
                  <div class="vital-card">
                    <div class="vital-value">${formData.heart_rate}</div>
                    <div class="vital-label">Heart Rate (BPM)</div>
                  </div>
                ` : ''}
                ${formData.temperature ? `
                  <div class="vital-card">
                    <div class="vital-value">${formData.temperature}°F</div>
                    <div class="vital-label">Temperature</div>
                  </div>
                ` : ''}
                ${formData.sugarLevel ? `
                  <div class="vital-card">
                    <div class="vital-value">${formData.sugarLevel}</div>
                    <div class="vital-label">Sugar Level</div>
                  </div>
                ` : ''}
                ${formData.weight ? `
                  <div class="vital-card">
                    <div class="vital-value">${formData.weight} kg</div>
                    <div class="vital-label">Weight</div>
                  </div>
                ` : ''}
              </div>
              ` : ''}
              
              ${formData.bloodSampleCollected ? `
              <div class="lab-tests">
                <div class="lab-title">Laboratory Tests</div>
                <div>✓ Blood Sample Collected</div>
              </div>
              ` : ''}

              ${symptomTags ? `
              <h3>Reported Symptoms</h3>
              <div class="symptoms">
                ${symptomTags}
              </div>
              ` : ''}

              <div class="analysis">
                <h2>Medical Analysis</h2>
                ${analysisResponse.data.response.replace(/\n/g, '<br>')}
              </div>
            </div>
          </body>
        </html>
      `);
      analysisWindow.document.close();
    } catch (error) {
      console.error('Analysis error:', error);
      setError(`Analysis failed. Error: ${error.message}. Please ensure Groq API key is configured correctly.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingSpinner />}
      {error && <div className="error-message">{error}</div>}
      <button 
        onClick={analyzePatientData}
        className="analyze-button"
        disabled={isLoading}
      >
        {isLoading ? 'Analyzing...' : 'Analyze Patient Data'}
      </button>
    </>
  );
};

export default PatientAnalysis;