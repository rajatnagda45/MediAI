const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

router.post('/analyze', async (req, res) => {
  try {
    const patientData = req.body;
    
    if (!patientData.symptoms) {
      return res.status(400).json({ success: false, message: 'Symptoms are required' });
    }

    const prompt = `Act as a senior clinical doctor and diagnostic AI.

Generate a highly realistic, detailed medical report based on structured patient data.

IMPORTANT:
- Use patient-specific reasoning (not generic text)
- Connect symptoms logically
- Mention WHY each condition is suspected
- Do NOT give generic answers or repeat same template blindly
- Make the report feel like written by a real doctor analyzing THIS specific case.

Patient Details:
${JSON.stringify(patientData, null, 2)}

Return a JSON object STRICTLY following this structure, with no markdown:
{
  "patientOverview": "Personalized summary of the patient's condition",
  "clinicalInterpretation": "Explanation of symptom relationships and possible causes",
  "differentialDiagnosis": [
    { "condition": "Name of condition 1", "reasoning": "Why it is suspected based on symptoms/history" },
    { "condition": "Name of condition 2", "reasoning": "..." }
  ],
  "riskAnalysis": {
    "level": "Low | Medium | High | Critical",
    "justification": "Justification using symptoms + vitals + history"
  },
  "treatmentPlan": {
    "shortTerm": ["Immediate action 1", "Immediate action 2"],
    "longTerm": ["Long term action 1"]
  },
  "recoveryTimeline": "Expected recovery days/weeks",
  "lifestyleAdjustments": ["Personalized suggestion 1 based on habits"],
  "redFlagWarnings": ["Specific warning sign 1 for this patient"],
  "followUpPlan": "Exact time recommendation",
  "healthScore": 75,
  "healthScoreReasoning": "Why this score was given"
}
Only return the raw JSON, nothing else.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0]?.message?.content;
    let aiData;
    
    try {
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            aiData = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("Invalid JSON format");
        }
    } catch (parseError) {
        console.error("Parse error:", parseError, "Response:", responseContent);
        return res.status(500).json({ success: false, message: 'Failed to parse AI response' });
    }

    res.json({ success: true, data: aiData });
  } catch (error) {
    console.error('AI Analysis Error:', error);
    res.status(500).json({ success: false, message: 'AI Analysis failed', error: error.message });
  }
});

module.exports = router;
